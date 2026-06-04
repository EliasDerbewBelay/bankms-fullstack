import { Router } from 'express';
import { getProfile, changePassword, revokeSession, getLookups, setup2FA, verify2FA, disable2FA } from './settings.controller';
import { authenticate } from '../../middleware/authenticate';

const router = Router();
router.use(authenticate);

router.get('/lookups', getLookups);
router.get('/profile', getProfile);
router.post('/change-password', changePassword);
router.delete('/sessions/:sessionId', revokeSession);

// TOTP 2FA
router.post('/2fa/setup', setup2FA);
router.post('/2fa/verify', verify2FA);
router.delete('/2fa', disable2FA);

export default router;
