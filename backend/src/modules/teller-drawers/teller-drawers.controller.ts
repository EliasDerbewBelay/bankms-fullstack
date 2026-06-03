import { Request, Response } from 'express';
import { TellerDrawersService } from './teller-drawers.service';
import { ApiResponse } from '../../utils/ApiResponse';
import { asyncHandler } from '../../utils/asyncHandler';

const service = new TellerDrawersService();

export const getDrawer = asyncHandler(async (req: Request, res: Response) => {
  const drawer = await service.getDrawer(parseInt(req.params.employeeId as string));
  return ApiResponse.success(res, drawer);
});

export const openDrawer = asyncHandler(async (req: Request, res: Response) => {
  const drawer = await service.openDrawer(req.body);
  return ApiResponse.created(res, drawer, 'Teller drawer opened');
});

export const closeDrawer = asyncHandler(async (req: Request, res: Response) => {
  const drawer = await service.closeDrawer(parseInt(req.params.id as string));
  return ApiResponse.success(res, drawer, 'Teller drawer closed');
});
