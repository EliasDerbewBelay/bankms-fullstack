import { Router } from 'express';
import { getTransactionReport, getLoanReport, getAccountReport } from './reports.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';

const router = Router();
router.use(authenticate);
router.use(authorize('BRANCH_MANAGER', 'ADMIN'));

router.get('/transactions', getTransactionReport);
router.get('/loans', getLoanReport);
router.get('/accounts', getAccountReport);

export default router;
