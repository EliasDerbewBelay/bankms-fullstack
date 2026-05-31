import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { ApiResponse } from '../../utils/ApiResponse';
import { asyncHandler } from '../../utils/asyncHandler';

const authService = new AuthService();

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { username, password } = req.body;
  const ipAddress = req.ip ?? '0.0.0.0';
  const userAgent = req.headers['user-agent'] ?? '';
  const result = await authService.login(username, password, ipAddress, userAgent);
  return ApiResponse.success(res, result, 'Login successful');
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  const tokens = await authService.refresh(refreshToken);
  return ApiResponse.success(res, tokens, 'Token refreshed');
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  await authService.logout((req as any).user!.userId, req.ip ?? '0.0.0.0');
  return ApiResponse.success(res, null, 'Logged out successfully');
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.getMe((req as any).user!.userId);
  return ApiResponse.success(res, user);
});
