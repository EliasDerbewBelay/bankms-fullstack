import { prisma } from '../../config/database';
import { ApiError } from '../../utils/ApiError';
import { getPagination, buildMeta } from '../../utils/pagination';
import { generateReferenceNumber, generateTransactionRef } from '../../utils/referenceNumber';
import { Request } from 'express';
import { Prisma } from '@prisma/client';

interface PaymentInput {
  account_id: number;
  utility_type: string;
  provider_name: string;
  provider_code?: string;
  provider_account_number: string;
  subscriber_name?: string;
  amount: number;
  currency_id?: number;
}

export class UtilityPaymentsService {
  private buildFilters(req: Request): Prisma.utility_paymentWhereInput {
    const { status, utility_type, from_date, to_date } = req.query as Record<string, string>;
    return {
      ...(status && { status: status as any }),
      ...(utility_type && { utility_type: utility_type as any }),
      ...((from_date || to_date) && {
        payment_date: {
          ...(from_date && { gte: new Date(from_date) }),
          ...(to_date && { lte: new Date(`${to_date}T23:59:59.999Z`) }),
        },
      }),
    };
  }

  private include = {
    account: { select: { account_number: true } },
    currency: { select: { currency_code: true, symbol: true } },
  };

  async list(req: Request) {
    const { page, limit, skip } = getPagination(req);
    const { customer_id } = req.query as Record<string, string>;
    const where: Prisma.utility_paymentWhereInput = {
      ...this.buildFilters(req),
      ...(customer_id && { customer_id: parseInt(customer_id) }),
    };

    const [payments, total] = await Promise.all([
      prisma.utility_payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { payment_date: 'desc' },
        include: this.include,
      }),
      prisma.utility_payment.count({ where }),
    ]);

    return { payments, meta: buildMeta(page, limit, total) };
  }

  async listMine(customerId: number | null | undefined, req: Request) {
    if (!customerId) throw ApiError.forbidden('Only customers can view their payments');
    const { page, limit, skip } = getPagination(req);
    const where: Prisma.utility_paymentWhereInput = {
      customer_id: customerId,
      ...this.buildFilters(req),
    };

    const [payments, total] = await Promise.all([
      prisma.utility_payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { payment_date: 'desc' },
        include: this.include,
      }),
      prisma.utility_payment.count({ where }),
    ]);

    return { payments, meta: buildMeta(page, limit, total) };
  }

  /**
   * Pays a utility bill from a customer account. The debit, the financial
   * transaction record, and the utility_payment record are all written inside a
   * single DB transaction so the ledger can never drift.
   */
  async pay(user: { role: string; linkedCustomerId?: number | null }, data: PaymentInput) {
    const account = await prisma.account.findUnique({
      where: { account_id: data.account_id },
      include: { customer_account: true },
    });
    if (!account) throw ApiError.notFound('Source account not found');

    // Customers may only pay from accounts they own.
    let customerId: number;
    if (user.role === 'CUSTOMER') {
      if (!user.linkedCustomerId) throw ApiError.forbidden('No customer profile linked');
      const owns = account.customer_account.some(
        (ca) => ca.customer_id === user.linkedCustomerId
      );
      if (!owns) throw ApiError.forbidden('You do not own this account');
      customerId = user.linkedCustomerId;
    } else {
      // Staff acting on behalf: derive the primary owner of the account.
      const primary =
        account.customer_account.find((ca) => ca.is_primary_owner) ??
        account.customer_account[0];
      if (!primary) throw ApiError.badRequest('Account has no associated customer');
      customerId = primary.customer_id;
    }

    if (account.status !== 'ACTIVE') throw ApiError.badRequest('Account is not active');
    if (Number(account.available_balance) < data.amount) {
      throw ApiError.badRequest('Insufficient available balance');
    }

    const currencyId = data.currency_id ?? account.currency_id;
    if (currencyId !== account.currency_id) {
      throw ApiError.badRequest('Currency mismatch with the source account');
    }

    return prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          reference_number: generateTransactionRef(),
          transaction_type: 'UTILITY_PAYMENT',
          channel: user.role === 'CUSTOMER' ? 'INTERNET' : 'BRANCH',
          amount: data.amount,
          currency_id: currencyId,
          account_id: data.account_id,
          description: `${data.utility_type} payment to ${data.provider_name}`,
          status: 'COMPLETED',
          value_date: new Date(),
        },
      });

      await tx.account.update({
        where: { account_id: data.account_id },
        data: {
          balance: { decrement: data.amount },
          available_balance: { decrement: data.amount },
        },
      });

      const payment = await tx.utility_payment.create({
        data: {
          account_id: data.account_id,
          customer_id: customerId,
          transaction_id: transaction.transaction_id,
          utility_type: data.utility_type as any,
          provider_name: data.provider_name,
          provider_code: data.provider_code ?? null,
          provider_account_number: data.provider_account_number,
          subscriber_name: data.subscriber_name?.trim() || null,
          amount: data.amount,
          currency_id: currencyId,
          reference_number: generateReferenceNumber('UTL'),
          provider_reference: generateReferenceNumber('PRV'),
          status: 'COMPLETED',
        },
        include: this.include,
      });

      return payment;
    });
  }
}

export const utilityPaymentsService = new UtilityPaymentsService();
