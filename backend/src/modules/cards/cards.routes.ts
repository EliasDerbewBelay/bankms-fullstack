import { Router } from 'express';
import { getCards, blockCard, issueCard, updateLimits, freezeCard, unfreezeCard } from './cards.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { issueCardSchema, updateLimitsSchema } from './cards.schema';

const router = Router();

router.use(authenticate);

// /cards/my is an alias for customers — same handler, service scopes by role
router.get('/my', getCards);
router.get('/', getCards);

router.patch('/:id/freeze', freezeCard);
router.patch('/:id/unfreeze', unfreezeCard);
router.patch('/:id/block', blockCard);
router.post('/', authorize('TELLER', 'SUPERVISOR', 'BRANCH_MANAGER', 'ADMIN'), validate({ body: issueCardSchema.shape.body }), issueCard);
router.patch('/:id/limits', validate({ body: updateLimitsSchema.shape.body }), updateLimits);

export default router;
