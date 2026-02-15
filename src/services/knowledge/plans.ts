/**
 * Plan Matching Engine
 *
 * Loads plans.json from the neuro-plans knowledge base and provides
 * fast lookup by ICD-10 code, diagnosis text, and keyword search.
 *
 * NO PHI — this module only handles reference clinical data.
 */

import { readFileSync } from "fs";
import type { PlanMatch } from "@shared/types.js";
import type { PlanQuery } from "./index.js";
import { logger } from "@shared/logger.js";

/** Shape of a plan in plans.json */
interface PlanEntry {
  id: string;
  title: string;
  version: string;
  icd10: string[];
  scope: string;
  notes: unknown[];
  sections: Record<string, unknown>;
  differential: unknown[];
  evidence: unknown[];
  monitoring: unknown[];
  disposition: unknown[];
}

/** In-memory plan index */
interface PlanIndex {
  plans: Map<string, PlanEntry>;
  icd10Index: Map<string, string[]>; // ICD-10 code → plan IDs
  keywordIndex: Map<string, string[]>; // lowercase term → plan IDs
}

let index: PlanIndex | null = null;

/**
 * Extract a clean ICD-10 code from the raw string in plans.json.
 * plans.json format: "I63.9 (Cerebral infarction, unspecified)" or "** I63.9 (...)"
 */
function extractIcd10Code(raw: string): string | null {
  const match = raw.match(/\*{0,2}\s*([A-Z]\d{1,2}(?:\.\d{1,4})?)/);
  return match?.[1] ?? null;
}

/**
 * Tokenize text into lowercase keywords, filtering out noise words.
 */
function tokenize(text: string): string[] {
  const stopWords = new Set([
    "the", "a", "an", "and", "or", "of", "in", "to", "for", "with",
    "is", "are", "was", "were", "be", "been", "not", "no", "on",
    "at", "by", "from", "this", "that", "it", "as", "if", "but",
    "see", "also", "may", "can", "will", "should", "would", "could",
    "template", "plan", "management", "evaluation", "assessment",
  ]);

  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w));
}

/**
 * Load and index plans.json.
 */
export function loadPlans(jsonPath: string): void {
  const raw = readFileSync(jsonPath, "utf-8");
  const data = JSON.parse(raw) as Record<string, PlanEntry>;

  const plans = new Map<string, PlanEntry>();
  const icd10Index = new Map<string, string[]>();
  const keywordIndex = new Map<string, string[]>();

  for (const [id, plan] of Object.entries(data)) {
    plans.set(id, plan);

    // Index ICD-10 codes
    for (const rawCode of plan.icd10 || []) {
      const code = extractIcd10Code(rawCode);
      if (code) {
        const existing = icd10Index.get(code) || [];
        existing.push(id);
        icd10Index.set(code, existing);
      }
    }

    // Index title + scope keywords
    const titleTokens = tokenize(plan.title);
    const scopeTokens = tokenize(plan.scope || "");
    for (const token of [...titleTokens, ...scopeTokens]) {
      const existing = keywordIndex.get(token) || [];
      if (!existing.includes(id)) {
        existing.push(id);
        keywordIndex.set(token, existing);
      }
    }
  }

  index = { plans, icd10Index, keywordIndex };
  logger.info("knowledge.plans.loaded", {
    planId: `${plans.size} plans`,
    message: `Loaded ${plans.size} plans, ${icd10Index.size} ICD-10 codes, ${keywordIndex.size} keywords`,
  });
}

/**
 * Match plans against a query.
 * Returns ranked results sorted by match score.
 */
export function matchPlans(query: PlanQuery): PlanMatch[] {
  if (!index) throw new Error("Plans not loaded. Call loadPlans() first.");

  const scores = new Map<string, { score: number; matchedOn: PlanMatch["matchedOn"] }>();

  // ICD-10 exact match (highest confidence)
  if (query.icd10Code) {
    const matches = index.icd10Index.get(query.icd10Code) || [];
    for (const planId of matches) {
      scores.set(planId, { score: 1.0, matchedOn: "icd10" });
    }
  }

  // Keyword match from diagnosis text
  if (query.diagnosisText) {
    const queryTokens = tokenize(query.diagnosisText);
    const planHits = new Map<string, number>();

    for (const token of queryTokens) {
      const matches = index.keywordIndex.get(token) || [];
      for (const planId of matches) {
        planHits.set(planId, (planHits.get(planId) || 0) + 1);
      }
    }

    for (const [planId, hitCount] of planHits) {
      const score = Math.min(hitCount / Math.max(queryTokens.length, 1), 0.95);
      const existing = scores.get(planId);
      if (!existing || existing.score < score) {
        scores.set(planId, { score, matchedOn: "keyword" });
      }
    }
  }

  // Explicit keyword list
  if (query.keywords && query.keywords.length > 0) {
    const planHits = new Map<string, number>();

    for (const kw of query.keywords) {
      const token = kw.toLowerCase().trim();
      const matches = index.keywordIndex.get(token) || [];
      for (const planId of matches) {
        planHits.set(planId, (planHits.get(planId) || 0) + 1);
      }
    }

    for (const [planId, hitCount] of planHits) {
      const score = Math.min(hitCount / query.keywords.length, 0.9);
      const existing = scores.get(planId);
      if (!existing || existing.score < score) {
        scores.set(planId, { score, matchedOn: "keyword" });
      }
    }
  }

  // Build results
  const results: PlanMatch[] = [];
  for (const [planId, { score, matchedOn }] of scores) {
    const plan = index.plans.get(planId);
    if (plan) {
      results.push({
        planId,
        planTitle: plan.title,
        matchScore: Math.round(score * 100) / 100,
        matchedOn,
      });
    }
  }

  // Sort by score descending, limit to top 10
  results.sort((a, b) => b.matchScore - a.matchScore);
  return results.slice(0, 10);
}

/**
 * Get a specific plan by ID.
 */
export function getPlan(planId: string): PlanEntry | null {
  if (!index) throw new Error("Plans not loaded. Call loadPlans() first.");
  return index.plans.get(planId) || null;
}

/**
 * Get all ICD-10 codes associated with a plan.
 */
export function getPlanIcd10Codes(planId: string): string[] {
  const plan = getPlan(planId);
  if (!plan) return [];
  return (plan.icd10 || [])
    .map(extractIcd10Code)
    .filter((c): c is string => c !== null);
}

/**
 * Get the total number of loaded plans.
 */
export function getPlanCount(): number {
  return index?.plans.size || 0;
}
