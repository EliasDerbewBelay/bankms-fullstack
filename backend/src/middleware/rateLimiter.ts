import rateLimit from 'express-rate-limit'; // Trigger restart
import { env } from '../config/env';
import { ApiResponse } from '../utils/ApiResponse';

export const globalLimiter = rateLimit({
  windowMs: parseInt(env.RATE_LIMIT_WINDOW_MS),
  max: parseInt(env.RATE_LIMIT_GLOBAL_MAX),
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    ApiResponse.error(res, 'Too many requests, please try again later', 429);
  },
});

export const loginLimiter = rateLimit({
  windowMs: parseInt(env.RATE_LIMIT_WINDOW_MS),
  max: parseInt(env.RATE_LIMIT_LOGIN_MAX),
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    ApiResponse.error(res, 'Too many login attempts, please try again in 15 minutes', 429);
  },
  skipSuccessfulRequests: true,
});

export const transferLimiter = rateLimit({
  windowMs: 3600000, // 1 hour
  max: parseInt(env.RATE_LIMIT_TRANSFER_MAX),
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    ApiResponse.error(res, 'Transfer limit reached for this hour', 429);
  },
});
