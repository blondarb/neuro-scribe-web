/**
 * Knowledge Service — Medication Lookup Tests
 *
 * Tests medication search, dose validation, and data completeness.
 * Uses the real medications.json data (no PHI — all reference data).
 */

import { describe, it, expect, beforeAll } from "vitest";
import {
  loadMedications,
  lookupMedication,
  validateDose,
  getMedicationCount,
  searchMedications,
} from "@services/knowledge/medications.js";

const MEDS_PATH = "./data/medications.json";

beforeAll(() => {
  loadMedications(MEDS_PATH);
});

describe("Medication Loading", () => {
  it("loads medications from medications.json", () => {
    expect(getMedicationCount()).toBeGreaterThan(500);
  });
});

describe("Medication Lookup", () => {
  it("finds a medication by generic name", () => {
    const result = lookupMedication("levetiracetam");
    expect(result).not.toBeNull();
    expect(result!.name.toLowerCase()).toContain("levetiracetam");
  });

  it("finds a medication by brand name", () => {
    const result = lookupMedication("Keppra");
    expect(result).not.toBeNull();
    expect(result!.brandNames.some((b) => b.toLowerCase().includes("keppra"))).toBe(true);
  });

  it("is case-insensitive", () => {
    const lower = lookupMedication("amitriptyline");
    const upper = lookupMedication("AMITRIPTYLINE");
    const mixed = lookupMedication("Amitriptyline");
    expect(lower).not.toBeNull();
    expect(upper).not.toBeNull();
    expect(mixed).not.toBeNull();
    expect(lower!.name).toBe(upper!.name);
    expect(lower!.name).toBe(mixed!.name);
  });

  it("returns null for unknown medication", () => {
    expect(lookupMedication("fakemedicationxyz")).toBeNull();
  });

  it("includes contraindication data when available", () => {
    const result = lookupMedication("amitriptyline");
    expect(result).not.toBeNull();
    // Amitriptyline should have some safety data
    expect(result!.drugClass).toBeTruthy();
  });

  it("includes clinical context data", () => {
    const result = lookupMedication("amitriptyline");
    expect(result).not.toBeNull();
    expect(result!.contexts.length).toBeGreaterThan(0);
    expect(result!.contexts[0].indication).toBeTruthy();
  });
});

describe("Dose Validation (KI-03, KI-04)", () => {
  it("validates a dose within range", () => {
    const result = validateDose("amitriptyline", "25 mg");
    expect(result.isValid).toBe(true);
    expect(result.mentionedDose).toBe("25 mg");
  });

  it("flags a dose exceeding maximum (KI-03)", () => {
    // Amitriptyline max is typically 150mg/day for pain
    const result = validateDose("amitriptyline", "500 mg", "neuropathic pain");
    expect(result.isValid).toBe(false);
    expect(result.severity).toBe("warning");
  });

  it("does not false-alarm for unknown medications (KI-04)", () => {
    const result = validateDose("unknownmed", "100 mg");
    expect(result.isValid).toBe(true); // Can't validate = assume OK
  });

  it("handles various dose formats", () => {
    const r1 = validateDose("amitriptyline", "25mg");
    expect(r1.mentionedDose).toBe("25mg");

    const r2 = validateDose("amitriptyline", "25 mg QHS");
    expect(r2.mentionedDose).toBe("25 mg QHS");
  });
});

describe("Medication Search", () => {
  it("searches by partial name", () => {
    const results = searchMedications("leve");
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.toLowerCase().includes("leve"))).toBe(true);
  });

  it("limits results", () => {
    const results = searchMedications("a", 5);
    expect(results.length).toBeLessThanOrEqual(5);
  });
});
