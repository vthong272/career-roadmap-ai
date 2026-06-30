import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';
import { authRouter } from './routes/auth.routes.js';
import { catalogRouter } from './routes/catalog.routes.js';
import { healthRouter } from './routes/health.routes.js';
import { mentorRouter } from './routes/mentor.routes.js';
import { profileRouter } from './routes/profile.routes.js';
import { roadmapRouter } from './routes/roadmap.routes.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use(express.json({ limit: '1mb' }));

  app.use('/api', healthRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/profile', profileRouter);
  app.use('/api', catalogRouter);
  app.use('/api', roadmapRouter);
  app.use('/api', mentorRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
