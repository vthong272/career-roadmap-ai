import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { getPortfolioForUser, getPublicPortfolio, syncGitHubPortfolio } from '../services/github.service.js';
import { asyncHandler } from '../utils/async-handler.js';

export const portfolioRouter = Router();

const SyncSchema = z.object({
  username: z.string().min(1).max(39)
});

portfolioRouter.get(
  '/portfolio/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = (req as AuthenticatedRequest).user;
    const portfolio = await getPortfolioForUser(user.id);
    res.json({ portfolio });
  })
);

portfolioRouter.post(
  '/portfolio/sync',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = (req as AuthenticatedRequest).user;
    const input = SyncSchema.parse(req.body);
    const portfolio = await syncGitHubPortfolio(user.id, input.username);
    res.status(201).json({ portfolio });
  })
);

portfolioRouter.get(
  '/portfolio/public/:username',
  asyncHandler(async (req, res) => {
    const portfolio = await getPublicPortfolio(String(req.params.username));
    res.json({ portfolio });
  })
);
