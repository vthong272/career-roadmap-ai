# Career Roadmap AI

SU26SWP02: Personalized Career Orientation & Learning Roadmap Platform for Software Engineering Students.

## Progress Checklist

- [x] Initial project setup
- [x] Backend database schema and seed data
- [x] Auth and user profile
- [x] Skill gap and roadmap modules
- [ ] AI mentor module
- [ ] GitHub portfolio module
- [ ] Market pulse dashboard
- [ ] Polish README and final verification

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

## Architecture

- `frontend/`: React, Vite, TypeScript, responsive design system.
- `backend/`: Express, TypeScript, Prisma, PostgreSQL, service-oriented modules.
- `docker-compose.yml`: local PostgreSQL dependency.

## Demo Accounts

- Student: `student@example.com` / `Student@123`
- Counselor/Admin: `counselor@example.com` / `Counselor@123`
