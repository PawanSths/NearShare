import type { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database.js';
import { env } from '../config/env.js';
import { filterProfanity } from '../utils/profanity.js';

interface AuthenticatedSocket {
  userId?: string;
  displayName?: string;
}

export function setupSocket(httpServer: HttpServer): void {
  const io = new Server(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token ?? socket.handshake.query.token;
    if (!token) {
      next(new Error('Authentication required'));
      return;
    }

    try {
      const payload = jwt.verify(token as string, env.JWT_SECRET) as {
        sub: string;
        displayName: string;
      };
      (socket as unknown as AuthenticatedSocket).userId = payload.sub;
      (socket as unknown as AuthenticatedSocket).displayName = payload.displayName;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const auth = socket as unknown as AuthenticatedSocket;
    const userId = auth.userId!;
    const displayName = auth.displayName!;

    socket.on('join:event', async (eventId: string) => {
      const participant = await prisma.eventParticipant.findUnique({
        where: { eventId_userId: { eventId, userId } },
      });
      if (!participant) {
        socket.emit('error', 'You must join the event to chat');
        return;
      }

      const isBlocked = await prisma.blockedUser.findFirst({
        where: {
          OR: [
            { blockerId: userId, blockedId: { in: (await prisma.eventParticipant.findMany({ where: { eventId }, select: { userId: true } })).map((p) => p.userId) } },
            { blockedId: userId, blockerId: { in: (await prisma.eventParticipant.findMany({ where: { eventId }, select: { userId: true } })).map((p) => p.userId) } },
          ],
        },
      });
      if (isBlocked) {
        socket.emit('error', 'You cannot access this chat');
        return;
      }

      socket.join(`event:${eventId}`);

      const messages = await prisma.message.findMany({
        where: { eventId },
        orderBy: { createdAt: 'asc' },
        take: 50,
        select: {
          id: true,
          content: true,
          createdAt: true,
          user: { select: { id: true, displayName: true } },
        },
      });

      socket.emit('messages:init', messages);
      socket.to(`event:${eventId}`).emit('user:joined', { userId, displayName });
    });

    socket.on('leave:event', (eventId: string) => {
      socket.leave(`event:${eventId}`);
      socket.to(`event:${eventId}`).emit('user:left', { userId, displayName });
    });

    socket.on('message:send', async (data: { eventId: string; content: string }) => {
      const trimmed = data.content.trim();
      if (!trimmed || trimmed.length > 1000) return;

      const participant = await prisma.eventParticipant.findUnique({
        where: { eventId_userId: { eventId: data.eventId, userId } },
      });
      if (!participant) {
        socket.emit('error', 'You must join the event to send messages');
        return;
      }

      const filtered = filterProfanity(trimmed);

      const message = await prisma.message.create({
        data: {
          eventId: data.eventId,
          userId,
          content: filtered,
        },
        select: {
          id: true,
          content: true,
          createdAt: true,
          user: { select: { id: true, displayName: true } },
        },
      });

      io.to(`event:${data.eventId}`).emit('message:new', message);
    });

    socket.on('disconnect', () => {
      // cleanup handled by socket.io
    });
  });
}
