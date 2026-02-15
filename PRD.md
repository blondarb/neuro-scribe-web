# Neuro Scribe — Product Requirements Document

**Version:** 0.1 (Draft)
**Date:** 2026-02-11
**Status:** Scoping
**Owner:** blondarb

---

## 1. Problem Statement

Neurologists spend 2-3 hours per day on clinical documentation. Existing EHR templates are rigid, specialty-generic, and produce notes that are lengthy but clinically imprecise. The gap between what a neurologist thinks during an encounter and what ends up in the chart is significant — resulting in:

- Incomplete documentation of neurological exams
- Missed billing opportunities (unlocked CPT complexity)
- Cognitive fatigue that compounds across a clinic day
- Notes that don't communicate the clinical reasoning to consultants

## 2. Product Vision

**Neuro Scribe** is an AI-powered clinical documentation assistant purpose-built for neurology. It listens to patient encounters, understands neurological terminology and exam patterns, and generates structured clinical notes — leveraging the 147 existing Neuro Plans clinical decision support templates as a knowledge backbone.

### Core Value Proposition

> A neurologist finishes a patient encounter and has a complete, accurate, specialty-specific note ready for review — not a generic transcript, but a structured clinical document that reflects how neurologists actually think and document.

## 3. Target User

**Primary:** Outpatient neurologists (general neurology + subspecialty)
**Secondary:** Neurology residents, APPs (NPs/PAs) in neurology clinics
**Tertiary:** Inpatient neurology consult services

## 4. Product Principles

1. **Clinical accuracy over speed** — A wrong note fast is worse than no note
2. **Neurology-native** — Understands the neuro exam, not just general medicine
3. **Physician-in-the-loop** — AI drafts, physician approves. Never auto-submit
4. **Privacy by design** — HIPAA compliant from day one, not bolted on
5. **Leverage the knowledge base** — 147 plans, 936 medications, 12K+ clinical items

## 5. Requirements by Milestone

### Milestone 1: Audio Capture + Transcript (MVP-0)

**Goal:** Reliable ambient audio capture → accurate medical transcript

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| M1-01 | Browser-based audio capture | P0 | Records encounter audio in Chrome/Safari with <100ms latency |
| M1-02 | Real-time speech-to-text | P0 | Transcription accuracy ≥95% for general English speech |
| M1-03 | Medical vocabulary recognition | P0 | Correctly transcribes top 200 neurology terms (e.g., "fasciculations", "proprioception", "Babinski") |
| M1-04 | Speaker diarization | P1 | Distinguishes physician from patient with ≥90% accuracy |
| M1-05 | Audio file upload (fallback) | P1 | Accepts .wav/.mp3/.m4a files for async processing |
| M1-06 | Transcript review UI | P0 | Physician can view, edit, and correct transcript before note generation |
| M1-07 | No PHI in logs | P0 | Transcripts never written to application logs; audit trail for access |

### Milestone 2: Note Generation (MVP-1)

**Goal:** Transform transcript into structured clinical note

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| M2-01 | SOAP note generation | P0 | Generates Subjective/Objective/Assessment/Plan from transcript |
| M2-02 | Neuro exam extraction | P0 | Correctly identifies and structures cranial nerves, motor, sensory, reflexes, coordination, gait |
| M2-03 | Medication reconciliation | P1 | Cross-references mentioned medications against medications.json for dosing accuracy |
| M2-04 | Assessment generation | P0 | Produces problem-oriented assessment with differential considerations |
| M2-05 | Plan suggestions | P1 | Links to relevant Neuro Plans templates based on identified diagnoses |
| M2-06 | Note editing UI | P0 | Rich-text editor with section-level accept/reject/edit |
| M2-07 | ICD-10 suggestion | P1 | Suggests ICD-10 codes from existing plan mappings |
| M2-08 | Multiple note types | P2 | Supports H&P, Progress Note, Consult Note, Procedure Note |

### Milestone 3: Knowledge Integration (MVP-2)

**Goal:** Deep integration with Neuro Plans knowledge base

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| M3-01 | Plan-aware suggestions | P0 | When "new onset seizure" is discussed, surfaces the seizure management plan |
| M3-02 | Workup recommendations | P1 | Suggests labs/imaging from relevant plans if not already mentioned |
| M3-03 | Medication dosing validation | P1 | Flags if dictated dose differs from plan-recommended dose by >20% |
| M3-04 | Evidence citations | P2 | Attaches PubMed references from plans to assessment/plan sections |
| M3-05 | Differential generation | P1 | Uses plan differentials to suggest items the physician may not have mentioned |

### Milestone 4: Workflow Integration

**Goal:** Fit into real clinical workflows

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| M4-01 | Copy-to-clipboard | P0 | One-click formatted note copy for EHR paste |
| M4-02 | Template customization | P1 | Physician can set preferred note structure/sections |
| M4-03 | Encounter history | P1 | Previous encounter notes accessible for follow-up visits |
| M4-04 | Batch mode | P2 | Process multiple encounters (end-of-day catch-up) |
| M4-05 | Mobile capture | P1 | PWA-based audio capture on phone, note generation on desktop |

### Milestone 5: Compliance & Scale

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| M5-01 | BAA with cloud providers | P0 | Signed BAAs for all PHI-handling services |
| M5-02 | Audit logging | P0 | All note access/edits logged with timestamp and user |
| M5-03 | Data retention policy | P0 | Configurable retention; auto-delete after defined period |
| M5-04 | Multi-user support | P1 | Separate accounts with role-based access |
| M5-05 | Usage analytics | P2 | De-identified metrics: notes/day, edit rate, time saved |

## 6. Out of Scope (v1)

- Direct EHR integration (HL7/FHIR) — copy-paste is the v1 workflow
- Billing/coding automation beyond ICD-10 suggestions
- Real-time translation / multilingual support
- Patient-facing features
- On-premise deployment

## 7. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Note accuracy | ≥90% sections correct without edit | Physician edit rate tracking |
| Time saved per note | ≥50% reduction vs. manual | Self-reported + time tracking |
| Neuro exam completeness | ≥95% of exam elements captured | Automated section analysis |
| Medication accuracy | 100% of mentioned meds correctly identified | Cross-reference with medications.json |
| Physician satisfaction | ≥4/5 rating | Post-encounter survey |

## 8. Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Transcription errors in medical terms | High | High | Fine-tuned medical vocabulary; physician review step |
| HIPAA breach via audio storage | Medium | Critical | Ephemeral processing; no persistent audio; BAAs |
| Low adoption due to workflow friction | Medium | High | PWA mobile capture; one-click copy; minimal clicks |
| AI hallucination in clinical content | Medium | Critical | Knowledge-base grounding; never auto-submit; confidence scoring |
| Cost per note too high | Medium | Medium | Optimize model calls; cache plan lookups; batch processing |

## 9. Dependencies

- **Neuro Plans knowledge base** — plans.json, medications.json (existing)
- **Speech-to-text API** — Whisper, Deepgram, or Google Cloud Speech
- **LLM API** — Claude API for note generation and clinical reasoning
- **HIPAA-compliant hosting** — AWS (with BAA) or GCP Healthcare API
- **Audio capture** — Web Audio API / MediaRecorder API

## 10. Open Questions

- [ ] Which speech-to-text provider best handles neurology vocabulary?
- [ ] Should audio be processed client-side (privacy) or server-side (accuracy)?
- [ ] What's the minimum viable note type for pilot? (SOAP vs. H&P vs. Progress Note)
- [ ] Who are the pilot physicians? How many encounters for validation?
- [ ] EHR target for eventual integration (Epic, Cerner, Athena)?
