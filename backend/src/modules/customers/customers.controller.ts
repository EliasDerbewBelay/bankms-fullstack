import { Request, Response } from 'express';
import { CustomersService } from './customers.service';
import { ApiResponse } from '../../utils/ApiResponse';
import { asyncHandler } from '../../utils/asyncHandler';

const service = new CustomersService();

export const listCustomers = asyncHandler(async (req: Request, res: Response) => {
  const { customers, meta } = await service.list(req);
  return ApiResponse.paginated(res, customers, meta);
});

export const getCustomer = asyncHandler(async (req: Request, res: Response) => {
  const customer = await service.getById(parseInt(req.params.id as string));
  return ApiResponse.success(res, customer);
});

export const createCustomer = asyncHandler(async (req: Request, res: Response) => {
  const customer = await service.create(req.body);
  return ApiResponse.created(res, customer, 'Customer created successfully');
});

export const updateCustomer = asyncHandler(async (req: Request, res: Response) => {
  const customer = await service.update(parseInt(req.params.id as string), req.body);
  return ApiResponse.success(res, customer, 'Customer updated successfully');
});

export const updateKyc = asyncHandler(async (req: Request, res: Response) => {
  const customer = await service.updateKyc(
    parseInt(req.params.id as string),
    req.body.kyc_status,
    req.user!.userId
  );
  return ApiResponse.success(res, customer, 'KYC status updated');
});
