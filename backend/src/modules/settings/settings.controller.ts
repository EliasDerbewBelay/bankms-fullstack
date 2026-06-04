import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { settingsService } from './settings.service';
import { ApiResponse } from '../../utils/ApiResponse';
import { ApiError } from '../../utils/ApiError';
import { z } from 'zod';

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const profile = await settingsService.getProfile(req.user!.userId);
  return ApiResponse.success(res, profile, 'Profile retrieved');
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
  const result = await settingsService.changePassword(req.user!.userId, currentPassword, newPassword);
  return ApiResponse.success(res, result, 'Password changed successfully');
});

export const revokeSession = asyncHandler(async (req: Request, res: Response) => {
  const sessionId = parseInt(String(req.params.sessionId), 10);
  if (isNaN(sessionId)) throw new ApiError('Invalid session ID', 400);
  const result = await settingsService.revokeSession(req.user!.userId, sessionId);
  return ApiResponse.success(res, result, 'Session revoked');
});

export const setup2FA = asyncHandler(async (req: Request, res: Response) => {
  const result = await settingsService.setup2FA(req.user!.userId);
  return ApiResponse.success(res, result, '2FA setup initiated — scan QR code and verify');
});

const verify2FASchema = z.object({ token: z.string().length(6) });

export const verify2FA = asyncHandler(async (req: Request, res: Response) => {
  const { token } = verify2FASchema.parse(req.body);
  const result = await settingsService.verify2FA(req.user!.userId, token);
  return ApiResponse.success(res, result, '2FA enabled successfully');
});

const disable2FASchema = z.object({ password: z.string().min(1) });

export const disable2FA = asyncHandler(async (req: Request, res: Response) => {
  const { password } = disable2FASchema.parse(req.body);
  const result = await settingsService.disable2FA(req.user!.userId, password);
  return ApiResponse.success(res, result, '2FA disabled');
});

export const getLookups = asyncHandler(async (req: Request, res: Response) => {
  const lookups = await settingsService.getLookups();
  return ApiResponse.success(res, lookups);
});
