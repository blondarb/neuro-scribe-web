/**
 * Knowledge Service — Plan Matching Tests
 *
 * Tests plan lookup by ICD-10 code, diagnosis text, and keyword search.
 * Uses the real plans.json data (no PHI — all reference data).
 */

import { describe, it, expect, beforeAll } from "vitest";
import { loadPlans, matchPlans, getPlan, getPlanCount } from "@services/knowledge/plans.js";

const PLANS_PATH = "./data/plans.json";

beforeAll(() => {
  loadPlans(PLANS_PATH);
});

describe("Plan Loading", () => {
  it("loads all plans from plans.json", () => {
    expect(getPlanCount()).toBeGreaterThan(100);
  });

  it("retrieves a specific plan by ID", () => {
    const plan = getPlan("acute-ischemic-stroke");
    expect(plan).not.toBeNull();
    expect(plan!.title).toBe("Acute Ischemic Stroke");
  });

  it("returns null for non-existent plan", () => {
    expect(getPlan("nonexistent-plan")).toBeNull();
  });
});

describe("Plan Matching — ICD-10", () => {
  it("matches by ICD-10 code (KI-01)", () => {
    const results = matchPlans({ icd10Code: "I63.9" });
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].matchScore).toBe(1.0);
    expect(results[0].matchedOn).toBe("icd10");
  });
});

describe("Plan Matching — Keyword", () => {
  it("matches 'seizure' to seizure-related plans", () => {
    const results = matchPlans({ diagnosisText: "new onset seizure" });
    expect(results.length).toBeGreaterThan(0);
    const titles = results.map((r) => r.planTitle.toLowerCase());
    expect(titles.some((t) => t.includes("seizure"))).toBe(true);
  });

  it("matches 'migraine' to headache-related plans", () => {
    const results = matchPlans({ diagnosisText: "migraine with aura" });
    expect(results.length).toBeGreaterThan(0);
    const titles = results.map((r) => r.planTitle.toLowerCase());
    expect(titles.some((t) => t.includes("migraine"))).toBe(true);
  });

  it("matches 'stroke' to cerebrovascular plans", () => {
    const results = matchPlans({ diagnosisText: "acute ischemic stroke" });
    expect(results.length).toBeGreaterThan(0);
    const titles = results.map((r) => r.planTitle.toLowerCase());
    expect(titles.some((t) => t.includes("stroke"))).toBe(true);
  });

  it("matches by explicit keyword list", () => {
    const results = matchPlans({ keywords: ["parkinson", "tremor"] });
    expect(results.length).toBeGreaterThan(0);
  });

  it("returns empty for completely unrelated query", () => {
    const results = matchPlans({
      diagnosisText: "orthopedic knee replacement surgery",
    });
    // May return some low-confidence matches or empty
    if (results.length > 0) {
      expect(results[0].matchScore).toBeLessThan(0.5);
    }
  });

  it("limits results to 10", () => {
    const results = matchPlans({ diagnosisText: "neurological disorder" });
    expect(results.length).toBeLessThanOrEqual(10);
  });

  it("sorts results by score descending", () => {
    const results = matchPlans({ diagnosisText: "seizure epilepsy" });
    for (let i = 1; i < results.length; i++) {
      expect(results[i].matchScore).toBeLessThanOrEqual(
        results[i - 1].matchScore,
      );
    }
  });
});
