/**
 * Database Schema — Drizzle ORM
 *
 * PHI columns use BYTEA for application-level AES-256 encryption.
 * Non-PHI metadata uses standard column types.
 */

import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  pgEnum,
  customType,
  jsonb,
  inet,
} from "drizzle-orm/pg-core";

// Custom type for encrypted BYTEA columns
const bytea = customType<{ data: Buffer }>({
  dataType() {
    return "bytea";
  },
});

// Enums
export const encounterStatusEnum = pgEnum("encounter_status", [
  "recording",
  "transcribed",
  "generating",
  "drafted",
  "reviewed",
  "finalized",
]);

export const noteTypeEnum = pgEnum("note_type", [
  "soap",
  "hp",
  "progress",
  "consult",
  "procedure",
]);

export const noteStatusEnum = pgEnum("note_status", [
  "draft",
  "reviewed",
  "finalized",
]);

export const userRoleEnum = pgEnum("user_role", [
  "physician",
  "admin",
  "readonly",
]);

// --- Tables ---

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  externalId: text("external_id").notNull().unique(),
  email: text("email").notNull(),
  name: text("name").notNull(),
  role: userRoleEnum("role").notNull().default("physician"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const encounters = pgTable("encounters", {
  id: uuid("id").primaryKey().defaultRandom(),
  physicianId: uuid("physician_id")
    .notNull()
    .references(() => users.id),
  status: encounterStatusEnum("status").notNull().default("recording"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const transcripts = pgTable("transcripts", {
  id: uuid("id").primaryKey().defaultRandom(),
  encounterId: uuid("encounter_id")
    .notNull()
    .references(() => encounters.id),
  /** AES-256-GCM encrypted JSON array of TranscriptSegment[] */
  segmentsEncrypted: bytea("segments_encrypted").notNull(),
  durationSeconds: integer("duration_seconds"),
  wordCount: integer("word_count"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const clinicalNotes = pgTable("clinical_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  encounterId: uuid("encounter_id")
    .notNull()
    .references(() => encounters.id),
  noteType: noteTypeEnum("note_type").notNull().default("soap"),
  /** AES-256-GCM encrypted JSON of NoteSections */
  sectionsEncrypted: bytea("sections_encrypted").notNull(),
  /** Non-PHI metadata: plan matches, ICD-10 suggestions, confidence scores */
  metadata: jsonb("metadata"),
  status: noteStatusEnum("status").notNull().default("draft"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const auditLog = pgTable("audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  action: text("action").notNull(),
  resourceType: text("resource_type").notNull(),
  resourceId: uuid("resource_id"),
  ipAddress: inet("ip_address"),
  timestamp: timestamp("timestamp", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
