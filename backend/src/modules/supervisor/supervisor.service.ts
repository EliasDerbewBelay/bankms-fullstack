import { prisma } from '../../config/database';
import { ApiError } from '../../utils/ApiError';
import { generateTransactionRef } from '../../utils/referenceNumber';

export class SupervisorService {
  /** Pending-action counts for the supervisor overview */
  async getOverview(employeeId: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      pendingKyc,
      pendingLoanApps,
      pendingRefunds,
      frozenToday,
      blockedCardsToday,
      pendingLoanAppsList,
      pendingRefundsList,
    ] = await Promise.all([
      prisma.customer.count({ where: { kyc_status: { in: ['PENDING', 'UNDER_REVIEW'] } } }),
      prisma.loan_application.count({ where: { status: { in: ['SUBMITTED', 'UNDER_REVIEW'] } } }),
      prisma.refund.count({ where: { status: 'PENDING_APPROVAL' } }),
      prisma.audit_log.count({
        where: {
          action_type: 'ACCOUNT_FREEZE',
          timestamp: { gte: today },
        },
      }),
      prisma.card.count({
        where: {
          status: 'BLOCKED',
          blocked_date: { gte: today },
        },
      }),
      // Top 5 pending loan applications
      prisma.loan_application.findMany({
        where: { status: { in: ['SUBMITTED', 'UNDER_REVIEW'] } },
        take: 5,
        orderBy: { submitted_at: 'asc' },
        include: {
          customer: { select: { first_name: true, last_name: true, company_name: true, customer_type: true } },
        },
      }),
      // Top 5 pending refunds (not requested by this employee — four-eyes)
      prisma.refund.findMany({
        where: {
          status: 'PENDING_APPROVAL',
          NOT: { requested_by_id: employeeId },
        },
        take: 5,
        orderBy: { created_at: 'asc' },
        include: {
          original_transaction: { select: { reference_number: true } },
          account: { select: { account_number: true } },
          requested_by: { select: { first_name: true, last_name: true } },
        },
      }),
    ]);

    return {
      queues: {
        pendingKyc,
        pendingLoanApps,
        pendingRefunds,
        frozenToday,
        blockedCardsToday,
      },
      pendingLoanAppsList,
      pendingRefundsList,
    };
  }

  /**
   * Override withdrawal — bypasses minimum-balance restriction.
   * Still enforces available_balance >= amount.
   * Writes a WITHDRAWAL_OVERRIDE audit log entry.
   */
  async withdrawalOverride(data: {
    account_id: number;
    amount: number;
    override_reason: string;
    processed_by_employee_id: number;
    user_id: number;
  }) {
    if (!data.override_reason || data.override_reason.trim().length < 10) {
      throw ApiError.badRequest('Override reason must be at least 10 characters');
    }

    const account = await prisma.account.findUnique({
      where: { account_id: data.account_id },
      include: { currency: true },
    });

    if (!account) throw ApiError.notFound('Account not found');
    if (account.status !== 'ACTIVE') throw ApiError.badRequest('Account is not active');
    if (Number(account.available_balance) < data.amount) {
      throw ApiError.badRequest('Insufficient available balance — cannot override insufficient funds');
    }

    const refNum = generateTransactionRef();

    const [txn] = await prisma.$transaction([
      prisma.transaction.create({
        data: {
          reference_number: refNum,
          transaction_type: 'WITHDRAWAL',
          amount: data.amount,
          currency_id: account.currency_id,
          account_id: data.account_id,
          description: `Override withdrawal: ${data.override_reason}`,
          status: 'COMPLETED',
          channel: 'BRANCH',
          processed_by_employee_id: data.processed_by_employee_id,
        },
      }),
      prisma.account.update({
        where: { account_id: data.account_id },
        data: {
          balance: { decrement: data.amount },
          available_balance: { decrement: data.amount },
        },
      }),
    ]);

    // Always audit override actions
    await prisma.audit_log.create({
      data: {
        action_type: 'TRANSACTION',
        entity_type: 'transaction',
        entity_id: txn.transaction_id,
        performed_by_user_id: data.user_id,
        details: `Supervisor override withdrawal of ${data.amount} on account ${account.account_number}. Reason: ${data.override_reason}`,
        new_values: {
          amount: data.amount,
          account_id: data.account_id,
          reference_number: refNum,
          override_reason: data.override_reason,
        } as any,
      },
    });

    return { transaction: txn, reference_number: refNum };
  }
}
