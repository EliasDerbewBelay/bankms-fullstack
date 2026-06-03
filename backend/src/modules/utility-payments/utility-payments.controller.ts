import { Request, Response } from 'express';
import { utilityPaymentsService } from './utility-payments.service';
import { ApiResponse } from '../../utils/ApiResponse';
import { asyncHandler } from '../../utils/asyncHandler';

export const listUtilityPayments = asyncHandler(async (req: Request, res: Response) => {
  const { payments, meta } = await utilityPaymentsService.list(req);
  return ApiResponse.paginated(res, payments, meta);
});

export const listMyUtilityPayments = asyncHandler(async (req: Request, res: Response) => {
  const { payments, meta } = await utilityPaymentsService.listMine(
    req.user!.linkedCustomerId,
    req
  );
  return ApiResponse.paginated(res, payments, meta);
});

export const payUtilityBill = asyncHandler(async (req: Request, res: Response) => {
  const payment = await utilityPaymentsService.pay(req.user!, req.body);
  return ApiResponse.created(res, payment, 'Payment submitted');
});
