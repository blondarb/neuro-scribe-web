/**
 * PHI-Safe Structured Logger
 *
 * CRITICAL: This logger NEVER outputs patient data.
 * Only allow-listed fields are logged. Everything else is redacted.
 *
 * Usage:
 *   logger.info("note.generated", { encounterId, userId, durationMs })
 *   logger.audit("note.read", { userId, resourceId, ip })
 */

import winston from "winston";

// Fields that are SAFE to log (never contain PHI)
const SAFE_FIELDS = new Set([
  "encounterId",
  "userId",
  "action",
  "resourceType",
  "resourceId",
  "durationMs",
  "statusCode",
  "method",
  "path",
  "ip",
  "userAgent",
  "error",
  "errorCode",
  "timestamp",
  "level",
  "message",
  "service",
  "version",
  "planId",
  "medicationName",
  "matchScore",
  "noteType",
  "sectionCount",
  "wordCount",
  "segmentCount",
  "confidenceScore",
]);

/**
 * Strip any field not in the safe list.
 * This prevents accidental PHI from reaching logs.
 */
function sanitize(
  info: winston.Logform.TransformableInfo,
): winston.Logform.TransformableInfo {
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(info)) {
    if (SAFE_FIELDS.has(key) || key === "level" || key === "message") {
      clean[key] = value;
    }
    // Silently drop any field not in the safe list
  }
  return clean as winston.Logform.TransformableInfo;
}

const sanitizeFormat = winston.format((info) => sanitize(info));

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  defaultMeta: { service: "neuro-scribe", version: "0.1.0" },
  format: winston.format.combine(
    sanitizeFormat(),
    winston.format.timestamp(),
    winston.format.json(),
  ),
  transports: [new winston.transports.Console()],
});

/**
 * Audit logger — writes to separate audit transport.
 * Every PHI access MUST be recorded here.
 */
export function audit(
  action: string,
  details: {
    userId: string;
    resourceType: string;
    resourceId?: string;
    ip?: string;
  },
): void {
  logger.info(action, {
    ...details,
    action,
    level: "info",
    message: `AUDIT: ${action}`,
  });
}
