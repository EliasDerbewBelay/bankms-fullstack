import { Router } from 'express';
import { getCards, blockCard, issueCard, updateLimits } from './cards.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { issueCardSchema, updateLimitsSchema } from './cards.schema';
const router = Router();

router.use(authenticate);

router.get('/', getCards);
router.patch('/:id/block', blockCard);
router.post('/issue', authorize('TELLER', 'SUPERVISOR', 'BRANCH_MANAGER', 'ADMIN'), validate({ body: issueCardSchema.shape.body }), issueCard);
router.patch('/:id/limits', validate({ body: updateLimitsSchema.shape.body }), updateLimits);

export default router;
