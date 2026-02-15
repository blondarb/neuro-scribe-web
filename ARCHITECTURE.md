# Neuro Scribe — Architecture

**Version:** 0.1 (Draft)
**Date:** 2026-02-11

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser/PWA)                      │
│                                                                   │
│  ┌──────────┐  ┌──────────────┐  ┌───────────┐  ┌────────────┐ │
│  │  Audio    │  │  Transcript  │  │   Note    │  │  Encounter │ │
│  │  Capture  │──│  Review      │──│  Editor   │  │  History   │ │
│  └──────────┘  └──────────────┘  └───────────┘  └────────────┘ │
│       │                                    │                      │
└───────┼────────────────────────────────────┼──────────────────────┘
        │                                    │
        ▼                                    ▼
┌───────────────────────────────────────────────────────────────────┐
│                         API GATEWAY (HTTPS)                       │
│                     (Auth / Rate Limit / Audit)                   │
└───────┬───────────────────────────────────┬───────────────────────┘
        │                                   │
        ▼                                   ▼
┌───────────────────┐            ┌──────────────────────┐
│  TRANSCRIPTION    │            │  NOTE GENERATION     │
│  SERVICE          │            │  SERVICE             │
│                   │            │                      │
│  Audio → Text     │            │  Transcript → Note   │
│  Speaker ID       │            │  Plan matching       │
│  Med term boost   │            │  Med reconciliation  │
│                   │            │  ICD-10 mapping      │
└───────────────────┘            └──────────┬───────────┘
                                            │
                                            ▼
                                 ┌──────────────────────┐
                                 │  KNOWLEDGE SERVICE    │
                                 │                      │
                                 │  plans.json lookup   │
                                 │  medications.json    │
                                 │  Evidence citations  │
                                 │  Differential lists  │
                                 └──────────────────────┘
```

## Components

### 1. Audio Capture (Client-Side)

**Technology:** Web Audio API + MediaRecorder API
**Responsibility:** Capture encounter audio in the browser

```
Microphone → MediaRecorder → WebSocket/chunked upload → Transcription Service
```

- **Format:** WebM/Opus (browser-native) or PCM 16kHz (for STT compatibility)
- **Streaming:** Real-time via WebSocket for live transcription; fallback to chunked upload
- **Privacy:** Audio chunks are ephemeral — streamed to transcription, never persisted on client or server
- **Fallback:** File upload (.wav/.mp3/.m4a) for pre-recorded encounters

**Key decisions:**
- Client-side VAD (Voice Activity Detection) to reduce bandwidth and cost
- No local audio storage — chunks stream and are discarded
- Configurable sample rate (16kHz default, 8kHz for bandwidth-constrained)

### 2. Transcription Service

**Technology:** Deepgram Nova-2 Medical (primary) or Whisper large-v3 (fallback)
**Responsibility:** Audio → timestamped, speaker-labeled transcript

**Pipeline:**
```
Audio stream
  → Speech-to-text (with medical vocabulary boost)
  → Speaker diarization (physician vs. patient)
  → Punctuation + formatting
  → Timestamped transcript segments
```

**Medical vocabulary handling:**
- Custom vocabulary list: top 500 neurology terms sourced from existing plans
- Boost list dynamically updated from medications.json (drug names)
- Post-processing corrections for commonly misheard terms (e.g., "Keppra" vs. "Kepra")

**Output schema:**
```json
{
  "transcript_id": "uuid",
  "segments": [
    {
      "speaker": "physician",
      "start": 0.0,
      "end": 3.2,
      "text": "So your seizures started about two weeks ago?",
      "confidence": 0.97
    }
  ],
  "duration_seconds": 840,
  "word_count": 1250
}
```

### 3. Note Generation Service

**Technology:** Claude API (Opus or Sonnet depending on complexity)
**Responsibility:** Transcript → structured clinical note

**Pipeline:**
```
Transcript
  → Section extraction (HPI, exam, assessment, plan)
  → Knowledge base enrichment (plan matching, med lookup)
  → Note assembly (template-based)
  → Confidence scoring per section
  → Draft note
```

**Prompt architecture:**
- **System prompt:** Neurology-specific note generation instructions, formatting rules
- **Context injection:** Relevant plan(s) from plans.json based on detected diagnoses
- **Medication context:** Dosing data from medications.json for mentioned drugs
- **Transcript:** Full or summarized transcript as primary input

**Model selection logic:**
| Task | Model | Rationale |
|------|-------|-----------|
| Section extraction | Haiku | Fast, structured output |
| Neuro exam structuring | Sonnet | Needs clinical precision |
| Assessment + Plan | Sonnet/Opus | Complex clinical reasoning |
| ICD-10 suggestion | Haiku | Lookup + simple matching |

**Output schema:**
```json
{
  "note_id": "uuid",
  "note_type": "SOAP",
  "sections": {
    "subjective": {
      "content": "...",
      "confidence": 0.92,
      "sources": ["transcript:0-120"]
    },
    "objective": {
      "neuro_exam": {
        "mental_status": "...",
        "cranial_nerves": "...",
        "motor": "...",
        "sensory": "...",
        "reflexes": "...",
        "coordination": "...",
        "gait": "..."
      },
      "confidence": 0.88
    },
    "assessment": {
      "problems": [
        {
          "diagnosis": "New onset seizure",
          "icd10": "R56.9",
          "differential": ["..."],
          "plan_match": "new-onset-seizure"
        }
      ]
    },
    "plan": {
      "items": ["..."],
      "medications": ["..."],
      "workup": ["..."],
      "follow_up": "..."
    }
  },
  "suggested_plans": ["new-onset-seizure", "epilepsy-management"],
  "medications_mentioned": [
    {"name": "levetiracetam", "dose_mentioned": "500mg BID", "db_match": true}
  ]
}
```

### 4. Knowledge Service

**Technology:** In-memory lookup + optional vector search
**Responsibility:** Bridge between AI generation and existing Neuro Plans data

**Data sources:**
- `plans.json` — 147 plans, indexed by diagnosis keywords and ICD-10 codes
- `medications.json` — 936 medications with dosing contexts
- Plan differentials, evidence citations, monitoring recommendations

**Lookup methods:**
1. **Keyword match** — Direct ICD-10 or diagnosis text match against plan index
2. **Semantic search** (future) — Embed plan summaries for fuzzy matching
3. **Medication lookup** — Exact match on drug name/brand name from medications.json

**API:**
```
GET /knowledge/plans?diagnosis=seizure     → matched plans
GET /knowledge/medications?name=keppra     → medication data
GET /knowledge/icd10?code=G40.909         → plan + differential
```

### 5. Client Application

**Technology:** Single-page app (React or vanilla JS + Web Components, TBD)
**Responsibility:** Audio capture, transcript review, note editing, encounter management

**Views:**
1. **Capture** — Start/stop recording, live transcript preview
2. **Transcript Review** — Edit transcript, correct speaker labels, flag errors
3. **Note Editor** — Section-by-section review, accept/reject/edit per section
4. **Encounter List** — History of encounters with status (draft, reviewed, finalized)
5. **Settings** — Preferred note format, specialty preferences, template customization

## Data Flow

```
1. Physician starts encounter recording
2. Audio streams via WebSocket to Transcription Service
3. Real-time transcript segments returned to client
4. Physician ends recording
5. Full transcript presented for review
6. Physician approves transcript → triggers Note Generation
7. Note Generation Service:
   a. Extracts clinical sections from transcript
   b. Queries Knowledge Service for matching plans
   c. Cross-references medications
   d. Assembles structured note with confidence scores
8. Draft note presented in Note Editor
9. Physician reviews, edits, approves
10. Final note available for copy-to-clipboard / export
```

## Security & Compliance

### PHI Handling

| Component | PHI Exposure | Protection |
|-----------|-------------|------------|
| Client (browser) | Audio in memory, transcript, notes | HTTPS only; no local storage of audio; session-scoped |
| API Gateway | Request metadata | TLS 1.3; no PHI in URLs or logs |
| Transcription Service | Audio stream | Ephemeral processing; BAA with provider; no retention |
| Note Generation | Transcript text | Claude API with BAA; zero-retention policy |
| Knowledge Service | None (no PHI in plans data) | Read-only static data |
| Database | Notes, transcripts, encounter metadata | Encrypted at rest (AES-256); encrypted in transit |

### Authentication & Authorization

- **Auth:** OAuth 2.0 / OIDC (provider TBD — Auth0, Cognito, or Clerk)
- **Sessions:** Short-lived JWTs (15 min access, 7-day refresh)
- **Roles:** `physician` (full access), `admin` (user management), `readonly` (review only)
- **Audit:** Every PHI access logged with user, timestamp, action, resource

### HIPAA Technical Safeguards

- [ ] Encryption at rest for all PHI (AES-256)
- [ ] Encryption in transit (TLS 1.3)
- [ ] Access controls (role-based, least privilege)
- [ ] Audit logging (immutable, tamper-evident)
- [ ] Automatic session timeout (15 minutes idle)
- [ ] BAAs with all subprocessors (STT provider, LLM provider, hosting)
- [ ] No PHI in application logs, error messages, or analytics
- [ ] Data retention policy with automated deletion

## Infrastructure

### Option A: AWS (Recommended)

```
CloudFront (CDN) → ALB → ECS Fargate (API + Services)
                                    ↓
                              RDS PostgreSQL (encrypted)
                              S3 (temporary audio staging)
```

- **Compute:** ECS Fargate (serverless containers)
- **Database:** RDS PostgreSQL with encryption
- **Audio staging:** S3 with lifecycle policy (auto-delete after processing)
- **Secrets:** AWS Secrets Manager
- **Monitoring:** CloudWatch + CloudTrail for audit

### Option B: Lightweight (Early Development)

```
Vercel/Cloudflare (static client)
  → Cloudflare Workers or Railway (API)
    → Supabase PostgreSQL (data)
    → Direct API calls to STT + Claude
```

Suitable for MVP/pilot with <10 users. Migrate to Option A before PHI handling.

## Cost Estimates (Per Encounter)

| Component | Cost/Encounter | Assumptions |
|-----------|---------------|-------------|
| Speech-to-text | $0.02-0.05 | 15 min encounter, Deepgram Nova-2 |
| Note generation (LLM) | $0.05-0.15 | ~4K input tokens, ~2K output, Sonnet |
| Knowledge lookup | ~$0 | In-memory, no external API |
| Infrastructure | $0.01-0.02 | Amortized compute + storage |
| **Total** | **$0.08-0.22** | **Per encounter** |

At 20 encounters/day = $1.60-4.40/day = **$35-95/month per physician**

## Technology Decisions (Pending)

| Decision | Options | Leaning | Notes |
|----------|---------|---------|-------|
| STT provider | Deepgram / Whisper / Google | Deepgram | Best medical vocabulary; BAA available |
| LLM provider | Claude API | Claude | BAA available; best clinical reasoning |
| Frontend framework | React / Vanilla JS / Svelte | TBD | Depends on team preference |
| Database | PostgreSQL / SQLite | PostgreSQL | Needed for multi-user |
| Hosting | AWS / GCP / Lightweight | Lightweight→AWS | Start simple, migrate for HIPAA |
| Auth | Auth0 / Cognito / Clerk | TBD | Need HIPAA-compliant option |
