import type { NextFunction, Response } from 'express';
import { authenticateToken, type AuthenticatedRequest } from './auth.js';

export function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void {
  authenticateToken(req, res, () => {
    if (req.user?.role !== 'ADMIN') {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }
    next();
  });
}
