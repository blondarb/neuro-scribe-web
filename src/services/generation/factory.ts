/**
 * Note Generation Service Factory
 *
 * Creates and caches the note generation service singleton.
 * Uses AWS Bedrock for Claude model access (no API key needed — uses AWS credential chain).
 */

import type { NoteGenerationService } from "./index.js";
import { ClaudeNoteGenerationService } from "./claude.js";

let instance: NoteGenerationService | null = null;

/**
 * Get the note generation service singleton.
 * Uses AWS Bedrock — credentials come from the standard AWS credential chain
 * (environment variables, IAM role, or SSO profile).
 */
export function getNoteGenerationService(): NoteGenerationService {
  if (!instance) {
    const region = process.env.AWS_REGION;
    if (!region) {
      throw new Error(
        "AWS_REGION is not configured. Set it in .env to enable Bedrock-based note generation.",
      );
    }
    instance = new ClaudeNoteGenerationService();
  }
  return instance;
}

/**
 * Reset the singleton (for testing).
 */
export function resetNoteGenerationService(): void {
  instance = null;
}

/**
 * Set a custom generation service (for testing).
 */
export function setNoteGenerationService(service: NoteGenerationService): void {
  instance = service;
}
