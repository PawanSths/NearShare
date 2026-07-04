import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database.js';
import { env } from '../config/env.js';
import { AppError } from '../middleware/errorHandler.js';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  displayName: z.string().min(2),
  username: z.string().min(3),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const authRouter = Router();

authRouter.post('/register', async (req, res, next) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, 'Invalid registration data');
    }

    const { email, password, displayName, username } = parsed.data;

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      throw new AppError(409, 'An account with that email or username already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        displayName,
        username,
      },
    });

    const token = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        username: user.username,
        displayName: user.displayName,
      },
      env.JWT_SECRET,
      { expiresIn: '7d' },
    );

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/login', async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, 'Invalid login data');
    }

    const { email, password } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new AppError(401, 'Invalid email or password');
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new AppError(401, 'Invalid email or password');
    }

    const token = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        username: user.username,
        displayName: user.displayName,
      },
      env.JWT_SECRET,
      { expiresIn: '7d' },
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
});

authRouter.get('/me', async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const token = header.split(' ')[1];
    const payload = jwt.verify(token, env.JWT_SECRET) as {
      sub: string;
      email: string;
      role: string;
      username: string;
      displayName: string;
    };

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      throw new AppError(401, 'User not found');
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
});
