import cors from 'cors';
import express from 'express';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { rateLimiter } from './middleware/rateLimiter.js';
import { authRouter } from './routes/auth.js';
import { healthRouter } from './routes/health.js';
import { profileRouter } from './routes/profile.js';
import { eventsRouter } from './routes/events.js';
import { notificationRouter } from './routes/notifications.js';
import { blockRouter } from './routes/blocks.js';
import { reportRouter } from './routes/reports.js';
import { adminRouter } from './routes/admin.js';

export const app = express();

app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  }),
);
app.use(express.json());
app.use(rateLimiter);

app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/profile', profileRouter);
app.use('/api/events', eventsRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/blocks', blockRouter);
app.use('/api/reports', reportRouter);
app.use('/api/admin', adminRouter);

app.use(errorHandler);
