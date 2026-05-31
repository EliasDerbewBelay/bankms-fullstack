import { Router } from 'express';
import { login, refresh, logout, getMe } from './auth.controller';
import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { loginLimiter } from '../../middleware/rateLimiter';
import { loginSchema, refreshSchema } from './auth.schema';

const router = Router();

router.post('/login', loginLimiter, validate({ body: loginSchema.shape.body }), login);
router.post('/refresh', validate({ body: refreshSchema.shape.body }), refresh);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);

export default router;
