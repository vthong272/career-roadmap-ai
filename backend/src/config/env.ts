import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const EnvSchema = z.object({
  NODE_ENV: z.string().default('development'),
  DATABASE_URL: z.string().default('postgresql://postgres:postgres@localhost:5432/career_roadmap_ai?schema=public'),
  PORT: z.coerce.number().default(4000),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  JWT_SECRET: z.string().min(20).default('dev-only-secret-change-before-production'),
  AI_PROVIDER: z.enum(['fallback', 'openai', 'gemini']).default('fallback'),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default('gpt-4.1-mini'),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-1.5-flash'),
  GITHUB_TOKEN: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional()
});

export const env = EnvSchema.parse(process.env);
