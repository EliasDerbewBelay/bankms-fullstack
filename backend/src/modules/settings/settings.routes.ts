import { Router } from 'express';
import { getProfile, changePassword, revokeSession, getLookups } from './settings.controller';
import { authenticate } from '../../middleware/authenticate';

const router = Router();
router.use(authenticate);

router.get('/lookups', getLookups);
router.get('/profile', getProfile);
router.post('/change-password', changePassword);
router.delete('/sessions/:sessionId', revokeSession);

export default router;
