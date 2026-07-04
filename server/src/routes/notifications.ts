import { Router } from 'express';
import { prisma } from '../config/database.js';
import { authenticateToken, type AuthenticatedRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

export const notificationRouter = Router();

notificationRouter.get('/', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError(401, 'Authentication required');

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.json({ notifications });
  } catch (error) {
    next(error);
  }
});

notificationRouter.put('/:id/read', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError(401, 'Authentication required');

    const id = String(req.params.id);
    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification || notification.userId !== userId) {
      throw new AppError(404, 'Notification not found');
    }

    await prisma.notification.update({ where: { id }, data: { isRead: true } });
    res.json({ message: 'Marked as read' });
  } catch (error) {
    next(error);
  }
});

notificationRouter.put('/read-all', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError(401, 'Authentication required');

    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
});
