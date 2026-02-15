/**
 * Database Client — Drizzle ORM + PostgreSQL
 *
 * Provides a typed database client for all operations.
 * Connection pool managed by `pg`.
 */

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema.js";
import { logger } from "@shared/logger.js";

let pool: pg.Pool | null = null;
let db: ReturnType<typeof drizzle<typeof schema>> | null = null;

/**
 * Initialize the database connection pool.
 * Call once at server startup.
 */
export function initDatabase(connectionString?: string): void {
  const url = connectionString || process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required");
  }

  pool = new pg.Pool({
    connectionString: url,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    ssl:
      process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: true }
        : undefined,
  });

  pool.on("error", (err) => {
    logger.info("db.pool.error", {
      error: err.message,
      errorCode: "POOL_ERROR",
    });
  });

  db = drizzle(pool, { schema });

  logger.info("db.initialized", {
    message: "Database connection pool created",
  });
}

/**
 * Get the database client.
 * Throws if not initialized.
 */
export function getDb(): ReturnType<typeof drizzle<typeof schema>> {
  if (!db) {
    throw new Error("Database not initialized. Call initDatabase() first.");
  }
  return db;
}

export type Database = ReturnType<typeof getDb>;

/**
 * Get the underlying pg Pool (for health checks, graceful shutdown).
 */
export function getPool(): pg.Pool {
  if (!pool) {
    throw new Error("Database not initialized. Call initDatabase() first.");
  }
  return pool;
}

/**
 * Close the connection pool. Call on shutdown.
 */
export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    db = null;
    logger.info("db.closed", { message: "Database connection pool closed" });
  }
}

/**
 * Verify database connectivity (for health checks).
 */
export async function checkConnection(): Promise<boolean> {
  if (!pool) return false;
  try {
    const client = await pool.connect();
    await client.query("SELECT 1");
    client.release();
    return true;
  } catch {
    return false;
  }
}
