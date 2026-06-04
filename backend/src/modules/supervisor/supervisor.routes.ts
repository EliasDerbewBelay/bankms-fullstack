import { Router } from 'express';
import { getSupervisorOverview, withdrawalOverride } from './supervisor.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorizeExact } from '../../middleware/authorize';

const router = Router();
router.use(authenticate, authorizeExact('SUPERVISOR', 'BRANCH_MANAGER', 'ADMIN'));

router.get('/overview', getSupervisorOverview);
router.post('/withdraw-override', withdrawalOverride);

export default router;
