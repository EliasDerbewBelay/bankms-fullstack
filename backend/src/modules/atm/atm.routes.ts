import { Router } from 'express';
import { getAllAtms, getAtmStats, refillAtm, updateStatus } from './atm.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';

const router = Router();
router.use(authenticate);

router.get('/', authorize('TELLER'), getAllAtms);
router.get('/stats', authorize('TELLER'), getAtmStats);
router.patch('/:id/refill', authorize('BRANCH_MANAGER', 'ADMIN'), refillAtm);
router.patch('/:id/status', authorize('ADMIN'), updateStatus);

export default router;
