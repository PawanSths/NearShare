import { describe, it, expect, vi } from 'vitest';
import { rateLimiter } from '../middleware/rateLimiter.js';
import type { Request, Response } from 'express';

function createReq(ip = '127.0.0.1'): Request {
  return { ip, socket: { remoteAddress: ip } } as unknown as Request;
}

function createRes(): Response {
  const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as unknown as Response;
  return res;
}

describe('rateLimiter', () => {
  it('allows requests within limit', () => {
    const req = createReq();
    const res = createRes();
    const next = vi.fn();

    rateLimiter(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('blocks requests over limit', () => {
    const req = createReq('10.0.0.1');
    const res = createRes();
    const next = vi.fn();

    for (let i = 0; i < 60; i++) {
      rateLimiter(createReq('10.0.0.1'), createRes(), vi.fn());
    }

    rateLimiter(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(429);
  });
});
