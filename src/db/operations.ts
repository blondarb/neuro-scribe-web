/**
 * Database Operations Layer
 *
 * Typed functions for all database CRUD operations.
 * Handles encryption/decryption of PHI columns transparently.
 */

import { eq, desc, and, sql } from "drizzle-orm";
import { getDb } from "./client.js";
import {
  users,
  encounters,
  transcripts,
  clinicalNotes,
  auditLog,
} from "./schema.js";
import { encryptJSON, decryptJSON } from "@shared/encryption.js";
import type {
  TranscriptSegment,
  NoteSections,
  NoteType,
  EncounterStatus,
} from "@shared/types.js";

// --- Users ---

export async function upsertUser(
  externalId: string,
  email: string,
  name: string,
  role: "physician" | "admin" | "readonly" = "physician",
) {
  const db = getDb();
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.externalId, externalId))
    .limit(1);

  if (existing[0]) {
    return existing[0];
  }

  const [user] = await db
    .insert(users)
    .values({ externalId, email, name, role })
    .returning();
  return user!;
}

export async function findUserByExternalId(externalId: string) {
  const db = getDb();
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.externalId, externalId))
    .limit(1);
  return user || null;
}

// --- Encounters ---

export async function createEncounter(physicianId: string) {
  const db = getDb();
  const [encounter] = await db
    .insert(encounters)
    .values({ physicianId })
    .returning();
  return encounter!;
}

export async function getEncounter(encounterId: string, physicianId: string) {
  const db = getDb();

  const [encounter] = await db
    .select()
    .from(encounters)
    .where(
      and(eq(encounters.id, encounterId), eq(encounters.physicianId, physicianId)),
    )
    .limit(1);

  if (!encounter) return null;

  // Fetch transcript if exists
  const [transcript] = await db
    .select()
    .from(transcripts)
    .where(eq(transcripts.encounterId, encounterId))
    .limit(1);

  // Fetch note if exists
  const [note] = await db
    .select()
    .from(clinicalNotes)
    .where(eq(clinicalNotes.encounterId, encounterId))
    .limit(1);

  return {
    ...encounter,
    transcript: transcript
      ? {
          id: transcript.id,
          encounterId: transcript.encounterId,
          segments: decryptJSON<TranscriptSegment[]>(transcript.segmentsEncrypted),
          durationSeconds: transcript.durationSeconds,
          wordCount: transcript.wordCount,
          createdAt: transcript.createdAt,
        }
      : null,
    note: note
      ? {
          id: note.id,
          encounterId: note.encounterId,
          noteType: note.noteType,
          sections: decryptJSON<NoteSections>(note.sectionsEncrypted),
          metadata: note.metadata,
          status: note.status,
          createdAt: note.createdAt,
          updatedAt: note.updatedAt,
        }
      : null,
  };
}

export async function listEncounters(
  physicianId: string,
  page: number,
  limit: number,
) {
  const db = getDb();
  const offset = (page - 1) * limit;

  const results = await db
    .select({
      id: encounters.id,
      physicianId: encounters.physicianId,
      status: encounters.status,
      createdAt: encounters.createdAt,
      updatedAt: encounters.updatedAt,
    })
    .from(encounters)
    .where(eq(encounters.physicianId, physicianId))
    .orderBy(desc(encounters.updatedAt))
    .limit(limit)
    .offset(offset);

  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(encounters)
    .where(eq(encounters.physicianId, physicianId));

  return {
    encounters: results,
    total: countResult?.count || 0,
    page,
    limit,
  };
}

export async function updateEncounterStatus(
  encounterId: string,
  status: EncounterStatus,
) {
  const db = getDb();
  const [updated] = await db
    .update(encounters)
    .set({ status, updatedAt: new Date() })
    .where(eq(encounters.id, encounterId))
    .returning();
  return updated || null;
}

// --- Transcripts ---

export async function saveTranscript(
  encounterId: string,
  segments: TranscriptSegment[],
  durationSeconds: number,
  wordCount: number,
) {
  const db = getDb();
  const segmentsEncrypted = encryptJSON(segments);

  const [transcript] = await db
    .insert(transcripts)
    .values({
      encounterId,
      segmentsEncrypted,
      durationSeconds,
      wordCount,
    })
    .returning();

  return transcript!;
}

export async function getTranscript(encounterId: string) {
  const db = getDb();
  const [transcript] = await db
    .select()
    .from(transcripts)
    .where(eq(transcripts.encounterId, encounterId))
    .limit(1);

  if (!transcript) return null;

  return {
    id: transcript.id,
    encounterId: transcript.encounterId,
    segments: decryptJSON<TranscriptSegment[]>(transcript.segmentsEncrypted),
    durationSeconds: transcript.durationSeconds,
    wordCount: transcript.wordCount,
    createdAt: transcript.createdAt,
  };
}

// --- Clinical Notes ---

export async function saveClinicalNote(
  encounterId: string,
  noteType: NoteType,
  sections: NoteSections,
  metadata: Record<string, unknown>,
) {
  const db = getDb();
  const sectionsEncrypted = encryptJSON(sections);

  const [note] = await db
    .insert(clinicalNotes)
    .values({
      encounterId,
      noteType,
      sectionsEncrypted,
      metadata,
    })
    .returning();

  return note!;
}

export async function updateClinicalNote(
  noteId: string,
  sectionUpdates: Partial<Record<string, string>>,
) {
  const db = getDb();

  const [current] = await db
    .select()
    .from(clinicalNotes)
    .where(eq(clinicalNotes.id, noteId))
    .limit(1);

  if (!current) return null;
  if (current.status === "finalized") {
    throw new Error("Cannot edit a finalized note");
  }

  // Decrypt current sections, apply updates
  const currentSections = decryptJSON<NoteSections>(current.sectionsEncrypted);
  const updatedSections: NoteSections = { ...currentSections };

  for (const [key, value] of Object.entries(sectionUpdates)) {
    if (value !== undefined && key in updatedSections) {
      const sectionKey = key as keyof NoteSections;
      const existingSection = updatedSections[sectionKey];
      if (existingSection) {
        (existingSection as { content: string; physicianEdited: boolean }).content = value;
        (existingSection as { content: string; physicianEdited: boolean }).physicianEdited = true;
      }
    }
  }

  const sectionsEncrypted = encryptJSON(updatedSections);

  const [updated] = await db
    .update(clinicalNotes)
    .set({
      sectionsEncrypted,
      status: "reviewed",
      updatedAt: new Date(),
    })
    .where(eq(clinicalNotes.id, noteId))
    .returning();

  return updated
    ? {
        ...updated,
        sections: updatedSections,
      }
    : null;
}

export async function finalizeClinicalNote(noteId: string) {
  const db = getDb();

  const [current] = await db
    .select()
    .from(clinicalNotes)
    .where(eq(clinicalNotes.id, noteId))
    .limit(1);

  if (!current) return null;
  if (current.status === "finalized") {
    return current;
  }

  const [updated] = await db
    .update(clinicalNotes)
    .set({ status: "finalized", updatedAt: new Date() })
    .where(eq(clinicalNotes.id, noteId))
    .returning();

  return updated || null;
}

export async function getClinicalNote(encounterId: string) {
  const db = getDb();
  const [note] = await db
    .select()
    .from(clinicalNotes)
    .where(eq(clinicalNotes.encounterId, encounterId))
    .limit(1);

  if (!note) return null;

  return {
    id: note.id,
    encounterId: note.encounterId,
    noteType: note.noteType,
    sections: decryptJSON<NoteSections>(note.sectionsEncrypted),
    metadata: note.metadata,
    status: note.status,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
  };
}

// --- Audit Log ---

export async function writeAuditLog(
  userId: string,
  action: string,
  resourceType: string,
  resourceId?: string,
  ipAddress?: string,
) {
  const db = getDb();
  await db.insert(auditLog).values({
    userId,
    action,
    resourceType,
    resourceId,
    ipAddress,
  });
}
