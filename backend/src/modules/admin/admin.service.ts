import { prisma } from '../../config/database';
import { getPagination, buildMeta } from '../../utils/pagination';
import { Request } from 'express';

export class AdminService {
  async getDashboard() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalCustomers, verifiedCustomers,
      totalAccounts, activeAccounts,
      totalLoans, activeLoans,
      totalTransactionsToday, totalVolumeToday,
      totalDeposits, totalWithdrawals,
      atmsOnline, atmsLowCash,
      pendingRefunds, auditAlerts,
    ] = await Promise.all([
      prisma.customer.count(),
      prisma.customer.count({ where: { kyc_status: 'VERIFIED' } }),
      prisma.account.count(),
      prisma.account.count({ where: { status: 'ACTIVE' } }),
      prisma.loan.count(),
      prisma.loan.count({ where: { status: 'ACTIVE' } }),
      prisma.transaction.count({ where: { transaction_date: { gte: today } } }),
      prisma.transaction.aggregate({
        where: { status: 'COMPLETED', transaction_date: { gte: today } },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { transaction_type: 'DEPOSIT', status: 'COMPLETED' },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { transaction_type: 'WITHDRAWAL', status: 'COMPLETED' },
        _sum: { amount: true },
      }),
      prisma.atm.count({ where: { status: 'ONLINE' } }),
      prisma.atm.count({ where: { status: { in: ['LOW_CASH', 'OUT_OF_CASH'] } } }),
      prisma.refund.count({ where: { status: 'PENDING_APPROVAL' } }),
      prisma.audit_log.count({ where: { is_suspicious: true, timestamp: { gte: today } } }),
    ]);

    // Loan portfolio
    const loanPortfolio = await prisma.loan.aggregate({
      where: { status: { not: 'PENDING_DISBURSEMENT' } },
      _sum: { principal_amount: true, outstanding_balance: true },
    });

    const defaultedLoans = await prisma.loan.count({ where: { status: 'DEFAULTED' } });

    // Transaction trend last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const trendData = await prisma.$queryRaw<Array<{ date: string; count: bigint; volume: number }>>`
      SELECT 
        DATE(transaction_date) as date,
        COUNT(*)::bigint as count,
        COALESCE(SUM(CASE WHEN status = 'COMPLETED' THEN amount ELSE 0 END), 0) as volume
      FROM "transaction"
      WHERE transaction_date >= ${sevenDaysAgo}
      GROUP BY DATE(transaction_date)
      ORDER BY date ASC
    `;

    return {
      customers: {
        total: totalCustomers,
        verified: verifiedCustomers,
        verificationRate:
          totalCustomers > 0
            ? ((verifiedCustomers / totalCustomers) * 100).toFixed(1)
            : '0',
      },
      accounts: { total: totalAccounts, active: activeAccounts },
      loans: {
        total: totalLoans,
        active: activeLoans,
        defaulted: defaultedLoans,
        totalDisbursed: loanPortfolio._sum.principal_amount ?? 0,
        totalOutstanding: loanPortfolio._sum.outstanding_balance ?? 0,
        nplRatio:
          totalLoans > 0
            ? ((defaultedLoans / totalLoans) * 100).toFixed(2)
            : '0.00',
      },
      transactions: {
        today: totalTransactionsToday,
        volumeToday: totalVolumeToday._sum.amount ?? 0,
        totalDeposits: totalDeposits._sum.amount ?? 0,
        totalWithdrawals: totalWithdrawals._sum.amount ?? 0,
      },
      atm: { online: atmsOnline, lowCash: atmsLowCash },
      alerts: { pendingRefunds, suspiciousToday: auditAlerts },
      trend: trendData.map((d) => ({
        date: d.date,
        count: Number(d.count),
        volume: Number(d.volume),
      })),
    };
  }

  async getAuditLogs(req: Request) {
    const { page, limit, skip } = getPagination(req);
    const { action_type, entity_type, user_id, suspicious, from_date, to_date } =
      req.query as Record<string, string>;

    const where: any = {
      ...(action_type && { action_type }),
      ...(entity_type && { entity_type }),
      ...(user_id && { performed_by_user_id: parseInt(user_id) }),
      ...(suspicious === 'true' && { is_suspicious: true }),
      ...(from_date && { timestamp: { gte: new Date(from_date) } }),
      ...(to_date && { timestamp: { lte: new Date(to_date) } }),
    };

    const [logs, total] = await Promise.all([
      prisma.audit_log.findMany({
        where, skip, take: limit,
        orderBy: { timestamp: 'desc' },
        include: {
          performed_by: { select: { username: true, role: true } },
        },
      }),
      prisma.audit_log.count({ where }),
    ]);

    return { logs, meta: buildMeta(page, limit, total) };
  }

  async getBranches() {
    return prisma.branch.findMany({
      include: {
        _count: { select: { employee: true, account: true, atm: true } },
        department: { select: { department_id: true, department_name: true } },
      },
      orderBy: { branch_name: 'asc' },
    });
  }

  async getEmployees(req: Request) {
    const { page, limit, skip } = getPagination(req);
    const { search, branch_id, department_id } = req.query as Record<string, string>;

    const where: any = {
      ...(branch_id && { branch_id: parseInt(branch_id) }),
      ...(department_id && { department_id: parseInt(department_id) }),
      ...(search && {
        OR: [
          { first_name: { contains: search, mode: 'insensitive' } },
          { last_name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { employee_code: { contains: search } },
        ],
      }),
    };

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where, skip, take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          branch: { select: { branch_name: true } },
          department: { select: { department_name: true } },
          manager: { select: { first_name: true, last_name: true } },
          online_user: { select: { username: true, role: true, last_login: true, account_locked: true } },
        },
      }),
      prisma.employee.count({ where }),
    ]);

    return { employees, meta: buildMeta(page, limit, total) };
  }

  async getAtmStatus() {
    return prisma.atm.findMany({
      include: {
        branch: { select: { branch_name: true, city: true } },
        last_refill_by: { select: { first_name: true, last_name: true } },
      },
      orderBy: { cash_balance: 'asc' },
    });
  }

  async getExchangeRates() {
    return prisma.exchange_rate.findMany({
      where: { expiry_date: null },
      include: {
        from_currency: { select: { currency_code: true, symbol: true } },
        to_currency: { select: { currency_code: true, symbol: true } },
      },
      orderBy: { effective_date: 'desc' },
    });
  }

  async getChargeSchedules() {
    return prisma.charge_schedule.findMany({
      where: { is_active: true },
      orderBy: { effective_date: 'desc' },
    });
  }
}
