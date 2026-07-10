import { Router } from 'express';
import { getMarketPulse, syncMarketJobs } from '../services/market.service.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { asyncHandler } from '../utils/async-handler.js';

export const marketRouter = Router();

marketRouter.get(
  '/market/trends',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = (req as AuthenticatedRequest).user;
    const market = await getMarketPulse(user.id);
    res.json({ market });
  })
);

marketRouter.post(
  '/market/sync',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = (req as AuthenticatedRequest).user;
    const marketBeforeSync = await getMarketPulse(user.id);
    const roleKeywords = marketBeforeSync.roleTrends.slice(0, 3).map((trend) => trend.skill);
    const imported = await syncMarketJobs(roleKeywords.length > 0 ? roleKeywords : ['software engineer']);
    const market = await getMarketPulse(user.id);
    res.json({ imported, market });
  })
);
