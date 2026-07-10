import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { askMentor, generateLearningPlan, getMentorHistory } from '../services/ai.service.js';
import { asyncHandler } from '../utils/async-handler.js';

export const mentorRouter = Router();

const MentorQuestionSchema = z.object({
  message: z.string().min(3).max(1200)
});

const MentorPlanSchema = z.object({
  days: z.union([z.literal(7), z.literal(30)])
});

mentorRouter.get(
  '/mentor/history',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = (req as AuthenticatedRequest).user;
    const history = await getMentorHistory(user.id);
    res.json({ history });
  })
);

mentorRouter.post(
  '/mentor/chat',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = (req as AuthenticatedRequest).user;
    const input = MentorQuestionSchema.parse(req.body);
    const result = await askMentor(user.id, input.message);
    res.status(201).json(result);
  })
);

mentorRouter.post(
  '/mentor/plan',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = (req as AuthenticatedRequest).user;
    const input = MentorPlanSchema.parse(req.body);
    const plan = await generateLearningPlan(user.id, input.days);
    res.json({ plan });
  })
);
