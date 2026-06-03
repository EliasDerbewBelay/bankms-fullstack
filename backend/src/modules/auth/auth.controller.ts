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

export const register = asyncHandler(async (req: Request, res: Response) => {
  const customer = await authService.registerCustomer(req.body);
  return ApiResponse.created(res, customer, 'Registration successful. Pending KYC verification.');
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  await authService.changePassword(req.user!.userId, currentPassword, newPassword);
  return ApiResponse.success(res, null, 'Password changed successfully');
});

export const adminResetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { user_id, new_password } = req.body;
  await authService.adminResetPassword(req.user!.userId, user_id, new_password);
  return ApiResponse.success(res, null, 'Password reset successfully');
});
