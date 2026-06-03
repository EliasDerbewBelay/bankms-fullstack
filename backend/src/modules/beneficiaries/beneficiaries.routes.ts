import { Router } from 'express';
import {
  listBeneficiaries,
  createBeneficiary,
  updateBeneficiary,
  deactivateBeneficiary,
} from './beneficiaries.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorizeExact } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { createBeneficiarySchema, updateBeneficiarySchema } from './beneficiaries.schema';

const router = Router();

router.use(authenticate);
// Beneficiaries are a customer self-service feature only.
router.use(authorizeExact('CUSTOMER'));

router.get('/', listBeneficiaries);
router.post('/', validate({ body: createBeneficiarySchema.shape.body }), createBeneficiary);
router.put('/:id', validate({ body: updateBeneficiarySchema.shape.body }), updateBeneficiary);
router.patch('/:id/deactivate', deactivateBeneficiary);

export default router;
