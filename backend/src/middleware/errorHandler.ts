import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { logger } from '../config/logger';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Zod validation errors
  if (err instanceof ZodError) {
    const errors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    ApiResponse.error(res, 'Validation failed', 400, errors);
    return;
  }

  // Known operational errors
  if (err instanceof ApiError) {
    if (!err.isOperational) {
      logger.error('Non-operational error:', {
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
      });
    }
    ApiResponse.error(res, err.message, err.statusCode, err.errors);
    return;
  }

  // Prisma errors
  if (err.constructor.name === 'PrismaClientKnownRequestError') {
    const prismaErr = err as unknown as { code: string; meta?: { target?: string[] } };
    if (prismaErr.code === 'P2002') {
      const field = prismaErr.meta?.target?.[0] ?? 'field';
      ApiResponse.error(res, `A record with this ${field} already exists`, 409);
      return;
    }
    if (prismaErr.code === 'P2025') {
      ApiResponse.error(res, 'Record not found', 404);
      return;
    }
  }

  // Unknown errors
  logger.error('Unhandled error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
  });

  ApiResponse.error(res, 'An unexpected error occurred', 500);
}

export function notFoundHandler(req: Request, res: Response): void {
  ApiResponse.error(res, `Route ${req.method} ${req.url} not found`, 404);
}
