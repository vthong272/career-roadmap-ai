import { Router } from 'express';
import { getMarketPulse } from '../services/market.service.js';
import { asyncHandler } from '../utils/async-handler.js';

export const marketRouter = Router();

marketRouter.get(
  '/market/trends',
  asyncHandler(async (_req, res) => {
    const market = await getMarketPulse();
    res.json({ market });
  })
);
