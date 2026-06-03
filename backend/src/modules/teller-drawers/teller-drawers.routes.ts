import { Router } from 'express';
import { getDrawer, openDrawer, closeDrawer } from './teller-drawers.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';

const router = Router();
router.use(authenticate);

router.get('/employee/:employeeId', authorize('TELLER'), getDrawer);
router.post('/open', authorize('SUPERVISOR'), openDrawer);
router.post('/:id/close', authorize('SUPERVISOR'), closeDrawer);

export default router;
