import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    username: string;
    displayName: string;
  };
}

export function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const token = header.split(' ')[1];

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as {
      sub: string;
      email: string;
      role: string;
      username: string;
      displayName: string;
    };

    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      username: payload.username,
      displayName: payload.displayName,
    };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
