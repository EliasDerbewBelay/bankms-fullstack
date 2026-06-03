import { Router } from 'express';
import {
  listUtilityPayments,
  listMyUtilityPayments,
  payUtilityBill,
} from './utility-payments.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { transferLimiter } from '../../middleware/rateLimiter';
import { createUtilityPaymentSchema } from './utility-payments.schema';

const router = Router();
router.use(authenticate);

// Customer self-service: only their own payments.
router.get('/my', authorize('CUSTOMER'), listMyUtilityPayments);
// Staff oversight across all payments.
router.get('/', authorize('TELLER'), listUtilityPayments);
// Any authenticated user may pay; ownership is enforced in the service.
router.post(
  '/',
  transferLimiter,
  validate({ body: createUtilityPaymentSchema.shape.body }),
  payUtilityBill
);

export default router;
