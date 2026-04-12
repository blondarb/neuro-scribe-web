# neuro-scribe-web — Router

## Task → Context

| Task | Files to Read |
|------|---------------|
| Understand overall architecture | `ARCHITECTURE.md`, `CLAUDE.md` |
| Product requirements | `PRD.md` |
| Milestones and timeline | `SCOPING.md` |
| Implementation approach | `IMPLEMENTATION_PLAN.md` |
| API server entry point | `src/api/server.ts` |
| API routes | `src/api/routes/encounters.ts`, `routes/health.ts`, `routes/knowledge.ts` |
| Auth middleware | `src/api/middleware/auth.ts` |
| Rate limiting | `src/api/middleware/rate-limit.ts` |
| PHI guard middleware | `src/api/middleware/phi-guard.ts` |
| Audit logging | `src/api/middleware/audit.ts` |
| Transcription service | `src/services/transcription/` |
| Note generation service | `src/services/generation/` |
| Knowledge base service | `src/services/knowledge/` |
| Database schema | `src/db/schema.ts` |
| DB client | `src/db/client.ts` |
| DB operations | `src/db/operations.ts` |
| Bedrock client | `src/lib/bedrock.ts` |
| Shared types | `src/shared/types.ts` |
| Shared config | `src/shared/config.ts` |
| Client app entry | `src/client/main.tsx`, `src/client/App.tsx` |
| Client pages | `src/client/pages/` |
| LLM prompts | `prompts/` |
| Test fixtures | `tests/fixtures/` |
| QA strategy | `qa/TEST_STRATEGY.md`, `qa/TEST_CASES.yaml` |

## Quick Facts

| Fact | Value |
|------|-------|
| Status | **Legacy — development paused** (may be superseded by native Mac app) |
| Package name | `neuro-scribe` |
| Type | Fullstack TypeScript (Express API + React SPA) |
| Build tool | Vite (client) + tsc (server) |
| Test runner | Vitest + Playwright |
| Database | PostgreSQL via Drizzle ORM |
| AI backend | AWS Bedrock (via `src/lib/bedrock.ts`) |
| STT provider | Undecided (Deepgram vs Whisper vs AWS Transcribe) |
| Auth provider | Undecided (Auth0 vs Cognito vs Clerk) |
| Hosting | Undecided (lightweight → AWS ECS) |

## File Index

| Path | Purpose |
|------|---------|
| `src/api/server.ts` | Express server entry point |
| `src/api/routes/encounters.ts` | Encounter CRUD endpoints |
| `src/api/routes/knowledge.ts` | Knowledge base lookup endpoints |
| `src/api/routes/health.ts` | Health check endpoint |
| `src/api/middleware/auth.ts` | JWT authentication middleware |
| `src/api/middleware/audit.ts` | PHI access audit logging |
| `src/api/middleware/phi-guard.ts` | PHI sanitization middleware |
| `src/api/middleware/rate-limit.ts` | Rate limiting middleware |
| `src/api/validation.ts` | Zod request validation schemas |
| `src/services/transcription/` | Audio transcription service |
| `src/services/generation/` | Note generation service (Claude via Bedrock) |
| `src/services/knowledge/` | Knowledge base (plans.json, medications.json lookup) |
| `src/db/schema.ts` | Drizzle ORM schema |
| `src/db/client.ts` | PostgreSQL connection |
| `src/db/operations.ts` | DB query helpers |
| `src/db/migrations/` | Drizzle migration files |
| `src/lib/bedrock.ts` | AWS Bedrock SDK client |
| `src/shared/types.ts` | Shared TypeScript types |
| `src/shared/config.ts` | Runtime configuration |
| `src/shared/constants.ts` | Application constants |
| `src/shared/encryption.ts` | PHI encryption utilities |
| `src/shared/logger.ts` | Winston logger (PHI-safe) |
| `src/client/main.tsx` | React app entry |
| `src/client/App.tsx` | Router and layout |
| `src/client/pages/Capture.tsx` | Audio capture page |
| `src/client/pages/TranscriptReview.tsx` | Transcript review and edit |
| `src/client/pages/NoteEditor.tsx` | Section-by-section note editor |
| `src/client/pages/EncounterList.tsx` | Encounter history |
| `src/client/pages/Login.tsx` | Auth page |
| `src/client/pages/Settings.tsx` | Preferences page |
| `prompts/section-extract.md` | Transcript → section extraction prompt |
| `prompts/note-generate.md` | Sections → clinical note prompt |
| `prompts/exam-structure.md` | Neuro exam parsing prompt |
| `prompts/plan-match.md` | Diagnosis → plan matching prompt |
| `ARCHITECTURE.md` | Full system architecture (detailed) |
| `PRD.md` | Product requirements |
| `SCOPING.md` | Milestones and timeline |
| `IMPLEMENTATION_PLAN.md` | Implementation approach |
| `qa/TEST_STRATEGY.md` | QA approach and coverage targets |
| `qa/TEST_CASES.yaml` | Structured acceptance test cases |
