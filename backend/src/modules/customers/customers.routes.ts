import { Router } from 'express';
import { listCustomers, getCustomer, createCustomer, updateCustomer, updateKyc } from './customers.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { createCustomerSchema, updateCustomerSchema } from './customers.schema';

const router = Router();

router.use(authenticate);

router.get('/', authorize('TELLER'), listCustomers);
router.get('/:id', authorize('TELLER'), getCustomer);
router.post('/', authorize('TELLER'), validate({ body: createCustomerSchema }), createCustomer);
router.put('/:id', authorize('TELLER'), validate({ body: updateCustomerSchema }), updateCustomer);
router.patch('/:id/kyc', authorize('SUPERVISOR'), updateKyc);

export default router;
