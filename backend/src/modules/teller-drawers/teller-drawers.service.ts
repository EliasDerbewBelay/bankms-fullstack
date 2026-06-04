import { prisma } from '../../config/database';
import { ApiError } from '../../utils/ApiError';

export class TellerDrawersService {
  async getDrawer(employeeId: number) {
    const drawer = await prisma.teller_drawer.findFirst({
      where: { employee_id: employeeId, status: 'OPEN' },
    });
    if (!drawer) throw ApiError.notFound('No open drawer found for this teller');
    return drawer;
  }

  async getDrawerSafe(employeeId: number) {
    return prisma.teller_drawer.findFirst({
      where: { employee_id: employeeId, status: 'OPEN' },
    });
  }

  async getDashboard(employeeId: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [drawer, depositsToday, withdrawalsToday, recentTxns] = await Promise.all([
      prisma.teller_drawer.findFirst({
        where: { employee_id: employeeId, status: 'OPEN' },
      }),
      prisma.transaction.aggregate({
        where: {
          processed_by_employee_id: employeeId,
          transaction_type: 'DEPOSIT',
          status: 'COMPLETED',
          transaction_date: { gte: today },
        },
        _count: { transaction_id: true },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: {
          processed_by_employee_id: employeeId,
          transaction_type: 'WITHDRAWAL',
          status: 'COMPLETED',
          transaction_date: { gte: today },
        },
        _count: { transaction_id: true },
        _sum: { amount: true },
      }),
      prisma.transaction.findMany({
        where: {
          processed_by_employee_id: employeeId,
          transaction_date: { gte: today },
        },
        take: 10,
        orderBy: { transaction_date: 'desc' },
        select: {
          transaction_id: true,
          reference_number: true,
          transaction_type: true,
          amount: true,
          status: true,
          transaction_date: true,
          from_account: { select: { account_number: true } },
          currency: { select: { currency_code: true, symbol: true } },
        },
      }),
    ]);

    return {
      drawer,
      daily: {
        deposits: {
          count: depositsToday._count.transaction_id,
          total: Number(depositsToday._sum.amount ?? 0),
        },
        withdrawals: {
          count: withdrawalsToday._count.transaction_id,
          total: Number(withdrawalsToday._sum.amount ?? 0),
        },
      },
      recentTransactions: recentTxns,
    };
  }

  async openDrawer(data: { employee_id: number; branch_id: number; opening_balance: number }) {
    const active = await prisma.teller_drawer.findFirst({
      where: { employee_id: data.employee_id, status: 'OPEN' },
    });
    if (active) throw ApiError.badRequest('Teller already has an open drawer');

    return prisma.teller_drawer.create({
      data: {
        employee_id: data.employee_id,
        branch_id: data.branch_id,
        opening_balance: data.opening_balance,
        current_balance: data.opening_balance,
        status: 'OPEN',
        opened_at: new Date(),
      },
    });
  }

  async closeDrawer(drawerId: number) {
    const drawer = await prisma.teller_drawer.findUnique({ where: { drawer_id: drawerId } });
    if (!drawer) throw ApiError.notFound('Drawer not found');
    if (drawer.status !== 'OPEN') throw ApiError.badRequest('Drawer is not open');

    return prisma.teller_drawer.update({
      where: { drawer_id: drawerId },
      data: {
        status: 'CLOSED',
        closed_at: new Date(),
      },
    });
  }
}
