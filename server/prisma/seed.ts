import bcrypt from 'bcrypt';
import {
  EventCategory,
  EventStatus,
  NotificationType,
  PrismaClient,
  ReportStatus,
  ReportTargetType,
  UserRole,
} from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = 'password123';

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

function hoursFromNow(hours: number): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

function daysFromNow(days: number): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

async function main(): Promise<void> {
  console.log('Seeding database...');

  const passwordHash = await hashPassword(DEFAULT_PASSWORD);

  await prisma.message.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.report.deleteMany();
  await prisma.blockedUser.deleteMany();
  await prisma.eventParticipant.deleteMany();
  await prisma.event.deleteMany();
  await prisma.user.deleteMany();

  const admin = await prisma.user.create({
    data: {
      email: 'admin@nearbeat.app',
      passwordHash,
      displayName: 'NearBeat Admin',
      username: 'admin',
      bio: 'Platform administrator',
      interests: ['community', 'events'],
      discoveryRadius: 25,
      role: UserRole.ADMIN,
    },
  });

  const alex = await prisma.user.create({
    data: {
      email: 'alex@example.com',
      passwordHash,
      displayName: 'Alex Rivera',
      username: 'alexr',
      bio: 'Always up for a spontaneous coffee or park hangout.',
      interests: ['coffee', 'music', 'hiking'],
      discoveryRadius: 8,
    },
  });

  const jordan = await prisma.user.create({
    data: {
      email: 'jordan@example.com',
      passwordHash,
      displayName: 'Jordan Lee',
      username: 'jordanl',
      bio: 'Weekend runner and food market explorer.',
      interests: ['running', 'food', 'photography'],
      discoveryRadius: 12,
    },
  });

  const sam = await prisma.user.create({
    data: {
      email: 'sam@example.com',
      passwordHash,
      displayName: 'Sam Patel',
      username: 'samp',
      bio: 'Board games, live music, and rooftop sunsets.',
      interests: ['board-games', 'music', 'social'],
      discoveryRadius: 10,
    },
  });

  const taylor = await prisma.user.create({
    data: {
      email: 'taylor@example.com',
      passwordHash,
      displayName: 'Taylor Brooks',
      username: 'taylorb',
      bio: 'Outdoor meetups and casual sports.',
      interests: ['sports', 'outdoors', 'fitness'],
      discoveryRadius: 15,
    },
  });

  const coffeeMeetup = await prisma.event.create({
    data: {
      title: 'Morning Coffee & Chat',
      description:
        'Grab a coffee and meet new people before the workday starts. Casual conversation, no agenda.',
      category: EventCategory.SOCIAL,
      startTime: hoursFromNow(4),
      location: 'Blue Bottle Coffee, Market St',
      latitude: 37.7879,
      longitude: -122.4074,
      maxAttendees: 8,
      organizerId: alex.id,
      expiresAt: hoursFromNow(6),
    },
  });

  const runClub = await prisma.event.create({
    data: {
      title: 'Sunset 5K Group Run',
      description:
        'Easy-paced group run along the waterfront. All levels welcome. Bring water and good vibes.',
      category: EventCategory.SPORTS,
      startTime: hoursFromNow(8),
      location: 'Embarcadero Pier 7',
      latitude: 37.8044,
      longitude: -122.3933,
      maxAttendees: 15,
      organizerId: jordan.id,
      expiresAt: hoursFromNow(10),
    },
  });

  const foodMarket = await prisma.event.create({
    data: {
      title: 'Ferry Building Food Walk',
      description:
        'Explore local vendors together and share recommendations. We will split up and regroup.',
      category: EventCategory.FOOD,
      startTime: hoursFromNow(26),
      location: 'Ferry Building Marketplace',
      latitude: 37.7956,
      longitude: -122.3933,
      maxAttendees: 12,
      organizerId: sam.id,
      expiresAt: hoursFromNow(30),
    },
  });

  const liveMusic = await prisma.event.create({
    data: {
      title: 'Acoustic Night at the Park',
      description:
        'Bring a blanket and enjoy acoustic sets from local musicians. BYO snacks welcome.',
      category: EventCategory.MUSIC,
      startTime: daysFromNow(2),
      location: 'Dolores Park',
      latitude: 37.7596,
      longitude: -122.4269,
      maxAttendees: 30,
      organizerId: sam.id,
      expiresAt: daysFromNow(2.2),
    },
  });

  const cancelledEvent = await prisma.event.create({
    data: {
      title: 'Beach Volleyball Pickup',
      description: 'Casual volleyball at Ocean Beach. Cancelled due to weather.',
      category: EventCategory.SPORTS,
      startTime: hoursFromNow(48),
      location: 'Ocean Beach',
      latitude: 37.7597,
      longitude: -122.5107,
      maxAttendees: 10,
      organizerId: taylor.id,
      expiresAt: hoursFromNow(52),
      status: EventStatus.CANCELLED,
    },
  });

  await prisma.eventParticipant.createMany({
    data: [
      { eventId: coffeeMeetup.id, userId: alex.id },
      { eventId: coffeeMeetup.id, userId: jordan.id },
      { eventId: coffeeMeetup.id, userId: sam.id },
      { eventId: runClub.id, userId: jordan.id },
      { eventId: runClub.id, userId: taylor.id },
      { eventId: foodMarket.id, userId: sam.id },
      { eventId: foodMarket.id, userId: alex.id },
      { eventId: liveMusic.id, userId: sam.id },
    ],
  });

  await prisma.message.createMany({
    data: [
      {
        eventId: coffeeMeetup.id,
        userId: alex.id,
        content: 'Hey everyone! Looking forward to meeting you all tomorrow morning.',
      },
      {
        eventId: coffeeMeetup.id,
        userId: jordan.id,
        content: 'Same here. I will be wearing a blue jacket.',
      },
      {
        eventId: runClub.id,
        userId: jordan.id,
        content: 'We will meet at the pier entrance. Warm-up starts 10 minutes before.',
      },
      {
        eventId: foodMarket.id,
        userId: sam.id,
        content: 'I recommend the empanada stand near the center aisle!',
      },
    ],
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: alex.id,
        type: NotificationType.EVENT_JOIN,
        title: 'New attendee',
        message: 'Jordan Lee joined Morning Coffee & Chat',
        eventId: coffeeMeetup.id,
      },
      {
        userId: alex.id,
        type: NotificationType.EVENT_JOIN,
        title: 'New attendee',
        message: 'Sam Patel joined Morning Coffee & Chat',
        eventId: coffeeMeetup.id,
      },
      {
        userId: taylor.id,
        type: NotificationType.EVENT_CANCELLED,
        title: 'Event cancelled',
        message: 'Beach Volleyball Pickup has been cancelled',
        eventId: cancelledEvent.id,
      },
    ],
  });

  await prisma.report.create({
    data: {
      reporterId: jordan.id,
      targetType: ReportTargetType.EVENT,
      eventId: cancelledEvent.id,
      reason: 'Event was cancelled but still appeared in discovery briefly.',
      status: ReportStatus.PENDING,
    },
  });

  await prisma.blockedUser.create({
    data: {
      blockerId: alex.id,
      blockedId: taylor.id,
    },
  });

  console.log('Seed completed successfully.');
  console.log('');
  console.log('Test accounts (password: password123):');
  console.log(`  Admin:   ${admin.email}`);
  console.log(`  Alex:    ${alex.email}`);
  console.log(`  Jordan:  ${jordan.email}`);
  console.log(`  Sam:     ${sam.email}`);
  console.log(`  Taylor:  ${taylor.email}`);
}

main()
  .catch((error: unknown) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
