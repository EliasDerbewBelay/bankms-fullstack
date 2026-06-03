import { prisma } from '../../config/database';
import { ApiError } from '../../utils/ApiError';
import { getPagination, buildMeta } from '../../utils/pagination';
import { generateAccountNumber } from '../../utils/referenceNumber';
import { Request } from 'express';
import { Prisma } from '@prisma/client';

export class AccountsService {
  async list(req: Request) {
    const { page, limit, skip } = getPagination(req);
    const { search, status, account_type_id } = req.query as Record<string, string>;

    const where: Prisma.accountWhereInput = {
      ...(status && { status: status as any }),
      ...(account_type_id && { account_type_id: parseInt(account_type_id) }),
      ...(search && {
        OR: [
          { account_number: { contains: search } },
          { iban: { contains: search } },
        ],
      }),
    };

    const [accounts, total] = await Promise.all([
      prisma.account.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          account_type: { select: { type_name: true, interest_rate: true } },
          currency: { select: { currency_code: true, symbol: true } },
          branch: { select: { branch_name: true, branch_code: true } },
          customer_account: {
            where: { is_primary_owner: true },
            include: {
              customer: {
                select: {
                  customer_id: true,
                  first_name: true,
                  last_name: true,
                  company_name: true,
                  customer_type: true,
                },
              },
            },
          },
        },
      }),
      prisma.account.count({ where }),
    ]);

    return { accounts, meta: buildMeta(page, limit, total) };
  }

  async getById(id: number) {
    const account = await prisma.account.findUnique({
      where: { account_id: id },
      include: {
        account_type: true,
        currency: true,
        branch: { select: { branch_name: true, city: true } },
        customer_account: {
          include: {
            customer: {
              select: {
                customer_id: true,
                customer_code: true,
                first_name: true,
                last_name: true,
                company_name: true,
                customer_type: true,
                phone_number: true,
              },
            },
          },
        },
        card: {
          where: { status: 'ACTIVE' },
          select: {
            card_id: true,
            masked_number: true,
            card_type: true,
            card_network: true,
            expiry_date: true,
            status: true,
          },
        },
        _count: {
          select: { transaction_from: true, interest_accrual: true },
        },
      },
    });

    if (!account) throw ApiError.notFound('Account not found');
    return account;
  }

  async getTransactions(id: number, req: Request) {
    const { page, limit, skip } = getPagination(req);
    const { type, status, from_date, to_date } = req.query as Record<string, string>;

    const where: Prisma.transactionWhereInput = {
      OR: [{ account_id: id }, { to_account_id: id }],
      ...(type && { transaction_type: type as any }),
      ...(status && { status: status as any }),
      ...(from_date && { transaction_date: { gte: new Date(from_date) } }),
      ...(to_date && {
        transaction_date: { lte: new Date(to_date) },
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

  async create(data: {
    account_type_id: number;
    currency_id: number;
    branch_id: number;
    customer_ids: number[];
    opened_by_employee_id: number;
    initial_deposit?: number;
  }) {
    const accountNumber = generateAccountNumber();

    const account = await prisma.account.create({
      data: {
        account_number: accountNumber,
        account_type_id: data.account_type_id,
        currency_id: data.currency_id,
        branch_id: data.branch_id,
        opened_by_employee_id: data.opened_by_employee_id,
        balance: data.initial_deposit ?? 0,
        available_balance: data.initial_deposit ?? 0,
        customer_account: {
          create: data.customer_ids.map((customerId, index) => ({
            customer_id: customerId,
            is_primary_owner: index === 0,
            ownership_percentage: 100 / data.customer_ids.length,
            relationship_type:
              data.customer_ids.length > 1 ? 'JOINT_OWNER' : 'SOLE_OWNER',
          })),
        },
      },
      include: {
        account_type: true,
        currency: true,
        branch: true,
        customer_account: { include: { customer: true } },
      },
    });

    return account;
  }

  async freeze(id: number, userId: number) {
    const account = await prisma.account.findUnique({ where: { account_id: id } });
    if (!account) throw ApiError.notFound('Account not found');
    if (account.status === 'FROZEN') throw ApiError.conflict('Account is already frozen');

    const updated = await prisma.account.update({
      where: { account_id: id },
      data: { status: 'FROZEN' },
    });

    await prisma.audit_log.create({
      data: {
        action_type: 'ACCOUNT_FREEZE',
        entity_type: 'account',
        entity_id: id,
        performed_by_user_id: userId,
        details: `Account ${account.account_number} frozen`,
        old_values: { status: account.status } as any,
        new_values: { status: 'FROZEN' } as any,
      },
    });

    return updated;
  }

  async unfreeze(id: number, userId: number) {
    const account = await prisma.account.findUnique({ where: { account_id: id } });
    if (!account) throw ApiError.notFound('Account not found');

    const updated = await prisma.account.update({
      where: { account_id: id },
      data: { status: 'ACTIVE' },
    });

    await prisma.audit_log.create({
      data: {
        action_type: 'UPDATE',
        entity_type: 'account',
        entity_id: id,
        performed_by_user_id: userId,
        details: `Account ${account.account_number} unfrozen`,
        old_values: { status: account.status } as any,
        new_values: { status: 'ACTIVE' } as any,
      },
    });

    return updated;
  }

  async getMyAccounts(customerId: number) {
    return prisma.customer_account.findMany({
      where: { customer_id: customerId },
      include: {
        account: {
          include: {
            account_type: { select: { type_name: true, interest_rate: true } },
            currency: { select: { currency_code: true, symbol: true } },
            branch: { select: { branch_name: true } },
            card: {
              where: { status: 'ACTIVE' },
              select: { masked_number: true, card_type: true, status: true },
            },
          },
        },
      },
    });
  }
}
