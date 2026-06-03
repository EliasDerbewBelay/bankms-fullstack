import { z } from 'zod';

export const createBeneficiarySchema = z.object({
  body: z.object({
    beneficiary_name: z.string().min(2).max(200),
    account_number_or_iban: z.string().min(4).max(34),
    bank_name: z.string().min(2).max(200),
    bank_code: z.string().max(20).optional().or(z.literal('')),
    swift_code: z.string().max(11).optional().or(z.literal('')),
    relationship: z.string().max(100).optional().or(z.literal('')),
  }),
});

export const updateBeneficiarySchema = z.object({
  body: z.object({
    beneficiary_name: z.string().min(2).max(200).optional(),
    account_number_or_iban: z.string().min(4).max(34).optional(),
    bank_name: z.string().min(2).max(200).optional(),
    bank_code: z.string().max(20).optional().or(z.literal('')),
    swift_code: z.string().max(11).optional().or(z.literal('')),
    relationship: z.string().max(100).optional().or(z.literal('')),
  }),
});
