/**
 * Application-wide constants.
 * No PHI, no secrets — just configuration values.
 */

export const SESSION_TIMEOUT_MS =
  (parseInt(process.env.SESSION_TIMEOUT_MINUTES || "15", 10)) * 60 * 1000;

export const NOTE_TYPES = ["soap", "hp", "progress", "consult", "procedure"] as const;

export const ENCOUNTER_STATUSES = [
  "recording",
  "transcribed",
  "generating",
  "drafted",
  "reviewed",
  "finalized",
] as const;

export const USER_ROLES = ["physician", "admin", "readonly"] as const;

/** Maximum audio duration in seconds (30 minutes) */
export const MAX_AUDIO_DURATION_SECONDS = 1800;

/** Maximum note generation time before timeout (60 seconds) */
export const NOTE_GENERATION_TIMEOUT_MS = 60_000;

/** Claude model selection by task */
export const MODELS = {
  sectionExtraction: "claude-haiku-4-5-20251001",
  noteGeneration: "claude-sonnet-4-5-20250929",
  complexReasoning: "claude-sonnet-4-5-20250929",
  icd10Suggestion: "claude-haiku-4-5-20251001",
} as const;
