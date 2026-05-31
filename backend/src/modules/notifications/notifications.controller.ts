import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { notificationsService } from './notifications.service';
import { ApiResponse } from '../../utils/ApiResponse';
import { ApiError } from '../../utils/ApiError';

export const getNotifications = asyncHandler(async (req: Request, res: Response) => {
  const unreadOnly = req.query.unread === 'true';
  const notifications = await notificationsService.getForUser(req.user!.userId, unreadOnly);
  return ApiResponse.success(res, notifications, 'Notifications retrieved');
});

export const markRead = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) throw new ApiError('Invalid notification ID', 400);

  const notif = await notificationsService.markRead(id, req.user!.userId);
  return ApiResponse.success(res, notif, 'Marked as read');
});

export const markAllRead = asyncHandler(async (req: Request, res: Response) => {
  const result = await notificationsService.markAllRead(req.user!.userId);
  return ApiResponse.success(res, result, 'All notifications marked as read');
});

export const getUnreadCount = asyncHandler(async (req: Request, res: Response) => {
  const count = await notificationsService.getUnreadCount(req.user!.userId);
  return ApiResponse.success(res, { count }, 'Unread count retrieved');
});
