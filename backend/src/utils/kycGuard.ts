import { prisma } from '../config/database';
import { ApiError } from './ApiError';

/**
 * Throws 403 if the customer linked to the given user does not have VERIFIED KYC.
 * Only applies when the user is a CUSTOMER.
 */
export async function requireVerifiedKyc(user: { role: string; linkedCustomerId?: number | null }): Promise<void> {
  if (user.role !== 'CUSTOMER') return;
  if (!user.linkedCustomerId) throw new ApiError('No customer profile linked to this account', 403);

  const customer = await prisma.customer.findUnique({
    where: { customer_id: user.linkedCustomerId },
    select: { kyc_status: true },
  });

  if (!customer) throw new ApiError('Customer profile not found', 404);
  if (customer.kyc_status !== 'VERIFIED') {
    throw new ApiError(
      'Your KYC verification is not complete. Please visit a branch to verify your identity before transacting.',
      403
    );
  }
}
