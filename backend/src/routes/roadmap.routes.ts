import { Router } from 'express';
import { RoadmapStatus } from '@prisma/client';
import { z } from 'zod';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { getRoadmapForUser, getSkillGapForUser, updateRoadmapProgress } from '../services/skill-gap.service.js';
import { asyncHandler } from '../utils/async-handler.js';

export const roadmapRouter = Router();

const ProgressSchema = z.object({
  status: z.nativeEnum(RoadmapStatus)
});

roadmapRouter.get(
  '/gap-analysis/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = (req as AuthenticatedRequest).user;
    const analysis = await getSkillGapForUser(user.id);
    res.json({ analysis });
  })
);

roadmapRouter.get(
  '/roadmap/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = (req as AuthenticatedRequest).user;
    const roadmap = await getRoadmapForUser(user.id);
    res.json({ roadmap });
  })
);

roadmapRouter.patch(
  '/roadmap/nodes/:nodeId/progress',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = (req as AuthenticatedRequest).user;
    const input = ProgressSchema.parse(req.body);
    const roadmap = await updateRoadmapProgress(user.id, String(req.params.nodeId), input.status);
    res.json({ roadmap });
  })
);
