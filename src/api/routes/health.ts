/**
 * Health Check Route
 *
 * No authentication required. No PHI.
 * Used by load balancers, monitoring, and deployment checks.
 *
 * Reports service status + database connectivity.
 */

import { Router } from "express";
import { checkConnection } from "../../db/client.js";

const router = Router();

router.get("/health", async (_req, res) => {
  let dbStatus = "unknown";
  try {
    const dbOk = await checkConnection();
    dbStatus = dbOk ? "connected" : "disconnected";
  } catch {
    dbStatus = "error";
  }

  const healthy = dbStatus === "connected" || dbStatus === "unknown";

  res.status(healthy ? 200 : 503).json({
    status: healthy ? "ok" : "degraded",
    service: "neuro-scribe",
    version: "0.1.0",
    timestamp: new Date().toISOString(),
    checks: {
      database: dbStatus,
    },
  });
});

export default router;
