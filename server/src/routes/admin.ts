import { Router } from 'express';
import { prisma } from '../config/database.js';
import { requireAdmin } from '../middleware/admin.js';

export const adminRouter = Router();

adminRouter.get('/users', requireAdmin, async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        role: true,
        isSuspended: true,
        createdAt: true,
      },
    });
    res.json({ users });
  } catch (error) {
    next(error);
  }
});

adminRouter.get('/events', requireAdmin, async (_req, res, next) => {
  try {
    const events = await prisma.event.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        category: true,
        status: true,
        startTime: true,
        organizer: { select: { id: true, displayName: true } },
        _count: { select: { participants: true } },
      },
    });
    res.json({ events });
  } catch (error) {
    next(error);
  }
});

adminRouter.get('/reports', requireAdmin, async (_req, res, next) => {
  try {
    const reports = await prisma.report.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        targetType: true,
        reason: true,
        status: true,
        createdAt: true,
        reporter: { select: { id: true, displayName: true } },
        reportedUser: { select: { id: true, displayName: true, username: true } },
        event: { select: { id: true, title: true, organizerId: true } },
      },
    });
    res.json({ reports });
  } catch (error) {
    next(error);
  }
});

adminRouter.patch('/users/:id/suspend', requireAdmin, async (req, res, next) => {
  try {
    const userId = String(req.params.id);
    await prisma.user.update({
      where: { id: userId },
      data: { isSuspended: true },
    });
    res.json({ message: 'User suspended' });
  } catch (error) {
    next(error);
  }
});

adminRouter.patch('/users/:id/unsuspend', requireAdmin, async (req, res, next) => {
  try {
    const userId = String(req.params.id);
    await prisma.user.update({
      where: { id: userId },
      data: { isSuspended: false },
    });
    res.json({ message: 'User unsuspended' });
  } catch (error) {
    next(error);
  }
});

adminRouter.delete('/users/:id', requireAdmin, async (req, res, next) => {
  try {
    const userId = String(req.params.id);
    await prisma.user.delete({ where: { id: userId } });
    res.json({ message: 'User deleted' });
  } catch (error) {
    next(error);
  }
});

adminRouter.delete('/events/:id', requireAdmin, async (req, res, next) => {
  try {
    const eventId = String(req.params.id);
    await prisma.event.delete({ where: { id: eventId } });
    res.json({ message: 'Event deleted' });
  } catch (error) {
    next(error);
  }
});

adminRouter.patch('/reports/:id/reviewed', requireAdmin, async (req, res, next) => {
  try {
    const reportId = String(req.params.id);
    await prisma.report.update({
      where: { id: reportId },
      data: { status: 'REVIEWED' },
    });
    res.json({ message: 'Report marked as reviewed' });
  } catch (error) {
    next(error);
  }
});

adminRouter.patch('/reports/:id/dismiss', requireAdmin, async (req, res, next) => {
  try {
    const reportId = String(req.params.id);
    await prisma.report.update({
      where: { id: reportId },
      data: { status: 'DISMISSED' },
    });
    res.json({ message: 'Report dismissed' });
  } catch (error) {
    next(error);
  }
});
