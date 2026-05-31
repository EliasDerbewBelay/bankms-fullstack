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

  async logRefill(atmId: number, employeeId: number) {
    const atm = await prisma.atm.findUnique({ where: { atm_id: atmId } });
    if (!atm) throw new ApiError('ATM not found', 404);

    return prisma.atm.update({
      where: { atm_id: atmId },
      data: {
        status: 'ONLINE',
        last_refill_date: new Date(),
        last_refill_by_id: employeeId,
        cash_balance: 1000000,
      },
      include: {
        branch: { select: { branch_name: true, city: true } },
      },
    });
  }

  async setMaintenanceMode(atmId: number) {
    const atm = await prisma.atm.findUnique({ where: { atm_id: atmId } });
    if (!atm) throw new ApiError('ATM not found', 404);

    return prisma.atm.update({
      where: { atm_id: atmId },
      data: { status: 'UNDER_MAINTENANCE' },
    });
  }
}

export const atmService = new AtmService();
