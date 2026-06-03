import { prisma } from '../../config/database';
import { ApiError } from '../../utils/ApiError';

export class AtmService {
  async getAllAtms() {
    return prisma.atm.findMany({
      include: {
        branch: { select: { branch_name: true, city: true } },
        last_refill_by: { select: { first_name: true, last_name: true } },
        _count: { select: { atm_transaction: true } },
      },
      orderBy: { status: 'asc' },
    });
  }

  async getAtmStats() {
    const atms = await prisma.atm.findMany({
      select: { status: true, cash_balance: true, low_cash_threshold: true },
    });
    const total = atms.length;
    const online = atms.filter((a: any) => a.status === 'ONLINE').length;
    const offline = atms.filter((a: any) => a.status === 'OFFLINE').length;
    const lowCash = atms.filter((a: any) => a.status === 'LOW_CASH').length;
    const outOfCash = atms.filter((a: any) => a.status === 'OUT_OF_CASH').length;
    const maintenance = atms.filter((a: any) => a.status === 'UNDER_MAINTENANCE').length;
    return { total, online, offline, lowCash, outOfCash, maintenance };
  }

  async refillAtm(atmId: number, amount: number, user: any) {
    const atm = await prisma.atm.findUnique({ where: { atm_id: atmId } });
    if (!atm) throw new ApiError('ATM not found', 404);

    const newBalance = Number(atm.cash_balance) + amount;
    const threshold = Number(atm.low_cash_threshold);
    let newStatus = atm.status;

    if (newBalance > threshold * 1.2) {
      newStatus = 'ONLINE';
    } else if (newBalance > threshold) {
      newStatus = 'LOW_CASH';
    }

    const updatedAtm = await prisma.atm.update({
      where: { atm_id: atmId },
      data: {
        cash_balance: newBalance,
        last_refill_date: new Date(),
        last_refill_by_id: user.linkedEmployeeId,
        status: newStatus as any,
      },
    });

    await prisma.audit_log.create({
      data: {
        action_type: 'UPDATE',
        entity_type: 'atm',
        entity_id: atmId,
        performed_by_user_id: user.userId,
        details: `ATM refilled with ${amount}`,
        old_values: { cash_balance: atm.cash_balance, status: atm.status } as any,
        new_values: { cash_balance: updatedAtm.cash_balance, status: updatedAtm.status } as any,
      },
    });

    return updatedAtm;
  }

  async updateStatus(atmId: number, status: string, user: any) {
    const atm = await prisma.atm.findUnique({ where: { atm_id: atmId } });
    if (!atm) throw new ApiError('ATM not found', 404);

    const updatedAtm = await prisma.atm.update({
      where: { atm_id: atmId },
      data: { status: status as any },
    });

    await prisma.audit_log.create({
      data: {
        action_type: 'UPDATE',
        entity_type: 'atm',
        entity_id: atmId,
        performed_by_user_id: user.userId,
        details: `ATM status manually changed to ${status}`,
        old_values: { status: atm.status } as any,
        new_values: { status: updatedAtm.status } as any,
      },
    });

    return updatedAtm;
  }
}

export const atmService = new AtmService();
