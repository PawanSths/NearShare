import { Router } from 'express';
import { prisma } from '../config/database.js';
import { authenticateToken, type AuthenticatedRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

export const blockRouter = Router();

blockRouter.get('/', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError(401, 'Authentication required');

    const blocks = await prisma.blockedUser.findMany({
      where: { blockerId: userId },
      select: {
        blocked: { select: { id: true, displayName: true, username: true } },
      },
    });

    res.json({ blockedUsers: blocks.map((b) => b.blocked) });
  } catch (error) {
    next(error);
  }
});

blockRouter.post('/:id', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const blockerId = req.user?.id;
    if (!blockerId) throw new AppError(401, 'Authentication required');

    const blockedId = String(req.params.id);
    if (blockerId === blockedId) throw new AppError(400, 'Cannot block yourself');

    const existing = await prisma.blockedUser.findUnique({
      where: { blockerId_blockedId: { blockerId, blockedId } },
    });
    if (existing) throw new AppError(409, 'User already blocked');

    await prisma.blockedUser.create({ data: { blockerId, blockedId } });
    res.status(201).json({ message: 'User blocked' });
  } catch (error) {
    next(error);
  }
});

blockRouter.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const blockerId = req.user?.id;
    if (!blockerId) throw new AppError(401, 'Authentication required');

    const blockedId = String(req.params.id);
    await prisma.blockedUser.deleteMany({
      where: { blockerId, blockedId },
    });

    res.json({ message: 'User unblocked' });
  } catch (error) {
    next(error);
  }
});
