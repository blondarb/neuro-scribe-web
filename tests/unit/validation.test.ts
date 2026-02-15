/**
 * Tests for request validation schemas (src/api/validation.ts)
 */

import { describe, it, expect } from "vitest";
import {
  createEncounterSchema,
  transcribeUploadSchema,
  generateNoteSchema,
  updateNoteSchema,
  validateDoseSchema,
  icd10SuggestionSchema,
  paginationSchema,
} from "@/api/validation.js";

describe("Request Validation Schemas", () => {
  describe("createEncounterSchema", () => {
    it("should accept empty body (defaults to soap)", () => {
      const result = createEncounterSchema.parse({});
      expect(result.noteType).toBe("soap");
    });

    it("should accept valid noteType", () => {
      const result = createEncounterSchema.parse({ noteType: "consult" });
      expect(result.noteType).toBe("consult");
    });

    it("should reject invalid noteType", () => {
      expect(() => createEncounterSchema.parse({ noteType: "invalid" })).toThrow();
    });
  });

  describe("transcribeUploadSchema", () => {
    it("should use defaults for empty body", () => {
      const result = transcribeUploadSchema.parse({});
      expect(result.format).toBe("webm");
      expect(result.sampleRate).toBe(16000);
      expect(result.channels).toBe(1);
    });

    it("should accept wav format", () => {
      const result = transcribeUploadSchema.parse({ format: "wav" });
      expect(result.format).toBe("wav");
    });

    it("should reject out-of-range sample rate", () => {
      expect(() =>
        transcribeUploadSchema.parse({ sampleRate: 100 }),
      ).toThrow();
    });
  });

  describe("generateNoteSchema", () => {
    it("should default to soap with knowledge enabled", () => {
      const result = generateNoteSchema.parse({});
      expect(result.noteType).toBe("soap");
      expect(result.includeKnowledge).toBe(true);
    });

    it("should accept all valid options", () => {
      const result = generateNoteSchema.parse({
        noteType: "hp",
        includeKnowledge: false,
        style: "bullets",
        showConfidence: true,
      });
      expect(result.noteType).toBe("hp");
      expect(result.includeKnowledge).toBe(false);
      expect(result.style).toBe("bullets");
    });
  });

  describe("updateNoteSchema", () => {
    it("should accept single section update", () => {
      const result = updateNoteSchema.parse({
        sections: { subjective: "Patient reports headache for 3 days" },
      });
      expect(result.sections.subjective).toBeDefined();
    });

    it("should accept multiple section updates", () => {
      const result = updateNoteSchema.parse({
        sections: {
          subjective: "Updated subjective",
          assessment: "Updated assessment",
        },
      });
      expect(result.sections.subjective).toBeDefined();
      expect(result.sections.assessment).toBeDefined();
    });

    it("should reject empty sections object", () => {
      expect(() => updateNoteSchema.parse({ sections: {} })).toThrow();
    });
  });

  describe("validateDoseSchema", () => {
    it("should accept valid dose validation request", () => {
      const result = validateDoseSchema.parse({
        medicationName: "levetiracetam",
        mentionedDose: "500 mg",
      });
      expect(result.medicationName).toBe("levetiracetam");
    });

    it("should reject missing medicationName", () => {
      expect(() =>
        validateDoseSchema.parse({ mentionedDose: "500 mg" }),
      ).toThrow();
    });

    it("should reject empty medicationName", () => {
      expect(() =>
        validateDoseSchema.parse({ medicationName: "", mentionedDose: "500 mg" }),
      ).toThrow();
    });
  });

  describe("icd10SuggestionSchema", () => {
    it("should accept assessment text", () => {
      const result = icd10SuggestionSchema.parse({
        assessmentText: "New onset seizure, likely focal",
      });
      expect(result.assessmentText).toContain("seizure");
    });

    it("should reject empty text", () => {
      expect(() =>
        icd10SuggestionSchema.parse({ assessmentText: "" }),
      ).toThrow();
    });
  });

  describe("paginationSchema", () => {
    it("should use defaults for empty query", () => {
      const result = paginationSchema.parse({});
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it("should parse string page/limit", () => {
      const result = paginationSchema.parse({ page: "3", limit: "50" });
      expect(result.page).toBe(3);
      expect(result.limit).toBe(50);
    });

    it("should reject limit > 100", () => {
      expect(() => paginationSchema.parse({ limit: "200" })).toThrow();
    });

    it("should reject page < 1", () => {
      expect(() => paginationSchema.parse({ page: "0" })).toThrow();
    });
  });
});
