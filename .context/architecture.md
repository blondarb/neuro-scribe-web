# neuro-scribe-web — Architecture

## Purpose

Web-based AI clinical documentation assistant for neurology. Records encounter audio, transcribes it with medical vocabulary support, and generates structured SOAP notes enriched with the Neuro Plans knowledge base. **Status: development paused; may be superseded by a native Mac app.**

## Core Data Flow

```
Browser (Client SPA)
┌────────────────────────────────────────┐
│  Capture.tsx                           │
│  (Web Audio API + MediaRecorder)       │
│          │ audio stream (WebSocket)    │
│          ▼                             │
│  TranscriptReview.tsx                  │
│          │ transcript (approved)       │
│          ▼                             │
│  NoteEditor.tsx                        │
│  (section-by-section review)           │
└────────────┬───────────────────────────┘
             │  HTTPS/JWT
             ▼
┌────────────────────────────────────────┐
│  Express API (src/api/server.ts)       │
│                                        │
│  Middleware stack:                     │
│  auth → rate-limit → phi-guard → audit │
│                                        │
│  Routes:                               │
│  /encounters   /knowledge   /health    │
└────────┬───────────────┬───────────────┘
         │               │
         ▼               ▼
┌─────────────────┐  ┌──────────────────┐
│  Transcription  │  │  Note Generation │
│  Service        │  │  Service         │
│                 │  │                  │
│  Audio → Text   │  │  Transcript →    │
│  Speaker ID     │  │  SOAP (Bedrock)  │
│  Med vocab      │  │  + Knowledge     │
│  boost          │  │  enrichment      │
└─────────────────┘  └────────┬─────────┘
                              │
                              ▼
                     ┌──────────────────┐
                     │  Knowledge       │
                     │  Service         │
                     │                  │
                     │  plans.json      │
                     │  medications.json│
                     │  ICD-10 index    │
                     └──────────────────┘
         │
         ▼
┌──────────────────────────────┐
│  PostgreSQL (Drizzle ORM)    │
│  Encrypted at rest           │
│  Encounters, notes,          │
│  transcripts, audit log      │
└──────────────────────────────┘
```

## Main Components

### API Layer (`src/api/`)
- **server.ts** — Express server; applies middleware pipeline; mounts routes
- **Middleware**: `auth.ts` (JWT validation, JWKS), `rate-limit.ts` (express-rate-limit), `phi-guard.ts` (sanitizes logs/responses), `audit.ts` (logs every PHI access)
- **Routes**: `encounters.ts` (CRUD), `knowledge.ts` (plan/medication lookup), `health.ts` (public health check)

### Services (`src/services/`)
- **Transcription** — STT provider undecided; architecture supports Deepgram, Whisper, or AWS Transcribe Medical; speaker diarization; medical vocabulary boost
- **Generation** — Transcript → structured SOAP note via Claude (Bedrock); section extraction (Haiku) → note assembly (Sonnet/Opus); per-section confidence scoring
- **Knowledge** — In-memory lookup against `plans.json` (147 plans) and `medications.json` (936 medications) sourced from `neuro-plans` repo

### Database (`src/db/`)
- Drizzle ORM + PostgreSQL
- `schema.ts` defines encounters, notes, transcripts, audit_log tables
- PHI encrypted at rest (AES-256 per `src/shared/encryption.ts`)

### Client (`src/client/`)
- React 19 + React Router 7 SPA
- Built with Vite
- Pages: Capture, TranscriptReview, NoteEditor, EncounterList, Login, Settings
- Components: AudioMeter, NoteSection, Layout, StatusBadge

### Prompts (`prompts/`)
- Versioned LLM prompt templates as markdown files
- 4 prompts: section-extract, note-generate, exam-structure, plan-match

### Security Design
- No PHI in URLs, logs, or error messages
- Short-lived JWTs (15 min access, 7-day refresh)
- Immutable audit log for all PHI access
- Ephemeral audio — streamed and discarded, never persisted
