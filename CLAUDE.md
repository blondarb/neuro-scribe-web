# Neuro Scribe — Claude Code Instructions

AI-powered clinical documentation assistant for neurology.

## Project Structure

```
neuro-scribe/
├── CLAUDE.md              # This file — AI dev instructions
├── PRD.md                 # Product requirements
├── ARCHITECTURE.md        # System architecture
├── SCOPING.md             # Milestones and timeline
├── qa/                    # QA framework
│   ├── TEST_STRATEGY.md   # QA approach and coverage
│   └── TEST_CASES.yaml    # Structured test cases
├── src/                   # Application source (TBD)
│   ├── client/            # Frontend (audio capture, note editor)
│   ├── api/               # API layer
│   ├── services/          # Transcription, note generation, knowledge
│   └── shared/            # Shared types, utilities
├── prompts/               # LLM prompt templates
│   ├── section-extract.md # Transcript → sections
│   ├── note-generate.md   # Sections → clinical note
│   ├── exam-structure.md  # Neuro exam parsing
│   └── plan-match.md      # Diagnosis → plan matching
└── tests/                 # Test suites
    ├── fixtures/          # Sample transcripts, expected notes
    ├── unit/              # Unit tests
    ├── integration/       # Service integration tests
    └── e2e/               # End-to-end tests
```

## Key Files

| File | Purpose |
|------|---------|
| `PRD.md` | Product requirements with acceptance criteria |
| `ARCHITECTURE.md` | System design, data flow, security |
| `SCOPING.md` | Milestone breakdown with weekly deliverables |
| `qa/TEST_STRATEGY.md` | QA approach, coverage targets, automation plan |
| `qa/TEST_CASES.yaml` | Structured test cases by milestone |
| `prompts/` | LLM prompt templates (version-controlled) |

## Knowledge Base Integration

This project builds on top of Neuro Plans data:

| Source | Location | Usage |
|--------|----------|-------|
| Clinical plans | [neuro-plans](https://github.com/blondarb/neuro-plans) `docs/data/plans.json` | Plan matching, differential suggestions |
| Medications | [neuro-plans](https://github.com/blondarb/neuro-plans) `docs/data/medications.json` | Dose validation, drug identification |
| ICD-10 codes | Plan frontmatter | Code suggestions from diagnoses |
| Evidence | Plan evidence sections | Citation attachment to notes |

**Never duplicate this data.** Sync from the canonical source in [neuro-plans](https://github.com/blondarb/neuro-plans) `docs/data/`.

## Development Conventions

### Prompts
- All LLM prompts live in `prompts/` as markdown files
- Version control prompts — every change is a commit
- Include test cases in prompt files as `<!-- TEST: ... -->` comments
- Prompt naming: `{task}-{version}.md` (e.g., `section-extract-v2.md`)

### Code
- TypeScript for all application code (strict mode)
- No `any` types — use proper interfaces
- PHI handling: never log, never cache in plaintext, never include in error messages
- All API endpoints require authentication (no public endpoints except health check)
- Test coverage target: 80% for services, 60% for UI

### Security (Non-Negotiable)
- **No PHI in logs** — sanitize all log output
- **No PHI in error messages** — generic errors to client, detailed errors to audit log only
- **No PHI in URLs** — use POST bodies, never query strings
- **Ephemeral audio** — audio data exists only during processing, never persisted
- **Encrypted at rest** — all stored data (notes, transcripts, encounter metadata)
- **Audit everything** — every PHI access logged with user, timestamp, action

### Git
- Feature branches off `main`
- Branch naming: `feature/<milestone>/<description>` (e.g., `feature/m1/audio-capture`)
- Commit messages: `M1: Add audio capture component` (prefix with milestone)
- PR required for merge to main
- QA test suite must pass before merge

## Commands

```bash
# Development (once scaffolded)
npm run dev              # Start development server
npm run test             # Run test suite
npm run test:unit        # Unit tests only
npm run test:e2e         # End-to-end tests
npm run lint             # Lint + type check
npm run build            # Production build

# Prompt testing
npm run prompt:test      # Run prompt test cases
npm run prompt:eval      # Evaluate prompt quality metrics

# Knowledge base
npm run kb:sync          # Sync plans.json + medications.json
npm run kb:index         # Rebuild knowledge index

# QA
npm run qa:smoke         # Smoke tests
npm run qa:regression    # Full regression suite
npm run qa:security      # Security scan
```

## Milestone Workflow

For each milestone:
1. Read `SCOPING.md` for week-by-week deliverables
2. Check `qa/TEST_CASES.yaml` for acceptance criteria
3. Implement features with tests
4. Run QA test suite for that milestone
5. All tests pass → milestone complete

## Open Decisions

Track in `SCOPING.md` Decision Log. Key pending:
- [ ] STT provider (Deepgram vs. Whisper)
- [ ] Frontend framework
- [ ] Hosting provider
- [ ] Auth provider

## Quality Targets

| Metric | Target |
|--------|--------|
| Test coverage (services) | ≥80% |
| Test coverage (UI) | ≥60% |
| Note accuracy (physician-judged) | ≥90% |
| Neuro term transcription accuracy | ≥95% |
| Note generation latency | <30s |
| Zero PHI in logs | 100% |

## Body of Work

**Status**: Legacy

### Recent
- Migrated AI backend to AWS Bedrock (replaced OpenAI)
- Deprecated Deepgram service in favor of Bedrock pipeline
- Added strategic synthesis doc for Bedrock architecture
- Initial commit with PRD, architecture, scoping, QA framework, and prompt templates

### In Progress
- None — development paused after Bedrock migration

### Planned
- Open decisions remain: frontend framework, hosting, auth provider (see SCOPING.md)
- May be superseded by neuro-scribe-personal (native Mac app) for production use

### Known Issues
- STT provider not decided (Deepgram vs Whisper vs AWS Transcribe)
- No implementation beyond planning docs and AI backend migration
