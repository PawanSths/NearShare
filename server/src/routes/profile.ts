import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { authenticateToken, type AuthenticatedRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const profileUpdateSchema = z.object({
  displayName: z.string().min(2).optional(),
  username: z.string().min(3).optional(),
  bio: z.string().max(280).optional().nullable(),
  profilePhoto: z.string().url().optional().nullable(),
  interests: z.array(z.string()).optional(),
  discoveryRadius: z.number().min(1).max(100).optional(),
});

function serializeUser(user: {
  id: string;
  email: string;
  username: string;
  displayName: string;
  profilePhoto: string | null;
  bio: string | null;
  interests: string[];
  discoveryRadius: number;
  role: string;
}) {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    profilePhoto: user.profilePhoto,
    bio: user.bio,
    interests: user.interests,
    discoveryRadius: user.discoveryRadius,
    role: user.role,
  };
}

export const profileRouter = Router();

profileRouter.get('/me', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError(401, 'Authentication required');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        profilePhoto: true,
        bio: true,
        interests: true,
        discoveryRadius: true,
        role: true,
      },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    const createdEvents = await prisma.event.findMany({
      where: { organizerId: userId },
      select: {
        id: true,
        title: true,
        category: true,
        startTime: true,
        location: true,
        status: true,
      },
      orderBy: { startTime: 'asc' },
    });

    const joinedEvents = await prisma.eventParticipant.findMany({
      where: { userId },
      select: {
        event: {
          select: {
            id: true,
            title: true,
            category: true,
            startTime: true,
            location: true,
            status: true,
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    res.json({
      user: serializeUser(user),
      createdEvents,
      joinedEvents: joinedEvents.map((entry) => entry.event),
    });
  } catch (error) {
    next(error);
  }
});

profileRouter.put('/me', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError(401, 'Authentication required');
    }

    const parsed = profileUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, 'Invalid profile data');
    }

    const { username, ...rest } = parsed.data;

    if (username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username,
          NOT: { id: userId },
        },
      });

      if (existingUser) {
        throw new AppError(409, 'That username is already taken');
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...rest,
        ...(username ? { username } : {}),
      },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        profilePhoto: true,
        bio: true,
        interests: true,
        discoveryRadius: true,
        role: true,
      },
    });

    res.json({
      user: serializeUser(user),
      createdEvents: [],
      joinedEvents: [],
    });
  } catch (error) {
    next(error);
  }
});

profileRouter.delete('/me', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError(401, 'Authentication required');
    }

    await prisma.user.delete({ where: { id: userId } });
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    next(error);
  }
});
