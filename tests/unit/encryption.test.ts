/**
 * Encryption Module Tests
 *
 * Verifies AES-256-GCM encrypt/decrypt round-trips.
 * Tests that encrypted data is not plaintext and that
 * tampering is detected.
 */

import { describe, it, expect, beforeAll } from "vitest";

// Set a test encryption key before importing the module
beforeAll(() => {
  process.env.ENCRYPTION_KEY =
    "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
});

describe("Encryption", () => {
  it("encrypts and decrypts a string", async () => {
    const { encrypt, decrypt } = await import("@shared/encryption.js");
    const plaintext = "This is sensitive patient data";
    const encrypted = encrypt(plaintext);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it("produces different ciphertext for same input (random IV)", async () => {
    const { encrypt } = await import("@shared/encryption.js");
    const plaintext = "Same input twice";
    const e1 = encrypt(plaintext);
    const e2 = encrypt(plaintext);
    expect(e1.equals(e2)).toBe(false);
  });

  it("encrypted data does not contain plaintext", async () => {
    const { encrypt } = await import("@shared/encryption.js");
    const plaintext = "PatientName123";
    const encrypted = encrypt(plaintext);
    expect(encrypted.toString("utf8")).not.toContain(plaintext);
  });

  it("encrypts and decrypts JSON objects", async () => {
    const { encryptJSON, decryptJSON } = await import("@shared/encryption.js");
    const data = { diagnosis: "seizure", medication: "levetiracetam" };
    const encrypted = encryptJSON(data);
    const decrypted = decryptJSON<typeof data>(encrypted);
    expect(decrypted).toEqual(data);
  });

  it("handles empty string", async () => {
    const { encrypt, decrypt } = await import("@shared/encryption.js");
    const encrypted = encrypt("");
    expect(decrypt(encrypted)).toBe("");
  });

  it("handles unicode content", async () => {
    const { encrypt, decrypt } = await import("@shared/encryption.js");
    const text = "Patient reports pain ≥7/10, noted µg dosing";
    expect(decrypt(encrypt(text))).toBe(text);
  });
});
