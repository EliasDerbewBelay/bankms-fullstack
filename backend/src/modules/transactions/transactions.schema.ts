import { z } from 'zod';

export const internalTransferSchema = z.object({
  body: z.object({
    from_account_id: z.number().int().positive(),
    to_account_id: z.number().int().positive(),
    amount: z.number().positive(),
    currency_id: z.number().int().positive(),
    description: z.string().max(255).optional(),
  }),
});

export const beneficiaryTransferSchema = z.object({
  body: z.object({
    from_account_id: z.number().int().positive(),
    beneficiary_id: z.number().int().positive(),
    amount: z.number().positive(),
    description: z.string().max(255).optional(),
  }),
});
