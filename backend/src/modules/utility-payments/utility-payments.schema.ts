import { z } from 'zod';

export const createUtilityPaymentSchema = z.object({
  body: z.object({
    account_id: z.number().int().positive(),
    utility_type: z.enum([
      'ELECTRICITY',
      'WATER',
      'TELECOM',
      'INTERNET',
      'TAX',
      'INSURANCE',
      'SCHOOL_FEE',
      'OTHER',
    ]),
    provider_name: z.string().min(2).max(200),
    provider_code: z.string().max(50).optional(),
    provider_account_number: z.string().min(1).max(100),
    subscriber_name: z.string().max(200).optional().or(z.literal('')),
    amount: z.number().positive(),
    currency_id: z.number().int().positive().optional(),
  }),
});
