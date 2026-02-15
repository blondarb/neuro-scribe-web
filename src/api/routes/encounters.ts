/**
 * Encounter Routes
 *
 * Full encounter lifecycle: create → transcribe → generate → edit → finalize.
 * All routes require authentication. All PHI access is audited.
 */

import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { heavyLimiter } from "../middleware/rate-limit.js";
import {
  validateBody,
  validateQuery,
  createEncounterSchema,
  generateNoteSchema,
  updateNoteSchema,
  paginationSchema,
} from "../validation.js";
import {
  createEncounter,
  getEncounter,
  listEncounters,
  updateEncounterStatus,
  saveTranscript,
  getTranscript,
  saveClinicalNote,
  updateClinicalNote,
  finalizeClinicalNote,
  getClinicalNote,
} from "../../db/operations.js";
import { getTranscriptionService } from "@services/transcription/factory.js";
import { getNoteGenerationService } from "@services/generation/factory.js";
import { logger } from "@shared/logger.js";
import type { AudioConfig } from "@shared/types.js";

const router = Router();

/** Helper to extract string param (Express 5 types return string | string[]) */
function paramStr(val: string | string[] | undefined): string {
  if (Array.isArray(val)) return val[0] || "";
  return val || "";
}

/**
 * POST /api/encounters
 * Create a new encounter.
 */
router.post(
  "/",
  requireAuth,
  validateBody(createEncounterSchema),
  async (req, res, next) => {
    try {
      const encounter = await createEncounter(req.user!.userId);
      logger.info("encounter.created", {
        encounterId: encounter.id,
        userId: req.user!.userId,
      });
      res.status(201).json({ data: encounter });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * GET /api/encounters
 * List encounters for the authenticated physician (paginated).
 */
router.get(
  "/",
  requireAuth,
  validateQuery(paginationSchema),
  async (req, res, next) => {
    try {
      const { page, limit } = (req as typeof req & { parsedQuery: { page: number; limit: number } }).parsedQuery;
      const result = await listEncounters(req.user!.userId, page, limit);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * GET /api/encounters/:id
 * Get a full encounter with transcript and note (decrypted).
 */
router.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const encounter = await getEncounter(paramStr(req.params.id), req.user!.userId);
    if (!encounter) {
      res.status(404).json({
        error: { code: "NOT_FOUND", message: "Encounter not found" },
      });
      return;
    }
    res.json({ data: encounter });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/encounters/:id/transcribe
 * Upload audio for transcription (file upload via raw body).
 * Content-Type should be audio/webm, audio/wav, etc.
 */
router.post(
  "/:id/transcribe",
  requireAuth,
  heavyLimiter,
  async (req, res, next) => {
    try {
      const encounterId = paramStr(req.params.id);

      // Verify encounter exists and belongs to user
      const encounter = await getEncounter(encounterId, req.user!.userId);
      if (!encounter) {
        res.status(404).json({
          error: { code: "NOT_FOUND", message: "Encounter not found" },
        });
        return;
      }

      // Get raw audio from request body
      const chunks: Buffer[] = [];
      for await (const chunk of req) {
        chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
      }
      const audioBuffer = Buffer.concat(chunks);

      if (audioBuffer.length === 0) {
        res.status(400).json({
          error: { code: "VALIDATION_ERROR", message: "No audio data received" },
        });
        return;
      }

      // Determine format from content-type
      const contentType = req.headers["content-type"] || "audio/webm";
      const formatMap: Record<string, AudioConfig["format"]> = {
        "audio/webm": "webm",
        "audio/wav": "wav",
        "audio/wave": "wav",
        "audio/pcm": "pcm",
        "audio/l16": "pcm",
      };
      const format = formatMap[contentType] || "webm";

      const config: AudioConfig = {
        sampleRate: parseInt(req.headers["x-sample-rate"] as string) || 16000,
        channels: parseInt(req.headers["x-channels"] as string) || 1,
        format,
      };

      logger.info("transcription.started", {
        encounterId,
        userId: req.user!.userId,
      });

      const stt = getTranscriptionService();
      const transcript = await stt.transcribeFile(
        audioBuffer.buffer.slice(
          audioBuffer.byteOffset,
          audioBuffer.byteOffset + audioBuffer.byteLength,
        ),
        config,
      );

      // Save encrypted transcript to DB
      await saveTranscript(
        encounterId,
        transcript.segments,
        transcript.durationSeconds,
        transcript.wordCount,
      );
      await updateEncounterStatus(encounterId, "transcribed");

      logger.info("transcription.completed", {
        encounterId,
        userId: req.user!.userId,
        wordCount: transcript.wordCount,
        segmentCount: transcript.segments.length,
      });

      res.json({
        data: {
          encounterId,
          durationSeconds: transcript.durationSeconds,
          wordCount: transcript.wordCount,
          segmentCount: transcript.segments.length,
          status: "transcribed",
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * POST /api/encounters/:id/generate
 * Trigger AI note generation from the transcript.
 */
router.post(
  "/:id/generate",
  requireAuth,
  heavyLimiter,
  validateBody(generateNoteSchema),
  async (req, res, next) => {
    try {
      const encounterId = paramStr(req.params.id);

      // Verify encounter exists and has a transcript
      const encounter = await getEncounter(encounterId, req.user!.userId);
      if (!encounter) {
        res.status(404).json({
          error: { code: "NOT_FOUND", message: "Encounter not found" },
        });
        return;
      }
      if (!encounter.transcript) {
        res.status(400).json({
          error: {
            code: "NO_TRANSCRIPT",
            message: "Encounter has no transcript. Upload audio first.",
          },
        });
        return;
      }

      await updateEncounterStatus(encounterId, "generating");

      logger.info("generation.started", {
        encounterId,
        userId: req.user!.userId,
        noteType: req.body.noteType,
      });

      const generator = getNoteGenerationService();
      const clinicalNote = await generator.generateNote(
        {
          id: encounter.transcript.id || encounterId,
          encounterId,
          segments: encounter.transcript.segments,
          durationSeconds: encounter.transcript.durationSeconds || 0,
          wordCount: encounter.transcript.wordCount || 0,
          createdAt: new Date().toISOString(),
        },
        req.body.noteType,
        {
          includeKnowledge: req.body.includeKnowledge,
          preferences: {
            style: req.body.style,
            showConfidence: req.body.showConfidence,
          },
        },
      );

      // Save to DB
      await saveClinicalNote(encounterId, req.body.noteType, clinicalNote.sections, {
        suggestedPlans: clinicalNote.suggestedPlans,
        medicationsMentioned: clinicalNote.medicationsMentioned,
        suggestedIcd10: clinicalNote.suggestedIcd10,
      });
      await updateEncounterStatus(encounterId, "drafted");

      logger.info("generation.completed", {
        encounterId,
        userId: req.user!.userId,
        noteType: req.body.noteType,
      });

      res.json({ data: clinicalNote });
    } catch (err) {
      await updateEncounterStatus(paramStr(req.params.id), "transcribed").catch(() => {});
      next(err);
    }
  },
);

/**
 * PATCH /api/encounters/:id/note
 * Update note sections (physician edits).
 */
router.patch(
  "/:id/note",
  requireAuth,
  validateBody(updateNoteSchema),
  async (req, res, next) => {
    try {
      const encounterId = paramStr(req.params.id);

      // Get the note for this encounter
      const note = await getClinicalNote(encounterId);
      if (!note) {
        res.status(404).json({
          error: { code: "NOT_FOUND", message: "No note found for this encounter" },
        });
        return;
      }

      const updated = await updateClinicalNote(note.id, req.body.sections);
      if (!updated) {
        res.status(500).json({
          error: { code: "UPDATE_FAILED", message: "Failed to update note" },
        });
        return;
      }

      logger.info("note.updated", {
        encounterId,
        userId: req.user!.userId,
        sectionCount: Object.keys(req.body.sections).length,
      });

      res.json({ data: { status: "reviewed", updatedSections: Object.keys(req.body.sections) } });
    } catch (err) {
      if (err instanceof Error && err.message.includes("finalized")) {
        res.status(409).json({
          error: { code: "FINALIZED", message: "Cannot edit a finalized note" },
        });
        return;
      }
      next(err);
    }
  },
);

/**
 * POST /api/encounters/:id/finalize
 * Mark encounter note as finalized (read-only).
 */
router.post("/:id/finalize", requireAuth, async (req, res, next) => {
  try {
    const encounterId = paramStr(req.params.id);

    const note = await getClinicalNote(encounterId);
    if (!note) {
      res.status(404).json({
        error: { code: "NOT_FOUND", message: "No note found for this encounter" },
      });
      return;
    }

    await finalizeClinicalNote(note.id);
    await updateEncounterStatus(encounterId, "finalized");

    logger.info("note.finalized", {
      encounterId,
      userId: req.user!.userId,
    });

    res.json({ data: { encounterId, status: "finalized" } });
  } catch (err) {
    next(err);
  }
});

export default router;
