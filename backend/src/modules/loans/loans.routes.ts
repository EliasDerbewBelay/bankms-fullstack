import { Router } from 'express';
import {
  listApplications, listLoans, getLoan, submitApplication,
  reviewApplication, createLoan, getSchedule, getLoanStats, listMyLoans,
  listMyApplications
} from './loans.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';

const router = Router();
router.use(authenticate);

router.get('/stats', authorize('BRANCH_MANAGER'), getLoanStats);
router.get('/my', authorize('CUSTOMER'), listMyLoans);
router.get('/applications/my', authorize('CUSTOMER'), listMyApplications);
router.get('/applications', authorize('TELLER'), listApplications);
router.post('/applications', authorize('CUSTOMER'), submitApplication);
router.patch('/applications/:id/review', authorize('SUPERVISOR'), reviewApplication);
router.post('/applications/:id/disburse', authorize('BRANCH_MANAGER'), createLoan);
router.get('/', authorize('TELLER'), listLoans);
router.get('/:id', authorize('TELLER'), getLoan);
router.get('/:id/schedule', authorize('TELLER'), getSchedule);

export default router;
