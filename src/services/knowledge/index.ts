/**
 * Knowledge Service
 *
 * Bridge between AI-generated notes and the Neuro Plans knowledge base.
 * Provides plan matching, medication lookup, and evidence retrieval.
 *
 * PHI handling: This service contains NO PHI — only clinical reference data.
 */

import type { PlanMatch, MedicationMention, Icd10Suggestion } from "@shared/types.js";

export interface KnowledgeService {
  /**
   * Find matching clinical plans for a given diagnosis or set of keywords.
   */
  matchPlans(query: PlanQuery): Promise<PlanMatch[]>;

  /**
   * Look up a medication in the central database.
   * Returns dosing data, contraindications, monitoring, settings.
   */
  lookupMedication(name: string, context?: string): Promise<MedicationData | null>;

  /**
   * Validate a mentioned dose against recommended ranges.
   */
  validateDose(
    medicationName: string,
    mentionedDose: string,
    indication?: string,
  ): Promise<DoseValidation>;

  /**
   * Get ICD-10 suggestions for an assessment/diagnosis text.
   */
  suggestIcd10(assessmentText: string): Promise<Icd10Suggestion[]>;

  /**
   * Get evidence citations from matched plans.
   */
  getEvidence(planId: string): Promise<EvidenceCitation[]>;
}

export interface PlanQuery {
  /** Free-text diagnosis or clinical description */
  diagnosisText?: string;
  /** ICD-10 code to match directly */
  icd10Code?: string;
  /** Keywords to search across plans */
  keywords?: string[];
}

export interface MedicationData {
  name: string;
  brandNames: string[];
  drugClass: string;
  contexts: MedicationContext[];
  contraindications: string[];
  monitoring: string[];
  settings: {
    ed: boolean;
    hosp: boolean;
    opd: boolean;
    icu: boolean;
  };
}

export interface MedicationContext {
  indication: string;
  dosing: string;
  route: string;
  frequency: string;
  priority: string;
}

export interface DoseValidation {
  isValid: boolean;
  mentionedDose: string;
  recommendedRange?: string;
  severity?: "info" | "warning";
  message?: string;
}

export interface EvidenceCitation {
  text: string;
  pmid?: string;
  url?: string;
  planId: string;
}

// Implementation will load:
// - ../../../docs/data/plans.json (or via API)
// - ../../../docs/data/medications.json (or via API)
