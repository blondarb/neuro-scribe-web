# Neuro Scribe — Product Requirements Document

**Version:** 0.2
**Date:** 2026-03-01
**Status:** Active Development
**Owner:** blondarb

---

## 1. Problem Statement

Neurologists spend 2-3 hours per day on clinical documentation. Existing EHR templates are rigid, specialty-generic, and produce notes that are lengthy but clinically imprecise. Existing AI scribing solutions (Abridge, Nuance DAX, Suki) offer generic ambient transcription but lack neurology-specific understanding—they don't recognize neurological exam patterns, haven't internalized the clinical reasoning frameworks that neurology uses, and can't validate findings against specialty-specific knowledge. The gap between what a neurologist thinks during an encounter and what ends up in the chart is significant — resulting in:

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
|----|-----------|----|-------------|
| M1-01 | Browser-based audio capture | P0 | Records encounter audio in Chrome/Safari with <100ms latency |
| M1-02 | Real-time speech-to-text (Deepgram Nova-3 Medical) | P0 | Transcription accuracy ≥97% for medical English speech (3.44% WER baseline for medical domain) |
| M1-03 | Medical vocabulary recognition | P0 | Correctly transcribes 100 custom neurology keyterms sourced from plans.json + medications.json (e.g., "fasciculations", "proprioception", "Babinski") |
| M1-04 | Speaker diarization (Deepgram native) | P1 | Deepgram's built-in diarization distinguishes physician from patient with ≥90% accuracy |
| M1-05 | Audio file upload (fallback) | P1 | Accepts .wav/.mp3/.m4a files for async processing |
| M1-06 | Transcript review UI | P0 | Physician can view, edit, and correct transcript before note generation |
| M1-07 | No PHI in logs | P0 | Transcripts never written to application logs; audit trail for access |
| M1-08 | Real-time streaming transcription via WebSocket | P0 | Live transcription during encounter using Deepgram WebSocket API (not batch) |
| M1-09 | Audio capture via offscreen document pattern | P0 | Chrome extension MV3 compatibility: audio captured via offscreen document for background processing |

### Milestone 2: Note Generation (MVP-1)

**Goal:** Transform transcript into structured clinical note

| ID | Requirement | Priority | Acceptance Criteria |
|----|-----------|----|-------------|
| M2-01 | SOAP note generation | P0 | Generates Subjective/Objective/Assessment/Plan from transcript |
| M2-02 | Neuro exam extraction | P0 | Correctly identifies and structures cranial nerves, motor, sensory, reflexes, coordination, gait |
| M2-03 | Medication reconciliation | P1 | Cross-references mentioned medications against medications.json for dosing accuracy |
| M2-04 | Assessment generation | P0 | Produces problem-oriented assessment with differential considerations |
| M2-05 | Plan suggestions | P1 | Links to relevant Neuro Plans templates based on identified diagnoses |
| M2-06 | Note editing UI | P0 | Rich-text editor with section-level accept/reject/edit |
| M2-07 | ICD-10 suggestion | P1 | Suggests ICD-10 codes from existing plan mappings |
| M2-08 | Multiple note types | P2 | Supports H&P, Progress Note, Consult Note, Procedure Note |
| M2-09 | Confidence scoring per note section | P1 | Visual confidence indicators (green/yellow/red) for each generated section |
| M2-10 | Section-level accept/reject/edit with inline controls | P0 | Inline buttons for each section: accept, edit, or regenerate |

### Milestone 3: Knowledge Integration (MVP-2)

**Goal:** Deep integration with Neuro Plans knowledge base

| ID | Requirement | Priority | Acceptance Criteria |
|----|-----------|----|-------------|
| M3-01 | Plan-aware suggestions | P0 | When "new onset seizure" is discussed, surfaces the seizure management plan |
| M3-02 | Workup recommendations | P1 | Suggests labs/imaging from relevant plans if not already mentioned |
| M3-03 | Medication dosing validation | P1 | Flags if dictated dose differs from plan-recommended dose by >20% |
| M3-04 | Evidence citations | P2 | Attaches PubMed references from plans to assessment/plan sections |
| M3-05 | Differential generation | P1 | Uses plan differentials to suggest items the physician may not have mentioned |
| M3-06 | Clinical scale integration | P1 | NIHSS, MOCA, MMSE scoring panels with auto-calculation from transcribed values |
| M3-07 | Medication dosing validation against medications.json | P1 | Cross-checks dictated dosing against structured medication database for contraindications and interactions |

### Milestone 4: Workflow Integration

**Goal:** Fit into real clinical workflows

| ID | Requirement | Priority | Acceptance Criteria |
|----|-----------|----|-------------|
| M4-01 | Copy-to-clipboard | P0 | One-click formatted note copy for EHR paste |
| M4-02 | Template customization | P1 | Physician can set preferred note structure/sections |
| M4-03 | Encounter history | P1 | Previous encounter notes accessible for follow-up visits |
| M4-04 | Batch mode | P2 | Process multiple encounters (end-of-day catch-up) |
| M4-05 | Mobile capture | P1 | PWA-based audio capture on phone, note generation on desktop |

### Milestone 5: Compliance & Scale

| ID | Requirement | Priority | Acceptance Criteria |
|----|-----------|----|-------------|
| M5-01 | BAA with cloud providers | P0 | Signed BAAs for all PHI-handling services |
| M5-02 | Audit logging | P0 | All note access/edits logged with timestamp and user |
| M5-03 | Data retention policy | P0 | Configurable retention; auto-delete after defined period |
| M5-04 | Multi-user support | P1 | Separate accounts with role-based access |
| M5-05 | Usage analytics | P2 | De-identified metrics: notes/day, edit rate, time saved |

### Milestone 1.5: Chart Prep Mode

**Goal:** Enable pre-visit documentation and structured encounter prep

| ID | Requirement | Priority | Acceptance Criteria |
|----|-----------|----|-------------|
| CP-01 | Pre-visit dictation with short clip recording | P1 | Physician can record chief complaint, HPI, brief context before encounter |
| CP-02 | AI-powered categorization | P1 | Auto-categorizes prep notes into: imaging, labs, referral, history, medications, general |
| CP-03 | Visual distinction from ambient mode | P1 | Chart prep UI uses red/warm theme; ambient mode uses blue/teal theme |
| CP-04 | Chart prep → ambient merge logic | P1 | Seamlessly merges pre-visit prep data into ambient encounter transcription |
| CP-05 | Previous encounter summary auto-load | P2 | Automatically loads and displays prior visit note for quick reference |

### Milestone 4.5: Chrome Extension Deployment

**Goal:** Deliver Neuro Scribe as a Chrome extension for physician desktop workflows

| ID | Requirement | Priority | Acceptance Criteria |
|----|-----------|----|-------------|
| CE-01 | Chrome Web Store deployment (unlisted) | P0 | Published to Chrome Web Store, restricted to Sevaro physician accounts only |
| CE-02 | Side panel UI with recording, transcript, note editing | P0 | Chrome side panel shows live recording button, real-time transcript, and note editor |
| CE-03 | Offscreen document for audio capture + Deepgram WebSocket | P0 | Background audio processing via MV3-compliant offscreen document; WebSocket streaming to Deepgram |
| CE-04 | Floating widget option for minimal UI during encounters | P2 | Optional floating widget mode: minimal UI footprint, recording indicator only |
| CE-05 | Content script for text insertion into EHR fields | P2 | Injects generated notes directly into EHR (Epic, Cerner, Athena) text fields |

## 6. Out of Scope (v1)

- Direct EHR integration beyond copy-paste is out of scope for v1; SMART on FHIR planned for v2
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
| WebSocket disconnection during encounter | Medium | High | Auto-reconnect with transcript continuity; user notification |
| Speaker diarization errors | Medium | Medium | Manual correction UI + learning feedback loop |

## 9. Dependencies

| Component | Specification | Notes |
|-----------|---------------|-------|
| **Speech-to-Text** | Deepgram Nova-3 Medical (streaming WebSocket, BAA required) | 3.44% WER for medical domain; real-time streaming for live encounters |
| **LLM** | Claude API (Sonnet 4.5 for note generation, Haiku for extraction/categorization) | Note generation via Sonnet; fast extraction tasks via Haiku |
| **Hosting** | Supabase Edge Functions (note generation proxy), Chrome extension (client-side audio) | Server-side: note generation and plan lookups; client-side: audio capture and streaming |
| **Knowledge Base** | plans.json, medications.json (existing Neuro Plans database) | 147 clinical plans, 936 medications, 12K+ items |
| **Audio Capture** | Web Audio API / MediaRecorder API (browser), offscreen document pattern (Chrome extension) | MV3-compliant background processing |

## 10. Open Questions

- [RESOLVED] Which speech-to-text provider best handles neurology vocabulary? → **Deepgram Nova-3 Medical** (3.44% WER, medical-optimized)
- [RESOLVED] Should audio be processed client-side or server-side? → **Server-side streaming via WebSocket** (accuracy + ephemeral; no persistent storage)
- [RESOLVED] What's the minimum viable note type for pilot? → **SOAP note** (Subjective/Objective/Assessment/Plan)
- [ ] Who are the pilot physicians? How many encounters for validation?
- [ ] EHR target for eventual integration (Epic, Cerner, Athena)?
- [ ] Chrome Web Store review timeline? Expected approval window?
- [ ] Deepgram BAA timeline? Corporate BAA coverage for HIPAA compliance?

## 11. Competitive Positioning

Neuroscribe differentiates through specialty-specific intelligence. While competitors like Abridge ($500-750/mo), Nuance DAX ($500-1000/mo), and Suki ($300-500/mo) offer generic ambient scribing, none provide neurology-native features. The 147 clinical plans, 936 medications, and structured neurological exam templates give Neuroscribe a vertical advantage at a competitive price point (~$120-165/mo at cost). Physicians benefit from:

- Neurology-specific exam patterns and terminology
- Integrated clinical decision support from Neuro Plans
- Medication validation against specialty-specific databases
- Confidence scoring to highlight uncertain sections for review
- Chrome extension deployment for desktop-centric workflows

## 12. Deployment Strategy

Neuro Scribe will be delivered through three phases:

**Phase 1: Native macOS App** (Current)
- Validates core transcription + note generation
- Desktop audio capture via Web Audio API
- Local testing with pilot neurologists
- Iterates on clinical accuracy before extension release

**Phase 2: Chrome Extension** (Q2 2026)
- Builds on sevaro-scribe foundation
- Adds Deepgram Nova-3 Medical streaming via WebSocket
- Integrates neurology-specific features (Milestone 1.5 — Chart Prep, Milestone 3 — Knowledge Integration)
- Side panel UI for recording, transcript review, note editing
- Deployed to Chrome Web Store (unlisted, Sevaro physicians only)

**Phase 3: Web App** (Q4 2026+)
- Standalone web deployment (no extension required)
- Multi-tenant architecture with physician accounts and clinic orgs
- SMART on FHIR integration for direct EHR connectivity
- Broader market distribution beyond Sevaro
