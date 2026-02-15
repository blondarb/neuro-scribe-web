/**
 * Note Generation Service Factory
 *
 * Creates and caches the note generation service singleton.
 */

import type { NoteGenerationService } from "./index.js";
import { ClaudeNoteGenerationService } from "./claude.js";

let instance: NoteGenerationService | null = null;

/**
 * Get the note generation service singleton.
 * Reads ANTHROPIC_API_KEY from environment.
 */
export function getNoteGenerationService(): NoteGenerationService {
  if (!instance) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === "sk-ant-placeholder") {
      throw new Error(
        "ANTHROPIC_API_KEY is not configured. Set it in .env to enable note generation.",
      );
    }
    instance = new ClaudeNoteGenerationService(apiKey);
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
