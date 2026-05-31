import { prisma } from '../../config/database';

export class ReportsService {
  async getTransactionSummary(days: number = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [byType, byChannel, byStatus, trend, topAccounts] = await Promise.all([
      // Group by transaction type
      prisma.transaction.groupBy({
        by: ['transaction_type'],
        where: { created_at: { gte: since } },
        _count: { transaction_id: true },
        _sum: { amount: true },
      }),
      // Group by channel
      prisma.transaction.groupBy({
        by: ['channel'],
        where: { created_at: { gte: since } },
        _count: { transaction_id: true },
        _sum: { amount: true },
      }),
      // Group by status
      prisma.transaction.groupBy({
        by: ['status'],
        where: { created_at: { gte: since } },
        _count: { transaction_id: true },
      }),
      // Daily trend — raw query for date truncation
      prisma.$queryRaw<Array<{ date: string; count: bigint; volume: string }>>`
        SELECT
          DATE_TRUNC('day', transaction_date)::date::text AS date,
          COUNT(*) AS count,
          SUM(amount)::text AS volume
        FROM "public"."transaction"
        WHERE transaction_date >= ${since}
        GROUP BY 1
        ORDER BY 1 ASC
      `,
      // Top 5 accounts by volume
      prisma.$queryRaw<Array<{ account_number: string; total: string; count: bigint }>>`
        SELECT a.account_number, SUM(t.amount)::text AS total, COUNT(*) AS count
        FROM "public"."transaction" t
        JOIN "public"."account" a ON t.account_id = a.account_id
        WHERE t.created_at >= ${since}
        GROUP BY a.account_number
        ORDER BY SUM(t.amount) DESC
        LIMIT 5
      `,
    ]);

    return {
      byType: byType.map(r => ({
        type: r.transaction_type,
        count: r._count.transaction_id,
        volume: Number(r._sum.amount ?? 0),
      })),
      byChannel: byChannel.map(r => ({
        channel: r.channel,
        count: r._count.transaction_id,
        volume: Number(r._sum.amount ?? 0),
      })),
      byStatus: byStatus.map(r => ({
        status: r.status,
        count: r._count.transaction_id,
      })),
      trend: trend.map(r => ({
        date: r.date,
        count: Number(r.count),
        volume: Number(r.volume),
      })),
      topAccounts: topAccounts.map(r => ({
        account_number: r.account_number,
        total: Number(r.total),
        count: Number(r.count),
      })),
    };
  }

  async getLoanSummary() {
    const [byStatus, byType, nplLoans] = await Promise.all([
      prisma.loan.groupBy({
        by: ['status'],
        _count: { loan_id: true },
        _sum: { principal_amount: true, outstanding_balance: true },
      }),
      prisma.loan.groupBy({
        by: ['loan_type'],
        _count: { loan_id: true },
        _sum: { principal_amount: true },
      }),
      prisma.loan.findMany({
        where: { status: { in: ['DEFAULTED', 'WRITTEN_OFF'] } },
        include: {
          customer: { select: { first_name: true, last_name: true, company_name: true } },
        },
        orderBy: { outstanding_balance: 'desc' },
        take: 10,
      }),
    ]);

    return {
      byStatus: byStatus.map(r => ({
        status: r.status,
        count: r._count.loan_id,
        principal: Number(r._sum.principal_amount ?? 0),
        outstanding: Number(r._sum.outstanding_balance ?? 0),
      })),
      byType: byType.map(r => ({
        type: r.loan_type,
        count: r._count.loan_id,
        principal: Number(r._sum.principal_amount ?? 0),
      })),
      nplLoans,
    };
  }

  async getAccountSummary() {
    const [byStatus, byType] = await Promise.all([
      prisma.account.groupBy({
        by: ['status'],
        _count: { account_id: true },
        _sum: { balance: true },
      }),
      prisma.account_type.findMany({
        select: {
          type_name: true,
          interest_rate: true,
          _count: { select: { account: true } },
        },
      }),
    ]);

    return {
      byStatus: byStatus.map(r => ({
        status: r.status,
        count: r._count.account_id,
        totalBalance: Number(r._sum.balance ?? 0),
      })),
      byType: byType.map(r => ({
        type: r.type_name,
        count: r._count.account,
        rate: Number(r.interest_rate),
      })),
    };
  }
}

export const reportsService = new ReportsService();
