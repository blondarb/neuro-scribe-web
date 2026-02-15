/**
 * Transcription Service Factory
 *
 * Creates and caches the transcription service singleton.
 * Currently supports Deepgram; add Whisper by creating whisper.ts.
 */

import type { TranscriptionService } from "./index.js";
import { DeepgramTranscriptionService } from "./deepgram.js";

let instance: TranscriptionService | null = null;

/**
 * Get the transcription service singleton.
 * Reads DEEPGRAM_API_KEY from environment.
 */
export function getTranscriptionService(): TranscriptionService {
  if (!instance) {
    const apiKey = process.env.DEEPGRAM_API_KEY;
    if (!apiKey || apiKey === "dg-placeholder") {
      throw new Error(
        "DEEPGRAM_API_KEY is not configured. Set it in .env to enable transcription.",
      );
    }
    instance = new DeepgramTranscriptionService(apiKey);
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
