/**
 * AES-256-GCM Encryption for PHI at Rest
 *
 * All patient data (transcripts, notes) is encrypted before database storage
 * and decrypted on retrieval. The encryption key is stored in environment
 * variables, NOT in the database or source code.
 *
 * Format: [12-byte IV][ciphertext][16-byte auth tag]
 */

import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

function getKey(): Buffer {
  const keyHex = process.env.ENCRYPTION_KEY;
  if (!keyHex || keyHex.length !== 64) {
    throw new Error(
      "ENCRYPTION_KEY must be a 64-character hex string (32 bytes). " +
        'Generate with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"',
    );
  }
  return Buffer.from(keyHex, "hex");
}

/**
 * Encrypt a string (typically JSON-serialized PHI).
 * Returns a Buffer suitable for BYTEA storage.
 */
export function encrypt(plaintext: string): Buffer {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag();

  // Pack: [IV][ciphertext][tag]
  return Buffer.concat([iv, encrypted, tag]);
}

/**
 * Decrypt a Buffer back to the original string.
 */
export function decrypt(packed: Buffer): string {
  const key = getKey();

  const iv = packed.subarray(0, IV_LENGTH);
  const tag = packed.subarray(packed.length - TAG_LENGTH);
  const ciphertext = packed.subarray(IV_LENGTH, packed.length - TAG_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  return decipher.update(ciphertext) + decipher.final("utf8");
}

/**
 * Encrypt a JSON-serializable object.
 */
export function encryptJSON(data: unknown): Buffer {
  return encrypt(JSON.stringify(data));
}

/**
 * Decrypt a Buffer and parse as JSON.
 */
export function decryptJSON<T>(packed: Buffer): T {
  return JSON.parse(decrypt(packed)) as T;
}
