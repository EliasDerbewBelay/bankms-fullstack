import { Router } from 'express';
import {
  listTransactions, getTransaction, deposit,
  withdraw, internalTransfer, getDashboardStats, listMyTransactions,
  beneficiaryTransfer, listBanks, directInterbankTransfer, getMyActivity,
} from './transactions.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { transferLimiter } from '../../middleware/rateLimiter';
import {
  internalTransferSchema,
  beneficiaryTransferSchema,
  directInterbankTransferSchema,
} from './transactions.schema';

const router = Router();
router.use(authenticate);

router.get('/stats', authorize('BRANCH_MANAGER'), getDashboardStats);
router.get('/my', authorize('CUSTOMER'), listMyTransactions);
router.get('/my/activity', authorize('CUSTOMER'), getMyActivity);
router.get('/banks', listBanks);
router.get('/', authorize('TELLER'), listTransactions);
router.get('/:id', authorize('TELLER'), getTransaction);

router.post('/deposit', authorize('TELLER'), deposit);
router.post('/withdraw', authorize('TELLER'), withdraw);
router.post('/transfer', authorize('CUSTOMER'), transferLimiter, validate({ body: internalTransferSchema.shape.body }), internalTransfer);
router.post('/transfer/beneficiary', authorize('CUSTOMER'), transferLimiter, validate({ body: beneficiaryTransferSchema.shape.body }), beneficiaryTransfer);
router.post('/transfer/interbank', authorize('CUSTOMER'), transferLimiter, validate({ body: directInterbankTransferSchema.shape.body }), directInterbankTransfer);

export default router;
