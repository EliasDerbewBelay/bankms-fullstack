import { Router } from 'express';
import { getNotifications, markRead, markAllRead, getUnreadCount } from './notifications.controller';
import { authenticate } from '../../middleware/authenticate';

const router = Router();
router.use(authenticate);

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.patch('/:id/read', markRead);
router.patch('/read-all', markAllRead);

export default router;
