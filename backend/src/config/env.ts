import { z } from 'zod';
import dotenv from 'dotenv';
import { isValidCorsOriginList, normalizeCorsOriginInput } from './cors-origin';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('4000'),
  API_VERSION: z.string().default('v1'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DIRECT_URL: z.string().min(1, 'DIRECT_URL is required'),
  REDIS_URL: z.string().optional(),
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGIN: z.preprocess(
    (val) => normalizeCorsOriginInput(val),
    z
      .string()
      .refine(isValidCorsOriginList, {
        message:
          'CORS_ORIGIN must be comma-separated http(s) URLs without quotes, e.g. https://app.vercel.app,http://localhost:3000',
      })
  ),
  CORS_ALLOW_VERCEL_PREVIEWS: z
    .enum(['true', 'false'])
    .default('false')
    .describe('Allow any *.vercel.app origin (preview deployments)'),
  RATE_LIMIT_WINDOW_MS: z.string().default('900000'),
  RATE_LIMIT_LOGIN_MAX: z.string().default('5'),
  RATE_LIMIT_OTP_MAX: z.string().default('3'),
  RATE_LIMIT_TRANSFER_MAX: z.string().default('20'),
  RATE_LIMIT_GLOBAL_MAX: z.string().default('100'),
  LOG_LEVEL: z.string().default('debug'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  if (process.env.CORS_ORIGIN !== undefined) {
    console.error('CORS_ORIGIN received:', JSON.stringify(process.env.CORS_ORIGIN));
  }
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
