/**
 * Neuro Scribe — API Server
 *
 * Express application with security middleware, PHI protection,
 * and audit logging. All routes require authentication except /health.
 */

import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import helmet from "helmet";
import cors from "cors";
import { loadConfig } from "@shared/config.js";
import { logger } from "@shared/logger.js";
import { initDatabase, closeDatabase, checkConnection } from "../db/client.js";
import { auditMiddleware } from "./middleware/audit.js";
import { phiGuardErrorHandler } from "./middleware/phi-guard.js";
import { generalLimiter } from "./middleware/rate-limit.js";
import healthRoutes from "./routes/health.js";
import knowledgeRoutes from "./routes/knowledge.js";
import encounterRoutes from "./routes/encounters.js";

// --- Config validation (fail fast) ---
const config = loadConfig();

const app = express();

// --- Security Middleware ---
app.use(helmet());
app.use(
  cors({
    origin: config.CORS_ORIGIN,
    credentials: true,
  }),
);
app.use(express.json({ limit: "10mb" }));
app.use(generalLimiter);

// --- Audit Middleware ---
app.use(auditMiddleware);

// --- Routes ---
app.use(healthRoutes);
app.use("/api/knowledge", knowledgeRoutes);
app.use("/api/encounters", encounterRoutes);

// --- Static frontend (production) ---
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDir = path.join(__dirname, "..", "client");
app.use(express.static(clientDir));
// SPA fallback: serve index.html for any non-API route
app.get("*", (_req, res, next) => {
  if (_req.path.startsWith("/api") || _req.path === "/health") return next();
  res.sendFile(path.join(clientDir, "index.html"));
});

// --- Error Handling (MUST be last) ---
app.use(phiGuardErrorHandler);

// --- Startup ---
async function start(): Promise<void> {
  // Initialize database
  try {
    initDatabase(config.DATABASE_URL);
    const dbOk = await checkConnection();
    if (dbOk) {
      logger.info("db.connected", { message: "Database connection verified" });
    } else {
      logger.info("db.unavailable", {
        message: "Database not reachable — encounter routes will fail until DB is available",
      });
    }
  } catch (err) {
    logger.info("db.init.warning", {
      message: `Database init: ${err instanceof Error ? err.message : "unknown error"}. Server starting without DB.`,
    });
  }

  const server = app.listen(config.PORT, () => {
    logger.info("server.started", {
      message: `Neuro Scribe API listening on port ${config.PORT}`,
    });
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info("server.shutdown", { message: `Received ${signal}, shutting down...` });
    server.close(async () => {
      await closeDatabase();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

start().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});

export default app;
