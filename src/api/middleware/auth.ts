/**
 * Authentication Middleware
 *
 * Two modes:
 * - Production (AUTH_JWKS_URI set): Uses jwks-rsa to fetch and cache
 *   signing keys from the OIDC provider (Auth0, Cognito, Okta).
 * - Development (JWT_SECRET set): Verifies with a symmetric HMAC secret.
 *
 * Attaches the authenticated user (userId, email, role) to req.user.
 */

import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";
import { logger } from "@shared/logger.js";

export interface AuthUser {
  userId: string;
  email: string;
  role: "physician" | "admin" | "readonly";
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

// --- JWKS client (lazy-initialized) ---
let client: jwksClient.JwksClient | null = null;

function getJwksClient(jwksUri: string): jwksClient.JwksClient {
  if (!client) {
    client = jwksClient({
      jwksUri,
      cache: true,
      cacheMaxAge: 3600_000, // 1 hour
      rateLimit: true,
      jwksRequestsPerMinute: 10,
    });
  }
  return client;
}

/**
 * Get the signing key for a given kid from the JWKS endpoint.
 */
function getSigningKey(jwksUri: string, kid: string): Promise<string> {
  const jClient = getJwksClient(jwksUri);
  return new Promise((resolve, reject) => {
    jClient.getSigningKey(kid, (err, key) => {
      if (err) return reject(err);
      if (!key) return reject(new Error("No signing key found"));
      resolve(key.getPublicKey());
    });
  });
}

/**
 * Verify a JWT using JWKS (production mode).
 */
async function verifyWithJwks(
  token: string,
  jwksUri: string,
): Promise<{ sub: string; email: string; role: string }> {
  const header = JSON.parse(
    Buffer.from(token.split(".")[0]!, "base64url").toString(),
  ) as { kid?: string };

  if (!header.kid) {
    throw new Error("JWT missing kid header — cannot match JWKS key");
  }

  const signingKey = await getSigningKey(jwksUri, header.kid);

  return jwt.verify(token, signingKey, {
    algorithms: ["RS256"],
    issuer: process.env.AUTH_ISSUER,
    audience: process.env.AUTH_AUDIENCE,
  }) as { sub: string; email: string; role: string };
}

/**
 * Require authentication on a route.
 * Returns 401 if no valid token is present.
 */
export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: { code: "401", message: "Authentication required" } });
    return;
  }

  const token = authHeader.slice(7);
  const jwksUri = process.env.AUTH_JWKS_URI;

  if (jwksUri) {
    // Production: JWKS-based verification
    verifyWithJwks(token, jwksUri)
      .then((decoded) => {
        req.user = {
          userId: decoded.sub,
          email: decoded.email,
          role: (decoded.role as AuthUser["role"]) || "physician",
        };
        next();
      })
      .catch(() => {
        logger.info("auth.failed", { ip: req.ip, path: req.path });
        res.status(401).json({ error: { code: "401", message: "Invalid or expired token" } });
      });
  } else {
    // Development: symmetric JWT_SECRET verification
    try {
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        throw new Error("JWT_SECRET not configured");
      }

      const decoded = jwt.verify(token, secret, {
        issuer: process.env.AUTH_ISSUER || "neuro-scribe",
        audience: process.env.AUTH_AUDIENCE || "neuro-scribe-api",
      }) as { sub: string; email: string; role: string };

      req.user = {
        userId: decoded.sub,
        email: decoded.email,
        role: (decoded.role as AuthUser["role"]) || "physician",
      };

      next();
    } catch {
      logger.info("auth.failed", {
        ip: req.ip,
        path: req.path,
      });
      res.status(401).json({ error: { code: "401", message: "Invalid or expired token" } });
    }
  }
}

/**
 * Require a specific role.
 */
export function requireRole(...roles: AuthUser["role"][]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: { code: "403", message: "Access denied" } });
      return;
    }
    next();
  };
}
