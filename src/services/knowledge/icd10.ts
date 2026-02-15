/**
 * ICD-10 Suggestion Engine
 *
 * Suggests ICD-10 codes based on assessment text by cross-referencing
 * against codes stored in the plans.json knowledge base.
 *
 * NO PHI — works on diagnosis text (clinical terminology, not patient data).
 */

import type { Icd10Suggestion } from "@shared/types.js";
import { matchPlans, getPlanIcd10Codes, getPlan } from "./plans.js";

/**
 * Suggest ICD-10 codes for an assessment/diagnosis text.
 *
 * Strategy:
 * 1. Extract any ICD-10 codes already in the text (direct extraction)
 * 2. Match diagnosis text against plans (keyword matching)
 * 3. Extract ICD-10 codes from matched plans
 * 4. Rank by plan match confidence
 */
export function suggestIcd10(assessmentText: string): Icd10Suggestion[] {
  const suggestions: Icd10Suggestion[] = [];
  const seenCodes = new Set<string>();

  // Strategy 1: Direct ICD-10 code extraction from text
  const codeMatches = assessmentText.match(/[A-Z]\d{1,2}\.\d{1,4}/g);
  if (codeMatches) {
    for (const code of codeMatches) {
      if (!seenCodes.has(code)) {
        seenCodes.add(code);
        suggestions.push({
          code,
          description: "Extracted from assessment text",
          confidence: 0.95,
          source: "extraction",
        });
      }
    }
  }

  // Strategy 2: Match plans and extract their ICD-10 codes
  const planResults = matchPlans({ diagnosisText: assessmentText });

  for (const match of planResults) {
    if (match.matchScore < 0.3) continue;

    const codes = getPlanIcd10Codes(match.planId);
    const plan = getPlan(match.planId);

    for (const code of codes) {
      if (!seenCodes.has(code)) {
        seenCodes.add(code);

        // Try to get a description from the raw plan data
        let description = `From plan: ${match.planTitle}`;
        if (plan?.icd10) {
          const rawEntry = (plan.icd10 as string[]).find((entry: string) =>
            entry.includes(code),
          );
          if (rawEntry) {
            const descMatch = rawEntry.match(/\(([^)]+)\)/);
            if (descMatch) {
              description = descMatch[1]!;
            }
          }
        }

        suggestions.push({
          code,
          description,
          confidence: Math.round(match.matchScore * 0.85 * 100) / 100,
          source: "plan_match",
        });
      }
    }
  }

  // Sort by confidence descending, limit to top 10
  suggestions.sort((a, b) => b.confidence - a.confidence);
  return suggestions.slice(0, 10);
}
