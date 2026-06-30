# Career Roadmap AI

SU26SWP02: Personalized Career Orientation & Learning Roadmap Platform for Software Engineering Students.

## Progress Checklist

- [x] Initial project setup
- [x] Backend database schema and seed data
- [x] Auth and user profile
- [x] Skill gap and roadmap modules
- [x] AI mentor module
- [x] GitHub portfolio module
- [x] Market pulse dashboard
- [x] Admin/Counselor tools
- [x] Polish README and final verification

## Features

- Email/password auth with JWT sessions and role support for Student and Counselor/Admin.
- Optional Google ID-token login endpoint when `GOOGLE_CLIENT_ID` is configured.
- Student profile with personal info, GPA/course input, career interests, target role, transcript placeholder, and current skills.
- Career role catalog with required skills, priorities, required levels, and seeded learning nodes/resources.
- Skill gap dashboard with readiness score, matched skills, below-level skills, missing skills, and charts.
- Dynamic roadmap with node status updates: Not Started, In Progress, Completed.
- AI virtual mentor service isolated behind `AI_PROVIDER`, `OPENAI_API_KEY`, and `GEMINI_API_KEY`; deterministic fallback works without keys.
- GitHub portfolio sync for public repositories, README-based summaries, and a public share page at `/portfolio/:username`.
- Market pulse dashboard from seeded job posts with keyword frequency charts.
- Counselor/Admin tools for student progress summary plus managing roles, skills, learning nodes, and resources.

## Tech Stack

- Frontend: React, Vite, TypeScript, Recharts, lucide-react, custom responsive design system.
- Backend: Node.js, Express, TypeScript, Prisma, PostgreSQL.
- Integrations: OpenAI/Gemini through `backend/src/services/ai.service.ts`; GitHub REST API through `backend/src/services/github.service.ts`.
- Testing: Vitest unit tests for skill gap, AI fallback, portfolio summary fallback, and market keyword analysis.

## Local Setup

```powershell
npm install
Copy-Item .env.example backend\.env
docker compose up -d postgres
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

Frontend: `http://localhost:5173`

Backend API: `http://localhost:4000/api`

Public portfolio page pattern: `http://localhost:5173/portfolio/<github-username>`

## Verification Commands

```powershell
npm run prisma:generate
npm run build
npm run test
npm audit --omit=dev
```

## Environment

Copy `.env.example` to `backend/.env`, then update values as needed.

- `DATABASE_URL`: PostgreSQL connection string.
- `JWT_SECRET`: long random secret for local tokens.
- `AI_PROVIDER`: `fallback`, `openai`, or `gemini`.
- `OPENAI_API_KEY`, `OPENAI_MODEL`: optional OpenAI configuration.
- `GEMINI_API_KEY`, `GEMINI_MODEL`: optional Gemini configuration.
- `GITHUB_TOKEN`: optional token for higher GitHub API rate limits.
- `GOOGLE_CLIENT_ID`: optional Google ID-token verification.

No API keys are hardcoded.

## Demo Accounts

Seeded by `npm run prisma:seed`:

- Student: `student@example.com` / `Student@123`
- Counselor/Admin: `counselor@example.com` / `Counselor@123`

## Architecture

- `frontend/src/features`: feature pages for auth, profile, gap analysis, roadmap, mentor, portfolio, market, and admin.
- `frontend/src/api.ts`: typed fetch helper with consistent error handling.
- `backend/src/routes`: REST API route modules.
- `backend/src/services`: business logic and integration boundaries.
- `backend/prisma/schema.prisma`: PostgreSQL data model.
- `backend/prisma/seed.ts`: roles, skills, learning nodes, learning resources, demo users, and mock job posts.

## Remaining Limitations

- Google OAuth is implemented as a backend ID-token endpoint; a production Google button/client flow still needs provider setup.
- AI calls are optional and fall back locally when keys are missing or provider calls fail.
- Transcript upload is represented by manual course/GPA input and a placeholder filename field.
- Market Pulse uses seeded mock job posts; the service is structured so a scraper or jobs API can replace the data source later.
- Docker Desktop must be running before applying migrations locally.

## Suggested CV Bullet Points

- Built a fullstack career roadmap platform with React, Express, Prisma, and PostgreSQL for software engineering student career planning.
- Implemented skill gap analysis, dynamic learning roadmap progress tracking, AI mentor fallback workflows, and GitHub portfolio synchronization.
- Designed role-gated counselor/admin tools, seeded domain data, and unit-tested core analysis services with Vitest.
