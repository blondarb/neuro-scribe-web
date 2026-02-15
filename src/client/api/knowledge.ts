/**
 * Knowledge API — Plan search, medication lookup, ICD-10 suggestions.
 */

import { get } from "./client";

export interface PlanMatch {
  planId: string;
  title: string;
  score: number;
  icd10: string[];
}

export interface MedicationInfo {
  name: string;
  brandNames: string[];
  drugClass: string;
  routes: string[];
  maxDose?: string;
  renalAdjustment?: string;
  hepaticAdjustment?: string;
}

export interface Icd10Suggestion {
  code: string;
  description: string;
  source: string;
}

export function searchPlans(diagnosis: string) {
  return get<{ data: PlanMatch[] }>(`/knowledge/plans?diagnosis=${encodeURIComponent(diagnosis)}`);
}

export function lookupMedication(name: string) {
  return get<{ data: MedicationInfo }>(`/knowledge/medications/${encodeURIComponent(name)}`);
}

export function suggestIcd10(text: string) {
  return get<{ data: Icd10Suggestion[] }>(`/knowledge/icd10?text=${encodeURIComponent(text)}`);
}
