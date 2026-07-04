import { prisma } from '../config/database.js';
import type { NotificationType } from '@prisma/client';

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  eventId?: string,
): Promise<void> {
  await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      message,
      eventId: eventId ?? null,
    },
  });
}

export async function notifyEventParticipants(
  eventId: string,
  excludeUserId: string,
  type: NotificationType,
  title: string,
  message: string,
): Promise<void> {
  const participants = await prisma.eventParticipant.findMany({
    where: { eventId, userId: { not: excludeUserId } },
    select: { userId: true },
  });

  await Promise.all(
    participants.map((p) => createNotification(p.userId, type, title, message, eventId)),
  );
}
