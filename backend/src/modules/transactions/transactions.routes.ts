import { Router } from 'express';
import {
  listTransactions, getTransaction, deposit,
  withdraw, internalTransfer, getDashboardStats,
} from './transactions.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { transferLimiter } from '../../middleware/rateLimiter';

const router = Router();
router.use(authenticate);

router.get('/stats', authorize('BRANCH_MANAGER'), getDashboardStats);
router.get('/', authorize('TELLER'), listTransactions);
router.get('/:id', authorize('TELLER'), getTransaction);
router.post('/deposit', authorize('TELLER'), deposit);
router.post('/withdraw', authorize('TELLER'), withdraw);
router.post('/transfer', authorize('CUSTOMER'), transferLimiter, internalTransfer);

export default router;
