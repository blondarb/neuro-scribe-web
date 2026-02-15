/**
 * Encounter API — All encounter lifecycle operations.
 */

import { get, post, patch, postRaw } from "./client";

export interface Encounter {
  id: string;
  physicianId: string;
  status: "recording" | "transcribed" | "generating" | "drafted" | "reviewed" | "finalized";
  createdAt: string;
  updatedAt: string;
}

export interface TranscriptSegment {
  speaker: "physician" | "patient" | "unknown";
  text: string;
  startTime: number;
  endTime: number;
  confidence: number;
}

export interface Transcript {
  id: string;
  encounterId: string;
  segments: TranscriptSegment[];
  durationSeconds: number;
  wordCount: number;
}

export interface NoteSections {
  chiefComplaint?: string;
  hpiNarrative?: string;
  reviewOfSystems?: string;
  examination?: string;
  assessment?: string;
  plan?: string;
  [key: string]: string | undefined;
}

export interface ClinicalNote {
  id: string;
  encounterId: string;
  noteType: string;
  sections: NoteSections;
  metadata: {
    planMatches?: Array<{ planId: string; title: string; score: number }>;
    icd10Suggestions?: Array<{ code: string; description: string }>;
    medications?: Array<{ name: string; doseValid: boolean }>;
  };
  status: "draft" | "reviewed" | "finalized";
}

export interface EncounterDetail extends Encounter {
  transcript?: Transcript;
  note?: ClinicalNote;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// --- API calls ---

export function createEncounter() {
  return post<{ data: Encounter }>("/encounters");
}

export function listEncounters(page = 1, limit = 20) {
  return get<PaginatedResponse<Encounter>>(`/encounters?page=${page}&limit=${limit}`);
}

export function getEncounter(id: string) {
  return get<{ data: EncounterDetail }>(`/encounters/${id}`);
}

export function transcribeAudio(encounterId: string, audio: Blob, mimeType: string) {
  return postRaw<{ data: Transcript }>(
    `/encounters/${encounterId}/transcribe`,
    audio,
    mimeType,
  );
}

export function generateNote(encounterId: string, noteType = "soap") {
  return post<{ data: ClinicalNote }>(`/encounters/${encounterId}/generate`, { noteType });
}

export function updateNote(encounterId: string, sections: Partial<NoteSections>) {
  return patch<{ data: ClinicalNote }>(`/encounters/${encounterId}/note`, { sections });
}

export function finalizeNote(encounterId: string) {
  return post<{ data: ClinicalNote }>(`/encounters/${encounterId}/finalize`);
}
