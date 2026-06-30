import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { asyncHandler } from '../utils/async-handler.js';
import { login, loginWithGoogleIdToken, register, serializeUser } from '../services/auth.service.js';
import { prisma } from '../lib/prisma.js';

export const authRouter = Router();

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2).max(120)
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

const GoogleSchema = z.object({
  credential: z.string().min(20)
});

authRouter.post(
  '/register',
  asyncHandler(async (req, res) => {
    const payload = await register(RegisterSchema.parse(req.body));
    res.status(201).json(payload);
  })
);

authRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const payload = await login(LoginSchema.parse(req.body));
    res.json(payload);
  })
);

authRouter.post(
  '/google',
  asyncHandler(async (req, res) => {
    const input = GoogleSchema.parse(req.body);
    const payload = await loginWithGoogleIdToken(input.credential);
    res.json(payload);
  })
);

authRouter.post('/logout', (_req, res) => {
  res.json({ ok: true });
});

authRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const authUser = (req as AuthenticatedRequest).user;
    const user = await prisma.user.findUniqueOrThrow({ where: { id: authUser.id } });
    res.json({ user: serializeUser(user) });
  })
);
