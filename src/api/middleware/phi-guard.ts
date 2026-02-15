/**
 * PHI Guard Middleware
 *
 * Intercepts all error responses and ensures NO patient data
 * leaks through error messages, stack traces, or headers.
 *
 * This is a defense-in-depth measure. Even if a service accidentally
 * includes PHI in an error, this middleware strips it.
 */

import type { Request, Response, NextFunction } from "express";

/** Patterns that suggest PHI content */
const PHI_PATTERNS = [
  /\b\d{3}-\d{2}-\d{4}\b/, // SSN
  /\b\d{9}\b/, // MRN (9-digit)
  /\b(patient|pt)\s*:?\s*\w+/i, // "Patient: Name"
  /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/, // Date of birth patterns
  /\b(MRN|SSN|DOB)\s*:?\s*\S+/i, // Explicit PHI labels
];

/**
 * Check if a string potentially contains PHI.
 */
export function containsPHI(text: string): boolean {
  return PHI_PATTERNS.some((pattern) => pattern.test(text));
}

/**
 * Express error handler that sanitizes error responses.
 * MUST be the last error handler in the middleware chain.
 */
export function phiGuardErrorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Generic message to client — NEVER the actual error
  const statusCode = (err as { statusCode?: number }).statusCode || 500;

  const genericMessages: Record<number, string> = {
    400: "Invalid request",
    401: "Authentication required",
    403: "Access denied",
    404: "Resource not found",
    409: "Conflict",
    422: "Validation error",
    429: "Too many requests",
    500: "Internal server error",
  };

  res.status(statusCode).json({
    error: {
      code: statusCode.toString(),
      message: genericMessages[statusCode] || "Internal server error",
    },
  });
}
