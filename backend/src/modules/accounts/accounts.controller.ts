import { Request, Response } from 'express';
import { AccountsService } from './accounts.service';
import { ApiResponse } from '../../utils/ApiResponse';
import { asyncHandler } from '../../utils/asyncHandler';

const service = new AccountsService();

export const listAccounts = asyncHandler(async (req: Request, res: Response) => {
  const { accounts, meta } = await service.list(req);
  return ApiResponse.paginated(res, accounts, meta);
});

export const getAccount = asyncHandler(async (req: Request, res: Response) => {
  const account = await service.getById(parseInt(req.params.id as string));
  return ApiResponse.success(res, account);
});

export const getAccountTransactions = asyncHandler(async (req: Request, res: Response) => {
  const { transactions, meta } = await service.getTransactions(parseInt(req.params.id as string), req);
  return ApiResponse.paginated(res, transactions, meta);
});

export const createAccount = asyncHandler(async (req: Request, res: Response) => {
  const account = await service.create({
    ...req.body,
    opened_by_employee_id: req.user!.linkedEmployeeId!,
  });
  return ApiResponse.created(res, account, 'Account opened successfully');
});

export const freezeAccount = asyncHandler(async (req: Request, res: Response) => {
  const account = await service.freeze(parseInt(req.params.id as string), req.user!.userId);
  return ApiResponse.success(res, account, 'Account frozen');
});

export const unfreezeAccount = asyncHandler(async (req: Request, res: Response) => {
  const account = await service.unfreeze(parseInt(req.params.id as string), req.user!.userId);
  return ApiResponse.success(res, account, 'Account unfrozen');
});

export const getMyAccounts = asyncHandler(async (req: Request, res: Response) => {
  const accounts = await service.getMyAccounts(req.user!.linkedCustomerId!);
  return ApiResponse.success(res, accounts);
});
