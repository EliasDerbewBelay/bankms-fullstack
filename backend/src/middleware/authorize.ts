import { Request, Response, NextFunction } from 'express';
import { user_role } from '@prisma/client';
import { ApiError } from '../utils/ApiError';

const ROLE_HIERARCHY: Record<user_role, number> = {
  CUSTOMER: 0,
  TELLER: 1,
  SUPERVISOR: 2,
  BRANCH_MANAGER: 3,
  ADMIN: 4,
};

export function authorize(...allowedRoles: user_role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(ApiError.unauthorized());
      return;
    }

    const userRoleLevel = ROLE_HIERARCHY[req.user.role];
    const hasPermission = allowedRoles.some(
      (role) => ROLE_HIERARCHY[role] <= userRoleLevel
    );

    if (!hasPermission) {
      next(ApiError.forbidden('You do not have permission to perform this action'));
      return;
    }

    next();
  };
}

export function authorizeExact(...roles: user_role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(ApiError.unauthorized());
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(ApiError.forbidden('Access denied for your role'));
      return;
    }

    next();
  };
}
