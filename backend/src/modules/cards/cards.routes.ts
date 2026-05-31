import { Router } from 'express';
import { getCards, blockCard } from './cards.controller';
import { authenticate } from '../../middleware/authenticate';

const router = Router();

router.use(authenticate);

router.get('/', getCards);
router.patch('/:id/block', blockCard);

export default router;
