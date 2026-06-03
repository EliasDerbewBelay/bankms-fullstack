import { Router } from 'express';
import {
  listTransactions, getTransaction, deposit,
  withdraw, internalTransfer, getDashboardStats, listMyTransactions,
  beneficiaryTransfer,
} from './transactions.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { transferLimiter } from '../../middleware/rateLimiter';
import { internalTransferSchema, beneficiaryTransferSchema } from './transactions.schema';

const router = Router();
router.use(authenticate);

router.get('/stats', authorize('BRANCH_MANAGER'), getDashboardStats);
router.get('/my', authorize('CUSTOMER'), listMyTransactions);
router.get('/', authorize('TELLER'), listTransactions);
router.get('/:id', authorize('TELLER'), getTransaction);
router.post('/deposit', authorize('TELLER'), deposit);
router.post('/withdraw', authorize('TELLER'), withdraw);
router.post('/transfer', authorize('CUSTOMER'), transferLimiter, validate({ body: internalTransferSchema.shape.body }), internalTransfer);
router.post('/transfer/beneficiary', authorize('CUSTOMER'), transferLimiter, validate({ body: beneficiaryTransferSchema.shape.body }), beneficiaryTransfer);

export default router;
