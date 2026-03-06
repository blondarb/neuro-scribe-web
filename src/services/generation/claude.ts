/**
 * Claude Note Generation Service (via AWS Bedrock)
 *
 * Multi-step pipeline: transcript -> section extraction -> knowledge enrichment -> note assembly.
 * Uses Claude Haiku (via Bedrock) for fast extraction, Sonnet (via Bedrock) for polished clinical note generation.
 *
 * PHI handling: Transcript text IS sent to Bedrock (AWS BAA required).
 * No PHI in logs, error messages, or prompt metadata.
 */

import { readFileSync } from "fs";
import { join } from "path";
import { invokeBedrockClaude, BEDROCK_MODELS } from "../../lib/bedrock.js";
import type {
  NoteGenerationService,
  GenerationOptions,
} from "./index.js";
import type {
  Transcript,
  ClinicalNote,
  NoteType,
  NoteSections,
  NoteSection,
  ObjectiveSection,
  AssessmentSection,
  PlanSection,
  NeuroExam,
  PlanMatch,
  MedicationMention,
  Icd10Suggestion,
} from "@shared/types.js";
import { getKnowledgeService } from "@services/knowledge/service.js";
import { logger } from "@shared/logger.js";

/** Load a prompt template from the prompts directory */
function loadPrompt(filename: string): string {
  const promptPath = join(
    process.cwd(),
    "prompts",
    filename,
  );
  try {
    const content = readFileSync(promptPath, "utf-8");
    // Extract the system prompt from between ``` markers
    const match = content.match(/## System Prompt\s*\n\s*```\s*\n([\s\S]*?)```/);
    return match ? match[1]!.trim() : content;
  } catch {
    logger.info("prompt.load.fallback", {
      message: `Could not load prompt ${filename}, using inline fallback`,
    });
    return "";
  }
}

/** Extraction response shape from Claude */
interface SectionExtractionResponse {
  sections: {
    subjective: { content: string; source_segments: number[]; confidence: number } | null;
    objective: { content: string; source_segments: number[]; confidence: number } | null;
    assessment: { content: string; source_segments: number[]; confidence: number } | null;
    plan: { content: string; source_segments: number[]; confidence: number } | null;
  };
}

/** Neuro exam structure response */
interface NeuroExamResponse {
  mental_status: string | null;
  cranial_nerves: string | null;
  motor: string | null;
  sensory: string | null;
  reflexes: string | null;
  coordination: string | null;
  gait: string | null;
}

/** Note generation response shape from Claude */
interface NoteGenerationResponse {
  note: {
    type: string;
    sections: {
      subjective: string;
      objective: {
        general: string;
        neuro_exam: NeuroExamResponse;
      };
      assessment: string;
      plan: string;
    };
    metadata: {
      medications_mentioned: Array<{
        name: string;
        dose?: string;
        route?: string;
        frequency?: string;
      }>;
      icd10_codes: Array<{ code: string; description: string }>;
      plan_matches: Array<{ plan_id: string; score: number }>;
      dose_alerts: Array<{
        medication: string;
        dictated: string;
        recommended: string;
        severity: string;
      }>;
    };
  };
}

export class ClaudeNoteGenerationService implements NoteGenerationService {
  private sectionExtractPrompt: string;
  private noteGeneratePrompt: string;
  private examStructurePrompt: string;

  constructor() {
    this.sectionExtractPrompt = loadPrompt("section-extract.md");
    this.noteGeneratePrompt = loadPrompt("note-generate.md");
    this.examStructurePrompt = loadPrompt("exam-structure.md");
  }

  async generateNote(
    transcript: Transcript,
    noteType: NoteType,
    options?: GenerationOptions,
  ): Promise<ClinicalNote> {
    const startTime = Date.now();

    // Step 1: Section extraction (Haiku via Bedrock — fast)
    logger.info("generation.step.extract", { message: "Extracting sections from transcript" });
    const extracted = await this.extractSections(transcript);

    // Step 2: Knowledge enrichment (local — no API call)
    let planMatches: PlanMatch[] = [];
    let medicationsMentioned: MedicationMention[] = [];
    let icd10Suggestions: Icd10Suggestion[] = [];

    if (options?.includeKnowledge !== false) {
      logger.info("generation.step.enrich", { message: "Enriching with knowledge base" });
      const enrichment = await this.enrichWithKnowledge(extracted);
      planMatches = enrichment.planMatches;
      medicationsMentioned = enrichment.medicationsMentioned;
      icd10Suggestions = enrichment.icd10Suggestions;
    }

    // Step 3: Note assembly (Sonnet via Bedrock — clinical precision)
    logger.info("generation.step.assemble", { message: "Assembling clinical note" });
    const note = await this.assembleNote(
      extracted,
      { planMatches, medicationsMentioned, icd10Suggestions },
      noteType,
      options,
    );

    const elapsed = Date.now() - startTime;
    logger.info("generation.pipeline.complete", { durationMs: elapsed });

    return note;
  }

  async regenerateSection(
    transcript: Transcript,
    sectionName: string,
    feedback?: string,
  ): Promise<string> {
    const systemPrompt = this.noteGeneratePrompt ||
      "You are a neurology clinical documentation specialist. Regenerate the specified section based on the transcript and physician feedback.";

    const responseText = await invokeBedrockClaude({
      modelId: BEDROCK_MODELS.SONNET,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: JSON.stringify({
            task: "regenerate_section",
            section_name: sectionName,
            transcript: {
              segments: transcript.segments.map((s) => ({
                speaker: s.speaker,
                start: s.start,
                end: s.end,
                text: s.text,
              })),
            },
            feedback: feedback || "Please regenerate this section with more detail.",
          }),
        },
      ],
      maxTokens: 2000,
    });

    return responseText;
  }

  // --- Private pipeline steps ---

  private async extractSections(
    transcript: Transcript,
  ): Promise<SectionExtractionResponse> {
    const systemPrompt = this.sectionExtractPrompt ||
      `You are a clinical documentation assistant specialized in neurology.
Given a transcript of a patient encounter, identify and extract the following sections:
- Subjective (HPI, symptoms, patient-reported history)
- Objective (physical exam findings, neurological exam, vital signs)
- Assessment (diagnostic impression, clinical reasoning)
- Plan (ordered workup, medications, referrals, follow-up)

Rules:
1. Only extract information explicitly stated in the transcript.
2. NEVER invent or infer findings not present in the transcript.
3. If a section has no relevant content in the transcript, return null for that section.
4. Preserve medical terminology exactly as spoken.
5. Note which transcript segments (by timestamp) each section draws from.

Return JSON matching the provided schema.`;

    const responseText = await invokeBedrockClaude({
      modelId: BEDROCK_MODELS.HAIKU,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: JSON.stringify({
            transcript: {
              segments: transcript.segments.map((s, i) => ({
                index: i,
                speaker: s.speaker,
                start: s.start,
                end: s.end,
                text: s.text,
              })),
            },
          }),
        },
      ],
      maxTokens: 4000,
    });

    try {
      // Try to parse JSON from the response (may be wrapped in ```json blocks)
      const jsonStr = responseText
        .replace(/```json\s*/g, "")
        .replace(/```\s*/g, "")
        .trim();
      return JSON.parse(jsonStr) as SectionExtractionResponse;
    } catch {
      // If parsing fails, create a minimal response
      logger.info("generation.extract.parse_fallback", {
        message: "Could not parse extraction response as JSON, using full text as subjective",
      });
      return {
        sections: {
          subjective: {
            content: responseText,
            source_segments: [],
            confidence: 0.5,
          },
          objective: null,
          assessment: null,
          plan: null,
        },
      };
    }
  }

  private async enrichWithKnowledge(extracted: SectionExtractionResponse) {
    const knowledge = getKnowledgeService();

    // Match plans from assessment text
    let planMatches: PlanMatch[] = [];
    if (extracted.sections.assessment?.content) {
      planMatches = await knowledge.matchPlans({
        diagnosisText: extracted.sections.assessment.content,
      });
    }

    // Extract medication mentions from plan text
    const medicationsMentioned: MedicationMention[] = [];
    const planText = extracted.sections.plan?.content || "";

    // Simple medication extraction: look for known patterns
    const medPatterns = planText.match(
      /(?:start|begin|initiate|continue|prescribe|order|give|administer)\s+(\w+(?:\s+\w+)?)\s+(\d+[\d.]*\s*(?:mg|mcg|g|mL|units?))/gi,
    );

    if (medPatterns) {
      for (const pattern of medPatterns) {
        const parts = pattern.match(
          /(?:start|begin|initiate|continue|prescribe|order|give|administer)\s+(\w+(?:\s+\w+)?)\s+(\d+[\d.]*\s*(?:mg|mcg|g|mL|units?))/i,
        );
        if (parts?.[1] && parts[2]) {
          const medName = parts[1];
          const dose = parts[2];

          const medData = await knowledge.lookupMedication(medName);
          let doseValidation;
          if (medData) {
            doseValidation = await knowledge.validateDose(medName, dose);
          }

          medicationsMentioned.push({
            name: medName,
            doseMentioned: dose,
            dbMatch: !!medData,
            doseDiscrepancy:
              doseValidation && !doseValidation.isValid
                ? {
                    dictatedDose: dose,
                    recommendedRange: doseValidation.recommendedRange || "unknown",
                    severity: doseValidation.severity || "info",
                  }
                : undefined,
          });
        }
      }
    }

    // ICD-10 suggestions from assessment
    let icd10Suggestions: Icd10Suggestion[] = [];
    if (extracted.sections.assessment?.content) {
      icd10Suggestions = await knowledge.suggestIcd10(
        extracted.sections.assessment.content,
      );
    }

    return { planMatches, medicationsMentioned, icd10Suggestions };
  }

  private async assembleNote(
    extracted: SectionExtractionResponse,
    enrichment: {
      planMatches: PlanMatch[];
      medicationsMentioned: MedicationMention[];
      icd10Suggestions: Icd10Suggestion[];
    },
    noteType: NoteType,
    options?: GenerationOptions,
  ): Promise<ClinicalNote> {
    const systemPrompt = this.noteGeneratePrompt ||
      `You are a neurology clinical documentation specialist. Transform raw section extractions into a polished, structured clinical note suitable for an EHR.

Rules:
1. Use standard medical documentation conventions.
2. Structure the neurological exam with standard subsections.
3. Only include findings explicitly present in the extracted sections.
4. NEVER add findings, diagnoses, or plan items not supported by the source data.
5. Use concise clinical language.
6. Medications should include dose, route, and frequency when available.
7. Format for direct EHR paste.

Return JSON matching the provided schema.`;

    const responseText = await invokeBedrockClaude({
      modelId: BEDROCK_MODELS.SONNET,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: JSON.stringify({
            extracted_sections: extracted.sections,
            knowledge: {
              matched_plans: enrichment.planMatches,
              medication_data: enrichment.medicationsMentioned,
              icd10_suggestions: enrichment.icd10Suggestions,
            },
            preferences: {
              style: options?.preferences?.style || "mixed",
              show_confidence: options?.preferences?.showConfidence || false,
            },
          }),
        },
      ],
      maxTokens: 6000,
    });

    let noteResponse: NoteGenerationResponse;
    try {
      const jsonStr = responseText
        .replace(/```json\s*/g, "")
        .replace(/```\s*/g, "")
        .trim();
      noteResponse = JSON.parse(jsonStr) as NoteGenerationResponse;
    } catch {
      // Fallback: use extracted sections directly
      logger.info("generation.assemble.parse_fallback", {
        message: "Could not parse note response, building from extracted sections",
      });
      return this.buildFallbackNote(extracted, enrichment, noteType);
    }

    // Map Claude response to ClinicalNote
    return this.mapToClinicalNote(noteResponse, extracted, enrichment, noteType);
  }

  private mapToClinicalNote(
    response: NoteGenerationResponse,
    extracted: SectionExtractionResponse,
    enrichment: {
      planMatches: PlanMatch[];
      medicationsMentioned: MedicationMention[];
      icd10Suggestions: Icd10Suggestion[];
    },
    noteType: NoteType,
  ): ClinicalNote {
    const sections: NoteSections = {};

    if (response.note.sections.subjective) {
      sections.subjective = {
        content: response.note.sections.subjective,
        confidence: extracted.sections.subjective?.confidence || 0.8,
        sources: (extracted.sections.subjective?.source_segments || []).map(String),
        physicianEdited: false,
      };
    }

    if (response.note.sections.objective) {
      const neuroExam: NeuroExam = {};
      const ne = response.note.sections.objective.neuro_exam;
      if (ne) {
        if (ne.mental_status) neuroExam.mentalStatus = ne.mental_status;
        if (ne.cranial_nerves) neuroExam.cranialNerves = ne.cranial_nerves;
        if (ne.motor) neuroExam.motor = ne.motor;
        if (ne.sensory) neuroExam.sensory = ne.sensory;
        if (ne.reflexes) neuroExam.reflexes = ne.reflexes;
        if (ne.coordination) neuroExam.coordination = ne.coordination;
        if (ne.gait) neuroExam.gait = ne.gait;
      }

      const objectiveSection: ObjectiveSection = {
        content: response.note.sections.objective.general ||
          response.note.sections.objective as unknown as string,
        confidence: extracted.sections.objective?.confidence || 0.8,
        sources: (extracted.sections.objective?.source_segments || []).map(String),
        physicianEdited: false,
        neuroExam: Object.keys(neuroExam).length > 0 ? neuroExam : undefined,
      };
      sections.objective = objectiveSection;
    }

    if (response.note.sections.assessment) {
      const assessmentSection: AssessmentSection = {
        content: response.note.sections.assessment,
        confidence: extracted.sections.assessment?.confidence || 0.8,
        sources: (extracted.sections.assessment?.source_segments || []).map(String),
        physicianEdited: false,
        problems: enrichment.icd10Suggestions.map((s) => ({
          diagnosis: s.description,
          icd10: s.code,
          differential: [],
          planMatchId: enrichment.planMatches[0]?.planId,
        })),
      };
      sections.assessment = assessmentSection;
    }

    if (response.note.sections.plan) {
      const planSection: PlanSection = {
        content: response.note.sections.plan,
        confidence: extracted.sections.plan?.confidence || 0.8,
        sources: (extracted.sections.plan?.source_segments || []).map(String),
        physicianEdited: false,
        items: enrichment.medicationsMentioned.map((m) => ({
          category: "medication" as const,
          description: `${m.name} ${m.doseMentioned || ""}`.trim(),
        })),
      };
      sections.plan = planSection;
    }

    return {
      id: "",
      encounterId: "",
      noteType,
      sections,
      suggestedPlans: enrichment.planMatches,
      medicationsMentioned: enrichment.medicationsMentioned,
      suggestedIcd10: enrichment.icd10Suggestions,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "draft",
    };
  }

  private buildFallbackNote(
    extracted: SectionExtractionResponse,
    enrichment: {
      planMatches: PlanMatch[];
      medicationsMentioned: MedicationMention[];
      icd10Suggestions: Icd10Suggestion[];
    },
    noteType: NoteType,
  ): ClinicalNote {
    const sections: NoteSections = {};

    const buildSection = (
      data: { content: string; source_segments: number[]; confidence: number } | null,
    ): NoteSection | undefined => {
      if (!data) return undefined;
      return {
        content: data.content,
        confidence: data.confidence,
        sources: data.source_segments.map(String),
        physicianEdited: false,
      };
    };

    sections.subjective = buildSection(extracted.sections.subjective);
    sections.objective = buildSection(extracted.sections.objective) as ObjectiveSection | undefined;

    if (extracted.sections.assessment) {
      sections.assessment = {
        ...buildSection(extracted.sections.assessment)!,
        problems: [],
      } as AssessmentSection;
    }

    if (extracted.sections.plan) {
      sections.plan = {
        ...buildSection(extracted.sections.plan)!,
        items: [],
      } as PlanSection;
    }

    return {
      id: "",
      encounterId: "",
      noteType,
      sections,
      suggestedPlans: enrichment.planMatches,
      medicationsMentioned: enrichment.medicationsMentioned,
      suggestedIcd10: enrichment.icd10Suggestions,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "draft",
    };
  }
}
