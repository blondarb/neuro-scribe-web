# Neuro Scribe — Scoping & Milestones

**Version:** 0.1 (Draft)
**Date:** 2026-02-11

---

## Overview

Five milestones, building incrementally. Each milestone produces a usable artifact that can be tested with real physicians. QA gates at every milestone boundary.

## Milestone Map

```
M1: Audio + Transcript ──→ M2: Note Generation ──→ M3: Knowledge Integration
         (4 weeks)              (4 weeks)                 (3 weeks)
                                                              │
                                                              ▼
                               M5: Compliance ←── M4: Workflow
                                 (3 weeks)          (3 weeks)
```

**Total estimated scope:** 17 weeks (assumes 1 developer + AI-assisted development)

---

## Milestone 1: Audio Capture + Transcript (Weeks 1-4)

**Deliverable:** Browser-based recording → accurate medical transcript

### Week 1: Audio Foundation
- [ ] Project scaffolding (repo structure, CI, linting, test framework)
- [ ] Web Audio API capture with MediaRecorder
- [ ] Audio format handling (WebM/Opus → PCM conversion if needed)
- [ ] Basic recording UI (start/stop/pause, audio level meter)
- [ ] File upload fallback (.wav, .mp3, .m4a)

**QA gate:** Audio captures correctly in Chrome + Safari; file upload works

### Week 2: Speech-to-Text Integration
- [ ] STT provider integration (Deepgram Nova-2 or Whisper)
- [ ] Streaming transcription via WebSocket
- [ ] Medical vocabulary boost list (500 neuro terms from plans)
- [ ] Speaker diarization (physician vs. patient)
- [ ] Transcript segment model (timestamped, speaker-labeled)

**QA gate:** ≥95% accuracy on general speech; ≥90% on neuro terms

### Week 3: Transcript Review UI
- [ ] Transcript display with speaker labels and timestamps
- [ ] Inline editing of transcript text
- [ ] Speaker label correction UI
- [ ] Confidence highlighting (low-confidence segments flagged)
- [ ] Keyboard shortcuts for efficient review

**QA gate:** Physician can review and correct a 15-min transcript in <3 minutes

### Week 4: Polish + Testing
- [ ] End-to-end audio → transcript flow testing
- [ ] Neuro vocabulary accuracy testing (200-term test suite)
- [ ] Performance testing (latency, memory usage)
- [ ] Error handling (mic permission denied, network loss, STT failure)
- [ ] M1 QA test suite execution (SMK + regression)

**QA gate:** All M1 test cases pass. Physician pilot feedback collected.

---

## Milestone 2: Note Generation (Weeks 5-8)

**Deliverable:** Transcript → structured SOAP note with neuro exam

### Week 5: Section Extraction
- [ ] Claude API integration with structured output
- [ ] Prompt engineering: transcript → section identification
- [ ] SOAP section extraction (Subjective, Objective, Assessment, Plan)
- [ ] Neuro exam subsection parsing (CN, motor, sensory, reflexes, coordination, gait)
- [ ] Confidence scoring per section

**QA gate:** Sections correctly identified in ≥85% of test transcripts

### Week 6: Note Assembly
- [ ] Note template system (SOAP, H&P, Progress Note)
- [ ] Section content generation from transcript segments
- [ ] Medication mention extraction and normalization
- [ ] ICD-10 suggestion from assessment text
- [ ] Draft note data model

**QA gate:** Generated notes are clinically coherent for ≥80% of test cases

### Week 7: Note Editor UI
- [ ] Section-by-section note display
- [ ] Accept/reject/edit per section
- [ ] Rich text editing within sections
- [ ] Side-by-side transcript ↔ note view
- [ ] Copy-to-clipboard (formatted for EHR paste)

**QA gate:** Physician can review and finalize a note in <5 minutes

### Week 8: Integration + Testing
- [ ] Full pipeline: audio → transcript → review → note → copy
- [ ] Note accuracy testing (physician review of 20+ generated notes)
- [ ] Edge cases (short encounters, multiple problems, unclear audio)
- [ ] Performance optimization (note generation <30s)
- [ ] M2 QA test suite execution

**QA gate:** All M2 test cases pass. Note accuracy ≥85% (physician-judged).

---

## Milestone 3: Knowledge Integration (Weeks 9-11)

**Deliverable:** Notes enriched with Neuro Plans knowledge base

### Week 9: Plan Matching
- [ ] Diagnosis keyword extraction from assessment section
- [ ] Plan lookup engine (keyword + ICD-10 matching against plans.json)
- [ ] Plan suggestion UI (matched plans shown alongside note)
- [ ] One-click plan reference insertion into note
- [ ] Differential diagnosis suggestions from matched plans

**QA gate:** Correct plan matched for ≥90% of common diagnoses

### Week 10: Medication Intelligence
- [ ] Medication extraction from transcript + note
- [ ] Cross-reference with medications.json (dose validation)
- [ ] Dosing discrepancy alerts (dictated vs. recommended)
- [ ] Drug interaction awareness (basic, from plan contraindications)
- [ ] Medication reconciliation summary section

**QA gate:** 100% of mentioned medications correctly identified; dose alerts accurate

### Week 11: Evidence + Polish
- [ ] Evidence citation attachment from plan references
- [ ] Workup recommendation suggestions (labs/imaging from plans)
- [ ] Monitoring recommendations from plans
- [ ] Knowledge integration QA testing
- [ ] M3 QA test suite execution

**QA gate:** All M3 test cases pass. Knowledge suggestions rated "helpful" by physician ≥80%.

---

## Milestone 4: Workflow Integration (Weeks 12-14)

**Deliverable:** Production-ready workflow for daily clinical use

### Week 12: Encounter Management
- [ ] Encounter list view (date, patient identifier, status)
- [ ] Encounter states: recording → transcribed → drafted → reviewed → finalized
- [ ] Encounter search and filtering
- [ ] Previous encounter reference for follow-up visits
- [ ] Draft auto-save and recovery

**QA gate:** Encounter lifecycle works end-to-end; no data loss on browser close

### Week 13: Personalization
- [ ] Physician preference settings (note format, default sections)
- [ ] Template customization (add/remove/reorder sections)
- [ ] Specialty-specific defaults (e.g., epilepsy clinic vs. general neuro)
- [ ] Quick phrases / macro system
- [ ] PWA manifest + service worker for mobile capture

**QA gate:** Preferences persist across sessions; PWA installable on mobile

### Week 14: Workflow Testing
- [ ] Full-day simulation (20 encounters across visit types)
- [ ] Mobile audio capture → desktop note generation flow
- [ ] Multi-device testing (phone capture, laptop review)
- [ ] Performance under load (concurrent encounters)
- [ ] M4 QA test suite execution

**QA gate:** All M4 test cases pass. Physician completes 20-encounter day using tool.

---

## Milestone 5: Compliance & Scale (Weeks 15-17)

**Deliverable:** HIPAA-ready deployment for pilot group

### Week 15: Security Hardening
- [ ] Authentication system (OAuth 2.0 / OIDC)
- [ ] Role-based access control
- [ ] Session management (timeout, refresh tokens)
- [ ] Input validation and sanitization
- [ ] Security audit (OWASP top 10 review)

**QA gate:** Auth flows work; no PHI exposure in any logs or error messages

### Week 16: Compliance
- [ ] Audit logging (all PHI access tracked)
- [ ] Data retention policy implementation (auto-delete)
- [ ] BAA documentation for all third-party services
- [ ] Encryption verification (at rest + in transit)
- [ ] HIPAA technical safeguard checklist completion

**QA gate:** All HIPAA technical safeguards verified; audit log complete

### Week 17: Pilot Preparation
- [ ] Deployment pipeline (staging → production)
- [ ] Monitoring and alerting setup
- [ ] Pilot physician onboarding documentation
- [ ] Feedback collection mechanism
- [ ] Launch readiness review
- [ ] M5 QA test suite execution

**QA gate:** All M5 test cases pass. System ready for pilot with 3-5 physicians.

---

## Risk Register

| Risk | Milestone | Likelihood | Mitigation |
|------|-----------|-----------|------------|
| STT accuracy on neuro terms | M1 | High | Custom vocabulary; post-processing corrections; physician review |
| Note generation hallucination | M2 | Medium | Knowledge grounding; confidence scores; physician approval |
| Slow note generation | M2 | Medium | Model selection (Haiku for extraction, Sonnet for reasoning); caching |
| PHI in logs/errors | M5 | Medium | Log sanitization from day 1; automated scanning |
| Low physician adoption | M4 | Medium | Minimize clicks; mobile capture; quick copy-paste |
| Cost per encounter too high | M2 | Low | Token optimization; batching; model routing |

## Decision Log

| Date | Decision | Rationale | Status |
|------|----------|-----------|--------|
| 2026-02-11 | Start with SOAP note type | Most common outpatient format; simplest structure | Proposed |
| 2026-02-11 | Browser-first (not native app) | Fastest to build; leverages existing web skills | Proposed |
| 2026-02-11 | Claude API for note generation | Best clinical reasoning; BAA available | Proposed |
| | STT provider selection | Deepgram vs. Whisper vs. Google | Pending |
| | Frontend framework | React vs. Vanilla JS vs. Svelte | Pending |
| | Hosting provider | AWS vs. GCP vs. Lightweight | Pending |
