import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { refundsService } from './refunds.service';
import { ApiResponse } from '../../utils/ApiResponse';
import { ApiError } from '../../utils/ApiError';
import { z } from 'zod';

const requestRefundSchema = z.object({
  original_transaction_id: z.number().int().positive(),
  account_id: z.number().int().positive(),
  amount: z.number().positive(),
  reason: z.string().min(5),
});

const rejectRefundSchema = z.object({
  rejection_reason: z.string().min(5),
});

export const listRefunds = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(String(req.query.page ?? '1'), 10);
  const limit = Math.min(parseInt(String(req.query.limit ?? '20'), 10), 100);
  const status = req.query.status as string | undefined;
  const result = await refundsService.list({ status, page, limit });
  return ApiResponse.paginated(res, result.data, result.meta, 'Refunds retrieved');
});

export const listMyRefunds = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.linkedCustomerId) throw new ApiError('No customer profile linked', 403);
  const page = parseInt(String(req.query.page ?? '1'), 10);
  const limit = Math.min(parseInt(String(req.query.limit ?? '20'), 10), 100);
  const status = req.query.status as string | undefined;
  const result = await refundsService.listMine(req.user.linkedCustomerId, { status, page, limit });
  return ApiResponse.paginated(res, result.data, result.meta, 'Refunds retrieved');
});

export const requestRefund = asyncHandler(async (req: Request, res: Response) => {
  const body = requestRefundSchema.parse(req.body);
  const refund = await refundsService.request(body, req.user!);
  return ApiResponse.created(res, refund, 'Refund request submitted');
});

export const approveRefund = asyncHandler(async (req: Request, res: Response) => {
  const refundId = parseInt(String(req.params.id), 10);
  if (isNaN(refundId)) throw new ApiError('Invalid refund ID', 400);
  const refund = await refundsService.approve(refundId, req.user!.linkedEmployeeId!, req.user!.userId);
  return ApiResponse.success(res, refund, 'Refund approved');
});

export const rejectRefund = asyncHandler(async (req: Request, res: Response) => {
  const refundId = parseInt(String(req.params.id), 10);
  if (isNaN(refundId)) throw new ApiError('Invalid refund ID', 400);
  const { rejection_reason } = rejectRefundSchema.parse(req.body);
  const refund = await refundsService.reject(refundId, req.user!.linkedEmployeeId!, rejection_reason);
  return ApiResponse.success(res, refund, 'Refund rejected');
});
