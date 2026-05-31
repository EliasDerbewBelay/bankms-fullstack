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

export const logRefill = asyncHandler(async (req: Request, res: Response) => {
  const atmId = parseInt(String(req.params.id), 10);
  if (isNaN(atmId)) throw new ApiError('Invalid ATM ID', 400);

  const employeeId = req.user!.linkedEmployeeId;
  if (!employeeId) throw new ApiError('Employee account required', 403);

  const atm = await atmService.logRefill(atmId, employeeId);
  return ApiResponse.success(res, atm, 'ATM refill logged successfully');
});

export const setMaintenance = asyncHandler(async (req: Request, res: Response) => {
  const atmId = parseInt(String(req.params.id), 10);
  if (isNaN(atmId)) throw new ApiError('Invalid ATM ID', 400);

  const atm = await atmService.setMaintenanceMode(atmId);
  return ApiResponse.success(res, atm, 'ATM set to maintenance mode');
});
