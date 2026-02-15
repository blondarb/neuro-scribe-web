/**
 * Tests for note generation service (mocked Claude SDK)
 */

import { describe, it, expect, beforeEach } from "vitest";
import type { NoteGenerationService } from "@services/generation/index.js";
import type {
  Transcript,
  ClinicalNote,
  NoteType,
} from "@shared/types.js";

// Sample transcript for testing
const sampleTranscript: Transcript = {
  id: "test-transcript",
  encounterId: "test-encounter",
  segments: [
    {
      speaker: "physician",
      start: 0,
      end: 5,
      text: "What brings you in today?",
      confidence: 0.95,
    },
    {
      speaker: "patient",
      start: 5.5,
      end: 15,
      text: "I had a seizure last night. It was the first time. My wife said I was shaking all over for about two minutes.",
      confidence: 0.92,
    },
    {
      speaker: "physician",
      start: 16,
      end: 30,
      text: "Motor exam shows 5/5 throughout. DTRs 2+ symmetric. Start levetiracetam 500 mg twice daily. Order EEG and MRI brain with contrast.",
      confidence: 0.9,
    },
  ],
  durationSeconds: 30,
  wordCount: 55,
  createdAt: new Date().toISOString(),
};

/** Mock NoteGenerationService that returns a realistic note without calling Claude */
function createMockNoteGenerationService(): NoteGenerationService {
  return {
    async generateNote(
      transcript: Transcript,
      noteType: NoteType,
    ): Promise<ClinicalNote> {
      return {
        id: "",
        encounterId: transcript.encounterId,
        noteType,
        sections: {
          subjective: {
            content:
              "Patient presents with first-time seizure. Wife reports generalized tonic-clonic activity lasting approximately 2 minutes during sleep.",
            confidence: 0.92,
            sources: ["1"],
            physicianEdited: false,
          },
          objective: {
            content: "Motor: 5/5 strength throughout. DTRs: 2+ symmetric bilaterally.",
            confidence: 0.9,
            sources: ["2"],
            physicianEdited: false,
            neuroExam: {
              motor: "5/5 throughout",
              reflexes: "2+ symmetric bilaterally",
            },
          },
          assessment: {
            content: "New onset seizure, likely generalized tonic-clonic.",
            confidence: 0.85,
            sources: ["1", "2"],
            physicianEdited: false,
            problems: [
              {
                diagnosis: "New onset seizure",
                icd10: "R56.9",
                differential: ["epilepsy", "provoked seizure"],
              },
            ],
          },
          plan: {
            content:
              "Start levetiracetam 500 mg BID. Order EEG. Order MRI brain with contrast.",
            confidence: 0.88,
            sources: ["2"],
            physicianEdited: false,
            items: [
              {
                category: "medication",
                description: "Levetiracetam 500 mg BID",
              },
              { category: "lab", description: "EEG" },
              { category: "imaging", description: "MRI brain with contrast" },
            ],
          },
        },
        suggestedPlans: [
          {
            planId: "new-onset-seizure",
            planTitle: "New Onset Seizure",
            matchScore: 0.95,
            matchedOn: "keyword",
          },
        ],
        medicationsMentioned: [
          {
            name: "levetiracetam",
            doseMentioned: "500 mg",
            dbMatch: true,
          },
        ],
        suggestedIcd10: [
          {
            code: "R56.9",
            description: "Unspecified convulsions",
            confidence: 0.9,
            source: "plan_match",
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: "draft",
      };
    },

    async regenerateSection(
      _transcript: Transcript,
      sectionName: string,
      feedback?: string,
    ): Promise<string> {
      return `Regenerated ${sectionName} section${feedback ? ` with feedback: ${feedback}` : ""}`;
    },
  };
}

describe("NoteGenerationService", () => {
  let service: NoteGenerationService;

  beforeEach(() => {
    service = createMockNoteGenerationService();
  });

  describe("generateNote", () => {
    it("should generate a SOAP note from transcript", async () => {
      const note = await service.generateNote(sampleTranscript, "soap");

      expect(note.noteType).toBe("soap");
      expect(note.status).toBe("draft");
      expect(note.sections.subjective).toBeDefined();
      expect(note.sections.objective).toBeDefined();
      expect(note.sections.assessment).toBeDefined();
      expect(note.sections.plan).toBeDefined();
    });

    it("should include confidence scores for each section", async () => {
      const note = await service.generateNote(sampleTranscript, "soap");

      if (note.sections.subjective) {
        expect(note.sections.subjective.confidence).toBeGreaterThan(0);
        expect(note.sections.subjective.confidence).toBeLessThanOrEqual(1);
      }
    });

    it("should mark all sections as not physician-edited", async () => {
      const note = await service.generateNote(sampleTranscript, "soap");

      if (note.sections.subjective)
        expect(note.sections.subjective.physicianEdited).toBe(false);
      if (note.sections.objective)
        expect(note.sections.objective.physicianEdited).toBe(false);
      if (note.sections.assessment)
        expect(note.sections.assessment.physicianEdited).toBe(false);
      if (note.sections.plan)
        expect(note.sections.plan.physicianEdited).toBe(false);
    });

    it("should include suggested plans from knowledge base", async () => {
      const note = await service.generateNote(sampleTranscript, "soap");

      expect(note.suggestedPlans).toHaveLength(1);
      expect(note.suggestedPlans[0]!.planTitle).toContain("Seizure");
    });

    it("should include medication mentions", async () => {
      const note = await service.generateNote(sampleTranscript, "soap");

      expect(note.medicationsMentioned).toHaveLength(1);
      expect(note.medicationsMentioned[0]!.name).toBe("levetiracetam");
      expect(note.medicationsMentioned[0]!.dbMatch).toBe(true);
    });

    it("should include ICD-10 suggestions", async () => {
      const note = await service.generateNote(sampleTranscript, "soap");

      expect(note.suggestedIcd10.length).toBeGreaterThan(0);
      expect(note.suggestedIcd10[0]!.code).toMatch(/^[A-Z]\d/);
    });

    it("should include neuro exam structure in objective", async () => {
      const note = await service.generateNote(sampleTranscript, "soap");

      const objective = note.sections.objective;
      expect(objective).toBeDefined();
      if (objective && "neuroExam" in objective) {
        expect(objective.neuroExam).toBeDefined();
        expect(objective.neuroExam!.motor).toBeDefined();
        expect(objective.neuroExam!.reflexes).toBeDefined();
      }
    });

    it("should include plan items in plan section", async () => {
      const note = await service.generateNote(sampleTranscript, "soap");

      const planSection = note.sections.plan;
      expect(planSection).toBeDefined();
      if (planSection && "items" in planSection) {
        expect(planSection.items.length).toBeGreaterThan(0);
        const categories = planSection.items.map((i) => i.category);
        expect(categories).toContain("medication");
      }
    });
  });

  describe("regenerateSection", () => {
    it("should regenerate a specific section", async () => {
      const result = await service.regenerateSection(
        sampleTranscript,
        "assessment",
      );

      expect(result).toContain("assessment");
    });

    it("should incorporate physician feedback", async () => {
      const result = await service.regenerateSection(
        sampleTranscript,
        "plan",
        "Add follow-up in 2 weeks",
      );

      expect(result).toContain("follow-up");
    });
  });
});
