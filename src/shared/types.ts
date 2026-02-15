// Core domain types for Neuro Scribe

// --- Encounter ---

export interface Encounter {
  id: string;
  physicianId: string;
  status: EncounterStatus;
  createdAt: string; // ISO 8601
  updatedAt: string;
  transcript?: Transcript;
  note?: ClinicalNote;
}

export type EncounterStatus =
  | "recording"
  | "transcribed"
  | "generating"
  | "drafted"
  | "reviewed"
  | "finalized";

// --- Transcript ---

export interface Transcript {
  id: string;
  encounterId: string;
  segments: TranscriptSegment[];
  durationSeconds: number;
  wordCount: number;
  createdAt: string;
}

export interface TranscriptSegment {
  speaker: "physician" | "patient" | "unknown";
  start: number; // seconds
  end: number;
  text: string;
  confidence: number; // 0-1
}

// --- Clinical Note ---

export interface ClinicalNote {
  id: string;
  encounterId: string;
  noteType: NoteType;
  sections: NoteSections;
  suggestedPlans: PlanMatch[];
  medicationsMentioned: MedicationMention[];
  suggestedIcd10: Icd10Suggestion[];
  createdAt: string;
  updatedAt: string;
  status: "draft" | "reviewed" | "finalized";
}

export type NoteType = "soap" | "hp" | "progress" | "consult" | "procedure";

export interface NoteSections {
  subjective?: NoteSection;
  objective?: ObjectiveSection;
  assessment?: AssessmentSection;
  plan?: PlanSection;
}

export interface NoteSection {
  content: string;
  confidence: number;
  sources: string[]; // transcript segment references
  physicianEdited: boolean;
}

export interface ObjectiveSection extends NoteSection {
  neuroExam?: NeuroExam;
}

export interface NeuroExam {
  mentalStatus?: string;
  cranialNerves?: string;
  motor?: string;
  sensory?: string;
  reflexes?: string;
  coordination?: string;
  gait?: string;
}

export interface AssessmentSection extends NoteSection {
  problems: Problem[];
}

export interface Problem {
  diagnosis: string;
  icd10?: string;
  differential: string[];
  planMatchId?: string; // references a Neuro Plans plan ID
}

export interface PlanSection extends NoteSection {
  items: PlanItem[];
}

export interface PlanItem {
  category: "medication" | "lab" | "imaging" | "referral" | "follow_up" | "other";
  description: string;
}

// --- Knowledge Base ---

export interface PlanMatch {
  planId: string;
  planTitle: string;
  matchScore: number; // 0-1
  matchedOn: "icd10" | "keyword" | "semantic";
}

export interface MedicationMention {
  name: string;
  doseMentioned?: string;
  routeMentioned?: string;
  frequencyMentioned?: string;
  dbMatch: boolean;
  doseDiscrepancy?: DoseDiscrepancy;
}

export interface DoseDiscrepancy {
  dictatedDose: string;
  recommendedRange: string;
  severity: "info" | "warning";
}

export interface Icd10Suggestion {
  code: string;
  description: string;
  confidence: number;
  source: "plan_match" | "extraction";
}

// --- Audio ---

export interface AudioConfig {
  sampleRate: number; // Hz (default 16000)
  channels: number; // 1 = mono
  format: "webm" | "pcm" | "wav";
}

// --- API ---

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string; // NEVER contains PHI — generic only
}
