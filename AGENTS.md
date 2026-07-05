# Neuro Scribe

- **What it is:** AI-powered clinical documentation web assistant for neurology. Listens to patient encounters and generates structured clinical notes, powered by the Neuro Plans knowledge base (147 clinical plans, 936 medications).
- **Type:** code repo
- **Stack / tools:** TypeScript, Express API + React client (Vite), Drizzle ORM + PostgreSQL, AWS Bedrock (Claude, incl. a Bedrock guardrail on note generation + prompt caching), AWS Transcribe Streaming, Docker (full-stack compose), Playwright (e2e), Vitest.
- **How to run / test:** `make setup` (installs deps, syncs KB, creates `.env`); `make db-up`; `make db-migrate`; `make dev` (or `npm run dev` for API, `npm run dev:client` for the Vite client); `npm test` / `npm run test:unit` / `npm run test:integration` / `npm run test:e2e`; `npm run lint` (tsc --noEmit); `npm run build`.
- **Key files / structure:**
  - `src/client/`, `src/api/`, `src/shared/` — application source
  - `prompts/` — version-controlled LLM prompt templates
  - `docs/`, `ARCHITECTURE.md`, `PRD.md`, `SCOPING.md` — design/product docs
  - `qa/TEST_STRATEGY.md`, `qa/TEST_CASES.yaml` — QA framework
  - `docker/` — Docker Compose full-stack setup
- **Conventions:** See CLAUDE.md.
- **Current focus / handoff notes:** ARCHIVED — no active development; kept for reference. Last commit 2026-04-01. Prior state per README: backend complete (Deepgram STT, Claude note generation, encounter CRUD, 95 tests passing). Most recent work added a Bedrock guardrail to clinical note generation and Bedrock prompt caching to InvokeModel calls. Per CLAUDE.md, knowledge-base data (plans/medications/ICD-10) is meant to sync from the canonical `neuro-plans` repo, never be duplicated here.

<!-- Read by Claude Code, Claude Cowork, and OpenAI Codex. Auto-generated 2026-07-05 (Fable run); edit freely. -->
