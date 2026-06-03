import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';
import { user_role } from '@prisma/client';

interface JwtPayload {
  userId: number;
  username: string;
  role: user_role;
  linkedCustomerId?: number | null;
  linkedEmployeeId?: number | null;
  mustChangePassword?: boolean;
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw ApiError.unauthorized('No token provided');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;

    req.user = {
      userId: decoded.userId,
      username: decoded.username,
      role: decoded.role,
      linkedCustomerId: decoded.linkedCustomerId,
      linkedEmployeeId: decoded.linkedEmployeeId,
      mustChangePassword: decoded.mustChangePassword,
    };

    if (req.user.mustChangePassword && req.baseUrl + req.path !== '/api/v1/auth/change-password') {
      throw ApiError.forbidden('Password change required before proceeding');
    }

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      next(ApiError.unauthorized('Token expired'));
    } else if (error instanceof jwt.JsonWebTokenError) {
      next(ApiError.unauthorized('Invalid token'));
    } else {
      next(error);
    }
  }
}
