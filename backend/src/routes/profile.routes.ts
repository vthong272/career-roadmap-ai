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

const requiredText = (max: number) => z.string({ error: 'Please enter a value.' }).trim().min(1, 'Please enter a value.').max(max);

export const ProfileUpdateSchema = z.object({
  headline: requiredText(180),
  location: requiredText(120),
  university: requiredText(160),
  major: requiredText(120),
  graduationYear: z.number({ error: 'Enter a valid number.' }).int().min(2020, 'Must be between 2020 and 2040.').max(2040, 'Must be between 2020 and 2040.'),
  gpa: z.number({ error: 'Enter a valid number.' }).min(0, 'Must be between 0 and 4.').max(4, 'Must be between 0 and 4.'),
  careerInterests: z.array(z.string().trim().min(1).max(80)).min(1, 'Enter at least one career interest.').max(10),
  courses: z.array(CourseSchema).max(20).optional(),
  transcriptName: z.string().max(180).nullable().optional(),
  targetRoleId: z.string({ error: 'Choose a target role.' }).trim().min(1, 'Choose a target role.'),
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
