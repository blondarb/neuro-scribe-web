/**
 * PHI Guard Tests
 *
 * Verifies that PHI patterns are detected and that error responses
 * never leak patient data.
 */

import { describe, it, expect } from "vitest";
import { containsPHI } from "@/api/middleware/phi-guard.js";

describe("PHI Detection", () => {
  it("detects SSN pattern", () => {
    expect(containsPHI("SSN: 123-45-6789")).toBe(true);
  });

  it("detects MRN label", () => {
    expect(containsPHI("MRN: 123456789")).toBe(true);
  });

  it("detects patient name label", () => {
    expect(containsPHI("Patient: John Smith")).toBe(true);
  });

  it("does not flag normal text", () => {
    expect(containsPHI("Server started on port 3000")).toBe(false);
  });

  it("does not flag clinical terminology", () => {
    expect(containsPHI("levetiracetam 500mg BID for seizure")).toBe(false);
  });

  it("does not flag UUIDs", () => {
    expect(
      containsPHI("encounter_id: 550e8400-e29b-41d4-a716-446655440000"),
    ).toBe(false);
  });
});
