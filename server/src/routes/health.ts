import { Router } from 'express';
import { prisma } from '../config/database.js';

export const healthRouter = Router();

healthRouter.get('/', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', service: 'nearbeat-api', database: 'connected' });
  } catch {
    res.status(503).json({
      status: 'degraded',
      service: 'nearbeat-api',
      database: 'disconnected',
    });
  }
});
