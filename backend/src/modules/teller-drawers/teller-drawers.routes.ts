import { Router } from 'express';
import { getDrawer, openDrawer, closeDrawer, getTellerDashboard } from './teller-drawers.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';

const router = Router();
router.use(authenticate);

router.get('/employee/:employeeId', authorize('TELLER'), getDrawer);
router.get('/employee/:employeeId/dashboard', authorize('TELLER'), getTellerDashboard);
router.post('/open', authorize('SUPERVISOR'), openDrawer);
router.post('/:id/close', authorize('SUPERVISOR'), closeDrawer);

export default router;
