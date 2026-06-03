import { Request, Response } from 'express';
import { LoansService } from './loans.service';
import { ApiResponse } from '../../utils/ApiResponse';
import { asyncHandler } from '../../utils/asyncHandler';

const service = new LoansService();

export const listApplications = asyncHandler(async (req: Request, res: Response) => {
  const { applications, meta } = await service.listApplications(req);
  return ApiResponse.paginated(res, applications, meta);
});

export const listLoans = asyncHandler(async (req: Request, res: Response) => {
  const { loans, meta } = await service.listLoans(req);
  return ApiResponse.paginated(res, loans, meta);
});

export const listMyLoans = asyncHandler(async (req: Request, res: Response) => {
  // Override customer_id with the requesting user's linked customer ID
  req.query.customer_id = req.user!.linkedCustomerId?.toString();
  const { loans, meta } = await service.listLoans(req);
  return ApiResponse.paginated(res, loans, meta);
});

export const listMyApplications = asyncHandler(async (req: Request, res: Response) => {
  // Scope strictly to the requesting customer's own applications.
  req.query.customer_id = req.user!.linkedCustomerId?.toString();
  const { applications, meta } = await service.listApplications(req);
  return ApiResponse.paginated(res, applications, meta);
});

export const getLoan = asyncHandler(async (req: Request, res: Response) => {
  const loan = await service.getLoanById(parseInt(req.params.id as string));
  return ApiResponse.success(res, loan);
});

export const submitApplication = asyncHandler(async (req: Request, res: Response) => {
  const app = await service.submitApplication({
    ...req.body,
    requesting_customer_id: req.user!.role === 'CUSTOMER' ? req.user!.linkedCustomerId : null,
  });
  return ApiResponse.created(res, app, 'Loan application submitted');
});

export const reviewApplication = asyncHandler(async (req: Request, res: Response) => {
  const app = await service.reviewApplication(parseInt(req.params.id as string), {
    ...req.body,
    reviewed_by_id: req.user!.linkedEmployeeId,
    reviewer_role: req.user!.role,
  });
  return ApiResponse.success(res, app, 'Application reviewed');
});

export const createLoan = asyncHandler(async (req: Request, res: Response) => {
  const loan = await service.createLoan(parseInt(req.params.id as string), {
    ...req.body,
    approved_by_id: req.user!.linkedEmployeeId,
  });
  return ApiResponse.created(res, loan, 'Loan created and schedule generated');
});

export const getSchedule = asyncHandler(async (req: Request, res: Response) => {
  const schedule = await service.getSchedule(parseInt(req.params.id as string));
  return ApiResponse.success(res, schedule);
});

export const getLoanStats = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await service.getLoanStats();
  return ApiResponse.success(res, stats);
});
