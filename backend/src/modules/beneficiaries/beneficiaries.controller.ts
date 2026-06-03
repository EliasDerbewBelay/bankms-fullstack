import { Request, Response } from 'express';
import { beneficiariesService } from './beneficiaries.service';
import { ApiResponse } from '../../utils/ApiResponse';
import { ApiError } from '../../utils/ApiError';
import { asyncHandler } from '../../utils/asyncHandler';

const parseId = (raw: unknown): number => {
  const id = parseInt(String(raw), 10);
  if (isNaN(id)) throw ApiError.badRequest('Invalid beneficiary ID');
  return id;
};

export const listBeneficiaries = asyncHandler(async (req: Request, res: Response) => {
  const beneficiaries = await beneficiariesService.list(req.user!.linkedCustomerId);
  return ApiResponse.success(res, beneficiaries);
});

export const createBeneficiary = asyncHandler(async (req: Request, res: Response) => {
  const beneficiary = await beneficiariesService.create(req.user!.linkedCustomerId, req.body);
  return ApiResponse.created(res, beneficiary, 'Beneficiary added');
});

export const updateBeneficiary = asyncHandler(async (req: Request, res: Response) => {
  const beneficiary = await beneficiariesService.update(
    req.user!.linkedCustomerId,
    parseId(req.params.id),
    req.body
  );
  return ApiResponse.success(res, beneficiary, 'Beneficiary updated');
});

export const deactivateBeneficiary = asyncHandler(async (req: Request, res: Response) => {
  const beneficiary = await beneficiariesService.deactivate(
    req.user!.linkedCustomerId,
    parseId(req.params.id)
  );
  return ApiResponse.success(res, beneficiary, 'Beneficiary deactivated');
});
