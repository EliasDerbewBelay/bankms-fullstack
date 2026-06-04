import { Request, Response } from 'express';
import { TransactionsService } from './transactions.service';
import { ApiResponse } from '../../utils/ApiResponse';
import { ApiError } from '../../utils/ApiError';
import { asyncHandler } from '../../utils/asyncHandler';

const service = new TransactionsService();

export const listTransactions = asyncHandler(async (req: Request, res: Response) => {
  const { transactions, meta } = await service.list(req);
  return ApiResponse.paginated(res, transactions, meta);
});

export const listMyTransactions = asyncHandler(async (req: Request, res: Response) => {
  const { transactions, meta } = await service.listMine(req.user!.linkedCustomerId, req);
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
  const txn = await service.internalTransfer({
    ...req.body,
    requesting_customer_id: req.user!.role === 'CUSTOMER' ? req.user!.linkedCustomerId : null,
  }, req.user!);
  return ApiResponse.created(res, txn, 'Transfer successful');
});

export const beneficiaryTransfer = asyncHandler(async (req: Request, res: Response) => {
  const txn = await service.beneficiaryTransfer({
    ...req.body,
    requesting_customer_id: req.user!.role === 'CUSTOMER' ? req.user!.linkedCustomerId : null,
  }, req.user!);
  return ApiResponse.created(res, txn, 'Transfer successful');
});

export const getMyActivity = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.linkedCustomerId) throw new ApiError('No customer profile linked', 403);
  const activity = await service.getCustomerActivity(req.user.linkedCustomerId);
  return ApiResponse.success(res, activity, 'Activity data retrieved');
});

export const listBanks = asyncHandler(async (_req: Request, res: Response) => {
  const banks = await service.listBanks();
  return ApiResponse.success(res, banks, 'Banks retrieved');
});

export const directInterbankTransfer = asyncHandler(async (req: Request, res: Response) => {
  const txn = await service.directInterbankTransfer({
    ...req.body,
    requesting_customer_id: req.user!.role === 'CUSTOMER' ? req.user!.linkedCustomerId : null,
  }, req.user!);
  return ApiResponse.created(res, txn, 'Interbank transfer submitted successfully');
});

export const getDashboardStats = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await service.getDashboardStats();
  return ApiResponse.success(res, stats);
});
