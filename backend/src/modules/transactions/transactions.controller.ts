import { Request, Response } from 'express';
import { TransactionsService } from './transactions.service';
import { ApiResponse } from '../../utils/ApiResponse';
import { asyncHandler } from '../../utils/asyncHandler';

const service = new TransactionsService();

export const listTransactions = asyncHandler(async (req: Request, res: Response) => {
  const { transactions, meta } = await service.list(req);
  return ApiResponse.paginated(res, transactions, meta);
});

export const getTransaction = asyncHandler(async (req: Request, res: Response) => {
  const txn = await service.getById(parseInt(req.params.id as string));
  return ApiResponse.success(res, txn);
});

export const deposit = asyncHandler(async (req: Request, res: Response) => {
  const txn = await service.deposit({
    ...req.body,
    processed_by_employee_id: req.user!.linkedEmployeeId,
  });
  return ApiResponse.created(res, txn, 'Deposit successful');
});

export const withdraw = asyncHandler(async (req: Request, res: Response) => {
  const txn = await service.withdraw({
    ...req.body,
    processed_by_employee_id: req.user!.linkedEmployeeId,
  });
  return ApiResponse.created(res, txn, 'Withdrawal successful');
});

export const internalTransfer = asyncHandler(async (req: Request, res: Response) => {
  const txn = await service.internalTransfer(req.body);
  return ApiResponse.created(res, txn, 'Transfer successful');
});

export const getDashboardStats = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await service.getDashboardStats();
  return ApiResponse.success(res, stats);
});
