/**
 * Dev Token Generator
 *
 * Generates a JWT token for local API development and testing.
 * This token is signed with JWT_SECRET from .env and is valid for 24 hours.
 *
 * Usage:
 *   make token
 *   npx tsx scripts/dev-token.ts
 *   npx tsx scripts/dev-token.ts --role admin
 *   npx tsx scripts/dev-token.ts --user "dr.smith" --email "smith@hospital.org"
 *
 * The generated token can be used as:
 *   curl -H "Authorization: Bearer <token>" http://localhost:3000/api/knowledge/plans?diagnosis=seizure
 */

import "dotenv/config";
import jwt from "jsonwebtoken";

// Parse CLI args
const args = process.argv.slice(2);
function getArg(name: string, defaultVal: string): string {
  const idx = args.indexOf(`--${name}`);
  if (idx !== -1 && args[idx + 1]) {
    return args[idx + 1];
  }
  return defaultVal;
}

const userId = getArg("user", "dev-physician-001");
const email = getArg("email", "dev@neuro-scribe.local");
const role = getArg("role", "physician");
const expiresIn = getArg("expires", "24h");

const secret = process.env.JWT_SECRET;
if (!secret) {
  console.error("Error: JWT_SECRET not set. Copy .env.example to .env first.");
  console.error("  cp .env.example .env");
  process.exit(1);
}

const issuer = process.env.AUTH_ISSUER || "neuro-scribe";
const audience = process.env.AUTH_AUDIENCE || "neuro-scribe-api";

const token = jwt.sign(
  {
    sub: userId,
    email,
    role,
  },
  secret,
  {
    issuer,
    audience,
    expiresIn,
  },
);

console.log("");
console.log("╔══════════════════════════════════════════════════════════════╗");
console.log("║  Neuro Scribe — Development Token                        ║");
console.log("╠══════════════════════════════════════════════════════════════╣");
console.log(`║  User:    ${userId.padEnd(49)}║`);
console.log(`║  Email:   ${email.padEnd(49)}║`);
console.log(`║  Role:    ${role.padEnd(49)}║`);
console.log(`║  Expires: ${expiresIn.padEnd(49)}║`);
console.log("╚══════════════════════════════════════════════════════════════╝");
console.log("");
console.log("Token:");
console.log(token);
console.log("");
console.log("Test with:");
console.log(`  curl -H "Authorization: Bearer ${token.slice(0, 20)}..." http://localhost:3000/api/knowledge/plans?diagnosis=seizure`);
console.log("");
console.log("Full curl:");
console.log(`  curl -s -H "Authorization: Bearer ${token}" http://localhost:3000/api/knowledge/plans?diagnosis=seizure | jq .`);
console.log("");
