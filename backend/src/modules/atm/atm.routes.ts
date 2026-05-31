import { Router } from 'express';
import { getAllAtms, getAtmStats, logRefill, setMaintenance } from './atm.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';

const router = Router();
router.use(authenticate);

router.get('/', authorize('SUPERVISOR', 'BRANCH_MANAGER', 'ADMIN'), getAllAtms);
router.get('/stats', authorize('SUPERVISOR', 'BRANCH_MANAGER', 'ADMIN'), getAtmStats);
router.patch('/:id/refill', authorize('BRANCH_MANAGER', 'ADMIN'), logRefill);
router.patch('/:id/maintenance', authorize('BRANCH_MANAGER', 'ADMIN'), setMaintenance);

export default router;
