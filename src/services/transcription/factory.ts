/**
 * Transcription Service Factory
 *
 * Creates and caches the transcription service singleton.
 * Uses Amazon Transcribe Medical via AWS SDK (credential chain).
 */

import type { TranscriptionService } from "./index.js";
import { AmazonTranscribeService } from "./transcribe.js";

let instance: TranscriptionService | null = null;

/**
 * Get the transcription service singleton.
 * Uses AWS credential chain (env vars, IAM role, or SSO profile).
 */
export function getTranscriptionService(): TranscriptionService {
  if (!instance) {
    const region = process.env.AWS_REGION;
    if (!region) {
      throw new Error(
        "AWS_REGION is not configured. Set it in .env to enable Amazon Transcribe Medical.",
      );
    }
    instance = new AmazonTranscribeService();
  }
  return instance;
}

/**
 * Reset the singleton (for testing).
 */
export function resetTranscriptionService(): void {
  instance = null;
}

/**
 * Set a custom transcription service (for testing).
 */
export function setTranscriptionService(service: TranscriptionService): void {
  instance = service;
}
