/**
 * Startup Configuration Validation
 *
 * Validates all required environment variables at startup using Zod.
 * Fails fast with clear error messages if anything is missing or invalid.
 */

import { z } from "zod";

const configSchema = z.object({
  // Server
  PORT: z
    .string()
    .default("3000")
    .transform((v) => parseInt(v, 10))
    .pipe(z.number().int().min(1).max(65535)),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  // Database
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  // Anthropic Claude API
  ANTHROPIC_API_KEY: z
    .string()
    .min(1, "ANTHROPIC_API_KEY is required")
    .default("sk-ant-placeholder"),

  // Deepgram STT
  DEEPGRAM_API_KEY: z
    .string()
    .min(1, "DEEPGRAM_API_KEY is required")
    .default("dg-placeholder"),

  // Authentication
  AUTH_ISSUER: z.string().default("neuro-scribe"),
  AUTH_AUDIENCE: z.string().default("neuro-scribe-api"),
  AUTH_JWKS_URI: z.string().url().optional(),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters"),

  // Session
  SESSION_TIMEOUT_MINUTES: z
    .string()
    .default("15")
    .transform((v) => parseInt(v, 10))
    .pipe(z.number().int().min(1).max(1440)),

  // Encryption
  ENCRYPTION_KEY: z
    .string()
    .length(64, "ENCRYPTION_KEY must be 64 hex characters (32 bytes)")
    .regex(/^[0-9a-fA-F]+$/, "ENCRYPTION_KEY must be hexadecimal"),

  // Knowledge Base
  PLANS_JSON_PATH: z.string().default("./data/plans.json"),
  MEDICATIONS_JSON_PATH: z.string().default("./data/medications.json"),

  // Logging
  LOG_LEVEL: z
    .enum(["error", "warn", "info", "debug"])
    .default("info"),

  // CORS
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
});

export type AppConfig = z.infer<typeof configSchema>;

let _config: AppConfig | null = null;

/**
 * Validate and load configuration from environment variables.
 * Call once at server startup before any other initialization.
 *
 * Fails fast with descriptive errors if validation fails.
 */
export function loadConfig(): AppConfig {
  const result = configSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.issues
      .map((issue) => `  ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(
      `Configuration validation failed:\n${errors}\n\nSee .env.example for required values.`,
    );
  }

  // Warn if using placeholder API keys in non-test environment
  if (result.data.NODE_ENV !== "test") {
    if (result.data.ANTHROPIC_API_KEY === "sk-ant-placeholder") {
      console.warn(
        "WARNING: ANTHROPIC_API_KEY is a placeholder. Note generation will fail.",
      );
    }
    if (result.data.DEEPGRAM_API_KEY === "dg-placeholder") {
      console.warn(
        "WARNING: DEEPGRAM_API_KEY is a placeholder. Transcription will fail.",
      );
    }
  }

  // Security: never allow debug logging in production
  if (
    result.data.NODE_ENV === "production" &&
    result.data.LOG_LEVEL === "debug"
  ) {
    throw new Error(
      "LOG_LEVEL=debug is not allowed in production (PHI exposure risk). Use 'info' or higher.",
    );
  }

  _config = result.data;
  return _config;
}

/**
 * Get the validated config. Throws if not loaded.
 */
export function getConfig(): AppConfig {
  if (!_config) {
    throw new Error("Config not loaded. Call loadConfig() first.");
  }
  return _config;
}
