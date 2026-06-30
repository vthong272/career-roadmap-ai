import { Router } from 'express';
import { SkillLevel } from '@prisma/client';
import { z } from 'zod';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { asyncHandler } from '../utils/async-handler.js';
import { getMyProfile, updateMyProfile } from '../services/profile.service.js';

export const profileRouter = Router();

const CourseSchema = z.object({
  code: z.string().min(1).max(30),
  name: z.string().min(1).max(160),
  grade: z.string().max(20).optional()
});

const ProfileUpdateSchema = z.object({
  headline: z.string().max(180).nullable().optional(),
  location: z.string().max(120).nullable().optional(),
  university: z.string().max(160).nullable().optional(),
  major: z.string().max(120).nullable().optional(),
  graduationYear: z.number().int().min(2020).max(2040).nullable().optional(),
  gpa: z.number().min(0).max(4).nullable().optional(),
  careerInterests: z.array(z.string().min(1).max(80)).max(10).optional(),
  courses: z.array(CourseSchema).max(20).optional(),
  transcriptName: z.string().max(180).nullable().optional(),
  targetRoleId: z.string().nullable().optional(),
  currentSkills: z
    .array(
      z.object({
        skillId: z.string(),
        level: z.nativeEnum(SkillLevel)
      })
    )
    .max(40)
    .optional()
});

profileRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = (req as AuthenticatedRequest).user;
    const profile = await getMyProfile(user.id);
    res.json({ profile });
  })
);

profileRouter.patch(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = (req as AuthenticatedRequest).user;
    const input = ProfileUpdateSchema.parse(req.body);
    const profile = await updateMyProfile(user.id, input);
    res.json({ profile });
  })
);
