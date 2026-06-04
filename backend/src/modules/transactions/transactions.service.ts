import { prisma } from '../../config/database';
import { ApiError } from '../../utils/ApiError';
import { getPagination, buildMeta } from '../../utils/pagination';
import { generateTransactionRef } from '../../utils/referenceNumber';
import { requireVerifiedKyc } from '../../utils/kycGuard';
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

  async listMine(customerId: number | null | undefined, req: Request) {
    if (!customerId) throw ApiError.forbidden('Only customers can view their transactions');
    const { page, limit, skip } = getPagination(req);
    const { type, status, from_date, to_date } = req.query as Record<string, string>;

    const owned = await prisma.customer_account.findMany({
      where: { customer_id: customerId },
      select: { account_id: true },
    });
    const accountIds = owned.map((ca) => ca.account_id);

    if (accountIds.length === 0) {
      return { transactions: [], meta: buildMeta(page, limit, 0) };
    }

    const where: Prisma.transactionWhereInput = {
      OR: [{ account_id: { in: accountIds } }, { to_account_id: { in: accountIds } }],
      ...(type && { transaction_type: type as any }),
      ...(status && { status: status as any }),
      ...((from_date || to_date) && {
        transaction_date: {
          ...(from_date && { gte: new Date(from_date) }),
          ...(to_date && { lte: new Date(`${to_date}T23:59:59.999Z`) }),
        },
      }),
    };

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { transaction_date: 'desc' },
        include: {
          currency: { select: { currency_code: true, symbol: true } },
          from_account: { select: { account_number: true } },
          to_account: { select: { account_number: true } },
          transaction_fee: { select: { fee_type: true, fee_amount: true } },
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

    let drawer = null;
    if (data.channel === 'BRANCH' || !data.channel) {
      drawer = await prisma.teller_drawer.findFirst({
        where: { employee_id: data.processed_by_employee_id, status: 'OPEN' },
      });
      if (!drawer) throw ApiError.badRequest('Teller drawer is not open');
    }

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

      if (drawer) {
        await tx.teller_drawer.update({
          where: { drawer_id: drawer.drawer_id },
          data: { current_balance: { increment: data.amount } },
        });
      }

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

    let drawer = null;
    if (data.channel === 'BRANCH' || !data.channel) {
      if (!data.processed_by_employee_id) throw ApiError.badRequest('Employee ID is required for branch withdrawal');
      drawer = await prisma.teller_drawer.findFirst({
        where: { employee_id: data.processed_by_employee_id, status: 'OPEN' },
      });
      if (!drawer) throw ApiError.badRequest('Teller drawer is not open');
      if (Number(drawer.current_balance) < data.amount) throw ApiError.badRequest('Insufficient cash in teller drawer');
    }

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

      if (drawer) {
        await tx.teller_drawer.update({
          where: { drawer_id: drawer.drawer_id },
          data: { current_balance: { decrement: data.amount } },
        });
      }

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
    requesting_customer_id?: number | null;
  }, user?: any) {
    if (user) await requireVerifiedKyc(user);
    if (data.from_account_id === data.to_account_id)
      throw ApiError.badRequest('Cannot transfer to the same account');

    const [from, to] = await Promise.all([
      prisma.account.findUnique({ 
        where: { account_id: data.from_account_id }, 
        include: { account_type: true, customer_account: true } 
      }),
      prisma.account.findUnique({ where: { account_id: data.to_account_id } }),
    ]);

    if (!from) throw ApiError.notFound('Source account not found');
    if (!to) throw ApiError.notFound('Destination account not found');
    if (from.status !== 'ACTIVE') throw ApiError.badRequest('Source account is not active');
    if (to.status !== 'ACTIVE') throw ApiError.badRequest('Destination account is not active');
    if (Number(from.available_balance) < data.amount)
      throw ApiError.badRequest('Insufficient available balance');
    
    // Strict Row-Level Checks for CUSTOMER
    if (data.requesting_customer_id) {
      const isOwner = from.customer_account.some(ca => ca.customer_id === data.requesting_customer_id);
      if (!isOwner) throw ApiError.forbidden('You do not own the source account');
    }

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

  async beneficiaryTransfer(data: {
    from_account_id: number;
    beneficiary_id: number;
    amount: number;
    description?: string;
    requesting_customer_id?: number | null;
  }, user?: any) {
    if (user) await requireVerifiedKyc(user);
    const from = await prisma.account.findUnique({
      where: { account_id: data.from_account_id },
      include: { account_type: true, customer_account: true },
    });
    if (!from) throw ApiError.notFound('Source account not found');

    const beneficiary = await prisma.beneficiary.findUnique({
      where: { beneficiary_id: data.beneficiary_id },
    });
    if (!beneficiary) throw ApiError.notFound('Beneficiary not found');
    if (!beneficiary.is_active) throw ApiError.badRequest('Beneficiary is inactive');

    // Ownership: customer must own the source account and the beneficiary.
    if (data.requesting_customer_id) {
      const ownsAccount = from.customer_account.some(
        (ca) => ca.customer_id === data.requesting_customer_id
      );
      if (!ownsAccount) throw ApiError.forbidden('You do not own the source account');
      if (beneficiary.customer_id !== data.requesting_customer_id) {
        throw ApiError.forbidden('You do not own this beneficiary');
      }
    }

    if (from.status !== 'ACTIVE') throw ApiError.badRequest('Source account is not active');
    if (Number(from.available_balance) < data.amount) {
      throw ApiError.badRequest('Insufficient available balance');
    }

    const minBalance = Number(from.account_type.minimum_balance);
    if (Number(from.balance) - data.amount < minBalance) {
      throw ApiError.badRequest(`Transfer would breach minimum balance of ${minBalance}`);
    }

    return prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          reference_number: generateTransactionRef(),
          transaction_type: 'INTERBANK_TRANSFER',
          channel: 'INTERNET',
          amount: data.amount,
          currency_id: from.currency_id,
          account_id: data.from_account_id,
          to_bank_code: beneficiary.bank_code,
          to_iban: beneficiary.account_number_or_iban,
          to_account_name: beneficiary.beneficiary_name,
          description: data.description ?? `Transfer to ${beneficiary.beneficiary_name}`,
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

      return transaction;
    });
  }

  async getCustomerActivity(customerId: number) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const customerAccounts = await prisma.customer_account.findMany({
      where: { customer_id: customerId },
      select: { account_id: true },
    });
    const accountIds = customerAccounts.map((ca) => ca.account_id);

    if (accountIds.length === 0) {
      return { trend: [], byType: [], recentTransactions: [] };
    }

    const accountFilter = {
      OR: [
        { account_id: { in: accountIds } },
        { to_account_id: { in: accountIds } },
      ],
    };

    const [trend, byTypeRaw, recent] = await Promise.all([
      prisma.$queryRaw<Array<{ date: string; count: bigint; volume: number }>>`
        SELECT
          DATE(transaction_date) as date,
          COUNT(*)::bigint as count,
          COALESCE(SUM(CASE WHEN status = 'COMPLETED' THEN amount ELSE 0 END), 0) as volume
        FROM "transaction"
        WHERE (account_id = ANY(${accountIds}::int[]) OR to_account_id = ANY(${accountIds}::int[]))
          AND transaction_date >= ${thirtyDaysAgo}
        GROUP BY DATE(transaction_date)
        ORDER BY date ASC
      `,
      prisma.$queryRaw<Array<{ type: string; count: bigint; volume: number }>>`
        SELECT
          transaction_type as type,
          COUNT(*)::bigint as count,
          COALESCE(SUM(amount), 0) as volume
        FROM "transaction"
        WHERE (account_id = ANY(${accountIds}::int[]) OR to_account_id = ANY(${accountIds}::int[]))
          AND status = 'COMPLETED'
        GROUP BY transaction_type
        ORDER BY count DESC
      `,
      prisma.transaction.findMany({
        where: accountFilter,
        take: 10,
        orderBy: { transaction_date: 'desc' },
        select: {
          transaction_id: true,
          reference_number: true,
          transaction_type: true,
          amount: true,
          status: true,
          transaction_date: true,
          description: true,
          from_account: { select: { account_number: true } },
          currency: { select: { currency_code: true, symbol: true } },
        },
      }),
    ]);

    return {
      trend: trend.map((d) => ({
        date: String(d.date),
        count: Number(d.count),
        volume: Number(d.volume),
      })),
      byType: byTypeRaw.map((t) => ({
        type: t.type,
        count: Number(t.count),
        volume: Number(t.volume),
      })),
      recentTransactions: recent,
    };
  }

  async listBanks() {
    return prisma.bank.findMany({
      orderBy: { bank_name: 'asc' },
      select: {
        bank_id: true,
        bank_name: true,
        bank_code: true,
        swift_code: true,
        city: true,
        country: true,
      },
    });
  }

  async directInterbankTransfer(data: {
    from_account_id: number;
    to_bank_code: string;
    to_account_number: string;
    to_account_name: string;
    amount: number;
    description?: string;
    requesting_customer_id?: number | null;
  }, user?: any) {
    if (user) await requireVerifiedKyc(user);

    const from = await prisma.account.findUnique({
      where: { account_id: data.from_account_id },
      include: { account_type: true, customer_account: true },
    });
    if (!from) throw ApiError.notFound('Source account not found');

    // Ownership check for customers
    if (data.requesting_customer_id) {
      const ownsAccount = from.customer_account.some(
        (ca) => ca.customer_id === data.requesting_customer_id
      );
      if (!ownsAccount) throw ApiError.forbidden('You do not own the source account');
    }

    // Verify the destination bank exists
    const destBank = await prisma.bank.findUnique({ where: { bank_code: data.to_bank_code } });
    if (!destBank) throw ApiError.badRequest('Destination bank not found');

    if (from.status !== 'ACTIVE') throw ApiError.badRequest('Source account is not active');

    if (Number(from.available_balance) < data.amount) {
      throw ApiError.badRequest('Insufficient available balance');
    }

    const minBalance = Number(from.account_type.minimum_balance);
    if (Number(from.balance) - data.amount < minBalance) {
      throw ApiError.badRequest(`Transfer would breach minimum balance of ${minBalance}`);
    }

    return prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          reference_number: generateTransactionRef(),
          transaction_type: 'INTERBANK_TRANSFER',
          channel: 'INTERNET',
          amount: data.amount,
          currency_id: from.currency_id,
          account_id: data.from_account_id,
          to_bank_code: data.to_bank_code,
          to_iban: data.to_account_number,
          to_account_name: data.to_account_name,
          description: data.description ?? `Interbank transfer to ${data.to_account_name} at ${destBank.bank_name}`,
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

      return { ...transaction, destination_bank: destBank.bank_name };
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

  async requestRefund(transactionId: number, reason: string, user: any) {
    const txn = await prisma.transaction.findUnique({ where: { transaction_id: transactionId } });
    if (!txn) throw ApiError.notFound('Transaction not found');
    if (txn.status !== 'COMPLETED') throw ApiError.badRequest('Only completed transactions can be refunded');
    
    const existing = await prisma.refund.findFirst({
      where: { original_transaction_id: transactionId, status: { in: ['PENDING_APPROVAL', 'APPROVED', 'PROCESSED'] } },
    });
    if (existing) throw ApiError.badRequest('Refund already requested or processed for this transaction');

    const refund = await prisma.refund.create({
      data: {
        original_transaction_id: transactionId,
        account_id: txn.account_id,
        amount: txn.amount,
        reason,
        requested_by_id: user.linkedEmployeeId,
      },
    });
    return refund;
  }

  async approveRefund(refundId: number, status: string, rejectionReason: string | undefined, user: any) {
    const refund = await prisma.refund.findUnique({ 
      where: { refund_id: refundId },
      include: { original_transaction: true }
    });
    if (!refund) throw ApiError.notFound('Refund not found');
    if (refund.status !== 'PENDING_APPROVAL') throw ApiError.badRequest('Refund is not pending approval');

    if (refund.requested_by_id === user.linkedEmployeeId) {
      throw new ApiError('You cannot approve your own refund request (Four-eyes rule)', 403);
    }

    if (status === 'REJECTED') {
      if (!rejectionReason) throw ApiError.badRequest('Rejection reason is required');
      const updated = await prisma.refund.update({
        where: { refund_id: refundId },
        data: {
          status: 'REJECTED',
          approved_by_id: user.linkedEmployeeId,
          approved_at: new Date(),
          rejection_reason: rejectionReason,
        },
      });

      await prisma.audit_log.create({
        data: {
          action_type: 'UPDATE',
          entity_type: 'refund',
          entity_id: refundId,
          performed_by_user_id: user.userId,
          details: `Refund rejected`,
          old_values: { status: refund.status } as any,
          new_values: { status: 'REJECTED' } as any,
        },
      });

      return updated;
    }

    if (status === 'APPROVED') {
      return prisma.$transaction(async (tx) => {
        const newTxn = await tx.transaction.create({
          data: {
            reference_number: generateTransactionRef(),
            transaction_type: 'REFUND',
            channel: 'SYSTEM',
            amount: refund.amount,
            currency_id: refund.original_transaction.currency_id,
            account_id: refund.account_id,
            description: `Refund for txn ${refund.original_transaction_id}`,
            status: 'COMPLETED',
            value_date: new Date(),
            processed_by_employee_id: user.linkedEmployeeId,
          },
        });

        await tx.account.update({
          where: { account_id: refund.account_id },
          data: {
            balance: { increment: refund.amount },
            available_balance: { increment: refund.amount },
          },
        });

        const updated = await tx.refund.update({
          where: { refund_id: refundId },
          data: {
            status: 'PROCESSED',
            approved_by_id: user.linkedEmployeeId,
            approved_at: new Date(),
            processed_transaction_id: newTxn.transaction_id,
          },
        });

        await tx.audit_log.create({
          data: {
            action_type: 'UPDATE',
            entity_type: 'refund',
            entity_id: refundId,
            performed_by_user_id: user.userId,
            details: `Refund approved and processed`,
            old_values: { status: refund.status } as any,
            new_values: { status: 'PROCESSED' } as any,
          },
        });

        return updated;
      });
    }

    throw ApiError.badRequest('Invalid status');
  }
}
