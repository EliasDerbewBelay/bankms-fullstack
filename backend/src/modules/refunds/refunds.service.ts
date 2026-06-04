import { prisma } from '../../config/database';
import { ApiError } from '../../utils/ApiError';
import { buildMeta } from '../../utils/pagination';

export class RefundsService {
  async list(filters: { status?: string; page: number; limit: number }) {
    const { status, page, limit } = filters;
    const where: any = {};
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      prisma.refund.findMany({
        where,
        include: {
          original_transaction: { select: { reference_number: true } },
          account: { select: { account_number: true } },
          requested_by: { select: { first_name: true, last_name: true } },
          approved_by: { select: { first_name: true, last_name: true } },
        },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.refund.count({ where }),
    ]);

    return { data: items.map(r => ({ ...r, requested_at: r.created_at })), meta: buildMeta(page, limit, total) };
  }

  async listMine(customerId: number, filters: { status?: string; page: number; limit: number }) {
    const { status, page, limit } = filters;

    // Get all account IDs belonging to this customer
    const customerAccounts = await prisma.customer_account.findMany({
      where: { customer_id: customerId },
      select: { account_id: true },
    });
    const accountIds = customerAccounts.map((ca: any) => ca.account_id);

    const where: any = { account_id: { in: accountIds } };
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      prisma.refund.findMany({
        where,
        include: {
          original_transaction: { select: { reference_number: true } },
          account: { select: { account_number: true } },
        },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.refund.count({ where }),
    ]);

    return { data: items.map(r => ({ ...r, requested_at: r.created_at })), meta: buildMeta(page, limit, total) };
  }

  async request(data: { original_transaction_id: number; account_id: number; amount: number; reason: string }, user: any) {
    // Verify the transaction exists
    const tx = await prisma.transaction.findUnique({ where: { transaction_id: data.original_transaction_id } });
    if (!tx) throw new ApiError('Original transaction not found', 404);

    // Customers can only request refunds on their own accounts
    if (user.role === 'CUSTOMER') {
      const ca = await prisma.customer_account.findFirst({
        where: { customer_id: user.linkedCustomerId, account_id: data.account_id },
      });
      if (!ca) throw new ApiError('Account does not belong to you', 403);
    }

    // Prevent duplicate pending refund for same transaction
    const existing = await prisma.refund.findFirst({
      where: { original_transaction_id: data.original_transaction_id, status: 'PENDING_APPROVAL' },
    });
    if (existing) throw new ApiError('A pending refund request already exists for this transaction', 409);

    const refund = await prisma.refund.create({
      data: {
        original_transaction_id: data.original_transaction_id,
        account_id: data.account_id,
        amount: data.amount,
        reason: data.reason,
        status: 'PENDING_APPROVAL',
        requested_by_id: user.linkedEmployeeId ?? null,
      },
      include: {
        original_transaction: { select: { reference_number: true } },
        account: { select: { account_number: true } },
      },
    });

    return { ...refund, requested_at: refund.created_at };
  }

  async approve(refundId: number, employeeId: number, userId: number) {
    const refund = await prisma.refund.findUnique({ where: { refund_id: refundId } });
    if (!refund) throw new ApiError('Refund not found', 404);
    if (refund.status !== 'PENDING_APPROVAL') throw new ApiError('Refund is not pending approval', 400);
    if (refund.requested_by_id && refund.requested_by_id === employeeId) {
      throw new ApiError('You cannot approve a refund you requested', 403);
    }

    const account = await prisma.account.findUnique({ where: { account_id: refund.account_id } });
    if (!account) throw new ApiError('Account not found', 404);

    const refNum = `REF-${Date.now()}`;

    const [updated] = await prisma.$transaction([
      prisma.refund.update({
        where: { refund_id: refundId },
        data: {
          status: 'APPROVED',
          approved_by_id: employeeId ?? null,
          approved_at: new Date(),
        },
      }),
      prisma.account.update({
        where: { account_id: refund.account_id },
        data: {
          available_balance: { increment: refund.amount },
        },
      }),
      prisma.transaction.create({
        data: {
          account_id: refund.account_id,
          transaction_type: 'DEPOSIT',
          amount: refund.amount,
          currency_id: account.currency_id,
          description: `Refund approved for transaction #${refund.original_transaction_id}`,
          reference_number: refNum,
          status: 'COMPLETED',
          channel: 'SYSTEM',
        },
      }),
    ]);

    return { ...updated, requested_at: updated.created_at };
  }

  async reject(refundId: number, employeeId: number, rejectionReason: string) {
    const refund = await prisma.refund.findUnique({ where: { refund_id: refundId } });
    if (!refund) throw new ApiError('Refund not found', 404);
    if (refund.status !== 'PENDING_APPROVAL') throw new ApiError('Refund is not pending approval', 400);
    if (refund.requested_by_id && refund.requested_by_id === employeeId) {
      throw new ApiError('You cannot reject a refund you requested', 403);
    }

    const updated = await prisma.refund.update({
      where: { refund_id: refundId },
      data: {
        status: 'REJECTED',
        approved_by_id: employeeId ?? null,
        approved_at: new Date(),
        rejection_reason: rejectionReason,
      },
    });

    return { ...updated, requested_at: updated.created_at };
  }
}

export const refundsService = new RefundsService();
