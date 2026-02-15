# Neuro Scribe — Implementation Plan

**Version:** 1.0
**Date:** 2026-02-11
**Status:** Active
**Audience:** Engineering team, clinical leadership, compliance officers

---

## Executive Summary

This document describes every step required to take Neuro Scribe from its current state (design documents + TypeScript interfaces) to a production-ready, HIPAA-compliant clinical documentation assistant that can be deployed behind a hospital BAA.

**Current state:** Project scaffolding — no runnable code.
**Target state:** Deployable service with signed BAAs, database integration points, API surface for EHR integration, and complete test coverage.

---

## Gap Analysis

### What Exists (Scaffolding)

| Asset | Status | Notes |
|-------|--------|-------|
| Product requirements (PRD.md) | Complete | 5 milestones, 30+ requirements |
| Architecture design (ARCHITECTURE.md) | Complete | System diagram, data flow, security model |
| Scoping (SCOPING.md) | Complete | 17-week milestone breakdown |
| TypeScript type system (src/shared/types.ts) | Complete | 26 interfaces, full domain model |
| Service interfaces | Complete | Transcription, Generation, Knowledge — interfaces only |
| LLM prompt templates (prompts/) | Complete | 4 prompt files with test annotations |
| QA framework (qa/) | Complete | Strategy + 40 test cases |
| CI pipeline (.github/workflows/ci.yml) | Skeleton | Lint, test, security audit — no code to run |
| Test fixture | 1 sample | Seizure consult transcript |
| Config (tsconfig, package.json) | Declared | Dependencies not installed, no vite/eslint config |

### What Must Be Built

| Component | Priority | Effort | Dependencies |
|-----------|----------|--------|-------------|
| Build system (vite, eslint, env) | P0 | 1 day | None |
| Database schema + migrations | P0 | 2 days | PostgreSQL |
| Knowledge Service implementation | P0 | 3 days | plans.json, medications.json |
| API layer (routes, middleware, auth) | P0 | 5 days | Database, auth provider |
| Transcription Service (Deepgram) | P0 | 4 days | Deepgram BAA |
| Note Generation Service (Claude) | P0 | 5 days | Anthropic BAA |
| Frontend application | P1 | 8 days | API layer |
| Security hardening + audit logging | P0 | 3 days | API layer |
| Deployment infrastructure | P0 | 3 days | All services |
| Integration + E2E tests | P0 | 4 days | All services |
| PHI scanning + compliance checks | P0 | 2 days | CI pipeline |
| Documentation for engineers | P0 | 2 days | All above |

---

## Phase 0: Project Foundation

**Goal:** Make the project build, lint, and run an empty dev server.
**Duration:** 1 day
**Risk:** None — no PHI, no external services

### 0.1 Install Dependencies

```bash
npm install
```

Add runtime dependencies:
```
@anthropic-ai/sdk          # Claude API client
@deepgram/sdk              # Deepgram STT client
express                    # API server
pg                         # PostgreSQL client
drizzle-orm                # Type-safe ORM
drizzle-kit                # Migration tooling
zod                        # Runtime validation
jsonwebtoken               # JWT handling
helmet                     # Security headers
cors                       # CORS middleware
winston                    # Structured logging (PHI-safe)
uuid                       # ID generation
dotenv                     # Environment config
```

Add dev dependencies:
```
@types/express
@types/pg
@types/jsonwebtoken
@types/cors
@types/uuid
vitest                     # (already declared)
vite                       # (already declared)
typescript                 # (already declared)
eslint                     # (already declared)
prettier                   # (already declared)
```

### 0.2 Configuration Files

| File | Purpose |
|------|---------|
| `vite.config.ts` | Build config with path aliases matching tsconfig |
| `eslint.config.js` | Flat config with TypeScript + PHI-leak custom rule |
| `.env.example` | All required environment variables (NO secrets) |
| `.env.test` | Test environment (mocked services, SQLite) |
| `drizzle.config.ts` | Database migration config |

### 0.3 Environment Variables (.env.example)

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/neuro_scribe

# Anthropic (Claude API) — BAA REQUIRED
ANTHROPIC_API_KEY=sk-ant-...

# Deepgram (STT) — BAA REQUIRED
DEEPGRAM_API_KEY=...

# Auth
JWT_SECRET=...
JWT_ISSUER=neuro-scribe
JWT_AUDIENCE=neuro-scribe-api
SESSION_TIMEOUT_MINUTES=15

# Encryption
ENCRYPTION_KEY=... # AES-256 key for PHI at rest

# Knowledge Base
PLANS_JSON_PATH=./data/plans.json
MEDICATIONS_JSON_PATH=./data/medications.json

# Audit
AUDIT_LOG_PATH=./logs/audit.log
```

### 0.4 Project Structure (Final)

```
neuro-scribe/
├── src/
│   ├── api/
│   │   ├── server.ts              # Express app setup
│   │   ├── routes/
│   │   │   ├── encounters.ts      # Encounter CRUD
│   │   │   ├── transcription.ts   # Audio upload + WebSocket
│   │   │   ├── generation.ts      # Note generation triggers
│   │   │   ├── knowledge.ts       # Plan/med lookup endpoints
│   │   │   └── health.ts          # Health check (no auth required)
│   │   └── middleware/
│   │       ├── auth.ts            # JWT verification
│   │       ├── audit.ts           # PHI access logging
│   │       ├── phi-guard.ts       # Block PHI from logs/errors
│   │       └── error-handler.ts   # Generic error responses
│   ├── services/
│   │   ├── transcription/
│   │   │   ├── index.ts           # Interface (exists)
│   │   │   ├── deepgram.ts        # Deepgram implementation
│   │   │   └── vocabulary.ts      # Neuro term boost list
│   │   ├── generation/
│   │   │   ├── index.ts           # Interface (exists)
│   │   │   ├── claude.ts          # Claude API implementation
│   │   │   ├── prompts.ts         # Prompt loader + templating
│   │   │   └── pipeline.ts        # Multi-step generation pipeline
│   │   └── knowledge/
│   │       ├── index.ts           # Interface (exists)
│   │       ├── plans.ts           # Plan matching engine
│   │       ├── medications.ts     # Medication lookup
│   │       └── icd10.ts           # ICD-10 suggestion engine
│   ├── db/
│   │   ├── schema.ts              # Drizzle schema definitions
│   │   ├── migrations/            # SQL migrations
│   │   └── client.ts              # Database connection
│   ├── shared/
│   │   ├── types.ts               # Domain types (exists)
│   │   ├── constants.ts           # App-wide constants
│   │   ├── encryption.ts          # AES-256 encrypt/decrypt for PHI
│   │   └── logger.ts              # PHI-safe structured logger
│   └── client/                    # Frontend (Phase 5)
├── data/
│   ├── plans.json                 # Synced from neuro-plans
│   └── medications.json           # Synced from neuro-plans
├── scripts/
│   ├── sync-knowledge.sh          # Pull latest plans.json + medications.json
│   ├── generate-vocab.ts          # Build neuro vocabulary list from plans
│   └── migrate.ts                 # Run database migrations
├── tests/
├── prompts/
├── qa/
├── docker/
│   ├── Dockerfile                 # Production container
│   ├── Dockerfile.dev             # Development container
│   └── docker-compose.yml         # Full stack (app + postgres + redis)
└── docs/
    ├── DEPLOYMENT.md              # Deployment guide for engineers
    ├── API.md                     # API reference
    ├── SECURITY.md                # Security architecture + HIPAA mapping
    └── ONBOARDING.md              # New engineer onboarding
```

---

## Phase 1: Knowledge Service (No PHI — Safest Start)

**Goal:** Working plan matching, medication lookup, and ICD-10 suggestions.
**Duration:** 3 days
**Risk:** None — this service handles NO patient data, only reference data.
**Why first:** Zero PHI risk. Validates the neuro-plans data contract. Every other service depends on it.

### 1.1 Knowledge Base Sync

Create `scripts/sync-knowledge.sh`:
- Fetch `plans.json` from neuro-plans repo (GitHub raw or release artifact)
- Fetch `medications.json` from neuro-plans repo
- Validate JSON schema
- Place in `data/` directory
- Log sync timestamp

Create `data/` directory with copies of current plans.json and medications.json.

### 1.2 Plan Matching Engine (`src/services/knowledge/plans.ts`)

Implement `matchPlans()`:
- Load and index plans.json on startup (in-memory)
- Build inverted index: ICD-10 code → plan IDs
- Build keyword index: diagnosis terms → plan IDs (tokenized, lowercase)
- Match by ICD-10 code (exact match, highest confidence)
- Match by keyword (term overlap scoring)
- Return ranked results with match scores

### 1.3 Medication Lookup (`src/services/knowledge/medications.ts`)

Implement `lookupMedication()` and `validateDose()`:
- Load medications.json on startup
- Index by name, brand names, aliases (case-insensitive)
- Return full medication data for a name query
- Dose validation: parse dictated dose, compare to plan-recommended range
- Flag discrepancies with severity levels

### 1.4 ICD-10 Suggestion (`src/services/knowledge/icd10.ts`)

Implement `suggestIcd10()`:
- Extract ICD-10 codes from all matched plans
- Map diagnosis keywords to codes via plan frontmatter
- Return suggestions with confidence based on match quality

### 1.5 Tests

- Unit tests for plan matching (KI-01, KI-02 from TEST_CASES.yaml)
- Unit tests for medication lookup (KI-03, KI-04)
- Unit tests for dose validation with known discrepancies
- Integration test: full knowledge lookup from sample transcript

---

## Phase 2: Database + API Layer

**Goal:** PostgreSQL schema, Express API, auth middleware, audit logging.
**Duration:** 5 days
**Risk:** Medium — database will store PHI (encrypted). Requires careful design.

### 2.1 Database Schema

```sql
-- Core tables
encounters (
  id UUID PRIMARY KEY,
  physician_id UUID NOT NULL,
  status encounter_status NOT NULL DEFAULT 'recording',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

transcripts (
  id UUID PRIMARY KEY,
  encounter_id UUID REFERENCES encounters(id),
  segments_encrypted BYTEA NOT NULL,     -- AES-256 encrypted JSON
  duration_seconds INTEGER,
  word_count INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

clinical_notes (
  id UUID PRIMARY KEY,
  encounter_id UUID REFERENCES encounters(id),
  note_type note_type NOT NULL DEFAULT 'soap',
  sections_encrypted BYTEA NOT NULL,     -- AES-256 encrypted JSON
  metadata JSONB,                        -- non-PHI: plan matches, ICD suggestions
  status note_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Security tables
audit_log (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  ip_address INET,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

users (
  id UUID PRIMARY KEY,
  external_id TEXT NOT NULL UNIQUE,      -- From auth provider (Auth0/Cognito)
  role user_role NOT NULL DEFAULT 'physician',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Critical:** All PHI columns use `_encrypted` suffix and store AES-256 ciphertext. Application-level encryption, not just database TDE.

### 2.2 API Endpoints

| Method | Path | Auth | PHI | Purpose |
|--------|------|------|-----|---------|
| GET | `/health` | No | No | Health check |
| POST | `/api/encounters` | Yes | No | Create encounter |
| GET | `/api/encounters` | Yes | No | List user's encounters |
| GET | `/api/encounters/:id` | Yes | Yes | Get encounter with transcript/note |
| POST | `/api/encounters/:id/transcribe` | Yes | Yes | Upload audio for transcription |
| WS | `/api/encounters/:id/stream` | Yes | Yes | Stream audio for real-time transcription |
| POST | `/api/encounters/:id/generate` | Yes | Yes | Trigger note generation |
| PATCH | `/api/encounters/:id/note` | Yes | Yes | Update/edit note sections |
| POST | `/api/encounters/:id/finalize` | Yes | Yes | Finalize note |
| GET | `/api/knowledge/plans` | Yes | No | Search plans |
| GET | `/api/knowledge/medications/:name` | Yes | No | Medication lookup |
| GET | `/api/knowledge/icd10` | Yes | No | ICD-10 suggestions |

### 2.3 Middleware Stack

```
Request → helmet → cors → auth → audit → phi-guard → route handler → error-handler → Response
```

- **auth.ts:** Verify JWT, extract user ID, attach to request
- **audit.ts:** Log every request that touches PHI resources (encounters, notes, transcripts)
- **phi-guard.ts:** Intercept all log calls and error responses; scrub any PHI patterns
- **error-handler.ts:** Generic "Internal Server Error" to client; detailed error only to audit log

### 2.4 PHI-Safe Logger

```typescript
// NEVER log: patient names, MRNs, dates of birth, transcript text, note content
// ALWAYS log: encounter IDs, user IDs, action names, timestamps
// Pattern: structured JSON logs with explicit allow-list of fields
```

### 2.5 Tests

- API route tests (mock services, verify request/response contracts)
- Auth middleware tests (valid JWT, expired JWT, missing JWT, wrong role)
- Audit logging tests (verify PHI access is logged)
- PHI guard tests (verify PHI patterns are scrubbed from errors/logs)
- Encryption round-trip tests (encrypt → store → retrieve → decrypt)

---

## Phase 3: Transcription Service

**Goal:** Audio → timestamped, speaker-labeled transcript with neurology vocabulary accuracy.
**Duration:** 4 days
**Risk:** High — processes real audio (PHI). Requires Deepgram BAA.

### 3.1 Prerequisites (BAA Required)

- [ ] Sign Deepgram BAA (HIPAA Business Associate Agreement)
- [ ] Obtain Deepgram API key with medical model access
- [ ] Configure Deepgram for zero-retention (no audio stored by Deepgram)

### 3.2 Deepgram Implementation (`src/services/transcription/deepgram.ts`)

- WebSocket streaming integration (real-time transcription)
- File upload fallback (batch transcription)
- Medical model with custom vocabulary boost
- Speaker diarization (2-speaker mode: physician + patient)
- Confidence scores per segment

### 3.3 Neuro Vocabulary Boost (`src/services/transcription/vocabulary.ts`)

Generate from neuro-plans data:
- Extract all medication names from medications.json (936 terms)
- Extract neurology terms from plan titles, sections, differentials
- Build Deepgram-compatible keyword boost list
- Script to regenerate when knowledge base updates

### 3.4 Tests

- Unit: vocabulary list generation
- Integration: Deepgram API with sample audio (synthetic, non-PHI)
- Accuracy: TA-01 through TA-06 from TEST_CASES.yaml (when audio corpus available)

---

## Phase 4: Note Generation Service

**Goal:** Transcript → structured SOAP note via Claude API.
**Duration:** 5 days
**Risk:** High — sends transcript text (PHI) to Claude API. Requires Anthropic BAA.

### 4.1 Prerequisites (BAA Required)

- [ ] Sign Anthropic BAA
- [ ] Obtain API key with zero-retention tier
- [ ] Verify Claude API data handling policy

### 4.2 Generation Pipeline (`src/services/generation/pipeline.ts`)

Multi-step pipeline:

```
Transcript
  → Step 1: Section Extraction (Haiku — fast, structured)
      Uses: prompts/section-extract.md
      Output: { subjective, objective, assessment, plan } sections
  → Step 2: Knowledge Enrichment (no LLM call)
      Uses: Knowledge Service
      Output: matched plans, medication data, ICD-10 suggestions
  → Step 3: Note Generation (Sonnet — clinical precision)
      Uses: prompts/note-generate.md + enrichment context
      Output: polished clinical note
  → Step 4: Validation (code, no LLM)
      Checks: all mentioned meds have DB match, dose alerts flagged
      Output: final note with metadata
```

### 4.3 Prompt Management (`src/services/generation/prompts.ts`)

- Load prompt templates from `prompts/` directory
- Variable substitution (transcript, knowledge context, preferences)
- Version tracking per prompt file

### 4.4 Tests

- Unit: prompt loading + templating
- Unit: pipeline step isolation (mock each step)
- Integration: full pipeline with sample transcript → note
- Accuracy: NG-01 through NG-08 from TEST_CASES.yaml
- Hallucination check: verify no fabricated findings

---

## Phase 5: Frontend Application

**Goal:** Browser-based UI for audio capture, transcript review, note editing.
**Duration:** 8 days
**Risk:** Medium — handles PHI in browser memory (never persisted locally).

### 5.1 Technology Decision

**Recommended:** React + Vite (team familiarity, ecosystem maturity)
**Alternative:** Vanilla JS + Web Components (smaller bundle, less abstraction)

### 5.2 Views

1. **Login** — OAuth redirect to auth provider
2. **Encounter List** — Active + past encounters, status badges
3. **Capture** — Start/stop/pause recording, audio level meter, live transcript preview
4. **Transcript Review** — Speaker-labeled segments, inline editing, confidence highlights
5. **Note Editor** — Section-by-section SOAP display, accept/reject/edit per section, side-by-side with transcript
6. **Note Export** — Copy-to-clipboard (EHR-formatted), PDF export
7. **Settings** — Note preferences, default sections, specialty defaults

### 5.3 Key Browser APIs

- `MediaRecorder` for audio capture
- `WebSocket` for streaming to transcription service
- `Clipboard API` for one-click copy-to-EHR
- `Service Worker` for PWA offline queuing

### 5.4 Tests

- Component tests (Vitest + Testing Library)
- E2E: full flow with Playwright (UX-01 through UX-07)
- Performance: PF-04, PF-05 from TEST_CASES.yaml

---

## Phase 6: Security & Compliance

**Goal:** HIPAA technical safeguard checklist complete, zero PHI leaks.
**Duration:** 3 days (runs in parallel with other phases)
**Risk:** Critical — non-compliance is a legal and career risk.

### 6.1 Authentication

- OAuth 2.0 / OIDC integration (Auth0 recommended — has HIPAA BAA)
- JWT access tokens (15-minute lifetime)
- Refresh tokens (7-day lifetime, rotated on use)
- Automatic session timeout (15 minutes idle)

### 6.2 Encryption

| Data | Location | Encryption |
|------|----------|-----------|
| Audio stream | In transit | TLS 1.3 |
| Transcript | Database | AES-256 (app-level) + TDE |
| Clinical note | Database | AES-256 (app-level) + TDE |
| Encounter metadata | Database | TDE only (non-PHI) |
| API key / secrets | Environment | AWS Secrets Manager / Vault |

### 6.3 Audit Logging

Every PHI access generates an immutable audit record:
```json
{
  "timestamp": "2026-02-11T10:30:00Z",
  "user_id": "uuid",
  "action": "note.read",
  "resource": "encounters/uuid",
  "ip": "10.0.1.50",
  "outcome": "success"
}
```

### 6.4 PHI Scanning (CI)

Custom ESLint rule + CI step:
- Scan all `console.log`, `logger.*` calls for PHI field patterns
- Scan error response bodies for PHI patterns
- Scan test files for real-looking PHI (names, SSNs, MRNs)
- Block PR merge if any PHI patterns detected

### 6.5 HIPAA Technical Safeguard Checklist

| Safeguard | Implementation | Status |
|-----------|---------------|--------|
| Access Control (§164.312(a)) | JWT auth, RBAC, unique user IDs | Planned |
| Audit Controls (§164.312(b)) | Immutable audit log, all PHI access | Planned |
| Integrity Controls (§164.312(c)) | Checksums on stored notes, DB constraints | Planned |
| Transmission Security (§164.312(e)) | TLS 1.3, no PHI in URLs | Planned |
| Encryption (§164.312(a)(2)(iv)) | AES-256 at rest, TLS in transit | Planned |
| Session Management | 15-min timeout, token rotation | Planned |
| Emergency Access | Admin override with enhanced audit | Planned |

---

## Phase 7: Deployment & Infrastructure

**Goal:** Staging + production environments, CI/CD pipeline, monitoring.
**Duration:** 3 days

### 7.1 Docker

```yaml
# docker-compose.yml
services:
  app:
    build: ./docker/Dockerfile
    ports: ["3000:3000"]
    environment:
      - DATABASE_URL=postgresql://...
    depends_on: [postgres]

  postgres:
    image: postgres:16
    volumes: ["pgdata:/var/lib/postgresql/data"]
    environment:
      - POSTGRES_DB=neuro_scribe

  # Development only
  pgadmin:
    image: dpage/pgadmin4
    profiles: ["dev"]
```

### 7.2 Deployment Options

**Option A — AWS (Recommended for production):**
```
Route 53 → CloudFront → ALB → ECS Fargate → RDS PostgreSQL
                                              ↕ (encrypted)
                                        Secrets Manager
```

**Option B — Lightweight (Pilot / staging):**
```
Cloudflare → Railway (API) → Supabase PostgreSQL
```

### 7.3 CI/CD Pipeline

```
PR opened → lint → type check → unit tests → integration tests
         → PHI scan → security audit → coverage check
         → deploy to staging (auto)

PR merged to main → all above + deploy to production (manual gate)
```

### 7.4 Monitoring

- Application metrics: latency, error rate, note generation time
- Security alerts: failed auth attempts, unusual access patterns
- Cost tracking: API calls to Deepgram + Claude per encounter

---

## Phase 8: Engineer Handoff Documentation

**Goal:** A senior engineer can deploy this in their hospital environment with minimal support.

### 8.1 Documents to Deliver

| Document | Audience | Contents |
|----------|----------|----------|
| `docs/DEPLOYMENT.md` | DevOps / Infrastructure | Step-by-step deploy guide, env vars, Docker, DB migration |
| `docs/API.md` | Backend engineers | Full API reference with request/response examples |
| `docs/SECURITY.md` | Compliance officers | HIPAA safeguard mapping, BAA checklist, audit log format |
| `docs/ONBOARDING.md` | New engineers | Architecture walkthrough, dev setup, code conventions |
| `docs/INTEGRATION.md` | EHR integration engineers | API surface for connecting to EHR systems, data formats |
| `docs/RUNBOOK.md` | Operations | Incident response, scaling, backup/restore procedures |

### 8.2 Integration Points (Plug-and-Play)

Engineers at the hospital connect these:

| Integration Point | What to Configure | Where |
|-------------------|------------------|-------|
| **Database** | PostgreSQL connection string | `DATABASE_URL` env var |
| **Auth provider** | OAuth 2.0 client ID/secret, OIDC discovery URL | `.env` |
| **Deepgram** | API key (with BAA) | `DEEPGRAM_API_KEY` env var |
| **Claude API** | API key (with BAA) | `ANTHROPIC_API_KEY` env var |
| **Knowledge base** | Path to plans.json + medications.json | `PLANS_JSON_PATH`, `MEDICATIONS_JSON_PATH` |
| **TLS certificate** | SSL cert for HTTPS | Reverse proxy / load balancer |
| **Audit log sink** | Where to send audit logs (SIEM, CloudWatch, etc.) | Logger config |

### 8.3 First-Run Checklist

```
1. [ ] Clone repo
2. [ ] Copy .env.example → .env, fill in all values
3. [ ] Run database migrations: npm run db:migrate
4. [ ] Sync knowledge base: npm run kb:sync
5. [ ] Build: npm run build
6. [ ] Run tests: npm run test
7. [ ] Run security scan: npm run qa:security
8. [ ] Run PHI leak scan: npm run phi:scan
9. [ ] Start server: npm start
10. [ ] Verify health check: curl https://localhost:3000/health
11. [ ] Create first user via auth provider
12. [ ] Test end-to-end: record → transcribe → generate note
```

---

## BAA Requirements

Before ANY real patient data touches this system:

| Provider | Service | BAA Status | Contact |
|----------|---------|-----------|---------|
| Anthropic | Claude API (note generation) | Required | sales@anthropic.com |
| Deepgram | Nova-2 Medical (transcription) | Required | hipaa@deepgram.com |
| Auth0 / AWS Cognito | Authentication | Required | Via enterprise agreement |
| AWS / GCP | Hosting infrastructure | Required | Via enterprise agreement |
| GitHub | Source code (no PHI in repo) | Not required | N/A (no PHI in code) |

**Rule:** No PHI in any system without a signed BAA. Development and testing use ONLY synthetic data.

---

## Execution Order

```
Phase 0 ──→ Phase 1 ──→ Phase 2 ──→ Phase 3 ──→ Phase 4 ──→ Phase 5
(Foundation)  (Knowledge)  (API+DB)    (STT)       (NoteGen)   (Frontend)
  1 day        3 days      5 days     4 days       5 days      8 days
                                                                  │
                                        Phase 6 (Security) ──────┤ (parallel)
                                          3 days                  │
                                                                  ▼
                                                           Phase 7 ──→ Phase 8
                                                           (Deploy)    (Docs)
                                                            3 days     2 days
```

**Total estimated duration:** 8-10 weeks (1 developer + AI-assisted)
**Critical path:** Phase 0 → 1 → 2 → 3 → 4 → 5 → 7

---

## Risk Mitigations for Hospital Deployment

| Concern | Mitigation |
|---------|-----------|
| "How do we know PHI is safe?" | AES-256 encryption at rest, TLS 1.3 in transit, ephemeral audio, immutable audit log, automated PHI scanning in CI |
| "What if the AI hallucinates?" | Physician-in-the-loop (never auto-submit), knowledge-base grounding, confidence scores, hallucination detection tests |
| "Can we connect to our EHR?" | v1 uses copy-to-clipboard; API surface designed for future HL7/FHIR integration |
| "What if Deepgram/Claude goes down?" | Graceful degradation — manual note writing still works; audio can be re-uploaded later |
| "Who accessed what when?" | Complete audit trail for every PHI access, exportable for compliance review |
| "What about data retention?" | Configurable auto-deletion policy, manual purge capability |

---

## What We Build Today

Starting now, in this session, we execute:

1. **Phase 0** — Full project foundation (build system, configs, Docker)
2. **Phase 1** — Knowledge Service (complete, tested implementation)
3. **Phase 2** — Database schema + API skeleton + middleware

This gives you a running server with the knowledge engine operational — the foundation everything else plugs into.
