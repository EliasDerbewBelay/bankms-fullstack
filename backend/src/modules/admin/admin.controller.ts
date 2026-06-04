import { Request, Response } from 'express';
import { AdminService } from './admin.service';
import { ApiResponse } from '../../utils/ApiResponse';
import { ApiError } from '../../utils/ApiError';
import { asyncHandler } from '../../utils/asyncHandler';

const service = new AdminService();

// ── Read (existing) ──────────────────────────────────────────────────────────
export const getDashboard = asyncHandler(async (_req: Request, res: Response) => {
  return ApiResponse.success(res, await service.getDashboard());
});

export const getAuditLogs = asyncHandler(async (req: Request, res: Response) => {
  const { logs, meta } = await service.getAuditLogs(req);
  return ApiResponse.paginated(res, logs, meta);
});

export const getBranches = asyncHandler(async (_req: Request, res: Response) => {
  return ApiResponse.success(res, await service.getBranches());
});

export const getEmployees = asyncHandler(async (req: Request, res: Response) => {
  const { employees, meta } = await service.getEmployees(req);
  return ApiResponse.paginated(res, employees, meta);
});

export const getAtmStatus = asyncHandler(async (_req: Request, res: Response) => {
  return ApiResponse.success(res, await service.getAtmStatus());
});

export const getExchangeRates = asyncHandler(async (_req: Request, res: Response) => {
  return ApiResponse.success(res, await service.getExchangeRates());
});

export const getChargeSchedules = asyncHandler(async (_req: Request, res: Response) => {
  return ApiResponse.success(res, await service.getChargeSchedules());
});

// ── Exchange Rates ────────────────────────────────────────────────────────────
export const getAllExchangeRates = asyncHandler(async (_req: Request, res: Response) => {
  return ApiResponse.success(res, await service.getAllExchangeRates());
});

export const createExchangeRate = asyncHandler(async (req: Request, res: Response) => {
  const rate = await service.createExchangeRate({
    ...req.body,
    created_by: req.user?.linkedEmployeeId ?? null,
  });
  return ApiResponse.created(res, rate, 'Exchange rate created');
});

export const expireExchangeRate = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.expireExchangeRate(parseInt(req.params.id as string));
  return ApiResponse.success(res, data, 'Exchange rate expired');
});

// ── Charge Schedules ─────────────────────────────────────────────────────────
export const createChargeSchedule = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.createChargeSchedule(req.body);
  return ApiResponse.created(res, data, 'Charge schedule created');
});

export const expireChargeSchedule = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.expireChargeSchedule(parseInt(req.params.id as string));
  return ApiResponse.success(res, data, 'Charge schedule expired');
});

// ── User Account Management ───────────────────────────────────────────────────
export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  const { users, meta } = await service.getUsers(req);
  return ApiResponse.paginated(res, users, meta);
});

export const lockUser = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.lockUser(parseInt(req.params.id as string));
  return ApiResponse.success(res, data, 'User account locked');
});

export const unlockUser = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.unlockUser(parseInt(req.params.id as string));
  return ApiResponse.success(res, data, 'User account unlocked');
});

export const resetUserPassword = asyncHandler(async (req: Request, res: Response) => {
  const { new_password } = req.body;
  if (!new_password) throw new ApiError('new_password is required', 400);
  await service.resetUserPassword(parseInt(req.params.id as string), new_password);
  return ApiResponse.success(res, null, 'Password reset successfully');
});

export const disable2FA = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.disable2FA(parseInt(req.params.id as string));
  return ApiResponse.success(res, data, '2FA disabled');
});

// ── Sessions / Security ───────────────────────────────────────────────────────
export const getSessions = asyncHandler(async (req: Request, res: Response) => {
  const { sessions, meta } = await service.getSessions(req);
  return ApiResponse.paginated(res, sessions, meta);
});

export const invalidateSession = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.invalidateSession(parseInt(req.params.id as string));
  return ApiResponse.success(res, data, 'Session invalidated');
});

export const invalidateAllUserSessions = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.invalidateAllUserSessions(parseInt(req.params.userId as string));
  return ApiResponse.success(res, result, 'All sessions for user invalidated');
});

export const getSecurityStats = asyncHandler(async (_req: Request, res: Response) => {
  return ApiResponse.success(res, await service.getSecurityStats());
});

// ── Employee Management ───────────────────────────────────────────────────────
export const createEmployee = asyncHandler(async (req: Request, res: Response) => {
  const emp = await service.createEmployee(req.body);
  return ApiResponse.created(res, emp, 'Employee created');
});

export const updateEmployee = asyncHandler(async (req: Request, res: Response) => {
  const emp = await service.updateEmployee(parseInt(req.params.id as string), req.body);
  return ApiResponse.success(res, emp, 'Employee updated');
});

// ── Branch & Department ───────────────────────────────────────────────────────
export const createBranch = asyncHandler(async (req: Request, res: Response) => {
  const branch = await service.createBranch(req.body);
  return ApiResponse.created(res, branch, 'Branch created');
});

export const getDepartments = asyncHandler(async (_req: Request, res: Response) => {
  return ApiResponse.success(res, await service.getDepartments());
});

export const createDepartment = asyncHandler(async (req: Request, res: Response) => {
  const dept = await service.createDepartment(req.body);
  return ApiResponse.created(res, dept, 'Department created');
});

// ── Currencies ────────────────────────────────────────────────────────────────
export const getCurrencies = asyncHandler(async (_req: Request, res: Response) => {
  return ApiResponse.success(res, await service.getCurrencies());
});

export const createCurrency = asyncHandler(async (req: Request, res: Response) => {
  const c = await service.createCurrency(req.body);
  return ApiResponse.created(res, c, 'Currency created');
});

export const updateCurrency = asyncHandler(async (req: Request, res: Response) => {
  const c = await service.updateCurrency(parseInt(req.params.id as string), req.body);
  return ApiResponse.success(res, c, 'Currency updated');
});

// ── Account Types ─────────────────────────────────────────────────────────────
export const getAccountTypes = asyncHandler(async (_req: Request, res: Response) => {
  return ApiResponse.success(res, await service.getAccountTypes());
});

export const updateAccountType = asyncHandler(async (req: Request, res: Response) => {
  const at = await service.updateAccountType(parseInt(req.params.id as string), req.body);
  return ApiResponse.success(res, at, 'Account type updated');
});

// ── Reports ───────────────────────────────────────────────────────────────────
export const getReportSummary = asyncHandler(async (_req: Request, res: Response) => {
  return ApiResponse.success(res, await service.getReportSummary());
});
