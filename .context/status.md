# neuro-scribe-web — Status

## Phase Summary

| Phase | Description | Status |
|-------|-------------|--------|
| Architecture and planning | PRD, ARCHITECTURE.md, SCOPING.md, IMPLEMENTATION_PLAN.md | Done |
| Project scaffolding | Express API + Vite client + Drizzle + test framework | Done |
| Prompts | LLM prompt templates (section-extract, note-generate, exam-structure, plan-match) | Done |
| API skeleton | Routes, middleware, validation stubs | Done (structure present) |
| Client skeleton | React pages and components scaffolded | Done (structure present) |
| Knowledge service | plans.json + medications.json lookup | Done (structure present) |
| DB schema | Drizzle schema defined | Done (structure present) |
| Feature implementation | Working transcription, generation, auth, note editing | Unknown — not in codebase |
| Testing | Unit, integration, E2E test suites | Framework in place; coverage unknown |

## What Works

- Project scaffolding: Express + React + Drizzle + Vitest + Playwright all configured
- File structure complete across all layers (api, services, db, client, prompts)
- LLM prompt templates in `prompts/` directory
- Security middleware structure (auth, audit, phi-guard, rate-limit) in place
- All client pages scaffolded (Capture, TranscriptReview, NoteEditor, EncounterList, Login, Settings)
- AWS Bedrock SDK installed and configured (`src/lib/bedrock.ts`)

## Active Gaps

| Gap | Notes |
|-----|-------|
| **Development paused** | CLAUDE.md explicitly states "Legacy — development paused" |
| STT provider undecided | Deepgram vs Whisper vs AWS Transcribe not resolved |
| Auth provider undecided | Auth0 vs Cognito vs Clerk not resolved |
| Hosting undecided | Lightweight vs AWS ECS not resolved |
| No implementation beyond scaffolding | CLAUDE.md: "No implementation beyond planning docs and AI backend migration" |
| Possible supersession | "May be superseded by neuro-scribe-personal (native Mac app)" |

## Next Priorities

Unknown — project is paused. If resumed:
1. Resolve STT provider decision (Deepgram recommended for medical vocabulary + BAA)
2. Resolve auth provider (Cognito consistent with rest of Sevaro platform)
3. Implement transcription service
4. Implement note generation service against Bedrock
5. Wire knowledge service to plans.json / medications.json

## Recent Activity

- Last commit: `fcc03d9` — Update project instructions (CLAUDE.md)
- Previous: `5169f39` — Add Body of Work section to CLAUDE.md
- PR #1: Bedrock migration — update PRD, add strategic synthesis doc
- No feature implementation commits visible in recent log
