import { OAuth2Client } from 'google-auth-library';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import { ApiError } from '../middleware/error.js';

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

function signToken(userId: string) {
  return jwt.sign({ sub: userId }, env.JWT_SECRET, { expiresIn: '7d' });
}

export function serializeUser(user: {
  id: string;
  email: string;
  name: string;
  role: 'STUDENT' | 'COUNSELOR_ADMIN';
  avatarUrl?: string | null;
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    avatarUrl: user.avatarUrl ?? null
  };
}

export async function register(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
  if (existing) {
    throw new ApiError(409, 'EMAIL_ALREADY_REGISTERED', 'Email is already registered.');
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await prisma.user.create({
    data: {
      email: input.email.toLowerCase(),
      passwordHash,
      name: input.name,
      profile: { create: { careerInterests: [], courses: [] } }
    }
  });

  return { token: signToken(user.id), user: serializeUser(user) };
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
  if (!user?.passwordHash) {
    throw new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid email or password.');
  }

  const isValid = await bcrypt.compare(input.password, user.passwordHash);
  if (!isValid) {
    throw new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid email or password.');
  }

  return { token: signToken(user.id), user: serializeUser(user) };
}

export async function loginWithGoogleIdToken(credential: string) {
  if (!env.GOOGLE_CLIENT_ID) {
    throw new ApiError(501, 'GOOGLE_OAUTH_NOT_CONFIGURED', 'Google OAuth is not configured.');
  }

  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: env.GOOGLE_CLIENT_ID
  });
  const payload = ticket.getPayload();

  if (!payload?.email || !payload.sub) {
    throw new ApiError(401, 'INVALID_GOOGLE_TOKEN', 'Google token did not include a verified account.');
  }

  const user = await prisma.user.upsert({
    where: { email: payload.email.toLowerCase() },
    update: {
      googleId: payload.sub,
      name: payload.name ?? payload.email,
      avatarUrl: payload.picture
    },
    create: {
      email: payload.email.toLowerCase(),
      googleId: payload.sub,
      name: payload.name ?? payload.email,
      avatarUrl: payload.picture,
      profile: { create: { careerInterests: [], courses: [] } }
    }
  });

  return { token: signToken(user.id), user: serializeUser(user) };
}
