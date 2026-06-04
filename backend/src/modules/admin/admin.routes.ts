import { Router } from 'express';
import {
  getDashboard, getAuditLogs, getBranches, getEmployees,
  getAtmStatus, getExchangeRates, getChargeSchedules,
  // new
  getAllExchangeRates, createExchangeRate, expireExchangeRate,
  createChargeSchedule, expireChargeSchedule,
  getUsers, lockUser, unlockUser, resetUserPassword, disable2FA,
  getSessions, invalidateSession, invalidateAllUserSessions, getSecurityStats,
  createEmployee, updateEmployee,
  createBranch, getDepartments, createDepartment,
  getCurrencies, createCurrency, updateCurrency,
  getAccountTypes, updateAccountType,
  getReportSummary,
} from './admin.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize, authorizeExact } from '../../middleware/authorize';

const router = Router();
router.use(authenticate, authorize('SUPERVISOR'));

// ── Dashboard (SUPERVISOR+) ──────────────────────────────────────────────────
router.get('/dashboard', getDashboard);

// ── Audit Logs (BRANCH_MANAGER+) ────────────────────────────────────────────
router.get('/audit-logs', authorizeExact('BRANCH_MANAGER', 'ADMIN'), getAuditLogs);

// ── Read-only for BRANCH_MANAGER+ ───────────────────────────────────────────
router.get('/branches', getBranches);
router.get('/employees', getEmployees);
router.get('/atm', getAtmStatus);
router.get('/exchange-rates', getExchangeRates);
router.get('/charge-schedules', getChargeSchedules);

// ── ADMIN-only routes ────────────────────────────────────────────────────────
const adminOnly = authorizeExact('ADMIN');

// Exchange Rates (full history + write)
router.get('/exchange-rates/all', adminOnly, getAllExchangeRates);
router.post('/exchange-rates', adminOnly, createExchangeRate);
router.patch('/exchange-rates/:id/expire', adminOnly, expireExchangeRate);

// Charge Schedules (write)
router.post('/charge-schedules', adminOnly, createChargeSchedule);
router.patch('/charge-schedules/:id/expire', adminOnly, expireChargeSchedule);

// User Account Management
router.get('/users', adminOnly, getUsers);
router.patch('/users/:id/lock', adminOnly, lockUser);
router.patch('/users/:id/unlock', adminOnly, unlockUser);
router.patch('/users/:id/reset-password', adminOnly, resetUserPassword);
router.delete('/users/:id/2fa', adminOnly, disable2FA);

// Sessions / Security
router.get('/sessions', adminOnly, getSessions);
router.get('/security-stats', adminOnly, getSecurityStats);
router.patch('/sessions/:id/invalidate', adminOnly, invalidateSession);
router.patch('/users/:userId/sessions/invalidate-all', adminOnly, invalidateAllUserSessions);

// Employee Management (full write)
router.post('/employees', adminOnly, createEmployee);
router.patch('/employees/:id', adminOnly, updateEmployee);

// Branch & Department Config
router.post('/branches', adminOnly, createBranch);
router.get('/departments', adminOnly, getDepartments);
router.post('/departments', adminOnly, createDepartment);

// Currencies
router.get('/currencies', adminOnly, getCurrencies);
router.post('/currencies', adminOnly, createCurrency);
router.patch('/currencies/:id', adminOnly, updateCurrency);

// Account Types
router.get('/account-types', adminOnly, getAccountTypes);
router.patch('/account-types/:id', adminOnly, updateAccountType);

// Reports
router.get('/reports/summary', adminOnly, getReportSummary);

export default router;
