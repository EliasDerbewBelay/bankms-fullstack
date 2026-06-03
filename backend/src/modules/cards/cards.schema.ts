import { z } from 'zod';

export const issueCardSchema = z.object({
  body: z.object({
    account_id: z.number().int().positive(),
    card_type: z.enum(['DEBIT', 'CREDIT', 'PREPAID']),
    card_network: z.enum(['VISA', 'MASTERCARD', 'AMEX', 'UNIONPAY', 'LOCAL']),
    daily_limit: z.number().optional(),
    monthly_limit: z.number().optional(),
  }),
});

export const updateLimitsSchema = z.object({
  body: z.object({
    daily_limit: z.number().optional(),
    monthly_limit: z.number().optional(),
  }),
});
