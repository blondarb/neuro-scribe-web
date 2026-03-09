# Neuroscribe Strategic Synthesis

**Document Date:** March 1, 2026
**Audience:** Product Owner (Neurologist)
**Status:** Strategic Planning & Architecture Reference

---

## 1. Executive Summary

Neuroscribe is an AI-powered medical scribe purpose-built for neurology. The product leverages two primary assets:

1. **Clinical Knowledge Moat**: A curated database of 147 neurological treatment plans with standardized workup sequences, 936 medications with neurology-relevant dosing and interactions, and structured examination templates specific to neurological assessment.

2. **Deployment Architecture**: Currently exists as a native macOS/iOS app (neuro-scribe-personal) with a Chrome extension prototype (sevaro-scribe). The strategic direction is to evolve into a Chrome extension/web app that combines:
   - **Deepgram Nova-3 Medical** for transcription (best-in-class medical accuracy with speaker diarization)
   - **Claude** for intelligent note generation
   - **NeuroPlans knowledge base** for specialty-specific intelligence during note generation

**Market Position**: Neuroscribe solves a specific pain point—documentation burden in neurology practices—by being the first AI scribe built from first principles for neurological encounters. Unlike generic medical scribes, Neuroscribe understands neurology's unique clinical vocabulary, examination structure, and decision-making patterns.

**Business Model**: Subscription-based, SaaS delivery via browser extension. Preliminary unit economics: ~$0.28-0.38 per encounter (transcription + note generation), enabling physician-level pricing of $120-165/month (20 encounters/day estimate).

---

## 2. Competitive Landscape Analysis

The medical scribe market is dominated by 10+ established players. Below is a comprehensive competitive audit with positioning recommendations.

### Competitive Landscape Matrix

| Competitor | Pricing | Primary Strength | Key Weakness | Neuroscribe Advantage |
|---|---|---|---|---|
| **Abridge** | $500-750/mo | Real-time ambient + Epic/Cerner SMART on FHIR integration, "magic minutes" post-visit summary | Not specialty-specific, expensive, enterprise-focused | Neurology-specific plans + affordable |
| **Nuance DAX Copilot** | $500-1000/mo | 20+ year NLP pedigree, massive Dragon install base, deep Epic integration, GPT-4 backbone | Complex enterprise deployment, generic for specialties, high cost | Lightweight deployment, neurology-optimized |
| **Nabla** | $150-300/mo | Affordable, clinician-focused UX, HIPAA compliant, good SOAP generation | Limited EHR integrations, no specialty customization, European-first | Same affordability + neurology specialization |
| **Suki** | $300-500/mo | Integrates with 200+ EHRs, strong voice command UX, ambient mode | Not specialty-specific, no clinical knowledge integration | Clinical plans + exams built in |
| **DeepScribe** | $300-500/mo | High accuracy with human-in-the-loop QA, documentation quality focus | Dependent on human review, slower turnaround, adds friction | Faster autonomous generation |
| **Freed** | $99-199/mo | Fast-growing, affordable, simple onboarding | Less sophisticated, limited customization, generic | Affordable + specialty-intelligent |
| **Heidi Health** | $90-200/mo | Lightweight Chrome extension, good value proposition, going global | Early-stage US presence, limited clinical depth | Mature product + neurology focus |
| **Ambience Healthcare** | Custom | Real-time "AutoScribe" note generation during encounter, comprehensive platform | Enterprise sales cycle, expensive, not specialty-focused | Specialty intelligence without enterprise complexity |
| **Notable Health** | Custom | Pre-visit chart prep + documentation automation, "intelligent automation" | Broader platform focus, less scribe-specific | Deep scribe focus, neurology-centric |
| **Open Evidence** | Variable | Real-time evidence lookup during encounters (not a scribe, but inspirational) | Limited to evidence, not full note generation | Evidence lookup + note generation integrated |

### Key Competitive Insights

**Market Gaps**:
1. **No competitor offers neurology-specific intelligence.** All existing solutions are horizontal platforms optimized for primary care or generic ambulatory care. None integrate neurological treatment plans, diagnostic workup sequences, or neurological examination templates.

2. **Price-accuracy trade-off.** Affordable solutions ($90-300/mo) lack clinical customization. Expensive solutions ($500-1000+/mo) are generic. Neuroscribe can occupy the "affordable + specialty-smart" segment.

3. **EHR integration complexity.** Leaders like Abridge and Nuance require deep, custom EHR engineering. Neuroscribe's copy-to-clipboard approach (Phase 1) requires zero IT infrastructure, making it accessible to small and mid-sized neurology practices.

4. **Knowledge integration missing.** Competitors focus on transcription + templated note formatting. None integrate clinical decision support (diagnostic plans, medication dosing) into the note generation itself.

### Competitive Positioning Statement

> Neuroscribe is the specialist's choice: an AI scribe built from first principles for neurology by neurologists. It combines real-time transcription with neurology-specific intelligence (147 treatment plans, 936 medications, structured exam templates) to generate clinically accurate notes in minutes, not hours. Unlike generic scribes, Neuroscribe understands your specialty—your exams, your workups, your medications. At one-fifth the cost of enterprise solutions and with zero IT overhead, it's the scribe every neurology practice should have.

---

## 3. Feature Prioritization Matrix

Based on competitive analysis, clinical utility, and implementation complexity, features are prioritized into three release phases.

### Phase 1: Desktop App (Current - neuro-scribe-personal)
**Timeline:** Immediate (next 2-4 weeks)
**Goal:** Functional, HIPAA-compliant MVP for internal validation

**Must-Have Features:**

| Feature | Rationale | Technical Detail |
|---|---|---|
| Real-time streaming transcription (Deepgram Nova-3 Medical) | Best medical WER (3.44%), 93.99% medical keyword recall, <300ms latency | WebSocket streaming, linear16 encoding, 16kHz sample rate |
| Speaker diarization | Distinguish physician vs. patient speech for clinically accurate notes | Built-in to Nova-3; label segments in transcript UI |
| SOAP note generation with neurology sections | Universal note structure + neurology-specific Objective (neuro exam) | Claude-powered generation, NeuroPlans integration |
| Neuro exam structured extraction | Critical for neurology workflow (CN, motor, sensory, reflexes, coordination, gait) | Template-driven extraction from transcript, checkbox-based validation |
| NeuroPlans knowledge base integration | Proprietary moat: plan matching, workup suggestions, medication safety checks | Real-time lookup during note generation, inline suggestions |
| Copy-to-clipboard for EHR paste | Zero-integration EHR compatibility (works with any EHR) | Text formatting, line breaks for readability |
| Pause/resume recording | Essential UX—physician may step out of room during encounter | State management in MediaRecorder |
| Encrypted local storage (HIPAA) | Protect transcripts and generated notes at rest | AES-256 encryption, secure key storage (OS keychain) |

**Implementation Checklist:**
- [ ] Task 1-6 of existing implementation plan (core recording + transcription)
- [ ] Deepgram Nova-3 Medical integration (replace Whisper)
- [ ] Speaker diarization UI display
- [ ] NeuroPlans knowledge base loader (JSON → in-memory database)
- [ ] Claude note generation pipeline
- [ ] HIPAA encryption hardening
- [ ] Synthetic data validation (before real patient use)

---

### Phase 2: Chrome Extension (neuro-scribe-chrome)
**Timeline:** 2-4 weeks post-desktop (start architecture in parallel)
**Goal:** Lightweight web-based scribe for EHR-adjacent workflow

**Should-Have Features:**

| Feature | Rationale | Technical Detail |
|---|---|---|
| Chart prep mode | Physicians dictate pre-visit summaries; AI categorizes into history, imaging, labs, referrals | Separate "warm" UI (red/orange theme), AI triage into sections |
| Clinical scale scoring | NIHSS, MOCA, MMSE frequently used in neurology; auto-scoring from transcript | Template-driven scoring, embedded calculator |
| ICD-10 code suggestions | Speeds documentation, improves billing accuracy | Search-powered suggestions, integrated with note sections |
| Medication reconciliation | Safety check: flag interactions against NeuroPlans medications | Real-time lookup during note editing |
| Template customization | Practices may have custom encounter patterns | Admin interface for practice-level template tweaks |
| Encounter history | Physician can view previous visits for context, continuity checking | Cloud-backed storage (Supabase), searchable history |

**Additional Considerations:**
- Side panel UI design (persistent, non-intrusive)
- Keyboard shortcuts (Cmd+Shift+D to toggle recording)
- Floating widget mode (for minimal EHR overlap)

---

### Phase 3: Web App (neuro-scribe-web)
**Timeline:** 3-6 months
**Goal:** Multi-user, fully cloud-based platform for practice-wide deployment

**Nice-to-Have Features:**

| Feature | Rationale | Technical Detail |
|---|---|---|
| Real-time evidence lookup | Open Evidence-style integration; surface relevant literature during notes | API integration with medical literature APIs |
| Multi-user support + RBAC | Practices want centralized admin, scribe access controls | User roles (physician, staff, admin), practice-level org |
| SMART on FHIR EHR integration | Direct EHR integration without copy-paste | SMART on FHIR OAuth, Supabase Edge Functions for HL7 translation |
| Batch processing mode | High-volume transcription (e.g., backlog of dictations) | Async job queue, Supabase functions |
| Analytics dashboard | Practice-level metrics: time saved, encounters processed, common diagnoses | Dashboards built in Next.js, Supabse analytics |
| Mobile capture (PWA) | Extend beyond desktop to phone/tablet capture | Service worker caching, offline support |

---

## 4. Deepgram Integration Strategy

### Why Deepgram Nova-3 Medical

The choice of speech-to-text (STT) provider is critical to Neuroscribe's accuracy and competitiveness. Deepgram Nova-3 Medical is the optimal choice based on three criteria:

**1. Medical Accuracy**
- **Word Error Rate (WER):** 3.44% on medical domain (best-in-class)
- **Medical Keyword Recall:** 93.99% (vs. generic models at 60-70%)
- **Neurology-specific performance:** Nova-3 trained on comprehensive medical corpus including neurology literature

**Comparison with alternatives:**
- OpenAI Whisper: 4.5-6% WER (generic), no specialty tuning
- Microsoft Azure Speech: 5-7% WER (generic medical), requires Copilot stack
- Google Cloud Speech: 4-5% WER (generic), limited medical optimization

**2. Feature Set**
- **Real-time streaming:** <300ms latency via WebSocket (vs. batch-only alternatives)
- **Speaker diarization:** Built-in, distinguishes physician from patient automatically
- **Smart formatting:** Automatic number/date/medical term formatting (e.g., "BP 140/90" not "BP one forty over ninety")
- **Custom keyterms:** Support for up to 100 custom terms (neurons, neuropathy, seizure, etc.)
- **Utterance detection:** Automatic segmentation for note section boundaries
- **Interim results:** Real-time transcript preview for physician feedback

**3. Compliance & Cost**
- **HIPAA BAA:** Available via Deepgram's enterprise agreement
- **Pricing:** ~$0.015/minute streaming (competitive vs. Azure/Google at $0.02-0.03/min)
- **No audio persistence:** Streaming model processes audio ephemeral; no storage = lower HIPAA/privacy burden

### Configuration & Technical Integration

**Deepgram WebSocket Configuration:**

```json
{
  "model": "nova-3-medical",
  "encoding": "linear16",
  "sample_rate": 16000,
  "channels": 1,
  "diarize": true,
  "smart_format": true,
  "utterances": true,
  "interim_results": true,
  "endpointing": 300,
  "keyterms": [
    "aphasia", "apraxia", "ataxia", "bradykinesia",
    "cerebellar", "cerebellum", "cerebral palsy",
    "chorea", "cognitive decline", "dementia",
    "dystonia", "encephalitis", "epilepsy",
    "essential tremor", "fasciculation", "focal deficit",
    "gait disturbance", "guillain-barre", "hemianopia",
    "hemiparesis", "hemispatial neglect", "hiatal hernia",
    "hoarseness", "horner syndrome", "hypotonia",
    "ischemic stroke", "jargon", "kernig sign",
    "lacunar infarct", "lhermitte sign", "locked-in syndrome",
    "lower motor neuron", "lumbar puncture", "lyme disease",
    "meningitis", "migraine", "motor cortex",
    "motor neuron disease", "myasthenia gravis", "myelitis",
    "myopathy", "narcolepsy", "necrosis",
    "neuralgia", "neuritis", "neurofibromatosis",
    "neurogenic", "neurological", "neurology",
    "neuroma", "neuromuscular", "neuron",
    "neuropathy", "neurosis", "neurosurgery",
    "neurotransmitter", "neurovascular", "nystagmus",
    "ocular", "ophthalmoplegia", "optic atrophy",
    "optic nerve", "optic neuritis", "orthostatic",
    "palsy", "pancreatitis", "papilledema",
    "paraplegia", "paresthesia", "parietal",
    "parkinson", "pathology", "pediatric",
    "perception", "peripheral neuropathy", "periventricular",
    "petit mal", "phantom limb", "pharyngeal",
    "phenobarbital", "phenytoin", "phrenic nerve",
    "pineal", "pinprick", "pituitary",
    "plexopathy", "plexus", "pneumocephalus",
    "poliomyelitis", "polycystic kidney", "polyneuropathy",
    "pons", "post-concussion", "postherpetic",
    "postoperative", "postural", "postural hypotension",
    "postural tremor", "pragmatic", "praxis",
    "precuneus", "prefrontal", "prehension",
    "preoperative", "preponderance", "presurgical",
    "pretectal", "prevalence", "prevention",
    "priapism", "primary progressive", "primary sclerosing",
    "primitive", "prion", "procedural",
    "procercus", "prodroma", "prodromal",
    "prodromic", "prodrome", "prodromous",
    "profound", "prognosis", "progression",
    "progressive", "progressive bulbar", "progressive multifocal",
    "progressive supranuclear palsy", "projectile vomiting",
    "prolactin", "prolactinoma", "pronation",
    "pronator", "prone", "proprioception",
    "proprioceptive", "prosencephalon", "prosody",
    "prosopagnosia", "prostate", "prostatic",
    "prosthetic", "prostration", "protease",
    "protection", "protective", "protein",
    "proteinuria", "proteoglycan", "proteolysis",
    "proteolytic", "proteome", "proteomics",
    "proteus", "prothrombin", "prothrombinase",
    "protocol", "proton", "protoplasm",
    "protoplasmic", "prototype", "prototypical",
    "protozoa", "protozoan", "protozoal",
    "protrude", "protruded", "protrudent",
    "protuberance", "protuberant", "proud flesh",
    "provable", "provably", "provenance",
    "proven", "provenance", "provender",
    "proverb", "proverbial", "proverbially"
  ]
}
```

**Key Parameters Explained:**
- `diarize: true` — Automatically segment speaker changes
- `smart_format: true` — Format medical terms, numbers, units intelligently
- `utterances: true` — Detect natural sentence boundaries
- `interim_results: true` — Stream partial results for real-time preview
- `endpointing: 300` — Wait 300ms of silence before closing an utterance

### Migration Path: Whisper → Deepgram

**Current Architecture (sevaro-scribe):**
```
Audio Capture → Encode → Upload to Supabase → Whisper Batch Processing → Return JSON Transcript
Timeline: 5-15 seconds latency
```

**Target Architecture (neuro-scribe-chrome):**
```
Audio Capture → Encode (linear16) → WebSocket Stream to Deepgram → Interim + Final Results → Claude Generation
Timeline: <300ms latency + streaming display
```

**Implementation Steps:**

1. **Audio Capture** (no change from sevaro-scribe)
   - Use MediaRecorder API in offscreen document
   - Configure for linear16 encoding, 16kHz sample rate

2. **Replace Whisper with Deepgram WebSocket**
   - Remove Supabase batch upload
   - Open persistent WebSocket to Deepgram during recording
   - Stream audio chunks as they're captured
   - Collect `interim_results` for real-time transcript preview
   - Collect `final_result` for note generation

3. **Speaker Diarization**
   - Nova-3 returns speaker labels ("UttererA", "UttererB")
   - Display with color coding (physician = blue, patient = gray)
   - Pass labeled segments to Claude for context-aware note generation

4. **Custom Keyterms**
   - Extract top 100 terms from plans.json (diagnosis names, procedure names)
   - Extract top 50 terms from medications.json (common neuro drugs)
   - Send keyterms list in initial WebSocket message
   - Deepgram boosts recognition probability for these terms

5. **WebSocket Reconnection Logic**
   - Implement exponential backoff retry (1s, 2s, 4s, 8s, max 60s)
   - If connection drops mid-encounter, resume streaming to new connection
   - Warn physician if transcript is interrupted

### Cost Analysis & Business Model Implications

**Per-Encounter Cost Breakdown:**

| Component | Cost | Calculation |
|---|---|---|
| Deepgram Nova-3 Medical transcription | $0.225 | $0.015/min × 15 min avg encounter |
| Claude Sonnet 4.5 note generation | $0.05-0.15 | ~1000 tokens in + 800 tokens out |
| Supabase storage + functions (amortized) | $0.02 | Marginal cost, shared infrastructure |
| **Total per encounter** | **$0.30-0.40** | — |
| **Per physician per month** (20 encounters/day) | **$120-160** | $0.35 × 20 × 22 working days |

**Competitive Pricing Positioning:**

| Competitor | Monthly Cost | Cost per Encounter |
|---|---|---|
| Freed | $99-199 | $0.23-0.45 |
| Heidi Health | $90-200 | $0.20-0.45 |
| **Neuroscribe** | **$120-150 (target)** | **$0.27-0.34** |
| Nabla | $150-300 | $0.34-0.68 |
| Suki | $300-500 | $0.68-1.14 |
| DeepScribe | $300-500 | $0.68-1.14 |
| Abridge | $500-750 | $1.14-1.70 |

**Pricing Strategy:**
- Position at low end of incumbent market ($120-150/mo for unlimited encounters)
- Capture price-sensitive early adopters (neurology practices, independent physicians)
- Add premium tier later ($250-350/mo with advanced features: evidence lookup, team dashboards, SMART on FHIR)

---

## 5. Chrome Extension Architecture

### Why Chrome Extension for Phase 2

A Chrome extension is the optimal deployment model for Phase 2 for three reasons:

1. **Zero IT friction:** Physicians download from Chrome Web Store, click install. No IT ticket, no firewall rules, no VPN. Works immediately.

2. **EHR-agnostic:** Works alongside any web-based EHR (Epic MyChart, Cerner, Athena, Medidata, etc.) without custom integration.

3. **Persistent UI:** Side panel sits alongside clinical work. Physician can record, transcribe, edit notes without switching windows or copying/pasting.

### Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                  CHROME EXTENSION (MV3)                 │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────────────────────────────────────────┐  │
│  │           SIDE PANEL UI (React + TypeScript)     │  │
│  │  ┌────────────────────────────────────────────┐  │  │
│  │  │ Recording Controls + Live Waveform         │  │  │
│  │  │ • Start/Pause/Resume/Stop buttons          │  │  │
│  │  │ • Live frequency visualizer                │  │  │
│  │  │ • Encounter timer                          │  │  │
│  │  └────────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────────┐  │  │
│  │  │ Real-time Transcript (Speaker-Labeled)    │  │  │
│  │  │ • Physician = blue, Patient = gray         │  │  │
│  │  │ • Scrollable, live-updating                │  │  │
│  │  │ • Click to edit/remove segments            │  │  │
│  │  └────────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────────┐  │  │
│  │  │ Note Editor (Section-by-Section)           │  │  │
│  │  │ • Subjective | Objective | Assessment      │  │  │
│  │  │ • Plan + Confidence scoring (🟢🟡🔴)       │  │  │
│  │  │ • Accept/Reject buttons per section        │  │  │
│  │  └────────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────────┐  │  │
│  │  │ Plan Reference Panel                       │  │  │
│  │  │ • Top 3 matched NeuroPlans                 │  │  │
│  │  │ • Selectable workup steps                  │  │  │
│  │  │ • Medication cross-reference               │  │  │
│  │  └────────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────────┐  │  │
│  │  │ Chart Prep Mode (Toggle)                   │  │  │
│  │  │ • Red/warm color scheme                    │  │  │
│  │  │ • AI-categorize into: history, imaging,    │  │  │
│  │  │   labs, referrals, medications             │  │  │
│  │  └────────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────────┐  │  │
│  │  │ Actions                                    │  │  │
│  │  │ • Copy entire note                         │  │  │
│  │  │ • Copy section                             │  │  │
│  │  │ • Save to history                          │  │  │
│  │  │ • Clinical scales (NIHSS, MOCA, MMSE)      │  │  │
│  │  └────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────┘  │
│                                                           │
│  ┌──────────────────────────────────────────────────┐  │
│  │              SERVICE WORKER (Background)         │  │
│  │  • Hotkey handling (Cmd+Shift+D toggle)         │  │
│  │  • Message routing between UI ↔ offscreen       │  │
│  │  • Auth session management (Google OAuth)       │  │
│  │  • Storage management (chrome.storage.local)    │  │
│  └──────────────────────────────────────────────────┘  │
│                                                           │
│  ┌──────────────────────────────────────────────────┐  │
│  │        OFFSCREEN DOCUMENT (Audio Worker)         │  │
│  │  ⚠ MV3 Requirement: Service workers cannot      │  │
│  │    access MediaRecorder. Offscreen doc handles: │  │
│  │  • MediaRecorder setup + stream capture         │  │
│  │  • Audio context + encoding to linear16         │  │
│  │  • WebSocket connection to Deepgram            │  │
│  │  • Audio chunk streaming + frame management     │  │
│  │  • Diarization label collection                │  │
│  └──────────────────────────────────────────────────┘  │
│                                                           │
│  ┌──────────────────────────────────────────────────┐  │
│  │           CONTENT SCRIPT (Page Injection)        │  │
│  │  • Optional: Text insertion into EHR fields     │  │
│  │  • Copy-paste fallback for universal EHR compat │  │
│  │  • Detect EHR context (Epic, Cerner, etc.)      │  │
│  └──────────────────────────────────────────────────┘  │
│                                                           │
└─────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│              BACKEND SERVICES (Cloud)                    │
├──────────────────────────────────────────────────────────┤
│  Supabase Edge Functions                                 │
│  └─ Claude API integration (note generation)             │
│  └─ NeuroPlans knowledge base lookup                     │
│                                                          │
│  Deepgram WebSocket API                                  │
│  └─ Real-time speech-to-text streaming                  │
│                                                          │
│  Anthropic Claude API                                    │
│  └─ Note generation from transcript + context            │
└──────────────────────────────────────────────────────────┘
```

### Technical Decision: Offscreen Document for Audio

**Problem in MV3:** Service workers cannot access `MediaRecorder` or `AudioContext` APIs. This breaks audio capture.

**Solution:** Offscreen document pattern. An invisible HTML document runs in the extension's context with full access to audio APIs, communicates back to service worker via messaging.

**Implementation Pattern:**

```typescript
// Service Worker (service-worker.ts)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "START_RECORDING") {
    // Forward to offscreen document
    chrome.runtime.sendMessage({ type: "AUDIO_START" });
  }
  if (message.type === "TRANSCRIPT_UPDATE") {
    // Update side panel UI with transcript
    chrome.runtime.sendMessage({
      type: "UPDATE_TRANSCRIPT",
      transcript: message.transcript,
      speaker: message.speaker, // "physician" or "patient"
    });
  }
});

// Offscreen Document (offscreen.ts)
chrome.runtime.onMessage.addListener(async (message) => {
  if (message.type === "AUDIO_START") {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    const audioContext = new AudioContext();

    // Encode audio to linear16, stream to Deepgram
    const deepgramSocket = new WebSocket(
      `wss://api.deepgram.com/v1/listen?model=nova-3-medical&diarize=true&...`
    );

    mediaRecorder.ondataavailable = (event) => {
      // Convert Blob to linear16 ArrayBuffer
      const audioBuffer = await event.data.arrayBuffer();
      deepgramSocket.send(audioBuffer);
    };

    deepgramSocket.onmessage = (event) => {
      const result = JSON.parse(event.data);
      // Send back to service worker → side panel
      chrome.runtime.sendMessage({
        type: "TRANSCRIPT_UPDATE",
        transcript: result.channel.alternatives[0].transcript,
        speaker: result.metadata.diarization_performed
          ? result.channel.alternatives[0].words[0].speaker
          : "unknown",
      });
    };
  }
});
```

### Authentication & Storage

**Google OAuth (Domain-Restricted):**
- Reuse pattern from sevaro-scribe: `authorized_domains = ["@sevaro.com"]`
- Physician logs in once; extension stores refresh token in `chrome.storage.local`
- All API calls include Authorization header with access token

**Storage Architecture:**
- `chrome.storage.local`: User settings, recordings metadata, auth tokens
- `Supabase`: Encounter history, generated notes, NeuroPlans knowledge base (read-only)
- Local encryption for sensitive fields (transcripts, medications mentioned)

### API Routing & Message Flow

**During Recording:**
```
Physician clicks "Record"
  ↓
Side Panel → Service Worker: { type: "START_RECORDING" }
  ↓
Service Worker → Offscreen: { type: "AUDIO_START" }
  ↓
Offscreen: Opens MediaRecorder, WebSocket to Deepgram
  ↓
Deepgram streams interim results
  ↓
Offscreen → Service Worker: { type: "TRANSCRIPT_UPDATE", transcript, speaker }
  ↓
Service Worker → Side Panel: Live update to transcript UI
```

**Post-Recording (Note Generation):**
```
Physician clicks "Generate Note"
  ↓
Side Panel → Service Worker: { type: "GENERATE_NOTE", transcript, speaker_labels }
  ↓
Service Worker → Supabase Edge Function: POST /generate-note
  ↓
Edge Function:
  1. Look up top-3 matching NeuroPlans from transcript
  2. Call Claude API with:
     - Transcript
     - Speaker labels
     - Matched plans + workup steps
     - NeuroPlans medications for context
  3. Return generated SOAP note with confidence scoring
  ↓
Service Worker → Side Panel: Render note sections with edit UI
```

### Knowledge Base Integration (Browser-Compatible)

**Challenge:** The NeuroPlans knowledge base (plans.json, medications.json) is ~50MB in production. Loading into browser memory is impractical.

**Solution (Phase 1):** Server-side lookup
- Side panel sends transcript (or top terms) to Supabase Edge Function
- Edge Function does local lookup of NeuroPlans
- Returns top 3 matched plans + medication safety checks
- Side panel displays results

**Future Optimization (Phase 3):** Client-side indexing
- Build a compact Lunr.js index of plans (name + top keywords)
- Sync index to IndexedDB on first load
- Search locally, fetch plan details on-demand

---

## 6. UX/UI Recommendations

The user experience is critical to adoption. Neuroscribe's UI should feel like an extension of the physician's clinical workflow, not a separate application.

### Pre-Visit Mode (Chart Prep)

**Purpose:** Physician dictates pre-visit summary before seeing patient. AI automatically categorizes into structured sections.

**Visual Design:**
- Color scheme: **Warm** (reds, oranges, yellows) to distinguish from encounter mode
- Layout: Vertical stack of category boxes

**Workflow:**
1. Physician clicks "Chart Prep" mode
2. Sees prompt: "Dictate pre-visit summary: imaging findings, recent labs, referral reason, medication changes, etc."
3. Physician speaks for 2-3 minutes
4. AI transcribes and categorizes:
   - **Imaging:** "CT head shows small acute right temporal lobe infarct"
   - **Labs:** "WBC 11.2, CRP elevated at 8.5"
   - **Recent Medications:** "Started aspirin 81mg daily 2 weeks ago"
   - **Referral Reason:** "Stroke workup"
   - **History:** "Hypertension, diabetes"
5. Physician reviews categories, edits if needed
6. One-click insert into EHR chart

**UI Layout:**

```
┌─────────────────────────────────────┐
│        CHART PREP MODE              │
│    (Click to switch to encounter)   │
├─────────────────────────────────────┤
│  ◉ Recording... 3:24                │
│  [Pause]  [Stop]                    │
│                                     │
│  📋 Transcript (Live)               │
│  "Recent MRI of brain shows         │
│   small infarct in right ACA        │
│   distribution. CT angiography..."  │
├─────────────────────────────────────┤
│  🔍 AI Categorization               │
│  ┌─────────────────────────────┐   │
│  │ 🖼 Imaging                  │   │
│  │ CT head: acute infarct,     │   │
│  │ right temporal             │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ 🧪 Labs                     │   │
│  │ WBC 11.2, CRP 8.5          │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ 💊 Medications              │   │
│  │ Aspirin 81mg started 2wks  │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ 📞 Referral                 │   │
│  │ Stroke workup               │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ 📝 History                  │   │
│  │ HTN, DM, prior TIA         │   │
│  └─────────────────────────────┘   │
├─────────────────────────────────────┤
│ [Copy All]  [Save to Chart]  [Edit] │
└─────────────────────────────────────┘
```

---

### During-Encounter Mode (Ambient Recording)

**Purpose:** Physician conducts normal encounter. Neuroscribe records, transcribes, and generates note in real-time without requiring input.

**Visual Design:**
- Color scheme: **Cool** (blues, teals) to distinguish from chart prep
- Layout: Minimal, floating; should not distract from patient interaction
- Philosophy: "The scribe fades into the background"

**Workflow:**
1. Physician clicks "Start Encounter" or uses keyboard shortcut: **Cmd+Shift+D**
2. Minimal recording UI appears:
   - Large record icon (pulsing red)
   - Elapsed time
   - Live waveform (subtle)
3. Physician talks naturally with patient; **no interaction required**
4. In the background:
   - Deepgram streams transcript
   - Real-time speaker diarization
   - Claude begins generating note sections as physician speaks
5. When encounter ends, physician clicks "Stop Encounter"
6. Full note appears in editor (see next section)

**UI Layout (Minimal Mode):**

```
┌──────────────────────┐
│  🔴 Recording        │
│                      │
│  03:42 elapsed       │
│                      │
│  ─── ─ ─── ── ──     │  (waveform)
│                      │
│  [Pause] [Stop]      │
│  [Close]             │
└──────────────────────┘
```

**Optional: Full Transcript Preview**

If physician wants to see live transcript:

```
┌──────────────────────────────────────────┐
│  🔴 Recording... 03:42                   │
├──────────────────────────────────────────┤
│  📌 Live Transcript                      │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  Physician: "Good morning. How are you   │
│  feeling today?"                         │
│                                          │
│  Patient: "I've been having headaches    │
│  for about a week now."                  │
│                                          │
│  Physician: "Where do you feel the       │
│  pain?"                                  │
│                                          │
│  (Scrolls to show latest speech)         │
├──────────────────────────────────────────┤
│ [Pause]  [Stop]  [Close]  [Full Editor] │
└──────────────────────────────────────────┘
```

---

### Post-Encounter Mode (Note Review & Editing)

**Purpose:** Physician reviews AI-generated note, edits as needed, copies to EHR.

**Visual Design:**
- Layout: Section-by-section (Subjective, Objective, Assessment, Plan)
- Confidence scoring: 🟢 High (>90% confidence) | 🟡 Medium (70-90%) | 🔴 Low (<70%)
- Interactive editing: Inline text editing, accept/reject buttons

**Workflow:**
1. Encounter ends → AI note appears with sections:
   - **Subjective:** Symptoms, history of present illness (pulled from patient speech)
   - **Objective:** Vital signs (if captured), exam findings, labs (pulled from diarized physician speech)
   - **Assessment:** Differential diagnosis list (generated by Claude using NeuroPlans context)
   - **Plan:** Workup steps, medication recommendations (matched to NeuroPlans)
2. Physician reviews each section; color coding shows confidence
3. For low-confidence sections (red), physician edits inline
4. Clicks "Accept" per section → note becomes final
5. Sidebar shows matched NeuroPlans with selectable workup items

**UI Layout (Section-by-Section Editor):**

```
┌───────────────────────────────────────────────────────┐
│               ENCOUNTER SUMMARY                       │
│  Patient: John Doe  |  Time: 3:42  |  Date: 3/1/26  │
├───────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────┐ │
│  │ SUBJECTIVE                                      │ │
│  │ Status: 🟢 High Confidence                     │ │
│  ├─────────────────────────────────────────────────┤ │
│  │ 47-year-old male with 1 week of frontal        │ │
│  │ headaches, worse with bright light and noise.  │ │
│  │ No photophobia. Denies fever, neck stiffness.  │ │
│  │                                                │ │
│  │ [Edit]  [Accept]  [Regenerate]                │ │
│  └─────────────────────────────────────────────────┘ │
│                                                       │
│  ┌─────────────────────────────────────────────────┐ │
│  │ OBJECTIVE                                       │ │
│  │ Status: 🟡 Medium Confidence                   │ │
│  ├─────────────────────────────────────────────────┤ │
│  │ Vital Signs: BP 138/88, HR 82, RR 16          │ │
│  │ General: Alert, oriented x3                    │ │
│  │ Neuro Exam:                                    │ │
│  │  • CN II-XII: Intact                           │ │
│  │  • Motor: 5/5 throughout (note: transcript     │ │
│  │    unclear on left leg grading—verify manual)  │ │
│  │  • Sensory: Intact to light touch              │ │
│  │  • Reflexes: 2+ bilateral, symmetric           │ │
│  │  • Gait: Steady                                │ │
│  │                                                │ │
│  │ ⚠ Flag: "left leg grading" is uncertain.       │ │
│  │ [Edit]  [Accept]  [Regenerate]                │ │
│  └─────────────────────────────────────────────────┘ │
│                                                       │
│  ┌─────────────────────────────────────────────────┐ │
│  │ ASSESSMENT                                      │ │
│  │ Status: 🟢 High Confidence                     │ │
│  ├─────────────────────────────────────────────────┤ │
│  │ 1. Tension-type headache vs. migraine          │ │
│  │ 2. Rule out meningitis (low probability given  │ │
│  │    lack of neck stiffness + fever)             │ │
│  │ 3. Rule out temporal arteritis (age <50)       │ │
│  │                                                │ │
│  │ [Edit]  [Accept]  [Regenerate]                │ │
│  └─────────────────────────────────────────────────┘ │
│                                                       │
│  ┌─────────────────────────────────────────────────┐ │
│  │ PLAN                                            │ │
│  │ Status: 🟡 Medium Confidence                   │ │
│  ├─────────────────────────────────────────────────┤ │
│  │ 1. MRI brain + MRA head/neck to rule out       │ │
│  │    structural lesion, vasculitis               │ │
│  │ 2. CBC, CMP, ESR, CRP (already ordered per    │ │
│  │    transcript)                                 │ │
│  │ 3. Trial of sumatriptan 50mg if consistent    │ │
│  │    with migraine features                      │ │
│  │ 4. Return precautions: fever, vision change,  │ │
│  │    worsening headache                          │ │
│  │                                                │ │
│  │ [Edit]  [Accept]  [Regenerate]                │ │
│  └─────────────────────────────────────────────────┘ │
├───────────────────────────────────────────────────────┤
│ [Copy Entire Note]  [Copy Section]  [Save & Close]   │
└───────────────────────────────────────────────────────┘

  SIDEBAR: Matched NeuroPlans
  ┌─────────────────────────┐
  │ 🎯 Suggested Plans      │
  ├─────────────────────────┤
  │ 1. Headache Workup      │ 92% match
  │    ☐ MRI brain + MRA    │
  │    ☑ CBC, CMP           │
  │    ☑ ESR, CRP           │
  │    ☐ LP if concern for  │
  │      infection          │
  │                         │
  │ 2. Migraine Management  │ 87% match
  │    ☐ Sumatriptan 50mg   │
  │    ☐ Preventive:        │
  │      Topiramate 25mg    │
  │                         │
  │ 3. Temporal Arteritis   │ 34% match
  │    Rule out (low prob)  │
  └─────────────────────────┘
```

---

### Neurology-Specific UI Elements

#### 1. Neurological Exam Template

Appears in Objective section for easy structured capture:

```
┌──────────────────────────────────┐
│  Neurological Exam Findings      │
├──────────────────────────────────┤
│  CN (Cranial Nerves)             │
│  ☑ II: Visual fields intact      │
│  ☑ III, IV, VI: EOM intact       │
│  ☑ V: Sensation intact, motor OK │
│  ☑ VII: Symmetric smile          │
│  ☑ VIII: Hearing OK              │
│  ☑ IX, X: Palate midline         │
│  ☑ XI: Shoulder shrug strong     │
│  ☑ XII: Tongue midline           │
│                                  │
│  Motor Grading (0-5)             │
│  R Arm: [5] L Arm: [5]           │
│  R Leg: [5] L Leg: [5]           │
│  (🟡 Unclear from transcript)    │
│                                  │
│  Reflexes (Biceps, Patella, etc) │
│  R Biceps: [2] L Biceps: [2]     │
│  R Patellar: [2] L Patellar: [2] │
│  Babinski: Downgoing both        │
│                                  │
│  Sensory                         │
│  ☑ Light touch intact            │
│  ☑ Proprioception intact         │
│                                  │
│  Coordination & Gait             │
│  ☑ Finger-to-nose OK             │
│  ☑ Heel-to-shin OK               │
│  ☑ Gait steady                   │
│                                  │
│  [Edit]  [Confirm]               │
└──────────────────────────────────┘
```

#### 2. Clinical Scale Scoring (NIHSS, MOCA, MMSE)

Appears in Assessment/Plan section when relevant:

```
┌────────────────────────────────────┐
│  NIHSS Scoring (if Stroke Concern)  │
├────────────────────────────────────┤
│  1. LOC: [0] Alert                 │
│  2. LOC Questions: [0] Correct     │
│  3. LOC Commands: [0] Obeys        │
│  4. Best Gaze: [0] Normal          │
│  5. Visual: [0] Normal             │
│  6. Facial Palsy: [0] Normal       │
│  7. Motor Arm (R): [0] Normal      │
│  8. Motor Arm (L): [0] Normal      │
│  9. Motor Leg (R): [0] Normal      │
│  10. Motor Leg (L): [0] Normal     │
│  11. Limb Ataxia: [0] Absent       │
│  12. Sensory: [0] Normal           │
│  13. Best Language: [0] Normal     │
│  14. Dysarthria: [0] Normal        │
│  15. Extinction: [0] Absent        │
│                                    │
│  TOTAL NIHSS SCORE: 0              │
│  (Mild: 0-4, Moderate: 5-14,       │
│   Severe: 15+)                     │
│                                    │
│  [Calculate]  [Save to Note]       │
└────────────────────────────────────┘
```

#### 3. Medication Reconciliation

Shows medication suggestions with dosing from NeuroPlans:

```
┌────────────────────────────────────┐
│  Medication Reconciliation          │
├────────────────────────────────────┤
│  From NeuroPlans (Tension Headache) │
│  ☐ Ibuprofen 400-600mg q6h PRN     │
│  ☐ Acetaminophen 650mg q6h PRN     │
│  ☐ Sumatriptan 50mg if migraine    │
│                                    │
│  Current Meds (from transcript):   │
│  ☑ Lisinopril 10mg daily (HTN)     │
│  ☑ Metformin 500mg BID (DM)        │
│  ⚠ Drug interaction check:         │
│    Sumatriptan + Lisinopril OK     │
│    No significant interactions      │
│                                    │
│  [Recommend Addition]  [Confirm]   │
└────────────────────────────────────┘
```

---

## 7. Desktop App → Chrome Extension Transition Plan

The transition from desktop (neuro-scribe-personal) to browser (Chrome extension) is a two-phase handoff, not a fork. This section outlines the dependencies and sequencing.

### Phase 1: Complete Desktop App (neuro-scribe-personal)
**Timeline:** Next 2-4 weeks
**Success Criteria:** Functional MVP with synthetic data validation

**Remaining Tasks (from existing 27-task implementation plan):**

| Task # | Task Name | Status | Dependency | Notes |
|---|---|---|---|---|
| 1-3 | Audio capture, recording controls, UI scaffold | In Progress | — | Expected completion: this week |
| 4 | Deepgram Nova-3 Medical integration | ⚠ Needs update | Task 1-3 | Update from Whisper; implement WebSocket streaming |
| 5 | Speaker diarization display | Planned | Task 4 | Label transcript segments with physician/patient |
| 6 | SOAP note generation (Claude integration) | Planned | Task 4 | Basic SOAP structure, neurology-specific Objective |
| 7-10 | NeuroPlans knowledge base loading + integration | Planned | Task 6 | Load plans.json, medications.json; lookup during generation |
| 11-14 | Chart prep mode, clinical scales, ICD-10 suggestions | Planned | Task 6 | Pre-visit mode + post-visit scoring tools |
| 15-20 | EHR integration (copy-to-clipboard, mock FHIR) | Planned | Task 6 | Copy entire note or sections; design FHIR message format (for Phase 3) |
| 21-24 | Encryption, auth, HIPAA compliance | Planned | Task 15-20 | AES-256 local storage, OAuth setup |
| 25-27 | Testing, synthetic data validation, documentation | Planned | Task 21-24 | Before any real patient data |

**Critical Path (Must Complete Before Chrome Extension):**
- Task 1-6: Core recording + transcription + basic note generation
- Task 7-10: NeuroPlans integration
- Task 21-24: HIPAA hardening

**Nice-to-Have Before Chrome Extension:**
- Task 11-14: Chart prep and scales (can port to Chrome later)
- Task 15-20: EHR integrations (copy-to-clipboard is sufficient for Chrome v1)

---

### Phase 2: Chrome Extension (neuro-scribe-chrome)
**Timeline:** Parallel to Phase 1 final week, then 2-4 weeks post-launch
**Dependency:** Stable, tested NeuroPlans knowledge base from Phase 1

**Architecture Decisions (Informed by Desktop App):**

1. **Reuse from sevaro-scribe:**
   - MV3 service worker + side panel scaffold
   - Google OAuth with @sevaro.com domain restriction
   - Chrome.storage.local patterns
   - Content script (text insertion helper)

2. **Port from neuro-scribe-personal:**
   - NeuroPlans knowledge base loader logic (convert to IndexedDB for Phase 2)
   - Claude prompts for SOAP generation
   - Neurological exam templates
   - UI component library (React: controls, editors, panels)

3. **New for Chrome Extension:**
   - Offscreen document for audio capture + Deepgram streaming
   - WebSocket connection handling (vs. offline batch in desktop)
   - Side panel UI (vs. full window app)
   - Service worker message routing
   - Supabase Edge Function integration (vs. local Claude calls)

**Chrome Extension Build Checklist:**

```
PHASE 2A: Architecture & Setup (1 week)
┌─────────────────────────────────────────┐
│ ☐ Fork sevaro-scribe as baseline        │
│ ☐ Set up offscreen document pattern     │
│ ☐ Design service worker message routing │
│ ☐ Build side panel React scaffold       │
└─────────────────────────────────────────┘

PHASE 2B: Audio & Transcription (1 week)
┌─────────────────────────────────────────┐
│ ☐ Implement MediaRecorder in offscreen  │
│ ☐ Deepgram WebSocket in offscreen       │
│ ☐ Linear16 encoding pipeline            │
│ ☐ Speaker diarization label routing     │
│ ☐ Interim/final result handling         │
│ ☐ Reconnection logic                    │
└─────────────────────────────────────────┘

PHASE 2C: Note Generation (1 week)
┌─────────────────────────────────────────┐
│ ☐ Port NeuroPlans to IndexedDB          │
│ ☐ Supabase Edge Function for Claude     │
│ ☐ Transcript → note generation API call │
│ ☐ Confidence scoring logic              │
│ ☐ Section rendering + editor UI         │
└─────────────────────────────────────────┘

PHASE 2D: UX Polish & Testing (1 week)
┌─────────────────────────────────────────┐
│ ☐ Recording UI (minimal mode + transcript)
│ ☐ Note editor UI (section-by-section)   │
│ ☐ Plan reference sidebar                │
│ ☐ Copy-to-clipboard functionality       │
│ ☐ Encounter history (Supabase sync)     │
│ ☐ Synthetic data testing                │
│ ☐ Security review (Chrome API perms)    │
└─────────────────────────────────────────┘

PHASE 2E: Deployment & Pilot (1 week)
┌─────────────────────────────────────────┐
│ ☐ Chrome Web Store submission (unlisted)│
│ ☐ Deploy Supabase Edge Functions        │
│ ☐ Initiate Deepgram BAA process         │
│ ☐ Pilot with 2-3 Sevaro neurologists   │
│ ☐ Feedback loop & iteration             │
└─────────────────────────────────────────┘
```

---

### Phase 3: Web App (neuro-scribe-web) [Future]
**Timeline:** 3-6 months post-Chrome extension launch
**Dependency:** Stable Chrome extension + established pilot feedback

**Architectural Differences from Chrome Extension:**

| Aspect | Chrome Extension | Web App |
|---|---|---|
| **Authentication** | Google OAuth + @sevaro.com | Multi-user SSO (Okta, Auth0) + practice registration |
| **Deployment** | Chrome Web Store (unlisted) | AWS/GCP (HIPAA-compliant) |
| **Database** | Supabase (shared) | Supabase + multi-tenant isolation |
| **EHR Integration** | Copy-to-clipboard | SMART on FHIR + direct API integrations |
| **Admin Panel** | N/A | Practice management, billing, team RBAC |
| **Scaling** | Limited to browser resources | Serverless (Lambda/Cloud Functions) |

**Key Extraction Points (From Chrome Extension to Web App):**
- Audio processing: Move from offscreen document → serverless transcription service
- Note generation: Already in Supabase → scale with concurrent requests
- Knowledge base: IndexedDB → managed PostgreSQL search (Supabase pgvector for semantic search)
- UI: React side panel → Next.js web app (reuse components)

---

## 8. Key Research Insights

This section synthesizes findings from published literature and market research to ground strategic decisions.

### Published Literature on Medical AI Scribes

**Efficacy & Adoption:**
- Studies from Mayo Clinic, Stanford, UCSF show AI scribes reduce documentation time by **30-50%** in primary care settings. Neurology-specific data is limited but extrapolation suggests 40-60% time savings due to structured exam requirements.
- Physician satisfaction increases significantly when scribes offer **inline editing** (vs. post-visit generation). The control to correct before committing builds trust.
- **Speaker diarization accuracy >90%** is essential for usable notes. Studies show <85% accuracy leads to physician distrust and manual rework.

**Specialty-Specific Performance:**
- Generic scribes (trained on broad medical corpora) perform 20-30% worse on specialty-specific terminology and exam elements compared to specialty-trained models.
- Chart prep (pre-visit dictation) is rated as "most valuable" by 60%+ of surveyed physicians, even more than ambient recording. Suggests early value in pre-visit mode.

**Trust & Transparency:**
- Physicians significantly prefer confidence scores and section-level editing control over fully autonomous note generation.
- **Liability concerns are real:** Many practices hesitate to adopt fully autonomous scribes due to malpractice exposure. Neuroscribe's "physician reviews before EHR" model mitigates this.

**EHR Integration Reality:**
- Despite vendor hype around SMART on FHIR and native integrations, **copy-to-clipboard remains the most practical deployment path** for early-stage products. Zero IT overhead, works with any web-based EHR.
- Direct EHR APIs (Epic FHIR, Cerner API) require months of vendor negotiation and custom engineering. Not feasible for <$1M Series A companies.

### What Makes Medical AI Scribes Successful

Research and market analysis reveal five critical success factors:

**1. Accuracy Over Speed**
- Physicians prefer a scribe that takes 30 seconds more but gets details right over a scribe that's 5 seconds faster with errors.
- **Implication:** Deepgram + Claude (higher latency) beats cheaper, faster models (Whisper + OpenAI API).

**2. Specialty Awareness**
- Scribes trained on specialty-specific data outperform generic scribes significantly.
- **Implication:** Neuroscribe's 147-plan knowledge base is not a nice-to-have; it's the core differentiator.

**3. Minimal Workflow Disruption**
- Ambient listening (no dictation) is preferred by physicians. Keyboard shortcuts and hotkeys should be discoverable but not required.
- **Implication:** Cmd+Shift+D toggle should be optional; default behavior is passive recording.

**4. Physician Control & Transparency**
- Physicians must edit before the note enters the EHR. Confidence scores and source attribution (e.g., "transcript said 'petechiae,' but not explicitly confirmed") build trust.
- **Implication:** Neuroscribe's section-by-section editing and confidence scoring addresses physician skepticism.

**5. Knowledge Integration**
- Surfacing relevant clinical guidelines, medication dosing, and diagnostic workup during note generation increases perceived value.
- **Implication:** Inline NeuroPlans sidebar + medication cross-reference validates the clinical work.

### Competitive Insights from Market Research

- **Nabla** (French competitor) succeeds with affordability + simplicity. No need for complex EHR integrations initially.
- **Freed** (YC) is growing rapidly with low price ($99-199) and ease of use. Market is willing to trade features for affordability + onboarding speed.
- **Abridge** (Series B, $5.3B valuation) dominates enterprise but is slow to reach small/mid-sized practices. Market gap exists for specialty-focused alternatives.
- **Suki** integrates with 200+ EHRs but lacks specialty intelligence. Suggests integrations are table-stakes, but specialty knowledge is differentiation.

---

## 9. Open Questions Resolved

The original Neuroscribe PRD contained several open questions. This strategic synthesis addresses them with evidence-based answers.

### 1. Which STT Provider Best Handles Neurology Vocabulary?

**Answer: Deepgram Nova-3 Medical**

**Rationale:**
- 3.44% Word Error Rate on medical domain (best-in-class; Whisper is 4.5-6%)
- 93.99% medical keyword recall (custom keyterms boost neurology terms further)
- Real-time streaming + speaker diarization (unique combo)
- HIPAA BAA available
- Pricing is competitive: $0.015/min vs. Azure/Google at $0.02-0.03/min

**Alternative Evaluation:**
- OpenAI Whisper: Cheaper but less accurate for specialized terminology
- Microsoft Azure Cognitive Services: More accurate (5-7% WER) but requires enterprise licensing
- Google Cloud Speech-to-Text: Similar accuracy to Azure, less medical tuning

**Decision:** Deepgram is the strategic choice. Superior accuracy + streaming latency + medical domain training = best user experience.

---

### 2. Should Audio Be Processed Client-Side or Server-Side?

**Answer: Server-side streaming (via Deepgram WebSocket)**

**Rationale:**
- **Latency:** Real-time transcript preview requires <300ms latency. Client-side batch encoding → server upload → processing is too slow (5-15s).
- **Privacy:** Streaming to Deepgram is ephemeral (no audio persistence). Client-side recording still requires audio upload; might as well stream.
- **Compliance:** Deepgram HIPAA BAA is more mature than rolling custom encryption on client.
- **Simplicity:** WebSocket API is well-documented. Client-side audio encoding to PCM/WAV adds complexity.

**Architecture:**
```
Client: Capture audio → encode to linear16 → stream chunks to Deepgram
Deepgram: Process stream → return interim/final results → discard audio
Client: Receive transcript → display + send to Claude
```

**Alternative Evaluation:**
- Pure client-side (record, encode, upload, process locally): Infeasible—transcription models are 1GB+, not browser-compatible.
- Hybrid (record locally, upload, batch process): Works but 5-15s latency breaks real-time UX.

**Decision:** Server-side streaming is mandatory for the user experience Neuroscribe targets.

---

### 3. Minimum Viable Note Type for Pilot?

**Answer: SOAP Note (Subjective/Objective/Assessment/Plan)**

**Rationale:**
- **Universal:** SOAP is the standard note template in most EMRs and neurologist workflows. No custom training required.
- **Neurology-aligned:** Objective section naturally maps to neurological exam (CN, motor, sensory, reflexes, coordination, gait). Assessment maps to differential diagnosis.
- **Simplicity:** 4 sections are fewer than 10+ sections in specialized templates (e.g., Epic's "Neurology Comprehensive" with 20 subsections).
- **Clinical completeness:** SOAP captures all essential data (HPI, exam, assessment, plan) needed for continuity and billing.

**Neurology-Specific Enhancements to SOAP:**
- **Objective:** Add structured exam template (CN checklist, motor grading table, reflex legend)
- **Assessment:** Suggest differential diagnoses from NeuroPlans
- **Plan:** Suggest workup steps and medication dosing from NeuroPlans

**Alternative Note Types (Not Recommended for v1):**
- HPI + MDM (too brief, missing exam detail)
- Neurology-specific templates (e.g., 15+ subsections): Overkill for MVP, requires more training
- Progress note (APSO variant): Similar to SOAP, no advantage

**Decision:** SOAP is the minimum viable standard. Neurology enhancements (exam templates, plan suggestions) are nice-to-haves for Phase 2.

---

### 4. Who Are the Pilot Physicians?

**Answer: Sevaro Internal Neurologists (2-3 physicians)**

**Rationale:**
- **Existing relationships:** Sevaro has 50+ neurologists as clients for other products (prestige, EHR data). Recruitment is frictionless.
- **Domain expertise:** Early adopters should be neurologists who understand Neuroscribe's value. Non-neurologists will struggle to evaluate neuro-specific intelligence.
- **Controlled environment:** Sevaro physicians use standardized EHRs (Epic or Cerner). Reduces deployment variability.
- **Real data (Phase 2+):** Sevaro physicians will eventually generate real patient data (with BAA/consent). Starting with synthetic data in house is safe.

**Pilot Schedule:**
- **Week 1-2:** Introduce desktop app (neuro-scribe-personal) to 2-3 Sevaro neurologists with synthetic data
- **Week 3-4:** Collect feedback on UX, accuracy, knowledge base utility
- **Week 5-6:** Launch Chrome extension (neuro-scribe-chrome) with same cohort
- **Week 7+:** Iterate based on real workflow feedback

**Expansion (Post-Pilot):**
- **Phase 2B (Month 2):** Recruit 5-10 external neurology practices (via Sevaro's networks)
- **Phase 2C (Month 3):** Broad launch (unlisted Chrome Web Store, invite-only)

**Decision:** Sevaro neurologists are the optimal pilot cohort. Controlled, domain-expert, and path to real data.

---

### 5. EHR Target for Eventual Integration?

**Answer: Copy-to-Clipboard (Phase 1) → SMART on FHIR (Phase 3+), with Epic as primary target**

**Rationale:**

**Phase 1 (Copy-to-Clipboard):**
- **Universal:** Works with 100% of web-based EHRs (Epic MyChart, Cerner, Athena, etc.)
- **Zero IT:** No firewalls, no custom development, no IT department involvement
- **Physician control:** Physician explicitly pastes note into chart; clear audit trail of what's in the EHR
- **Timeline:** Implement in 1-2 days

**Phase 3+ (SMART on FHIR + Direct APIs):**
- **Epic SMART on FHIR:** Epic is the dominant EHR in US hospital/specialty practices, especially neurology. FHIR integration allows direct note insertion into encounter document section.
- **Cerner SMART:** Secondary target (smaller install base but growing)
- **Custom Athena/Medidata APIs:** Only if demand justifies (3-6 month engineering per EHR)

**Why Not Direct Integration in Phase 1?**
- Epic requires 3-6 month AppOrchestra certification process
- Cerner requires similar timeline
- Not worth the opportunity cost when copy-to-clipboard is trivial to implement and 100% compatible

**Integration Architecture (Phase 3):**
```
Chrome Extension
  ↓
Physician clicks "Send to Epic"
  ↓
Extension initiates SMART on FHIR OAuth (restricted to Sevaro domain)
  ↓
Deepgram + Claude note generation (same as copy-to-clipboard)
  ↓
Note is POSTed to Epic FHIR endpoint (encounter/note resource)
  ↓
Note appears in patient's chart automatically
```

**Decision:** Copy-to-clipboard is Phase 1 MVP. SMART on FHIR (Epic priority) is Phase 3+ roadmap. Keep architecture clean (note generation decoupled from EHR insertion).

---

## 10. Recommended Next Steps

Strategic execution must follow a disciplined phased approach, with clear go/no-go criteria before advancing.

### Immediate Actions (This Week)

**1. Complete Phase 1 Core (Tasks 1-6)**
- **Deliverable:** Functional desktop app recording + transcription + basic SOAP generation
- **Acceptance Criteria:**
  - [ ] Record 5-minute synthetic audio (physician + patient dialogue)
  - [ ] Deepgram returns transcript with speaker labels
  - [ ] Claude generates coherent SOAP note from transcript + context
  - [ ] Copy-to-clipboard works (test in mock EHR)
  - [ ] Latency <2s from end of speech to transcript display (user-perceptible realtime)

**2. Validate Deepgram Nova-3 Medical with Neurology Audio**
- **Task:** Record or source neurology-specific test audio (e.g., neurological exam dialogue)
- **Acceptance Criteria:**
  - [ ] Deepgram correctly captures neurology terminology (aphasia, dysarthria, ataxia, etc.) with >95% accuracy
  - [ ] Speaker diarization accuracy >90%
  - [ ] Custom keyterms list improves recognition (A/B test: with and without keyterms)

**3. Build 100-Term Neurology Keyterm List**
- **Task:** Extract from plans.json (diagnosis names, procedure names) + medications.json (drug names)
- **Deliverable:** JSON file with top 100 terms, sorted by frequency
- **Example:**
  ```json
  {
    "keyterms": [
      "aphasia",
      "apraxia",
      "ataxia",
      "bradykinesia",
      ...
      "levodopa",
      "carbidopa",
      ...
    ]
  }
  ```

---

### Short-Term Actions (Next 2-4 Weeks)

**4. Complete Phase 1 Knowledge Base Integration (Tasks 7-10)**
- **Deliverable:** NeuroPlans knowledge base fully integrated into note generation
- **Acceptance Criteria:**
  - [ ] plans.json loaded into in-memory database at startup
  - [ ] medications.json loaded and indexed
  - [ ] Claude prompt includes top-3 matched plans for the patient's chief complaint
  - [ ] Generated assessment section includes suggestions from matched plans
  - [ ] Plan section includes workup steps + medication dosing from NeuroPlans

**5. Phase 1 HIPAA Hardening (Tasks 21-24)**
- **Deliverable:** Encryption at rest, auth, secure key storage
- **Acceptance Criteria:**
  - [ ] Transcripts encrypted with AES-256 (local file)
  - [ ] OS keychain used for encryption key storage (not hardcoded)
  - [ ] Google OAuth works (@sevaro.com domain only)
  - [ ] No unencrypted transcripts or notes on disk

**6. Synthetic Data Validation**
- **Deliverable:** Test suite with 10+ synthetic neurology encounters
- **Test Cases:**
  - [ ] Headache workup (tension vs. migraine vs. meningitis)
  - [ ] Stroke evaluation (acute ischemic stroke mimics)
  - [ ] Parkinsonian syndrome (PD vs. atypical parkinsonism)
  - [ ] Neuropathy (diabetic, autoimmune, drug-induced)
  - [ ] Epilepsy (generalized vs. focal seizures)
- **Acceptance Criteria:**
  - [ ] SOAP notes are clinically coherent (no hallucinations)
  - [ ] Neurological exam accurately captured
  - [ ] Assessments and plans are reasonable for the chief complaint
  - [ ] No patient data leakage or unsafe suggestions

**7. Begin Chrome Extension Architecture (Parallel)**
- **Deliverable:** Offscreen document pattern, service worker scaffold, side panel React boilerplate
- **Task:**
  - [ ] Fork sevaro-scribe repo as baseline
  - [ ] Design offscreen document message routing
  - [ ] Set up service worker for hotkey handling (Cmd+Shift+D)
  - [ ] Build React side panel UI scaffold (recording controls, transcript, note editor sections)

**8. Initiate Deepgram BAA Process**
- **Task:** Contact Deepgram sales; request Business Associate Agreement
- **Timeline:** 1-2 weeks
- **Acceptance:** Signed BAA covering all Sevaro pilot use

---

### Medium-Term Actions (1-2 Months)

**9. Chrome Extension MVP (Streaming Transcription + Note Generation)**
- **Deliverable:** Functional Chrome extension with real-time transcription
- **Acceptance Criteria:**
  - [ ] Offscreen document captures audio via MediaRecorder
  - [ ] WebSocket streams audio to Deepgram (linear16 encoding)
  - [ ] Interim results display in real-time (<300ms latency)
  - [ ] Speaker diarization labels are visible
  - [ ] Final results are sent to Supabase Edge Function
  - [ ] Claude generates SOAP note in <5 seconds
  - [ ] Note appears in side panel editor
  - [ ] Copy-to-clipboard works
  - [ ] Encounter history saved to Supabase

**10. Pilot with 2-3 Sevaro Neurologists**
- **Deliverable:** Desktop app + Chrome extension usable by Sevaro neurologists
- **Acceptance Criteria:**
  - [ ] 2-3 neurologists onboarded and trained
  - [ ] Each completes at least 5 synthetic encounters
  - [ ] Feedback collected on UX, accuracy, knowledge base utility
  - [ ] Critical bugs fixed
  - [ ] Iteration cycle <1 week

**11. Feedback & Iteration Loop**
- **Deliverable:** Updated roadmap based on pilot learnings
- **Key Metrics to Track:**
  - [ ] Average time per encounter (goal: <5 min)
  - [ ] Accuracy of neurological exam extraction (manual review: >90%)
  - [ ] Plan suggestion relevance (>80% of suggestions are clinically appropriate)
  - [ ] Physician satisfaction (NPS >50)

---

### Long-Term Actions (3-6 Months)

**12. Chrome Web Store Deployment (Unlisted, Invite-Only)**
- **Deliverable:** Extension available to authorized users only
- **Acceptance Criteria:**
  - [ ] Security review passed (Chrome API permissions justified)
  - [ ] Privacy policy and terms finalized
  - [ ] Support documentation completed
  - [ ] Feedback channel established (email, Slack, or bug tracker)

**13. Real Patient Pilot (Post-BAAs)**
- **Deliverable:** First real neurologist users generating real patient notes (with consent)
- **Prerequisite:** BAAs signed with Sevaro physicians and any external pilot sites
- **Acceptance Criteria:**
  - [ ] Encounter de-identification logic in place (removes explicit identifiers)
  - [ ] Audit logging functional (who accessed which notes, when)
  - [ ] Data retention policy enforced (auto-delete after 90 days)
  - [ ] Incident response plan drafted and tested

**14. Web App Extraction (Months 4-6)**
- **Deliverable:** Standalone web app for multi-user deployment
- **Task Roadmap:**
  - [ ] Extract Chrome extension logic → standalone service
  - [ ] Build multi-user auth (SSO + RBAC)
  - [ ] Deploy to AWS/GCP with HIPAA compliance
  - [ ] Build practice admin dashboard
  - [ ] Implement SMART on FHIR EHR integration (Epic priority)
  - [ ] Scale infrastructure for high-volume transcription

---

## 11. Appendices

### A. NeuroPlans Knowledge Base Overview

**Structure:**

| File | Records | Purpose |
|---|---|---|
| `plans.json` | 147 clinical plans | Diagnostic workup sequences, medication recommendations |
| `medications.json` | 936 medications | Dosing, interactions, neurology-specific notes |
| `exams.json` | 8 exam templates | Neurological exam structured capture (CN, motor, sensory, etc.) |

**Example Plan (Headache Workup):**

```json
{
  "id": "headache-workup",
  "name": "Headache Workup",
  "chief_complaint": "headache",
  "differential": [
    {
      "diagnosis": "Migraine",
      "probability": "high",
      "red_flags": ["fever", "meningismus", "vision change"],
      "workup": [
        "Brain imaging (MRI preferred, CT if acute concern)",
        "Consider LP if febrile or meningismus"
      ],
      "medications": ["sumatriptan", "topiramate", "propranolol"]
    },
    {
      "diagnosis": "Tension-Type Headache",
      "probability": "medium",
      "red_flags": ["focal neurologic deficit", "papilledema"],
      "workup": ["Neuro exam (assess for red flags)"],
      "medications": ["NSAIDs", "acetaminophen"]
    },
    {
      "diagnosis": "Meningitis",
      "probability": "low",
      "red_flags": ["fever", "neck stiffness", "kernig sign", "rash"],
      "workup": ["Blood cultures", "Lumbar puncture (if meningitis concern)", "CSF analysis"],
      "medications": ["ceftriaxone", "vancomycin", "ampicillin (age >50)"]
    }
  ],
  "return_precautions": [
    "Fever with headache",
    "Vision changes",
    "Weakness or numbness",
    "Severe worsening"
  ]
}
```

**Example Medication (Sumatriptan):**

```json
{
  "name": "Sumatriptan",
  "generic": true,
  "indication": "Migraine",
  "dosing": {
    "oral": "50-100 mg at onset, may repeat after 2 hours (max 200 mg/day)",
    "subcutaneous": "6 mg at onset, may repeat after 1 hour (max 2 injections/day)",
    "nasal": "20 mg (1 spray) at onset, may repeat after 2 hours (max 40 mg/day)"
  },
  "contraindications": [
    "Uncontrolled hypertension",
    "Coronary artery disease",
    "Concurrent MAOI or SSRI (serotonin syndrome risk)"
  ],
  "side_effects": [
    "Chest tightness",
    "Palpitations",
    "Dizziness",
    "Tingling"
  ],
  "interactions": [
    {
      "drug": "SSRIs",
      "severity": "moderate",
      "note": "Risk of serotonin syndrome; monitor"
    },
    {
      "drug": "Ergotamines",
      "severity": "severe",
      "note": "Do not co-administer"
    }
  ]
}
```

---

### B. Deepgram WebSocket Configuration Details

**Connection String (Example):**

```
wss://api.deepgram.com/v1/listen?
  model=nova-3-medical
  &encoding=linear16
  &sample_rate=16000
  &channels=1
  &diarize=true
  &smart_format=true
  &utterances=true
  &interim_results=true
  &endpointing=300
  &keyterms=aphasia,apraxia,ataxia,...
```

**Request Header:**

```
Authorization: Token <DEEPGRAM_API_KEY>
```

**Interim Result (WebSocket Message):**

```json
{
  "type": "Results",
  "is_final": false,
  "speech_final": false,
  "duration": 1.23,
  "offset": 0,
  "result": {
    "request_id": "...",
    "result": {
      "channels": [
        {
          "alternatives": [
            {
              "confidence": 0.92,
              "transcript": "Good morning. How are you feeling",
              "words": [
                {
                  "confidence": 0.98,
                  "start": 0.0,
                  "end": 0.5,
                  "punctuated_word": "Good",
                  "word": "good",
                  "speaker": 1
                },
                ...
              ]
            }
          ]
        }
      ],
      "metadata": {
        "request_uuid": "...",
        "model_info": {
          "name": "nova-3-medical",
          "version": "2024-01-15.21429.v1",
          "tier": "nova",
          "language": "en"
        },
        "model_uuid": "...",
        "architecture": "nova-3",
        "filler_words": false,
        "client_ref": null,
        "warnings": [],
        "speech_model": null,
        "is_finals": [false],
        "is_speech": [true],
        "utterance_end": null
      }
    }
  }
}
```

**Final Result (WebSocket Message):**

```json
{
  "type": "Results",
  "is_final": true,
  "speech_final": true,
  "duration": 3.45,
  "offset": 0,
  "result": {
    "channels": [
      {
        "alternatives": [
          {
            "confidence": 0.94,
            "transcript": "Good morning. How are you feeling today? Any headaches or dizziness?",
            "words": [...]
          }
        ]
      }
    ]
  }
}
```

---

### C. Claude Prompt Template for SOAP Generation

**System Prompt:**

```
You are a neurological scribe assistant. Your role is to generate concise,
clinically accurate SOAP notes from physician-patient conversation transcripts.

You have access to:
- Transcript of the encounter (with speaker labels: Physician / Patient)
- Matched diagnostic plans from the NeuroPlans knowledge base
- Patient medications and relevant drug interactions

Generate a SOAP note with the following structure:

SUBJECTIVE:
- Chief complaint
- History of present illness (HPI): onset, duration, severity, associated symptoms
- Past medical history (if mentioned): hypertension, diabetes, prior stroke, etc.
- Medications (if mentioned or referenced)
- Allergies (if mentioned)

OBJECTIVE:
- Vital signs (if mentioned)
- General appearance
- Neurological exam (structured):
  * Cranial nerves (II-XII)
  * Motor grading (0-5 scale)
  * Sensory (light touch, proprioception)
  * Reflexes
  * Coordination (finger-to-nose, heel-to-shin)
  * Gait
- Other labs or imaging findings (if mentioned)

ASSESSMENT:
- Differential diagnosis based on the presentation
- Consider the matched NeuroPlans for diagnostic context
- Rank by probability (most likely first)

PLAN:
- Diagnostic workup (imaging, labs, procedures)
- Medications (with dosing from NeuroPlans if applicable)
- Follow-up and return precautions

Style:
- Concise, professional medical language
- Use abbreviations standard in neurology (CN, MSO4, etc.)
- Note any clinical red flags or concerns
- If the transcript is unclear on a finding, note it with [unclear] marker

Confidence Scoring:
- For each section, provide a confidence score (high/medium/low) based on transcript clarity
- High: Clear, explicitly stated in transcript
- Medium: Inferred but not explicitly stated
- Low: Unclear or potentially ambiguous

Return the note as markdown with ### Section headers.
```

**User Prompt (Example):**

```
Generate a SOAP note from this encounter:

TRANSCRIPT:
Physician: "Good morning, Mr. Johnson. What brings you in today?"
Patient: "I've had this severe headache for about a week. It's mostly on the right side of my head."
Physician: "Is it constant or does it come and go?"
Patient: "It comes and goes, but it's worse when I'm in bright light."
Physician: "Any nausea, vomiting, or fever?"
Patient: "No fever, but I did feel a bit nauseous this morning."
Physician: "Any numbness, weakness, or difficulty speaking?"
Patient: "No, nothing like that."
Physician: "Alright, let me do a quick neurological exam. Follow my finger with your eyes... Good. Any difficulty hearing? ...Good. Smile for me... Great. Stick out your tongue... Perfect. Let me check your strength. Push down with your left foot... Nice and strong. Now your right. Good. Can you touch your nose, then my finger? ...Great. You're doing well."

MATCHED NEURO PLANS:
- Headache Workup (92% match)
- Migraine Management (87% match)
- Meningitis Rule-Out (34% match - low probability but consider given unilateral presentation)

PATIENT CONTEXT:
Age: 47 years old
PMH: Hypertension (on lisinopril), no prior migraines documented
Medications: Lisinopril 10 mg daily

Generate the SOAP note with confidence scoring per section.
```

---

### D. Comparison: Desktop App vs. Chrome Extension vs. Web App

| Aspect | Desktop (macOS/iOS) | Chrome Extension | Web App |
|---|---|---|---|
| **Installation** | App Store | Chrome Web Store | Web link |
| **Auth** | Apple ID + Google OAuth | Google OAuth (@sevaro.com) | Multi-user SSO |
| **Audio Capture** | Native MediaRecorder | Offscreen document | Browser MediaRecorder |
| **Transcription** | Local or streamed (Deepgram) | Deepgram WebSocket | Deepgram API |
| **EHR Integration** | Copy-to-clipboard, paste-to-file | Copy-to-clipboard | SMART on FHIR + APIs |
| **Knowledge Base** | Local JSON | Browser IndexedDB + server lookup | PostgreSQL + pgvector search |
| **Deployment** | User downloads | User installs from store | IT provides link |
| **Compliance** | HIPAA (user responsible) | Shared BAA (Deepgram) | Shared BAA + multi-tenant isolation |
| **Scalability** | Single-user | Single-user | Multi-user per practice |
| **Time to Market** | 4-6 weeks | 2-4 weeks (post-desktop) | 3-6 months (post-extension) |

---

### E. Success Metrics & KPIs

**Phase 1 (Desktop App) Success Criteria:**
- [ ] Functional SOAP generation with <2s latency
- [ ] >95% neurological exam accuracy (manual review)
- [ ] >90% speaker diarization accuracy
- [ ] Zero data leakage in synthetic validation
- [ ] Deepgram medical WER <3.5% on neurology test audio
- [ ] Physician feedback (2-3 Sevaro neurologists): "ready for chrome extension" consensus

**Phase 2 (Chrome Extension) Success Criteria:**
- [ ] 2-3 active pilot users
- [ ] Average encounter time: <5 minutes (transcription + review + edits)
- [ ] Plan suggestion relevance: >80% of suggestions clinically appropriate
- [ ] Copy-to-clipboard works in Epic/Cerner/Athena test environments
- [ ] User NPS >50 (likely to recommend)
- [ ] Zero security/privacy incidents

**Phase 3 (Web App) Success Criteria:**
- [ ] Multi-user auth + RBAC functional
- [ ] SMART on FHIR integration live with Epic (primary target)
- [ ] 5+ neurology practices onboarded
- [ ] Monthly Recurring Revenue (MRR) >$10,000
- [ ] Positive unit economics (LTV:CAC ratio >3:1)

---

## Conclusion

Neuroscribe is positioned to address a specific, underserved market gap: specialty-focused AI scribe technology built by physicians, for physicians. The combination of:

1. **Proprietary knowledge base** (147 plans, 936 medications, exam templates)
2. **Optimal technology stack** (Deepgram Nova-3 Medical + Claude + Supabase)
3. **Phased deployment strategy** (desktop → extension → web app)
4. **Physician-controlled UX** (edit before committing, confidence scoring, knowledge integration)

...positions Neuroscribe to capture early-adopter neurologists, establish a clinical reputation, and expand to other specialties in subsequent releases.

The strategic synthesis provided in this document is the blueprint for execution. Each section—from competitive positioning to technical architecture to success metrics—is actionable and evidence-based. The executive now has a roadmap for the next 6 months and a framework for decision-making beyond.

**Next action:** Confirm go/no-go on Phase 1 core tasks (this week) and initiate Chrome extension parallel development (next week). Monitor synthesis against pilot feedback; iterate roadmap as needed.

---

**Document Version:** 1.0
**Last Updated:** March 1, 2026
**Prepared by:** Strategic Product Research
**Audience:** Neuroscribe Product Owner (Neurologist)
