# Neuro Scribe

AI-powered clinical documentation assistant for neurology.

Listens to patient encounters, understands neurological terminology and exam patterns, and generates structured clinical notes — powered by the [Neuro Plans](https://github.com/blondarb/neuro-plans) knowledge base (147 clinical plans, 936 medications).

## Status

**Phase:** Backend complete — Deepgram STT, Claude note generation, encounter CRUD, 95 tests passing

## Quick Start

```bash
# 1. First-time setup (installs deps, syncs KB, creates .env)
make setup

# 2. Edit .env with your API keys
#    Required: DEEPGRAM_API_KEY, ANTHROPIC_API_KEY, JWT_SECRET, ENCRYPTION_KEY

# 3. Start PostgreSQL
make db-up

# 4. Run database migrations
make db-migrate

# 5. Start development server
make dev

# 6. Generate a dev JWT and test
make token
curl http://localhost:3000/health
```

### Docker (Full Stack)

```bash
# Provide API keys via environment
export DEEPGRAM_API_KEY=your-key-here
export ANTHROPIC_API_KEY=your-key-here
docker compose -f docker/docker-compose.yml up --build
```

## What's Built

| Component | Status | Description |
|-----------|--------|-------------|
| Knowledge Service | **Working** | Plan matching (147 plans), medication lookup (936 meds), dose validation, ICD-10 suggestions |
| Transcription (Deepgram) | **Working** | Nova-2 Medical model, file upload + streaming, neurology vocab boost, speaker diarization |
| Note Generation (Claude) | **Working** | 3-step pipeline: section extraction → knowledge enrichment → note assembly |
| Encounter CRUD | **Working** | 7 endpoints: create, list, get, transcribe, generate, edit, finalize |
| API Server | **Working** | Express + helmet + CORS + rate limiting, health check with DB status |
| Auth Middleware | **Working** | JWT verification (dev: HMAC secret, prod: JWKS/OIDC), role-based access |
| Audit Logging | **Working** | Dual write: structured logger + database audit table |
| PHI Guard | **Working** | Error sanitization, PHI pattern detection |
| Encryption | **Working** | AES-256-GCM for PHI at rest |
| Database | **Working** | Drizzle ORM, PostgreSQL, encrypted PHI columns, full operations layer |
| Config Validation | **Working** | Zod-validated startup config, fail-fast on bad env |
| Rate Limiting | **Working** | 100/min general, 10/min for transcription/generation |
| Frontend | Not started | Audio capture, transcript review, note editor |

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | No | Service + DB health check |
| POST | `/api/encounters` | Yes | Create encounter |
| GET | `/api/encounters` | Yes | List encounters (paginated) |
| GET | `/api/encounters/:id` | Yes | Get encounter + transcript + note |
| POST | `/api/encounters/:id/transcribe` | Yes | Upload audio for STT |
| POST | `/api/encounters/:id/generate` | Yes | Generate clinical note from transcript |
| PATCH | `/api/encounters/:id/note` | Yes | Edit note sections |
| POST | `/api/encounters/:id/finalize` | Yes | Finalize note (read-only) |
| GET | `/api/knowledge/plans` | Yes | Search clinical plans |
| GET | `/api/knowledge/medications/:name` | Yes | Medication lookup |
| POST | `/api/knowledge/medications/validate-dose` | Yes | Dose validation |
| POST | `/api/knowledge/icd10` | Yes | ICD-10 suggestions |

## Project Structure

```
├── src/
│   ├── api/
│   │   ├── server.ts              # Entry point (config validation, graceful shutdown)
│   │   ├── routes/
│   │   │   ├── health.ts          # Health check with DB status
│   │   │   ├── knowledge.ts       # Plan/medication/ICD-10 routes
│   │   │   └── encounters.ts      # Full encounter lifecycle
│   │   ├── middleware/
│   │   │   ├── auth.ts            # JWT + JWKS authentication
│   │   │   ├── audit.ts           # PHI access logging (logger + DB)
│   │   │   ├── phi-guard.ts       # Error response sanitization
│   │   │   └── rate-limit.ts      # Rate limiting (general + heavy)
│   │   └── validation.ts          # Zod request schemas
│   ├── services/
│   │   ├── knowledge/             # Plan matching, med lookup, ICD-10
│   │   ├── transcription/
│   │   │   ├── deepgram.ts        # Deepgram Nova-2 Medical provider
│   │   │   └── factory.ts         # Singleton factory
│   │   └── generation/
│   │       ├── claude.ts          # Multi-step note generation pipeline
│   │       └── factory.ts         # Singleton factory
│   ├── db/
│   │   ├── schema.ts              # Drizzle ORM tables
│   │   ├── client.ts              # Connection pool + health check
│   │   └── operations.ts          # CRUD with PHI encryption
│   └── shared/
│       ├── types.ts               # 26 domain interfaces
│       ├── config.ts              # Zod-validated env config
│       ├── encryption.ts          # AES-256-GCM
│       └── logger.ts              # PHI-safe structured logger
├── tests/                         # 95 tests (unit + integration)
├── prompts/                       # LLM prompt templates
├── data/                          # plans.json + medications.json (synced)
├── docker/                        # Dockerfile + docker-compose
├── scripts/                       # dev-token, seed, sync, phi-scan
└── .github/workflows/ci.yml       # Lint, test, security
```

## Configuration

Copy `.env.example` to `.env` and fill in:

| Variable | Required | Description |
|----------|----------|-------------|
| `DEEPGRAM_API_KEY` | Yes | Deepgram API key (BAA required for PHI) |
| `ANTHROPIC_API_KEY` | Yes | Claude API key (BAA required for PHI) |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | ≥16 char signing secret (dev mode) |
| `ENCRYPTION_KEY` | Yes | 64-char hex AES-256 key |
| `AUTH_JWKS_URI` | Prod | OIDC JWKS endpoint (Auth0, Cognito, Okta) |

Generate an encryption key: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

## Before Production: BAA Checklist

| Vendor | Service | BAA Status |
|--------|---------|-----------|
| Anthropic | Claude API (note generation) | **Required** |
| Deepgram | Nova-2 Medical (transcription) | **Required** |
| Auth provider | OAuth 2.0 authentication | **Required** |
| Cloud hosting | AWS/GCP infrastructure | **Required** |

No real patient data until ALL BAAs are signed. Development uses synthetic data only.

## Docs

- [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) — Complete build roadmap
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) — Deployment guide for engineers
- [docs/SECURITY.md](docs/SECURITY.md) — HIPAA technical safeguard mapping
- [PRD.md](PRD.md) — Product requirements with acceptance criteria
- [ARCHITECTURE.md](ARCHITECTURE.md) — System architecture and security

## License

Private — not open source.
