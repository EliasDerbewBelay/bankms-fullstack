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
