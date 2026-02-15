/**
 * Audit Middleware
 *
 * Logs every request that accesses PHI resources.
 * Creates an immutable audit trail for HIPAA compliance.
 * Writes to both structured logger AND database.
 *
 * Audited resources: encounters, transcripts, clinical notes.
 * Not audited: health checks, knowledge base lookups (no PHI).
 */

import type { Request, Response, NextFunction } from "express";
import { audit } from "@shared/logger.js";
import { writeAuditLog } from "../../db/operations.js";

/** Routes that access PHI and require audit logging */
const PHI_ROUTE_PATTERNS = [
  /^\/api\/encounters/,
];

export function auditMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  // Only audit PHI routes
  const isPHIRoute = PHI_ROUTE_PATTERNS.some((p) => p.test(req.path));
  if (!isPHIRoute || !req.user) {
    next();
    return;
  }

  // Determine resource type and ID from the URL
  const parts = req.path.split("/").filter(Boolean);
  const resourceType = parts[1] || "unknown"; // "encounters"
  const resourceId = parts[2]; // encounter UUID if present

  // Map HTTP method to action
  const actionMap: Record<string, string> = {
    GET: `${resourceType}.read`,
    POST: `${resourceType}.create`,
    PATCH: `${resourceType}.update`,
    PUT: `${resourceType}.update`,
    DELETE: `${resourceType}.delete`,
  };

  const action = actionMap[req.method] || `${resourceType}.access`;

  // Log after response completes (to capture status code)
  res.on("finish", () => {
    // Structured logger (always works, even without DB)
    audit(action, {
      userId: req.user!.userId,
      resourceType,
      resourceId,
      ip: req.ip,
    });

    // Database audit log (best-effort, don't block response)
    writeAuditLog(
      req.user!.userId,
      action,
      resourceType,
      resourceId,
      req.ip,
    ).catch(() => {
      // DB write failed — structured log is the fallback
    });
  });

  next();
}
