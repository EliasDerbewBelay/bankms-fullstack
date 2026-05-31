import { z } from 'zod';

export const createCustomerSchema = z.object({
  customer_type: z.enum(['INDIVIDUAL', 'CORPORATE', 'JOINT']),
  first_name: z.string().min(1).max(100).optional(),
  last_name: z.string().min(1).max(100).optional(),
  date_of_birth: z.string().date().optional(),
  national_id: z.string().max(50).optional(),
  company_name: z.string().max(200).optional(),
  tax_id: z.string().max(50).optional(),
  incorporation_date: z.string().date().optional(),
  address: z.string().min(5),
  city: z.string().min(2).max(100),
  phone_number: z.string().min(10).max(20),
  email: z.string().email().optional(),
  relationship_manager_id: z.number().int().positive().optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial().omit({
  customer_type: true,
});

export const customerIdSchema = z.object({
  id: z.string().transform((v) => parseInt(v)),
});

export const listCustomersSchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  customer_type: z.enum(['INDIVIDUAL', 'CORPORATE', 'JOINT']).optional(),
  kyc_status: z
    .enum(['PENDING', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'EXPIRED'])
    .optional(),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
