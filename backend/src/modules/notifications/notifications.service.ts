import { prisma } from '../../config/database';
import { ApiError } from '../../utils/ApiError';

export class NotificationsService {
  async getForUser(userId: number, unreadOnly: boolean) {
    return prisma.notification.findMany({
      where: {
        user_id: userId,
        ...(unreadOnly ? { is_read: false } : {}),
      },
      orderBy: { created_at: 'desc' },
      take: 100,
    });
  }

  async markRead(notificationId: number, userId: number) {
    const notif = await prisma.notification.findUnique({ where: { notification_id: notificationId } });
    if (!notif) throw new ApiError('Notification not found', 404);
    if (notif.user_id !== userId) throw new ApiError('Access denied', 403);

    return prisma.notification.update({
      where: { notification_id: notificationId },
      data: { is_read: true, read_at: new Date() },
    });
  }

  async markAllRead(userId: number) {
    return prisma.notification.updateMany({
      where: { user_id: userId, is_read: false },
      data: { is_read: true, read_at: new Date() },
    });
  }

  async getUnreadCount(userId: number) {
    return prisma.notification.count({ where: { user_id: userId, is_read: false } });
  }
}

export const notificationsService = new NotificationsService();
