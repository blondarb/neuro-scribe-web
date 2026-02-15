/**
 * Rate Limiting Middleware
 *
 * Protects against abuse and DoS. Two tiers:
 * - General: 100 requests/minute (most routes)
 * - Heavy: 10 requests/minute (transcription, note generation)
 */

import rateLimit from "express-rate-limit";

/**
 * General rate limiter — 100 requests per minute per IP.
 */
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: "RATE_LIMITED",
      message: "Too many requests. Please try again in a moment.",
    },
  },
  keyGenerator: (req) => {
    return req.user?.userId || req.ip || "unknown";
  },
});

/**
 * Heavy operation rate limiter — 10 requests per minute per user.
 * For transcription and note generation (expensive API calls).
 */
export const heavyLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: "RATE_LIMITED",
      message:
        "Too many transcription/generation requests. Please wait before retrying.",
    },
  },
  keyGenerator: (req) => {
    return req.user?.userId || req.ip || "unknown";
  },
});
