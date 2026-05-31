import { Router } from 'express';
import {
  listAccounts, getAccount, getAccountTransactions,
  createAccount, freezeAccount, unfreezeAccount, getMyAccounts,
} from './accounts.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';

const router = Router();
router.use(authenticate);

router.get('/my', authorize('CUSTOMER'), getMyAccounts);
router.get('/', authorize('TELLER'), listAccounts);
router.get('/:id', authorize('TELLER'), getAccount);
router.get('/:id/transactions', authorize('TELLER'), getAccountTransactions);
router.post('/', authorize('TELLER'), createAccount);
router.patch('/:id/freeze', authorize('SUPERVISOR'), freezeAccount);
router.patch('/:id/unfreeze', authorize('SUPERVISOR'), unfreezeAccount);

export default router;
