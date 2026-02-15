/**
 * Request Validation Schemas & Middleware
 *
 * Zod schemas for all API request bodies.
 * Reusable validate() middleware returns 400 with structured errors.
 */

import { z } from "zod";
import type { Request, Response, NextFunction } from "express";

// --- Schemas ---

export const createEncounterSchema = z.object({
  noteType: z
    .enum(["soap", "hp", "progress", "consult", "procedure"])
    .optional()
    .default("soap"),
});

export const transcribeUploadSchema = z.object({
  format: z.enum(["webm", "pcm", "wav"]).default("webm"),
  sampleRate: z.number().int().min(8000).max(48000).default(16000),
  channels: z.number().int().min(1).max(2).default(1),
});

export const generateNoteSchema = z.object({
  noteType: z
    .enum(["soap", "hp", "progress", "consult", "procedure"])
    .default("soap"),
  includeKnowledge: z.boolean().default(true),
  style: z.enum(["prose", "bullets", "mixed"]).optional(),
  showConfidence: z.boolean().optional(),
});

export const updateNoteSchema = z.object({
  sections: z
    .object({
      subjective: z.string().optional(),
      objective: z.string().optional(),
      assessment: z.string().optional(),
      plan: z.string().optional(),
    })
    .refine((s) => Object.keys(s).length > 0, {
      message: "At least one section must be provided",
    }),
});

export const validateDoseSchema = z.object({
  medicationName: z.string().min(1, "medicationName is required"),
  mentionedDose: z.string().min(1, "mentionedDose is required"),
  indication: z.string().optional(),
});

export const icd10SuggestionSchema = z.object({
  assessmentText: z.string().min(1, "assessmentText is required"),
});

export const paginationSchema = z.object({
  page: z
    .string()
    .optional()
    .default("1")
    .transform((v) => parseInt(v, 10))
    .pipe(z.number().int().min(1)),
  limit: z
    .string()
    .optional()
    .default("20")
    .transform((v) => parseInt(v, 10))
    .pipe(z.number().int().min(1).max(100)),
});

// --- Middleware ---

/**
 * Create a validation middleware for request body.
 * Returns 400 with structured error details on failure.
 */
export function validateBody<T extends z.ZodSchema>(schema: T) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));
      res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Request body validation failed",
          details: errors,
        },
      });
      return;
    }
    req.body = result.data;
    next();
  };
}

/**
 * Create a validation middleware for query parameters.
 */
export function validateQuery<T extends z.ZodSchema>(schema: T) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));
      res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Query parameter validation failed",
          details: errors,
        },
      });
      return;
    }
    (req as Request & { parsedQuery: unknown }).parsedQuery = result.data;
    next();
  };
}
