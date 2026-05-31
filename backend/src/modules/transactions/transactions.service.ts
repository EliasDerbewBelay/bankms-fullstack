import { prisma } from '../../config/database';
import { ApiError } from '../../utils/ApiError';
import { getPagination, buildMeta } from '../../utils/pagination';
import { generateTransactionRef } from '../../utils/referenceNumber';
import { Request } from 'express';
import { Prisma } from '@prisma/client';

export class TransactionsService {
  async list(req: Request) {
    const { page, limit, skip } = getPagination(req);
    const { type, status, channel, from_date, to_date, account_id } = req.query as Record<string, string>;

    const where: Prisma.transactionWhereInput = {
      ...(type && { transaction_type: type as any }),
      ...(status && { status: status as any }),
      ...(channel && { channel: channel as any }),
      ...(account_id && { account_id: parseInt(account_id) }),
      ...(from_date && { transaction_date: { gte: new Date(from_date) } }),
      ...(to_date && { transaction_date: { lte: new Date(to_date) } }),
    };

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where, skip, take: limit,
        orderBy: { transaction_date: 'desc' },
        include: {
          currency: { select: { currency_code: true, symbol: true } },
          from_account: {
            select: { account_number: true },
            include: {
              customer_account: {
                where: { is_primary_owner: true },
                include: {
                  customer: { select: { first_name: true, last_name: true, company_name: true } },
                },
              },
            },
          },
          to_account: { select: { account_number: true } },
          transaction_fee: true,
          processed_by: { select: { first_name: true, last_name: true } },
        },
      }),
      prisma.transaction.count({ where }),
    ]);

    return { transactions, meta: buildMeta(page, limit, total) };
  }

  async getById(id: number) {
    const txn = await prisma.transaction.findUnique({
      where: { transaction_id: id },
      include: {
        currency: true,
        settled_currency: true,
        from_account: {
          include: {
            customer_account: {
              where: { is_primary_owner: true },
              include: { customer: true },
            },
          },
        },
        to_account: true,
        transaction_fee: { include: { currency: true } },
        processed_by: { select: { first_name: true, last_name: true, position: true } },
        card_transaction: true,
        atm_transaction: { include: { atm: true } },
      },
    });
    if (!txn) throw ApiError.notFound('Transaction not found');
    return txn;
  }

  async deposit(data: {
    account_id: number;
    amount: number;
    currency_id: number;
    description?: string;
    processed_by_employee_id: number;
    channel?: string;
  }) {
    const account = await prisma.account.findUnique({
      where: { account_id: data.account_id },
      include: { account_type: true },
    });

    if (!account) throw ApiError.notFound('Account not found');
    if (account.status !== 'ACTIVE') throw ApiError.badRequest('Account is not active');
    if (account.currency_id !== data.currency_id)
      throw ApiError.badRequest('Currency mismatch');

    return prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          reference_number: generateTransactionRef(),
          transaction_type: 'DEPOSIT',
          channel: (data.channel as any) ?? 'BRANCH',
          amount: data.amount,
          currency_id: data.currency_id,
          account_id: data.account_id,
          description: data.description ?? 'Cash deposit',
          status: 'COMPLETED',
          processed_by_employee_id: data.processed_by_employee_id,
          value_date: new Date(),
        },
      });

      await tx.account.update({
        where: { account_id: data.account_id },
        data: {
          balance: { increment: data.amount },
          available_balance: { increment: data.amount },
        },
      });

      return transaction;
    });
  }

  async withdraw(data: {
    account_id: number;
    amount: number;
    currency_id: number;
    description?: string;
    processed_by_employee_id?: number;
    channel?: string;
  }) {
    const account = await prisma.account.findUnique({
      where: { account_id: data.account_id },
      include: { account_type: true },
    });

    if (!account) throw ApiError.notFound('Account not found');
    if (account.status !== 'ACTIVE') throw ApiError.badRequest('Account is not active');
    if (Number(account.available_balance) < data.amount)
      throw ApiError.badRequest('Insufficient available balance');
    if (account.currency_id !== data.currency_id)
      throw ApiError.badRequest('Currency mismatch');

    const minBalance = Number(account.account_type.minimum_balance);
    if (Number(account.balance) - data.amount < minBalance)
      throw ApiError.badRequest(`Withdrawal would breach minimum balance of ${minBalance}`);

    return prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          reference_number: generateTransactionRef(),
          transaction_type: 'WITHDRAWAL',
          channel: (data.channel as any) ?? 'BRANCH',
          amount: data.amount,
          currency_id: data.currency_id,
          account_id: data.account_id,
          description: data.description ?? 'Cash withdrawal',
          status: 'COMPLETED',
          processed_by_employee_id: data.processed_by_employee_id ?? null,
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

      return transaction;
    });
  }

  async internalTransfer(data: {
    from_account_id: number;
    to_account_id: number;
    amount: number;
    currency_id: number;
    description?: string;
    channel?: string;
  }) {
    if (data.from_account_id === data.to_account_id)
      throw ApiError.badRequest('Cannot transfer to the same account');

    const [from, to] = await Promise.all([
      prisma.account.findUnique({ where: { account_id: data.from_account_id }, include: { account_type: true } }),
      prisma.account.findUnique({ where: { account_id: data.to_account_id } }),
    ]);

    if (!from) throw ApiError.notFound('Source account not found');
    if (!to) throw ApiError.notFound('Destination account not found');
    if (from.status !== 'ACTIVE') throw ApiError.badRequest('Source account is not active');
    if (to.status !== 'ACTIVE') throw ApiError.badRequest('Destination account is not active');
    if (Number(from.available_balance) < data.amount)
      throw ApiError.badRequest('Insufficient available balance');

    return prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          reference_number: generateTransactionRef(),
          transaction_type: 'INTERNAL_TRANSFER',
          channel: (data.channel as any) ?? 'INTERNET',
          amount: data.amount,
          currency_id: data.currency_id,
          account_id: data.from_account_id,
          to_account_id: data.to_account_id,
          description: data.description ?? 'Internal transfer',
          status: 'COMPLETED',
          value_date: new Date(),
        },
      });

      await tx.account.update({
        where: { account_id: data.from_account_id },
        data: {
          balance: { decrement: data.amount },
          available_balance: { decrement: data.amount },
        },
      });

      await tx.account.update({
        where: { account_id: data.to_account_id },
        data: {
          balance: { increment: data.amount },
          available_balance: { increment: data.amount },
        },
      });

      return transaction;
    });
  }

  async getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalTxns, totalVolume, completedToday, failedToday, byType] = await Promise.all([
      prisma.transaction.count(),
      prisma.transaction.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true },
      }),
      prisma.transaction.count({
        where: { status: 'COMPLETED', transaction_date: { gte: today } },
      }),
      prisma.transaction.count({
        where: { status: 'FAILED', transaction_date: { gte: today } },
      }),
      prisma.transaction.groupBy({
        by: ['transaction_type'],
        _count: { transaction_id: true },
        _sum: { amount: true },
        where: { status: 'COMPLETED' },
      }),
    ]);

    return {
      totalTransactions: totalTxns,
      totalVolume: totalVolume._sum.amount ?? 0,
      completedToday,
      failedToday,
      byType,
    };
  }
}
