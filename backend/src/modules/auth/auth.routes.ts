import { Router } from 'express';
import { login, refresh, logout, getMe, register, changePassword, adminResetPassword } from './auth.controller';
import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { authorizeExact } from '../../middleware/authorize';
import { loginLimiter } from '../../middleware/rateLimiter';
import { loginSchema, refreshSchema, registerCustomerSchema, changePasswordSchema, adminResetPasswordSchema } from './auth.schema';

const router = Router();

router.post('/login', loginLimiter, validate({ body: loginSchema.shape.body }), login);
router.post('/refresh', validate({ body: refreshSchema.shape.body }), refresh);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);
router.post('/register', validate({ body: registerCustomerSchema.shape.body }), register);
router.post('/change-password', authenticate, validate({ body: changePasswordSchema.shape.body }), changePassword);
router.post('/admin/reset-password', authenticate, authorizeExact('ADMIN'), validate({ body: adminResetPasswordSchema.shape.body }), adminResetPassword);
export default router;
