import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { reportsService } from './reports.service';
import { ApiResponse } from '../../utils/ApiResponse';

export const getTransactionReport = asyncHandler(async (req: Request, res: Response) => {
  const days = parseInt(req.query.days as string, 10) || 30;
  const data = await reportsService.getTransactionSummary(Math.min(days, 365));
  return ApiResponse.success(res, data, 'Transaction report generated');
});

export const getLoanReport = asyncHandler(async (_req: Request, res: Response) => {
  const data = await reportsService.getLoanSummary();
  return ApiResponse.success(res, data, 'Loan report generated');
});

export const getAccountReport = asyncHandler(async (_req: Request, res: Response) => {
  const data = await reportsService.getAccountSummary();
  return ApiResponse.success(res, data, 'Account report generated');
});
