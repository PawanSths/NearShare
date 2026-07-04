import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { authenticateToken, type AuthenticatedRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const reportSchema = z.object({
  targetType: z.enum(['USER', 'EVENT']),
  targetId: z.string().min(1),
  reason: z.string().min(10).max(500),
});

export const reportRouter = Router();

reportRouter.post('/', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const reporterId = req.user?.id;
    if (!reporterId) throw new AppError(401, 'Authentication required');

    const parsed = reportSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError(400, 'Invalid report data');

    const { targetType, targetId, reason } = parsed.data;

    const data: Record<string, unknown> = {
      reporterId,
      targetType,
      reason,
    };

    if (targetType === 'USER') {
      if (targetId === reporterId) throw new AppError(400, 'Cannot report yourself');
      const target = await prisma.user.findUnique({ where: { id: targetId } });
      if (!target) throw new AppError(404, 'User not found');
      data.reportedUserId = targetId;
    } else {
      const target = await prisma.event.findUnique({ where: { id: targetId } });
      if (!target) throw new AppError(404, 'Event not found');
      data.eventId = targetId;
    }

    const report = await prisma.report.create({ data: data as Parameters<typeof prisma.report.create>[0]['data'] });

    res.status(201).json({ message: 'Report submitted', report });
  } catch (error) {
    next(error);
  }
});
