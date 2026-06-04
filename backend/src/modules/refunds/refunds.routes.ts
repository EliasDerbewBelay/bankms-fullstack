import { Router } from 'express';
import { listRefunds, listMyRefunds, requestRefund, approveRefund, rejectRefund } from './refunds.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';

const router = Router();
router.use(authenticate);

// Customer: view own refund requests
router.get('/my', authorize('CUSTOMER'), listMyRefunds);

// Staff: list all refunds
router.get('/', authorize('TELLER', 'SUPERVISOR', 'BRANCH_MANAGER', 'ADMIN'), listRefunds);

// Any authenticated user can request a refund (service enforces ownership)
router.post('/', requestRefund);

// Supervisor+ approve/reject
router.patch('/:id/approve', authorize('SUPERVISOR', 'BRANCH_MANAGER', 'ADMIN'), approveRefund);
router.patch('/:id/reject', authorize('SUPERVISOR', 'BRANCH_MANAGER', 'ADMIN'), rejectRefund);

export default router;
