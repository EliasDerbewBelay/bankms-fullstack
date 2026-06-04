import argon2 from 'argon2';
import { prisma } from '../../config/database';
import { getPagination, buildMeta } from '../../utils/pagination';
import { ApiError } from '../../utils/ApiError';
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

    // Transaction trend last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const trendData = await prisma.$queryRaw<Array<{ date: string; count: bigint; volume: number }>>`
      SELECT 
        DATE(transaction_date) as date,
        COUNT(*)::bigint as count,
        COALESCE(SUM(CASE WHEN status = 'COMPLETED' THEN amount ELSE 0 END), 0) as volume
      FROM "transaction"
      WHERE transaction_date >= ${thirtyDaysAgo}
      GROUP BY DATE(transaction_date)
      ORDER BY date ASC
    `;

    // Transaction type breakdown
    const byType = await prisma.transaction.groupBy({
      by: ['transaction_type'],
      _count: { transaction_id: true },
      _sum: { amount: true },
      where: { status: 'COMPLETED' },
      orderBy: { _count: { transaction_id: 'desc' } },
    });

    // Channel breakdown
    const byChannel = await prisma.transaction.groupBy({
      by: ['channel'],
      _count: { transaction_id: true },
      where: { status: 'COMPLETED' },
      orderBy: { _count: { transaction_id: 'desc' } },
    });

    // Loan breakdown by type
    const loansByType = await prisma.loan.groupBy({
      by: ['loan_type'],
      _count: { loan_id: true },
      _sum: { principal_amount: true, outstanding_balance: true },
      orderBy: { _count: { loan_id: 'desc' } },
    });

    // Recent transactions (last 10)
    const recentTransactions = await prisma.transaction.findMany({
      take: 10,
      orderBy: { transaction_date: 'desc' },
      select: {
        transaction_id: true,
        reference_number: true,
        transaction_type: true,
        channel: true,
        amount: true,
        status: true,
        transaction_date: true,
        from_account: { select: { account_number: true } },
        currency: { select: { currency_code: true, symbol: true } },
      },
    });

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
      byType: byType.map((t) => ({
        type: t.transaction_type,
        count: t._count.transaction_id,
        volume: Number(t._sum.amount ?? 0),
      })),
      byChannel: byChannel.map((c) => ({
        channel: c.channel,
        count: c._count.transaction_id,
      })),
      loansByType: loansByType.map((l) => ({
        type: l.loan_type,
        count: l._count.loan_id,
        disbursed: Number(l._sum.principal_amount ?? 0),
        outstanding: Number(l._sum.outstanding_balance ?? 0),
      })),
      recentTransactions,
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
      orderBy: { effective_date: 'desc' },
    });
  }

  // ── Exchange Rate Management ────────────────────────────────────────────────
  async getAllExchangeRates() {
    return prisma.exchange_rate.findMany({
      include: {
        from_currency: { select: { currency_code: true, symbol: true } },
        to_currency: { select: { currency_code: true, symbol: true } },
      },
      orderBy: { effective_date: 'desc' },
    });
  }

  async createExchangeRate(data: {
    from_currency_id: number;
    to_currency_id: number;
    rate: number;
    effective_date?: Date;
    expiry_date?: Date | null;
    source?: string;
    created_by?: number;
  }) {
    if (data.from_currency_id === data.to_currency_id)
      throw new ApiError('From and To currencies must be different', 400);
    return prisma.exchange_rate.create({
      data: {
        from_currency_id: data.from_currency_id,
        to_currency_id: data.to_currency_id,
        rate: data.rate,
        effective_date: data.effective_date ?? new Date(),
        expiry_date: data.expiry_date ?? null,
        source: data.source ?? 'NBE',
        created_by: data.created_by ?? null,
      },
      include: {
        from_currency: { select: { currency_code: true, symbol: true } },
        to_currency: { select: { currency_code: true, symbol: true } },
      },
    });
  }

  async expireExchangeRate(id: number) {
    const rate = await prisma.exchange_rate.findUnique({ where: { rate_id: id } });
    if (!rate) throw new ApiError('Exchange rate not found', 404);
    return prisma.exchange_rate.update({
      where: { rate_id: id },
      data: { expiry_date: new Date() },
    });
  }

  // ── Charge Schedule Config ──────────────────────────────────────────────────
  async createChargeSchedule(data: any) {
    return prisma.charge_schedule.create({ data });
  }

  async expireChargeSchedule(id: number) {
    const cs = await prisma.charge_schedule.findUnique({ where: { schedule_id: id } });
    if (!cs) throw new ApiError('Charge schedule not found', 404);
    return prisma.charge_schedule.update({
      where: { schedule_id: id },
      data: { expiry_date: new Date(), is_active: false },
    });
  }

  // ── User Account Management ────────────────────────────────────────────────
  async getUsers(req: Request) {
    const { page, limit, skip } = getPagination(req);
    const { search, role } = req.query as Record<string, string>;
    const where: any = {
      ...(role && { role }),
      ...(search && {
        OR: [
          { username: { contains: search, mode: 'insensitive' } },
          { linked_customer: { OR: [{ first_name: { contains: search, mode: 'insensitive' } }, { last_name: { contains: search, mode: 'insensitive' } }] } },
          { linked_employee: { OR: [{ first_name: { contains: search, mode: 'insensitive' } }, { last_name: { contains: search, mode: 'insensitive' } }] } },
        ],
      }),
    };
    const [users, total] = await Promise.all([
      prisma.online_user.findMany({
        where, skip, take: limit,
        orderBy: { created_at: 'desc' },
        select: {
          user_id: true, username: true, role: true, account_locked: true,
          failed_login_attempts: true, lockout_until: true, last_login: true,
          last_login_ip: true, two_factor_enabled: true, must_change_password: true,
          created_at: true,
          linked_customer: { select: { customer_id: true, first_name: true, last_name: true, company_name: true } },
          linked_employee: { select: { employee_id: true, first_name: true, last_name: true, position: true } },
        },
      }),
      prisma.online_user.count({ where }),
    ]);
    return { users, meta: buildMeta(page, limit, total) };
  }

  async lockUser(id: number) {
    const user = await prisma.online_user.findUnique({ where: { user_id: id } });
    if (!user) throw new ApiError('User not found', 404);
    return prisma.online_user.update({
      where: { user_id: id },
      data: { account_locked: true },
    });
  }

  async unlockUser(id: number) {
    const user = await prisma.online_user.findUnique({ where: { user_id: id } });
    if (!user) throw new ApiError('User not found', 404);
    return prisma.online_user.update({
      where: { user_id: id },
      data: { account_locked: false, failed_login_attempts: 0, lockout_until: null },
    });
  }

  async resetUserPassword(id: number, newPassword: string) {
    if (newPassword.length < 8) throw new ApiError('Password must be at least 8 characters', 400);
    const hash = await argon2.hash(newPassword);
    return prisma.online_user.update({
      where: { user_id: id },
      data: { password_hash: hash, must_change_password: true, failed_login_attempts: 0, account_locked: false },
    });
  }

  async disable2FA(id: number) {
    return prisma.online_user.update({
      where: { user_id: id },
      data: { two_factor_enabled: false, two_factor_secret: null },
    });
  }

  // ── Session / Security Oversight ───────────────────────────────────────────
  async getSessions(req: Request) {
    const { page, limit, skip } = getPagination(req);
    const { active_only } = req.query as Record<string, string>;
    const where: any = active_only === 'true' ? { is_active: true, expires_at: { gte: new Date() } } : {};
    const [sessions, total] = await Promise.all([
      prisma.session.findMany({
        where, skip, take: limit,
        orderBy: { last_active_at: 'desc' },
        include: {
          online_user: { select: { username: true, role: true } },
        },
      }),
      prisma.session.count({ where }),
    ]);
    return { sessions, meta: buildMeta(page, limit, total) };
  }

  async invalidateSession(id: number) {
    const session = await prisma.session.findUnique({ where: { session_id: id } });
    if (!session) throw new ApiError('Session not found', 404);
    return prisma.session.update({
      where: { session_id: id },
      data: { is_active: false },
    });
  }

  async invalidateAllUserSessions(userId: number) {
    return prisma.session.updateMany({
      where: { user_id: userId, is_active: true },
      data: { is_active: false },
    });
  }

  async getSecurityStats() {
    const now = new Date();
    const [activeSessions, lockedAccounts, suspiciousToday, failedLoginsToday] = await Promise.all([
      prisma.session.count({ where: { is_active: true, expires_at: { gte: now } } }),
      prisma.online_user.count({ where: { account_locked: true } }),
      prisma.audit_log.count({ where: { is_suspicious: true, timestamp: { gte: new Date(now.setHours(0,0,0,0)) } } }),
      prisma.audit_log.count({ where: { action_type: 'FAILED_LOGIN', timestamp: { gte: new Date(new Date().setHours(0,0,0,0)) } } }),
    ]);
    return { activeSessions, lockedAccounts, suspiciousToday, failedLoginsToday };
  }

  // ── Employee Management ────────────────────────────────────────────────────
  async createEmployee(data: any) {
    const code = `EMP${String(Date.now()).slice(-6)}`;
    return prisma.employee.create({
      data: { ...data, employee_code: code },
      include: {
        branch: { select: { branch_name: true } },
        department: { select: { department_name: true } },
      },
    });
  }

  async updateEmployee(id: number, data: any) {
    const emp = await prisma.employee.findUnique({ where: { employee_id: id } });
    if (!emp) throw new ApiError('Employee not found', 404);
    return prisma.employee.update({ where: { employee_id: id }, data });
  }

  // ── Branch & Department Config ─────────────────────────────────────────────
  async createBranch(data: any) {
    return prisma.branch.create({ data });
  }

  async getDepartments() {
    return prisma.department.findMany({
      include: {
        branch: { select: { branch_name: true } },
        manager: { select: { first_name: true, last_name: true } },
        _count: { select: { employees: true } },
      },
      orderBy: { department_name: 'asc' },
    });
  }

  async createDepartment(data: any) {
    return prisma.department.create({ data });
  }

  // ── Currency Management ────────────────────────────────────────────────────
  async getCurrencies() {
    return prisma.currency.findMany({ orderBy: { currency_code: 'asc' } });
  }

  async createCurrency(data: { currency_code: string; currency_name: string; symbol: string; is_base?: boolean }) {
    if (data.is_base) {
      const existing = await prisma.currency.findFirst({ where: { is_base: true } });
      if (existing) throw new ApiError('A base currency (ETB) already exists. Deactivate it first.', 409);
    }
    return prisma.currency.create({ data });
  }

  async updateCurrency(id: number, data: { is_active?: boolean; is_base?: boolean }) {
    return prisma.currency.update({ where: { currency_id: id }, data });
  }

  // ── Account Type Config ────────────────────────────────────────────────────
  async getAccountTypes() {
    return prisma.account_type.findMany({ orderBy: { type_name: 'asc' } });
  }

  async updateAccountType(id: number, data: any) {
    const at = await prisma.account_type.findUnique({ where: { account_type_id: id } });
    if (!at) throw new ApiError('Account type not found', 404);
    return prisma.account_type.update({ where: { account_type_id: id }, data });
  }

  // ── System-wide Reports ────────────────────────────────────────────────────
  async getReportSummary() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      kycSummary, txSummary, loanAging, atmPerformance,
    ] = await Promise.all([
      // KYC status breakdown
      prisma.customer.groupBy({
        by: ['kyc_status'],
        _count: { customer_id: true },
      }),
      // Transaction summary last 30 days
      prisma.transaction.groupBy({
        by: ['transaction_type', 'status'],
        where: { transaction_date: { gte: thirtyDaysAgo } },
        _count: { transaction_id: true },
        _sum: { amount: true },
      }),
      // Loan aging: group by status
      prisma.loan.groupBy({
        by: ['status'],
        _count: { loan_id: true },
        _sum: { outstanding_balance: true, principal_amount: true },
      }),
      // ATM performance
      prisma.atm.findMany({
        include: {
          branch: { select: { branch_name: true } },
          _count: { select: { atm_transaction: true } },
        },
        orderBy: { cash_balance: 'asc' },
      }),
    ]);

    return { kycSummary, txSummary, loanAging, atmPerformance };
  }
}
