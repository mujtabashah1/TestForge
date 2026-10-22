import type { NextFunction, Request, Response } from 'express';
import type { Role } from './generated/prisma/client.js';
import jwt from 'jsonwebtoken';
import { ZodError, type ZodType } from 'zod';
import { config } from './config.js';

export type AuthRequest = Request & {
  auth?: { userId: string; role: Role };
  validatedQuery?: unknown;
};
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export const asyncRoute =
  (handler: (req: AuthRequest, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: AuthRequest, res: Response, next: NextFunction) =>
    void handler(req, res, next).catch(next);

export const validate =
  (schema: ZodType, source: 'body' | 'query' = 'body') =>
  (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req[source]);
      if (source === 'query') (req as AuthRequest).validatedQuery = parsed;
      else req.body = parsed;
      next();
    } catch (error) {
      next(error);
    }
  };

export function authenticate(req: AuthRequest, _res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) return next(new HttpError(401, 'Authentication required'));
  try {
    req.auth = jwt.verify(token, config.JWT_SECRET) as { userId: string; role: Role };
    next();
  } catch {
    next(new HttpError(401, 'Invalid or expired token'));
  }
}

export function requireAdmin(req: AuthRequest, _res: Response, next: NextFunction) {
  if (req.auth?.role !== 'ADMIN') return next(new HttpError(403, 'Admin access required'));
  next();
}

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof ZodError) {
    return res.status(400).json({ error: 'Validation failed', issues: error.issues });
  }
  if (error instanceof HttpError) return res.status(error.status).json({ error: error.message });
  if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2034') {
    return res.status(409).json({ error: 'Concurrent transaction conflict; retry the request' });
  }
  console.error(error);
  return res.status(500).json({ error: 'Internal server error' });
}
