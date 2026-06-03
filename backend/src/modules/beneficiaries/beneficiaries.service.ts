import { prisma } from '../../config/database';
import { ApiError } from '../../utils/ApiError';

interface BeneficiaryInput {
  beneficiary_name?: string;
  account_number_or_iban?: string;
  bank_name?: string;
  bank_code?: string;
  swift_code?: string;
  relationship?: string;
}

/**
 * Beneficiaries are strictly owned by a customer. Every operation is scoped to
 * the requesting customer's `linked_customer_id`; staff roles are not owners and
 * therefore cannot manage beneficiaries through this module.
 */
export class BeneficiariesService {
  private requireCustomer(customerId?: number | null): number {
    if (!customerId) {
      throw ApiError.forbidden('Only customers can manage beneficiaries');
    }
    return customerId;
  }

  private clean(value?: string): string | null {
    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
  }

  async list(customerId: number | null | undefined) {
    const ownerId = this.requireCustomer(customerId);
    return prisma.beneficiary.findMany({
      where: { customer_id: ownerId },
      orderBy: [{ is_active: 'desc' }, { created_at: 'desc' }],
    });
  }

  private async ownOrThrow(customerId: number, beneficiaryId: number) {
    const beneficiary = await prisma.beneficiary.findUnique({
      where: { beneficiary_id: beneficiaryId },
    });
    if (!beneficiary) throw ApiError.notFound('Beneficiary not found');
    if (beneficiary.customer_id !== customerId) {
      throw ApiError.forbidden('You do not own this beneficiary');
    }
    return beneficiary;
  }

  async create(customerId: number | null | undefined, data: BeneficiaryInput) {
    const ownerId = this.requireCustomer(customerId);
    const accountRef = data.account_number_or_iban!.trim();

    const duplicate = await prisma.beneficiary.findFirst({
      where: { customer_id: ownerId, account_number_or_iban: accountRef },
    });
    if (duplicate) {
      throw ApiError.conflict('A beneficiary with this account number already exists');
    }

    return prisma.beneficiary.create({
      data: {
        customer_id: ownerId,
        beneficiary_name: data.beneficiary_name!.trim(),
        account_number_or_iban: accountRef,
        bank_name: this.clean(data.bank_name),
        bank_code: this.clean(data.bank_code),
        swift_code: this.clean(data.swift_code),
        relationship: this.clean(data.relationship),
      },
    });
  }

  async update(
    customerId: number | null | undefined,
    beneficiaryId: number,
    data: BeneficiaryInput
  ) {
    const ownerId = this.requireCustomer(customerId);
    await this.ownOrThrow(ownerId, beneficiaryId);

    return prisma.beneficiary.update({
      where: { beneficiary_id: beneficiaryId },
      data: {
        ...(data.beneficiary_name !== undefined && {
          beneficiary_name: data.beneficiary_name.trim(),
        }),
        ...(data.account_number_or_iban !== undefined && {
          account_number_or_iban: data.account_number_or_iban.trim(),
        }),
        ...(data.bank_name !== undefined && { bank_name: this.clean(data.bank_name) }),
        ...(data.bank_code !== undefined && { bank_code: this.clean(data.bank_code) }),
        ...(data.swift_code !== undefined && { swift_code: this.clean(data.swift_code) }),
        ...(data.relationship !== undefined && {
          relationship: this.clean(data.relationship),
        }),
        // Re-verification required after any change to payment details.
        is_verified: false,
      },
    });
  }

  async deactivate(customerId: number | null | undefined, beneficiaryId: number) {
    const ownerId = this.requireCustomer(customerId);
    await this.ownOrThrow(ownerId, beneficiaryId);

    return prisma.beneficiary.update({
      where: { beneficiary_id: beneficiaryId },
      data: { is_active: false },
    });
  }
}

export const beneficiariesService = new BeneficiariesService();
