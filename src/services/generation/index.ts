/**
 * Note Generation Service
 *
 * Transforms transcripts into structured clinical notes using Claude API.
 * Leverages Neuro Plans knowledge base for clinical grounding.
 *
 * PHI handling: Transcript text is sent to Claude API (BAA required).
 * No PHI in logs or error messages. All access audited.
 */

import type {
  Transcript,
  ClinicalNote,
  NoteType,
  PlanMatch,
  MedicationMention,
} from "@shared/types.js";

export interface NoteGenerationService {
  /**
   * Generate a clinical note from a transcript.
   * Multi-step pipeline: extract sections → enrich with knowledge → assemble note.
   */
  generateNote(
    transcript: Transcript,
    noteType: NoteType,
    options?: GenerationOptions,
  ): Promise<ClinicalNote>;

  /**
   * Regenerate a specific section of an existing note.
   * Used when physician rejects a section and wants AI to retry.
   */
  regenerateSection(
    transcript: Transcript,
    sectionName: string,
    feedback?: string,
  ): Promise<string>;
}

export interface GenerationOptions {
  /** Include knowledge base enrichment (plan matching, med validation) */
  includeKnowledge?: boolean;
  /** Preferred note template/structure */
  templateId?: string;
  /** Physician preferences for formatting */
  preferences?: PhysicianPreferences;
}

export interface PhysicianPreferences {
  /** Preferred section order */
  sectionOrder?: string[];
  /** Use prose vs. bullet points */
  style?: "prose" | "bullets" | "mixed";
  /** Include confidence scores in output */
  showConfidence?: boolean;
}

// Implementation will use:
// - prompts/section-extract.md for transcript → sections
// - prompts/note-generate.md for sections → clinical note
// - prompts/exam-structure.md for neuro exam parsing
