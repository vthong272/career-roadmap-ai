import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import { ApiError } from './error.js';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: 'STUDENT' | 'COUNSELOR_ADMIN';
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

interface JwtPayload {
  sub: string;
}

function readBearerToken(req: Request) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return null;
  }

  return header.slice('Bearer '.length);
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = readBearerToken(req);
    if (!token) {
      throw new ApiError(401, 'UNAUTHENTICATED', 'Authentication is required.');
    }

    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, name: true, role: true }
    });

    if (!user) {
      throw new ApiError(401, 'UNAUTHENTICATED', 'Authentication is required.');
    }

    (req as AuthenticatedRequest).user = user;
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
      return;
    }

    next(new ApiError(401, 'UNAUTHENTICATED', 'Invalid or expired token.'));
  }
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  const user = (req as AuthenticatedRequest).user;
  if (user.role !== 'COUNSELOR_ADMIN') {
    next(new ApiError(403, 'FORBIDDEN', 'Counselor or admin role is required.'));
    return;
  }

  next();
}
