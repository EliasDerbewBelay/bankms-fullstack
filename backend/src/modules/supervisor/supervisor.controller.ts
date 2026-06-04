import { Request, Response } from 'express';
import { SupervisorService } from './supervisor.service';
import { ApiResponse } from '../../utils/ApiResponse';
import { ApiError } from '../../utils/ApiError';
import { asyncHandler } from '../../utils/asyncHandler';

const service = new SupervisorService();

export const getSupervisorOverview = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.linkedEmployeeId) throw new ApiError('No employee profile linked', 403);
  const data = await service.getOverview(req.user.linkedEmployeeId);
  return ApiResponse.success(res, data, 'Overview loaded');
});

export const withdrawalOverride = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.linkedEmployeeId) throw new ApiError('No employee profile linked', 403);
  const { account_id, amount, override_reason } = req.body;
  if (!account_id || !amount || !override_reason) {
    throw new ApiError('account_id, amount, and override_reason are required', 400);
  }
  const result = await service.withdrawalOverride({
    account_id: parseInt(account_id),
    amount: parseFloat(amount),
    override_reason,
    processed_by_employee_id: req.user.linkedEmployeeId,
    user_id: req.user.userId,
  });
  return ApiResponse.created(res, result, 'Override withdrawal processed');
});
