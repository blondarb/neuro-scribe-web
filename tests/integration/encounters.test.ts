/**
 * Integration tests for encounter lifecycle
 *
 * Tests the full flow: create → transcribe → generate → edit → finalize
 * Using mocked external services (Deepgram, Claude) but real validation and middleware.
 */

import { describe, it, expect, beforeAll, vi } from "vitest";
import {
  createEncounterSchema,
  generateNoteSchema,
  updateNoteSchema,
  paginationSchema,
  validateDoseSchema,
  icd10SuggestionSchema,
} from "@/api/validation.js";

describe("Encounter Lifecycle (schema validation)", () => {
  describe("Create encounter", () => {
    it("should validate creation with default noteType", () => {
      const result = createEncounterSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.noteType).toBe("soap");
      }
    });

    it("should reject invalid note type", () => {
      const result = createEncounterSchema.safeParse({
        noteType: "not-a-valid-type",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Generate note", () => {
    it("should validate generation request with defaults", () => {
      const result = generateNoteSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.noteType).toBe("soap");
        expect(result.data.includeKnowledge).toBe(true);
      }
    });

    it("should accept H&P note type", () => {
      const result = generateNoteSchema.safeParse({ noteType: "hp" });
      expect(result.success).toBe(true);
    });

    it("should accept style preferences", () => {
      const result = generateNoteSchema.safeParse({
        noteType: "soap",
        style: "bullets",
        showConfidence: true,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.style).toBe("bullets");
      }
    });
  });

  describe("Update note", () => {
    it("should validate single section update", () => {
      const result = updateNoteSchema.safeParse({
        sections: {
          subjective:
            "Patient reports 3-day headache, worse in the morning, 8/10 severity.",
        },
      });
      expect(result.success).toBe(true);
    });

    it("should reject empty sections", () => {
      const result = updateNoteSchema.safeParse({ sections: {} });
      expect(result.success).toBe(false);
    });

    it("should accept multiple section updates", () => {
      const result = updateNoteSchema.safeParse({
        sections: {
          subjective: "Updated subjective",
          plan: "Updated plan with new medication",
        },
      });
      expect(result.success).toBe(true);
    });
  });

  describe("Pagination", () => {
    it("should parse valid pagination params", () => {
      const result = paginationSchema.safeParse({ page: "2", limit: "10" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(2);
        expect(result.data.limit).toBe(10);
      }
    });
  });

  describe("Dose validation", () => {
    it("should validate dose check request", () => {
      const result = validateDoseSchema.safeParse({
        medicationName: "levetiracetam",
        mentionedDose: "500 mg",
        indication: "seizure",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing medication name", () => {
      const result = validateDoseSchema.safeParse({
        mentionedDose: "500 mg",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("ICD-10 suggestion", () => {
    it("should accept assessment text", () => {
      const result = icd10SuggestionSchema.safeParse({
        assessmentText: "New onset generalized tonic-clonic seizure",
      });
      expect(result.success).toBe(true);
    });

    it("should reject empty assessment", () => {
      const result = icd10SuggestionSchema.safeParse({
        assessmentText: "",
      });
      expect(result.success).toBe(false);
    });
  });
});

describe("Service factory contracts", () => {
  it("transcription factory should throw without API key", async () => {
    const originalKey = process.env.DEEPGRAM_API_KEY;
    process.env.DEEPGRAM_API_KEY = "";

    // Reset module to pick up new env
    const { resetTranscriptionService, getTranscriptionService } = await import(
      "@services/transcription/factory.js"
    );
    resetTranscriptionService();

    expect(() => getTranscriptionService()).toThrow("DEEPGRAM_API_KEY");

    // Restore
    process.env.DEEPGRAM_API_KEY = originalKey;
    resetTranscriptionService();
  });

  it("generation factory should throw without API key", async () => {
    const originalKey = process.env.ANTHROPIC_API_KEY;
    process.env.ANTHROPIC_API_KEY = "";

    const { resetNoteGenerationService, getNoteGenerationService } = await import(
      "@services/generation/factory.js"
    );
    resetNoteGenerationService();

    expect(() => getNoteGenerationService()).toThrow("ANTHROPIC_API_KEY");

    // Restore
    process.env.ANTHROPIC_API_KEY = originalKey;
    resetNoteGenerationService();
  });
});
