import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    username: z.string().min(3).max(100),
    password: z.string().min(8),
  }),
});

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1),
  }),
});

export const changePasswordSchema = z.object({
  body: z
    .object({
      currentPassword: z.string().min(8),
      newPassword: z
        .string()
        .min(8)
        .regex(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
          'Password must contain uppercase, lowercase, number and special character'
        ),
      confirmPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: 'Passwords do not match',
      path: ['confirmPassword'],
    }),
});

export const registerCustomerSchema = z.object({
  body: z.object({
    username: z.string().min(3).max(100),
    password: z.string().min(8),
    customer_type: z.enum(['INDIVIDUAL', 'CORPORATE', 'JOINT']),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    company_name: z.string().optional(),
    national_id: z.string().optional(),
    tax_id: z.string().optional(),
    phone_number: z.string(),
    address: z.string(),
    city: z.string(),
  }).refine(data => {
    if (data.customer_type === 'INDIVIDUAL' || data.customer_type === 'JOINT') {
      return !!data.first_name && !!data.last_name && !!data.national_id;
    }
    if (data.customer_type === 'CORPORATE') {
      return !!data.company_name && !!data.tax_id;
    }
    return true;
  }, { message: "Invalid fields for customer type" }),
});

export const adminResetPasswordSchema = z.object({
  body: z.object({
    user_id: z.number().int().positive(),
    new_password: z.string().min(8),
  }),
});

export type LoginInput = z.infer<typeof loginSchema>['body'];
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>['body'];
export type RegisterCustomerInput = z.infer<typeof registerCustomerSchema>['body'];
export type AdminResetPasswordInput = z.infer<typeof adminResetPasswordSchema>['body'];
