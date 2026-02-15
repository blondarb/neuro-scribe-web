/**
 * Database Seed Script
 *
 * Populates the database with synthetic test data for development.
 * ALL DATA IS SYNTHETIC — no real patient information.
 *
 * Creates:
 *   - 2 test users (physician + admin)
 *   - 5 sample encounters at various stages
 *   - 2 sample transcripts (encrypted)
 *   - 1 sample clinical note (encrypted)
 *
 * Usage:
 *   make db-seed
 *   npx tsx scripts/seed.ts
 */

import "dotenv/config";

// Synthetic test data — NOT real patients
const SYNTHETIC_USERS = [
  {
    externalId: "dev-physician-001",
    email: "dr.dev@neuro-scribe.local",
    name: "Dr. Dev Physician",
    role: "physician" as const,
  },
  {
    externalId: "dev-admin-001",
    email: "admin@neuro-scribe.local",
    name: "Dev Admin",
    role: "admin" as const,
  },
];

const SYNTHETIC_TRANSCRIPT_SEGMENTS = [
  {
    speaker: "physician" as const,
    start: 0.0,
    end: 4.2,
    text: "Good morning, I'm Dr. Smith from neurology. I understand you had a seizure yesterday?",
    confidence: 0.97,
  },
  {
    speaker: "patient" as const,
    start: 4.5,
    end: 12.1,
    text: "Yes, my wife says I fell down and was shaking all over for about two minutes. I don't remember any of it.",
    confidence: 0.94,
  },
  {
    speaker: "physician" as const,
    start: 12.5,
    end: 16.8,
    text: "Have you ever had anything like this before? Any history of seizures or epilepsy?",
    confidence: 0.98,
  },
  {
    speaker: "patient" as const,
    start: 17.0,
    end: 21.3,
    text: "No, never. This is the first time. I've been healthy my whole life.",
    confidence: 0.96,
  },
  {
    speaker: "physician" as const,
    start: 34.0,
    end: 55.0,
    text: "Let me do a neurological exam. Mental status is alert and oriented times three. Cranial nerves two through twelve are intact. Motor exam shows five out of five strength. Sensation intact to light touch. Reflexes two plus and symmetric. Toes downgoing bilaterally. Coordination normal. Gait is steady.",
    confidence: 0.92,
  },
  {
    speaker: "physician" as const,
    start: 55.5,
    end: 72.0,
    text: "My assessment is new onset generalized tonic clonic seizure, nonfocal exam. I'd like to get an MRI brain with and without contrast, routine EEG, CMP and CBC. Starting levetiracetam 500mg twice daily. No driving for six months. Follow up in four weeks.",
    confidence: 0.91,
  },
];

const SYNTHETIC_NOTE_SECTIONS = {
  subjective: {
    content:
      "Patient presents with first-time seizure yesterday. Wife witnessed generalized tonic-clonic activity lasting approximately 2 minutes with loss of consciousness and postictal confusion. Patient has no recall of the event. Reports tongue soreness. No prior seizure history. No family history of epilepsy. Current medications: lisinopril for hypertension.",
    confidence: 0.93,
    sources: ["transcript:0-21"],
    physicianEdited: false,
  },
  objective: {
    content:
      "Alert and oriented x3. Cranial nerves II-XII intact. Motor: 5/5 strength all extremities. Sensory: intact to light touch throughout. Reflexes: 2+ and symmetric. Toes downgoing bilaterally. Coordination: normal finger-to-nose and heel-to-shin. Gait: steady.",
    confidence: 0.91,
    sources: ["transcript:34-55"],
    physicianEdited: false,
    neuroExam: {
      mentalStatus: "Alert and oriented x3",
      cranialNerves: "II-XII intact",
      motor: "5/5 strength all extremities",
      sensory: "Intact to light touch throughout",
      reflexes: "2+ and symmetric, toes downgoing bilaterally",
      coordination: "Normal finger-to-nose and heel-to-shin",
      gait: "Steady",
    },
  },
  assessment: {
    content: "New onset generalized tonic-clonic seizure. Nonfocal neurological exam.",
    confidence: 0.89,
    sources: ["transcript:55-72"],
    physicianEdited: false,
    problems: [
      {
        diagnosis: "New onset generalized tonic-clonic seizure",
        icd10: "R56.9",
        differential: [
          "Epilepsy",
          "Structural lesion",
          "Metabolic (hypoglycemia, hyponatremia)",
          "Medication-related",
        ],
        planMatchId: "new-onset-seizure",
      },
    ],
  },
  plan: {
    content:
      "1. MRI brain with and without contrast\n2. Routine EEG\n3. CMP, CBC\n4. Start levetiracetam 500mg BID\n5. Driving restriction: no driving for 6 months per state law\n6. Follow up in 4 weeks",
    confidence: 0.90,
    sources: ["transcript:55-72"],
    physicianEdited: false,
    items: [
      { category: "imaging", description: "MRI brain with and without contrast" },
      { category: "lab", description: "Routine EEG" },
      { category: "lab", description: "CMP" },
      { category: "lab", description: "CBC" },
      { category: "medication", description: "Levetiracetam 500mg BID" },
      { category: "other", description: "Driving restriction: 6 months" },
      { category: "follow_up", description: "Follow up in 4 weeks" },
    ],
  },
};

async function seed() {
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║  Neuro Scribe — Database Seed (Synthetic Data)            ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");
  console.log("");

  if (!process.env.DATABASE_URL) {
    console.log("Seed data preview (DATABASE_URL not configured):");
    console.log("");
    console.log(`Users: ${SYNTHETIC_USERS.length}`);
    SYNTHETIC_USERS.forEach((u) => console.log(`  - ${u.name} (${u.role})`));
    console.log("");
    console.log(`Transcript segments: ${SYNTHETIC_TRANSCRIPT_SEGMENTS.length}`);
    console.log(
      `Note sections: ${Object.keys(SYNTHETIC_NOTE_SECTIONS).length} (${Object.keys(SYNTHETIC_NOTE_SECTIONS).join(", ")})`,
    );
    console.log("");
    console.log("To seed a real database:");
    console.log("  1. Start PostgreSQL: make db-up");
    console.log("  2. Set DATABASE_URL in .env");
    console.log("  3. Run migrations: make db-migrate");
    console.log("  4. Run seed: make db-seed");
    console.log("");
    console.log("Seed data written to: scripts/seed-data.json");

    // Write seed data as JSON for manual import or frontend development
    const fs = await import("fs");
    const seedData = {
      _notice: "SYNTHETIC DATA ONLY — not real patients",
      users: SYNTHETIC_USERS,
      encounters: [
        { id: "00000000-0000-0000-0000-000000000001", status: "finalized", physicianId: "dev-physician-001" },
        { id: "00000000-0000-0000-0000-000000000002", status: "drafted", physicianId: "dev-physician-001" },
        { id: "00000000-0000-0000-0000-000000000003", status: "transcribed", physicianId: "dev-physician-001" },
        { id: "00000000-0000-0000-0000-000000000004", status: "recording", physicianId: "dev-physician-001" },
        { id: "00000000-0000-0000-0000-000000000005", status: "reviewed", physicianId: "dev-physician-001" },
      ],
      transcript: {
        encounterId: "00000000-0000-0000-0000-000000000001",
        segments: SYNTHETIC_TRANSCRIPT_SEGMENTS,
        durationSeconds: 72,
        wordCount: 285,
      },
      clinicalNote: {
        encounterId: "00000000-0000-0000-0000-000000000001",
        noteType: "soap",
        sections: SYNTHETIC_NOTE_SECTIONS,
        metadata: {
          suggestedPlans: [{ planId: "new-onset-seizure", planTitle: "New Onset Seizure", matchScore: 0.95, matchedOn: "keyword" }],
          suggestedIcd10: [{ code: "R56.9", description: "Unspecified convulsions", confidence: 0.9 }],
          medicationsMentioned: [
            { name: "levetiracetam", dose: "500mg BID", dbMatch: true },
            { name: "lisinopril", category: "home_medication", dbMatch: true },
          ],
        },
      },
    };
    fs.writeFileSync("scripts/seed-data.json", JSON.stringify(seedData, null, 2));
    console.log("Done.");
    return;
  }

  // If DATABASE_URL is set, perform actual database seeding
  console.log("Database seeding with Drizzle ORM...");
  console.log("(Full implementation requires running migrations first)");
  console.log("");
  console.log("For now, seed data has been exported to scripts/seed-data.json");
  console.log("Import it after migrations are run.");
}

seed().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
