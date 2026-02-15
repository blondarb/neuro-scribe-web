/**
 * Knowledge Service — Orchestrator
 *
 * Initializes and provides access to the plan matching, medication lookup,
 * and ICD-10 suggestion engines. This is the main entry point for all
 * knowledge base operations.
 *
 * NO PHI — all data here is clinical reference material.
 */

import type { PlanMatch, Icd10Suggestion } from "@shared/types.js";
import type {
  KnowledgeService,
  PlanQuery,
  MedicationData,
  DoseValidation,
  EvidenceCitation,
} from "./index.js";
import {
  loadPlans,
  matchPlans as matchPlansImpl,
  getPlan,
  getPlanCount,
} from "./plans.js";
import {
  loadMedications,
  lookupMedication as lookupMedImpl,
  validateDose as validateDoseImpl,
  getMedicationCount,
} from "./medications.js";
import { suggestIcd10 as suggestIcd10Impl } from "./icd10.js";
import { logger } from "@shared/logger.js";

let initialized = false;

/**
 * Initialize the knowledge service by loading data files.
 * Call once at startup.
 */
export function initKnowledgeService(
  plansPath?: string,
  medsPath?: string,
): void {
  const pPath = plansPath || process.env.PLANS_JSON_PATH || "./data/plans.json";
  const mPath =
    medsPath ||
    process.env.MEDICATIONS_JSON_PATH ||
    "./data/medications.json";

  loadPlans(pPath);
  loadMedications(mPath);
  initialized = true;

  logger.info("knowledge.initialized", {
    message: `Knowledge service ready: ${getPlanCount()} plans, ${getMedicationCount()} medications`,
  });
}

/**
 * Get the knowledge service instance.
 * Auto-initializes on first call if not already initialized.
 */
export function getKnowledgeService(): KnowledgeService {
  if (!initialized) {
    initKnowledgeService();
  }

  return {
    async matchPlans(query: PlanQuery): Promise<PlanMatch[]> {
      return matchPlansImpl(query);
    },

    async lookupMedication(
      name: string,
      context?: string,
    ): Promise<MedicationData | null> {
      return lookupMedImpl(name, context);
    },

    async validateDose(
      medicationName: string,
      mentionedDose: string,
      indication?: string,
    ): Promise<DoseValidation> {
      return validateDoseImpl(medicationName, mentionedDose, indication);
    },

    async suggestIcd10(assessmentText: string): Promise<Icd10Suggestion[]> {
      return suggestIcd10Impl(assessmentText);
    },

    async getEvidence(planId: string): Promise<EvidenceCitation[]> {
      const plan = getPlan(planId);
      if (!plan) return [];

      return ((plan.evidence as Array<{ text?: string; pmid?: string; url?: string }>) || []).map(
        (e) => ({
          text: typeof e === "string" ? e : e.text || "",
          pmid: typeof e === "object" ? e.pmid : undefined,
          url: typeof e === "object" ? e.url : undefined,
          planId,
        }),
      );
    },
  };
}
