# ADR-001: Use feature-oriented boundaries around pure domain logic

## Status

Accepted

## Date

2026-07-10

## Context

The MVP started with route files in `backend/src/routes`, service files in `backend/src/services`, and shared frontend files at the application root. That structure was fast to build, but the market and mentor services grew to combine several responsibilities:

- deterministic analysis and fallback rules;
- prompt or source parsing;
- external provider calls;
- Prisma persistence and request orchestration.

The frontend also mixed provider implementation with its public hook and duplicated navigation metadata between the app shell and layout. These couplings made otherwise safe refactors touch unrelated concerns.

## Decision

Keep the existing REST endpoints and deployment shape, while introducing feature-oriented modules for logic that can run independently of Express, Prisma, React providers, or external APIs.

- `backend/src/features/<feature>` owns pure domain types and deterministic rules.
- `backend/src/services` remains the orchestration and compatibility layer for database and external-provider workflows.
- `backend/src/routes` owns HTTP validation, authorization, status codes, and response mapping only.
- `frontend/src/features/<feature>` owns feature UI and feature state.
- `frontend/src/app` owns cross-feature navigation and application composition.
- React context definitions/hooks live separately from provider components so Fast Refresh and consumers have a stable boundary.

Existing imports from `backend/src/services` remain valid through explicit re-exports. This lets the codebase migrate incrementally without changing public API behavior.

## Dependency rules

```text
Backend routes -> services -> feature domain modules
                         \-> Prisma/external providers

Frontend app -> feature pages -> auth hook/API adapter
             \-> shared navigation metadata
```

Pure feature-domain modules must not import Express, Prisma clients, environment configuration, or network clients. Orchestration modules may depend on them.

## Alternatives considered

### Full clean-architecture rewrite

Rejected because the application is an evolving MVP with active uncommitted feature work. Replacing every route and repository at once would create a large, risky diff without changing user-visible behavior.

### Keep layer-only folders

Rejected as the only organizing principle because large service files were already accumulating unrelated provider, persistence, parsing, and domain responsibilities.

### Add a shared package for frontend/backend contracts

Deferred. The current REST surface is small, and introducing a buildable third workspace would add tooling before the API contracts justify it. This can be revisited when more consumers or generated OpenAPI contracts exist.

## Consequences

- Pure market analysis and mentor fallback/prompt logic can be unit-tested without database or network setup.
- External providers and storage can be replaced without rewriting deterministic business rules.
- Existing routes and response contracts remain unchanged.
- Some compatibility re-exports remain temporarily in `backend/src/services`; new domain imports should prefer `backend/src/features`.
- Large existing files such as demo data and admin routes can be migrated incrementally under the same rules.
