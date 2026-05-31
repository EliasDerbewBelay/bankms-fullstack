import { Request, Response } from 'express';
import { AdminService } from './admin.service';
import { ApiResponse } from '../../utils/ApiResponse';
import { asyncHandler } from '../../utils/asyncHandler';

const service = new AdminService();

export const getDashboard = asyncHandler(async (_req: Request, res: Response) => {
  const data = await service.getDashboard();
  return ApiResponse.success(res, data);
});

export const getAuditLogs = asyncHandler(async (req: Request, res: Response) => {
  const { logs, meta } = await service.getAuditLogs(req);
  return ApiResponse.paginated(res, logs, meta);
});

export const getBranches = asyncHandler(async (_req: Request, res: Response) => {
  const data = await service.getBranches();
  return ApiResponse.success(res, data);
});

export const getEmployees = asyncHandler(async (req: Request, res: Response) => {
  const { employees, meta } = await service.getEmployees(req);
  return ApiResponse.paginated(res, employees, meta);
});

export const getAtmStatus = asyncHandler(async (_req: Request, res: Response) => {
  const data = await service.getAtmStatus();
  return ApiResponse.success(res, data);
});

export const getExchangeRates = asyncHandler(async (_req: Request, res: Response) => {
  const data = await service.getExchangeRates();
  return ApiResponse.success(res, data);
});

export const getChargeSchedules = asyncHandler(async (_req: Request, res: Response) => {
  const data = await service.getChargeSchedules();
  return ApiResponse.success(res, data);
});
