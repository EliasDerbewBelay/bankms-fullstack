import { Router } from 'express';
import {
  getDashboard, getAuditLogs, getBranches,
  getEmployees, getAtmStatus, getExchangeRates, getChargeSchedules,
} from './admin.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize, authorizeExact } from '../../middleware/authorize';

const router = Router();
router.use(authenticate, authorize('SUPERVISOR'));

router.get('/dashboard', getDashboard);
router.get('/audit-logs', authorizeExact('BRANCH_MANAGER', 'ADMIN'), getAuditLogs);
router.get('/branches', getBranches);
router.get('/employees', getEmployees);
router.get('/atm', getAtmStatus);
router.get('/exchange-rates', getExchangeRates);
router.get('/charge-schedules', getChargeSchedules);

export default router;
