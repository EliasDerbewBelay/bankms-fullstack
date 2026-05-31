import { user_role } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        username: string;
        role: user_role;
        linkedCustomerId?: number | null;
        linkedEmployeeId?: number | null;
      };
    }
  }
}

export {};
