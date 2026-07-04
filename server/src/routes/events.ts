import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { authenticateToken, type AuthenticatedRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { createNotification, notifyEventParticipants } from '../utils/notify.js';
import { filterProfanity } from '../utils/profanity.js';

const createEventSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  category: z.enum(['SOCIAL', 'SPORTS', 'FOOD', 'MUSIC', 'OUTDOOR', 'OTHER']),
  startTime: z.string(),
  location: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  maxAttendees: z.coerce.number().int().min(1),
});

const updateEventSchema = createEventSchema.partial();

export const eventsRouter = Router();

const eventSelect = {
  id: true,
  title: true,
  description: true,
  category: true,
  startTime: true,
  location: true,
  latitude: true,
  longitude: true,
  maxAttendees: true,
  organizerId: true,
  status: true,
  expiresAt: true,
  createdAt: true,
  organizer: {
    select: { id: true, displayName: true, username: true },
  },
};

eventsRouter.get('/', async (_req, res, next) => {
  try {
    const events = await prisma.event.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { startTime: 'asc' },
      select: {
        ...eventSelect,
        _count: { select: { participants: true } },
      },
    });

    const result = events.map(({ _count, ...event }) => ({
      ...event,
      participantCount: _count.participants,
    }));

    res.json(result);
  } catch (error) {
    if (error instanceof Error && error.message.includes("Can't reach database server")) {
      res.json([]);
      return;
    }
    next(error);
  }
});

eventsRouter.post('/', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError(401, 'Authentication required');

    const parsed = createEventSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError(400, 'Invalid event data');

    const data = parsed.data;
    const event = await prisma.event.create({
      data: {
        title: filterProfanity(data.title),
        description: filterProfanity(data.description),
        category: data.category,
        startTime: new Date(data.startTime),
        location: data.location,
        latitude: data.latitude,
        longitude: data.longitude,
        maxAttendees: data.maxAttendees,
        organizerId: userId,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
      },
      select: {
        ...eventSelect,
        _count: { select: { participants: true } },
      },
    });

    const { _count, ...rest } = event;
    res.status(201).json({ ...rest, participantCount: _count.participants });
  } catch (error) {
    next(error);
  }
});

eventsRouter.get('/:id', async (req, res, next) => {
  try {
    const id = String(req.params.id);
    const event = await prisma.event.findUnique({
      where: { id },
      select: {
        ...eventSelect,
        _count: { select: { participants: true } },
      },
    });
    if (!event) throw new AppError(404, 'Event not found');

    const { _count, ...rest } = event;
    const result: Record<string, unknown> = { ...rest, participantCount: _count.participants };

    const header = req.headers.authorization;
    if (header?.startsWith('Bearer ')) {
      try {
        const jwt = await import('jsonwebtoken');
        const { env } = await import('../config/env.js');
        const payload = jwt.default.verify(header.split(' ')[1], env.JWT_SECRET) as { sub: string };
        const participation = await prisma.eventParticipant.findUnique({
          where: { eventId_userId: { eventId: id, userId: payload.sub } },
        });
        result.isParticipant = !!participation;
      } catch {
        result.isParticipant = false;
      }
    } else {
      result.isParticipant = false;
    }

    res.json(result);
  } catch (error) {
    if (error instanceof Error && error.message.includes("Can't reach database server")) {
      next(new AppError(503, 'Database unavailable'));
      return;
    }
    next(error);
  }
});

eventsRouter.put('/:id', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError(401, 'Authentication required');

    const parsed = updateEventSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError(400, 'Invalid event data');

    const id = String(req.params.id);
    const existing = await prisma.event.findUnique({ where: { id } });
    if (!existing) throw new AppError(404, 'Event not found');
    if (existing.organizerId !== userId) throw new AppError(403, 'Not authorized');

    const updated = await prisma.event.update({
      where: { id },
      data: {
        ...parsed.data,
        ...(parsed.data.title ? { title: filterProfanity(parsed.data.title) } : {}),
        ...(parsed.data.description ? { description: filterProfanity(parsed.data.description) } : {}),
        ...(parsed.data.startTime ? { startTime: new Date(parsed.data.startTime) } : {}),
      },
      select: {
        ...eventSelect,
        _count: { select: { participants: true } },
      },
    });

    const { _count, ...rest } = updated;

    await notifyEventParticipants(
      id,
      userId,
      'EVENT_UPDATED',
      'Event updated',
      `The event "${updated.title}" has been updated`,
    );

    res.json({ ...rest, participantCount: _count.participants });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Can't reach database server")) {
      next(new AppError(503, 'Database unavailable'));
      return;
    }
    next(error);
  }
});

eventsRouter.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError(401, 'Authentication required');

    const id = String(req.params.id);
    const existing = await prisma.event.findUnique({ where: { id } });
    if (!existing) throw new AppError(404, 'Event not found');
    if (existing.organizerId !== userId) throw new AppError(403, 'Not authorized');

    await notifyEventParticipants(
      id,
      userId,
      'EVENT_CANCELLED',
      'Event cancelled',
      `The event "${existing.title}" has been cancelled by the organizer`,
    );

    await prisma.event.delete({ where: { id } });
    res.json({ message: 'Event deleted' });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Can't reach database server")) {
      next(new AppError(503, 'Database unavailable'));
      return;
    }
    next(error);
  }
});

eventsRouter.patch('/:id/cancel', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError(401, 'Authentication required');

    const id = String(req.params.id);
    const event = await prisma.event.findUnique({
      where: { id },
      select: { id: true, title: true, organizerId: true, status: true },
    });
    if (!event) throw new AppError(404, 'Event not found');
    if (event.organizerId !== userId) throw new AppError(403, 'Not authorized');
    if (event.status === 'CANCELLED') throw new AppError(400, 'Event already cancelled');

    await prisma.event.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    await notifyEventParticipants(
      id,
      userId,
      'EVENT_CANCELLED',
      'Event cancelled',
      `The event "${event.title}" has been cancelled`,
    );

    res.json({ message: 'Event cancelled' });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Can't reach database server")) {
      next(new AppError(503, 'Database unavailable'));
      return;
    }
    next(error);
  }
});

eventsRouter.post('/:id/join', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError(401, 'Authentication required');

    const id = String(req.params.id);
    const event = await prisma.event.findUnique({
      where: { id },
      select: { id: true, title: true, maxAttendees: true, organizerId: true, _count: { select: { participants: true } } },
    });
    if (!event) throw new AppError(404, 'Event not found');

    if (event._count.participants >= event.maxAttendees) {
      throw new AppError(400, 'Event is full');
    }

    if (event.organizerId === userId) {
      throw new AppError(400, 'You are the organizer of this event');
    }

    const existing = await prisma.eventParticipant.findUnique({
      where: { eventId_userId: { eventId: id, userId } },
    });
    if (existing) throw new AppError(409, 'Already joined this event');

    await prisma.eventParticipant.create({
      data: { eventId: id, userId },
    });

    const joiner = await prisma.user.findUnique({
      where: { id: userId },
      select: { displayName: true },
    });
    await createNotification(
      event.organizerId,
      'EVENT_JOIN',
      'New participant',
      `${joiner?.displayName ?? 'Someone'} joined "${event.title}"`,
      id,
    );

    res.json({ message: 'Joined event successfully' });
  } catch (error) {
    next(error);
  }
});

eventsRouter.post('/:id/leave', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError(401, 'Authentication required');

    const id = String(req.params.id);
    const existing = await prisma.eventParticipant.findUnique({
      where: { eventId_userId: { eventId: id, userId } },
    });
    if (!existing) throw new AppError(404, 'Not a participant');

    await prisma.eventParticipant.delete({
      where: { eventId_userId: { eventId: id, userId } },
    });

    res.json({ message: 'Left event successfully' });
  } catch (error) {
    next(error);
  }
});
