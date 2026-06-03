import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { atmService } from './atm.service';
import { ApiResponse } from '../../utils/ApiResponse';
import { ApiError } from '../../utils/ApiError';

export const getAllAtms = asyncHandler(async (_req: Request, res: Response) => {
  const atms = await atmService.getAllAtms();
  return ApiResponse.success(res, atms, 'ATMs retrieved successfully');
});

export const getAtmStats = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await atmService.getAtmStats();
  return ApiResponse.success(res, stats, 'ATM stats retrieved');
});

export const refillAtm = asyncHandler(async (req: Request, res: Response) => {
  const atmId = parseInt(String(req.params.id), 10);
  if (isNaN(atmId)) throw new ApiError('Invalid ATM ID', 400);

  const amount = Number(req.body.amount);
  if (isNaN(amount) || amount <= 0) throw new ApiError('Invalid amount', 400);

  const atm = await atmService.refillAtm(atmId, amount, req.user!);
  return ApiResponse.success(res, atm, 'ATM refill logged successfully');
});

export const updateStatus = asyncHandler(async (req: Request, res: Response) => {
  const atmId = parseInt(String(req.params.id), 10);
  if (isNaN(atmId)) throw new ApiError('Invalid ATM ID', 400);

  const { status } = req.body;
  if (!status) throw new ApiError('Status is required', 400);

  const atm = await atmService.updateStatus(atmId, status, req.user!);
  return ApiResponse.success(res, atm, `ATM status updated to ${status}`);
});
