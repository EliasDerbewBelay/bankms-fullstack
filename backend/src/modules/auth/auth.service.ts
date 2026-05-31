import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/database';
import { env } from '../../config/env';
import { ApiError } from '../../utils/ApiError';
import { logger } from '../../config/logger';
import { user_role } from '@prisma/client';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface JwtPayload {
  userId: number;
  username: string;
  role: user_role;
  linkedCustomerId?: number | null;
  linkedEmployeeId?: number | null;
}

export class AuthService {
  private generateTokens(payload: JwtPayload): TokenPair {
    const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN as any,
    });
    const refreshToken = jwt.sign(
      { userId: payload.userId },
      env.JWT_REFRESH_SECRET,
      { expiresIn: env.JWT_REFRESH_EXPIRES_IN as any }
    );
    return { accessToken, refreshToken };
  }

  async login(
    username: string,
    password: string,
    ipAddress: string,
    userAgent: string
  ): Promise<{ user: object; tokens: TokenPair }> {
    const user = await prisma.online_user.findUnique({
      where: { username },
      include: {
        linked_customer: {
          select: {
            customer_id: true,
            first_name: true,
            last_name: true,
            company_name: true,
            kyc_status: true,
          },
        },
        linked_employee: {
          select: {
            employee_id: true,
            first_name: true,
            last_name: true,
            position: true,
          },
        },
      },
    });

    if (!user) {
      // Log failed attempt without leaking whether user exists
      await prisma.audit_log.create({
        data: {
          action_type: 'FAILED_LOGIN',
          entity_type: 'online_user',
          ip_address: ipAddress,
          user_agent: userAgent,
          details: `Failed login attempt for username: ${username}`,
        },
      });
      throw ApiError.unauthorized('Invalid credentials');
    }

    // Check lockout
    if (user.account_locked) {
      if (user.lockout_until && user.lockout_until > new Date()) {
        throw ApiError.unauthorized(
          `Account locked until ${user.lockout_until.toISOString()}`
        );
      }
    }

    // Verify password
    const isValid = await argon2.verify(user.password_hash, password);
    if (!isValid) {
      const attempts = user.failed_login_attempts + 1;
      const shouldLock = attempts >= 5;

      await prisma.online_user.update({
        where: { user_id: user.user_id },
        data: {
          failed_login_attempts: attempts,
          account_locked: shouldLock,
          lockout_until: shouldLock
            ? new Date(Date.now() + 15 * 60 * 1000)
            : null,
        },
      });

      await prisma.audit_log.create({
        data: {
          action_type: 'FAILED_LOGIN',
          entity_type: 'online_user',
          entity_id: user.user_id,
          performed_by_user_id: user.user_id,
          ip_address: ipAddress,
          details: `Failed login attempt ${attempts}/5`,
          is_suspicious: attempts >= 3,
        },
      });

      throw ApiError.unauthorized('Invalid credentials');
    }

    // Reset failed attempts on success
    await prisma.online_user.update({
      where: { user_id: user.user_id },
      data: {
        failed_login_attempts: 0,
        account_locked: false,
        lockout_until: null,
        last_login: new Date(),
        last_login_ip: ipAddress,
      },
    });

    // Create session
    const tokens = this.generateTokens({
      userId: user.user_id,
      username: user.username,
      role: user.role,
      linkedCustomerId: user.linked_customer_id,
      linkedEmployeeId: user.linked_employee_id,
    });

    const hashedRefresh = await argon2.hash(tokens.refreshToken);
    await prisma.session.create({
      data: {
        user_id: user.user_id,
        session_token: hashedRefresh,
        ip_address: ipAddress,
        user_agent: userAgent,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // Audit log
    await prisma.audit_log.create({
      data: {
        action_type: 'LOGIN',
        entity_type: 'online_user',
        entity_id: user.user_id,
        performed_by_user_id: user.user_id,
        ip_address: ipAddress,
        user_agent: userAgent,
        details: `Successful login for ${username}`,
      },
    });

    logger.info(`User ${username} logged in from ${ipAddress}`);

    const profile =
      user.role === 'CUSTOMER'
        ? user.linked_customer
        : user.linked_employee;

    return {
      user: {
        userId: user.user_id,
        username: user.username,
        role: user.role,
        mustChangePassword: user.must_change_password,
        twoFactorEnabled: user.two_factor_enabled,
        profile,
      },
      tokens,
    };
  }

  async refresh(refreshToken: string): Promise<TokenPair> {
    try {
      const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as {
        userId: number;
      };

      const user = await prisma.online_user.findUnique({
        where: { user_id: decoded.userId },
      });

      if (!user || user.account_locked) {
        throw ApiError.unauthorized('Invalid refresh token');
      }

      return this.generateTokens({
        userId: user.user_id,
        username: user.username,
        role: user.role,
        linkedCustomerId: user.linked_customer_id,
        linkedEmployeeId: user.linked_employee_id,
      });
    } catch {
      throw ApiError.unauthorized('Invalid or expired refresh token');
    }
  }

  async logout(userId: number, ipAddress: string): Promise<void> {
    await prisma.session.updateMany({
      where: { user_id: userId, is_active: true },
      data: { is_active: false },
    });

    await prisma.audit_log.create({
      data: {
        action_type: 'LOGOUT',
        entity_type: 'online_user',
        entity_id: userId,
        performed_by_user_id: userId,
        ip_address: ipAddress,
        details: 'User logged out',
      },
    });
  }

  async getMe(userId: number): Promise<object> {
    const user = await prisma.online_user.findUnique({
      where: { user_id: userId },
      include: {
        linked_customer: true,
        linked_employee: {
          include: {
            branch: { select: { branch_name: true, branch_code: true } },
            department: { select: { department_name: true } },
          },
        },
      },
    });

    if (!user) throw ApiError.notFound('User not found');

    const { password_hash, salt, two_factor_secret, ...safeUser } = user;
    return safeUser;
  }
}
