import argon2 from 'argon2';
import { prisma } from '../../config/database';
import { ApiError } from '../../utils/ApiError';

export class SettingsService {
  async getProfile(userId: number) {
    const user = await prisma.online_user.findUnique({
      where: { user_id: userId },
      include: {
        linked_customer: {
          select: {
            first_name: true, last_name: true, company_name: true,
            phone_number: true, email: true, address: true, city: true,
            kyc_status: true, risk_profile: true, customer_type: true,
            registration_date: true,
          },
        },
        linked_employee: {
          select: {
            first_name: true, last_name: true, position: true, email: true,
            phone_number: true, employee_type: true, hire_date: true,
            branch: { select: { branch_name: true } },
            department: { select: { department_name: true } },
          },
        },
        session: {
          where: { is_active: true },
          orderBy: { last_active_at: 'desc' },
          take: 10,
          select: {
            session_id: true, ip_address: true, device_name: true,
            user_agent: true, created_at: true, last_active_at: true,
          },
        },
      },
    });

    if (!user) throw new ApiError('User not found', 404);

    const { password_hash, salt, two_factor_secret, ...safeUser } = user;
    return safeUser;
  }

  async changePassword(userId: number, currentPassword: string, newPassword: string) {
    const user = await prisma.online_user.findUnique({ where: { user_id: userId } });
    if (!user) throw new ApiError('User not found', 404);

    const valid = await argon2.verify(user.password_hash, currentPassword);
    if (!valid) throw new ApiError('Current password is incorrect', 400);

    const history = await prisma.password_history.findMany({
      where: { user_id: userId },
      orderBy: { changed_at: 'desc' },
      take: 5,
    });

    for (const entry of history) {
      const reused = await argon2.verify(entry.password_hash, newPassword);
      if (reused) throw new ApiError('Cannot reuse one of your last 5 passwords', 400);
    }

    const newHash = await argon2.hash(newPassword);

    await prisma.$transaction([
      prisma.online_user.update({
        where: { user_id: userId },
        data: {
          password_hash: newHash,
          must_change_password: false,
          password_changed_at: new Date(),
        },
      }),
      prisma.password_history.create({
        data: { user_id: userId, password_hash: newHash },
      }),
    ]);

    return { message: 'Password changed successfully' };
  }

  async revokeSession(userId: number, sessionId: number) {
    const session = await prisma.session.findUnique({ where: { session_id: sessionId } });
    if (!session) throw new ApiError('Session not found', 404);
    if (session.user_id !== userId) throw new ApiError('Access denied', 403);

    return prisma.session.update({
      where: { session_id: sessionId },
      data: { is_active: false },
    });
  }

  async getLookups() {
    const [accountTypes, currencies, branches] = await Promise.all([
      prisma.account_type.findMany({ where: { is_active: true } }),
      prisma.currency.findMany({ where: { is_active: true } }),
      prisma.branch.findMany({ where: { status: 'ACTIVE' }, select: { branch_id: true, branch_name: true, branch_code: true } })
    ]);
    return { accountTypes, currencies, branches };
  }
}

export const settingsService = new SettingsService();
