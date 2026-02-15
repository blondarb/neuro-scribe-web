# Neuro Scribe — QA Strategy

**Version:** 0.1
**Date:** 2026-02-11

---

## Philosophy

QA is built into every milestone, not bolted on at the end. Every feature ships with tests. Every milestone has a QA gate. No code merges without passing tests.

### QA Principles

1. **Test at the boundary** — Focus on inputs/outputs, not implementation details
2. **Clinical accuracy is testable** — Build a corpus of annotated transcripts with expected outputs
3. **Security is testable** — PHI leak detection is automated, not manual
4. **Real-world data** — Test with actual neurology encounter patterns, not synthetic happy-path data
5. **Physician validation** — AI-generated clinical content requires human clinical review

## Test Pyramid

```
         ┌─────────┐
         │  E2E    │  5-10 critical flows
         │ Tests   │  (record → note → copy)
         ├─────────┤
         │ Integ.  │  20-30 service integration tests
         │ Tests   │  (STT → generation → knowledge)
         ├─────────┤
         │  Unit   │  100+ unit tests
         │  Tests  │  (parsers, formatters, validators)
         └─────────┘
```

### Coverage Targets

| Layer | Target | Focus |
|-------|--------|-------|
| Unit | ≥80% | Parsers, formatters, data models, validators |
| Integration | Key paths | STT integration, LLM calls, knowledge lookups |
| E2E | Critical flows | Full encounter → note pipeline |
| Security | 100% of PHI paths | No PHI in logs, errors, URLs, or analytics |

## Test Categories

### 1. Transcription Accuracy (TA-*)

**Purpose:** Validate speech-to-text quality for neurology content

**Approach:**
- Maintain a corpus of audio samples with ground-truth transcripts
- Automated Word Error Rate (WER) measurement
- Neuro vocabulary accuracy measured separately from general accuracy

**Test fixtures needed:**
- 20+ audio samples covering common encounter types
- Ground-truth transcripts with speaker labels
- Neurology term list (500 terms) with expected transcriptions

| ID | Test | Pass Criteria |
|----|------|---------------|
| TA-01 | General speech WER | ≤5% word error rate |
| TA-02 | Neurology term accuracy | ≥95% of 200 core terms correct |
| TA-03 | Medication name accuracy | ≥98% of top 100 neuro medications correct |
| TA-04 | Speaker diarization | ≥90% speaker labels correct |
| TA-05 | Background noise handling | WER ≤10% with moderate clinic noise |
| TA-06 | Accented speech | WER ≤8% across 3 accent profiles |

### 2. Note Generation Quality (NG-*)

**Purpose:** Validate AI-generated notes are clinically accurate and complete

**Approach:**
- Annotated transcript corpus with expected note sections
- Automated section-presence checks
- Physician review scoring (1-5 per section)

| ID | Test | Pass Criteria |
|----|------|---------------|
| NG-01 | Section identification | All SOAP sections present when relevant data exists |
| NG-02 | Neuro exam completeness | All mentioned exam components structured correctly |
| NG-03 | Medication extraction | 100% of mentioned medications captured |
| NG-04 | No hallucinated findings | 0 findings in note that weren't in transcript |
| NG-05 | Assessment accuracy | Diagnosis matches transcript intent ≥90% |
| NG-06 | Plan completeness | All discussed plan items captured |
| NG-07 | ICD-10 accuracy | Suggested code matches assessment ≥85% |
| NG-08 | Note formatting | Consistent structure, no formatting artifacts |

### 3. Knowledge Integration (KI-*)

**Purpose:** Validate correct matching between encounters and Neuro Plans knowledge base

| ID | Test | Pass Criteria |
|----|------|---------------|
| KI-01 | Plan matching (common dx) | Correct plan for top 20 diagnoses |
| KI-02 | Plan matching (uncommon dx) | Correct plan for 10 rare diagnoses |
| KI-03 | Medication dose validation | Flags dose discrepancy when present |
| KI-04 | No false dose alerts | No alerts when dose matches plan |
| KI-05 | Differential suggestions | Relevant differentials from plan data |
| KI-06 | Evidence attachment | Correct citations from matched plan |

### 4. Security & Compliance (SC-*)

**Purpose:** Verify PHI protection and HIPAA compliance

**Approach:** Automated scanning + manual review

| ID | Test | Pass Criteria |
|----|------|---------------|
| SC-01 | No PHI in application logs | Scan all log outputs for PHI patterns |
| SC-02 | No PHI in error messages | Error responses contain only generic messages |
| SC-03 | No PHI in URLs | All PHI transmitted via POST body only |
| SC-04 | Audio ephemeral | Audio not persisted after transcription |
| SC-05 | Encryption at rest | Database encryption verified |
| SC-06 | Encryption in transit | TLS 1.2+ on all connections |
| SC-07 | Session timeout | Idle sessions expire after 15 minutes |
| SC-08 | Auth required | All API endpoints return 401 without valid token |
| SC-09 | Audit log completeness | All PHI access events logged |
| SC-10 | Role-based access | Users can only access their own encounters |

### 5. UI/UX (UX-*)

**Purpose:** Validate usability for clinical workflow

| ID | Test | Pass Criteria |
|----|------|---------------|
| UX-01 | Recording start/stop | One-click start, clear visual state |
| UX-02 | Transcript review speed | 15-min encounter reviewable in <3 min |
| UX-03 | Note edit workflow | Section accept/reject in <5 clicks per section |
| UX-04 | Copy to clipboard | One click, formatted correctly for EHR paste |
| UX-05 | Mobile recording | PWA capture works on iOS Safari + Android Chrome |
| UX-06 | Keyboard navigation | Full workflow accessible via keyboard |
| UX-07 | Error recovery | Clear messaging on mic failure, network loss, etc. |

### 6. Performance (PF-*)

**Purpose:** Validate acceptable latency and resource usage

| ID | Test | Pass Criteria |
|----|------|---------------|
| PF-01 | Transcription latency | <2s behind real-time for streaming |
| PF-02 | Note generation time | <30s for 15-minute encounter |
| PF-03 | Knowledge lookup time | <500ms for plan matching |
| PF-04 | UI responsiveness | <100ms for user interactions |
| PF-05 | Memory usage | <512MB browser memory during recording |
| PF-06 | Concurrent encounters | System handles 10 simultaneous users |

## Milestone QA Gates

Each milestone requires passing its QA gate before proceeding.

| Milestone | Required Tests | Gate Criteria |
|-----------|---------------|---------------|
| M1 | TA-01 through TA-06, UX-01, PF-01, PF-05 | All pass |
| M2 | NG-01 through NG-08, UX-02 through UX-04, PF-02 | All pass |
| M3 | KI-01 through KI-06 | All pass |
| M4 | UX-05 through UX-07, PF-04, PF-06 | All pass |
| M5 | SC-01 through SC-10 | All pass, zero exceptions |

## Test Infrastructure

### Automated Testing
- **Framework:** Vitest (unit + integration) + Playwright (E2E)
- **CI:** Run on every PR; block merge on failure
- **Coverage:** Track via Istanbul; report in PR comments
- **PHI scanning:** Custom lint rule that flags potential PHI patterns in logs/errors

### Clinical Accuracy Testing
- **Corpus:** 50+ annotated encounters (built incrementally per milestone)
- **Scoring:** Physician rates each note section 1-5
- **Threshold:** Average ≥4.0 across all sections
- **Regression:** New model/prompt versions must meet or exceed previous scores

### Fixture Management
```
tests/fixtures/
├── audio/                    # Sample audio files (synthetic, no real PHI)
│   ├── seizure-consult.wav
│   ├── headache-followup.wav
│   └── ...
├── transcripts/              # Ground-truth transcripts
│   ├── seizure-consult.json
│   └── ...
├── notes/                    # Expected note outputs
│   ├── seizure-consult-soap.json
│   └── ...
└── knowledge/                # Test plan/medication data
    ├── plans-subset.json
    └── meds-subset.json
```

**Important:** Test fixtures must NEVER contain real PHI. All test data is synthetic.

## Reporting

- **Per-PR:** Test results in PR comment (pass/fail + coverage delta)
- **Per-Milestone:** Full QA report with physician scores, accuracy metrics, security scan
- **Dashboard (future):** Track accuracy, latency, and physician satisfaction over time
