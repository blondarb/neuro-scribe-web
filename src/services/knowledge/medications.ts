/**
 * Medication Lookup Service
 *
 * Loads medications.json from the neuro-plans knowledge base and provides
 * fast lookup by name/brand name, dose validation, and context-specific data.
 *
 * NO PHI — this module only handles reference medication data.
 */

import { readFileSync } from "fs";
import type { MedicationData, MedicationContext, DoseValidation } from "./index.js";
import { logger } from "@shared/logger.js";

/** Shape of a medication in medications.json */
interface MedEntry {
  id: string;
  name: string;
  genericName: string;
  brandNames: string[];
  drugClass: string;
  mechanisms: string[];
  routes: string[];
  formulations: string[];
  contexts: Record<
    string,
    {
      indication: string;
      doseOptions: Array<{ text: string; orderSentence: string }>;
      startingDose: string;
      maxDose: string;
      titration: string;
      notes: string;
      settings?: Record<string, string>;
      _sourcePlans?: string[];
    }
  >;
  safety?: {
    blackBoxWarnings: string[];
    contraindications: string[];
    precautions: string[];
    drugInteractions: Array<{ drug: string; severity: string; effect: string }>;
    pregnancyCategory: string;
    lactation: string;
  };
  monitoring?: {
    baseline: string[];
    ongoing: string[];
    frequency: string;
  };
}

/** In-memory medication index */
interface MedIndex {
  meds: Map<string, MedEntry>;
  nameIndex: Map<string, string>; // lowercase name/brand → med ID
}

let index: MedIndex | null = null;

/**
 * Load and index medications.json.
 */
export function loadMedications(jsonPath: string): void {
  const raw = readFileSync(jsonPath, "utf-8");
  const data = JSON.parse(raw) as { _metadata?: unknown; medications: Record<string, MedEntry> };

  const meds = new Map<string, MedEntry>();
  const nameIndex = new Map<string, string>();

  const medsData = data.medications || data;

  for (const [id, med] of Object.entries(medsData)) {
    if (id === "_metadata" || !med.name) continue;

    // Skip withdrawn medications
    if (med.name.startsWith("~~")) continue;

    meds.set(id, med);

    // Index by generic name
    if (med.genericName) {
      nameIndex.set(med.genericName.toLowerCase(), id);
    }

    // Index by display name
    if (med.name) {
      nameIndex.set(med.name.toLowerCase(), id);
    }

    // Index by brand names
    for (const brand of med.brandNames || []) {
      if (brand && !brand.startsWith("~~")) {
        nameIndex.set(brand.toLowerCase(), id);
      }
    }

    // Index by ID itself
    nameIndex.set(id.toLowerCase(), id);
  }

  index = { meds, nameIndex };
  logger.info("knowledge.medications.loaded", {
    medicationName: `${meds.size} medications`,
    message: `Loaded ${meds.size} medications, ${nameIndex.size} name variants`,
  });
}

/**
 * Look up a medication by name, brand name, or generic name.
 * Case-insensitive matching.
 */
export function lookupMedication(
  name: string,
  context?: string,
): MedicationData | null {
  if (!index) throw new Error("Medications not loaded. Call loadMedications() first.");

  const id = index.nameIndex.get(name.toLowerCase());
  if (!id) return null;

  const med = index.meds.get(id);
  if (!med) return null;

  // Build contexts array
  const contexts: MedicationContext[] = [];
  for (const [ctxId, ctx] of Object.entries(med.contexts || {})) {
    if (context && ctxId !== context) continue;
    if (ctx.indication.startsWith("~~") || ctx.indication.startsWith("**WITHDRAWN")) continue;

    contexts.push({
      indication: ctx.indication,
      dosing: ctx.startingDose || "",
      route: med.routes?.[0] || "",
      frequency: "",
      priority: ctx.settings?.OPD === "ROUTINE" ? "routine" : "stat",
    });
  }

  return {
    name: med.name,
    brandNames: (med.brandNames || []).filter((b) => !b.startsWith("~~")),
    drugClass: med.drugClass || "",
    contexts,
    contraindications: med.safety?.contraindications || [],
    monitoring: [
      ...(med.monitoring?.baseline || []),
      ...(med.monitoring?.ongoing || []),
    ],
    settings: {
      ed: hasSettingEnabled(med, "ED"),
      hosp: hasSettingEnabled(med, "HOSP"),
      opd: hasSettingEnabled(med, "OPD"),
      icu: hasSettingEnabled(med, "ICU"),
    },
  };
}

/**
 * Check if a medication is used in a given clinical setting.
 */
function hasSettingEnabled(med: MedEntry, setting: string): boolean {
  for (const ctx of Object.values(med.contexts || {})) {
    if (ctx.settings && ctx.settings[setting] && ctx.settings[setting] !== "-") {
      return true;
    }
  }
  return false;
}

/**
 * Validate a dictated dose against recommended ranges.
 */
export function validateDose(
  medicationName: string,
  mentionedDose: string,
  indication?: string,
): DoseValidation {
  if (!index) throw new Error("Medications not loaded. Call loadMedications() first.");

  const id = index.nameIndex.get(medicationName.toLowerCase());
  if (!id) {
    return {
      isValid: true, // Can't validate unknown meds — don't false-alarm
      mentionedDose,
      message: "Medication not found in database — unable to validate",
    };
  }

  const med = index.meds.get(id);
  if (!med) {
    return { isValid: true, mentionedDose };
  }

  // Find the relevant context
  let matchedContext: (typeof med.contexts)[string] | null = null;

  if (indication) {
    // Try exact context match
    for (const [, ctx] of Object.entries(med.contexts || {})) {
      if (ctx.indication.toLowerCase().includes(indication.toLowerCase())) {
        matchedContext = ctx;
        break;
      }
    }
  }

  // Fall back to first context with dosing data
  if (!matchedContext) {
    for (const ctx of Object.values(med.contexts || {})) {
      if (ctx.startingDose || ctx.maxDose) {
        matchedContext = ctx;
        break;
      }
    }
  }

  if (!matchedContext || !matchedContext.maxDose) {
    return { isValid: true, mentionedDose, message: "No dosing data available for validation" };
  }

  // Extract numeric dose from mentioned dose string
  const mentionedNum = extractDoseNumber(mentionedDose);
  const maxNum = extractDoseNumber(matchedContext.maxDose);

  if (mentionedNum === null || maxNum === null) {
    return {
      isValid: true,
      mentionedDose,
      recommendedRange: `Starting: ${matchedContext.startingDose}, Max: ${matchedContext.maxDose}`,
      message: "Unable to parse dose for comparison",
    };
  }

  const recommendedRange = `Starting: ${matchedContext.startingDose}, Max: ${matchedContext.maxDose}`;

  if (mentionedNum > maxNum) {
    return {
      isValid: false,
      mentionedDose,
      recommendedRange,
      severity: "warning",
      message: `Dose ${mentionedDose} exceeds maximum recommended dose of ${matchedContext.maxDose}`,
    };
  }

  return {
    isValid: true,
    mentionedDose,
    recommendedRange,
  };
}

/**
 * Extract the numeric portion of a dose string.
 * "500 mg" → 500, "500mg BID" → 500, "10-25 mg" → 25 (takes upper bound)
 */
function extractDoseNumber(doseStr: string): number | null {
  // Match patterns like "500", "500 mg", "10-25 mg", "1.5 mg"
  const rangeMatch = doseStr.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/);
  if (rangeMatch) {
    return parseFloat(rangeMatch[2]!); // Upper bound
  }

  const singleMatch = doseStr.match(/(\d+(?:\.\d+)?)/);
  if (singleMatch) {
    return parseFloat(singleMatch[1]!);
  }

  return null;
}

/**
 * Get the total number of loaded medications.
 */
export function getMedicationCount(): number {
  return index?.meds.size || 0;
}

/**
 * Search medications by partial name match.
 */
export function searchMedications(query: string, limit = 10): string[] {
  if (!index) return [];
  const q = query.toLowerCase();
  const results: string[] = [];

  for (const [name, id] of index.nameIndex) {
    if (name.includes(q)) {
      const med = index.meds.get(id);
      if (med && !results.includes(med.name)) {
        results.push(med.name);
        if (results.length >= limit) break;
      }
    }
  }

  return results;
}
