/**
 * Transcription Service
 *
 * Converts audio streams to timestamped, speaker-labeled transcripts.
 * Integrates with STT provider (Deepgram/Whisper) with neurology vocabulary boost.
 *
 * PHI handling: Audio is ephemeral — streamed to STT provider and discarded.
 * No audio is persisted on disk, in memory beyond processing, or in logs.
 */

import type { Transcript, TranscriptSegment, AudioConfig } from "@shared/types.js";

export interface TranscriptionService {
  /**
   * Start streaming transcription from audio chunks.
   * Returns a readable stream of transcript segments.
   */
  startStream(config: AudioConfig): TranscriptionStream;

  /**
   * Transcribe a complete audio file (fallback for file upload).
   */
  transcribeFile(audioBuffer: ArrayBuffer, config: AudioConfig): Promise<Transcript>;
}

export interface TranscriptionStream {
  /** Send an audio chunk for processing */
  sendChunk(chunk: ArrayBuffer): void;

  /** Signal end of audio */
  end(): void;

  /** Listen for transcript segments as they arrive */
  onSegment(callback: (segment: TranscriptSegment) => void): void;

  /** Listen for final complete transcript */
  onComplete(callback: (transcript: Transcript) => void): void;

  /** Listen for errors */
  onError(callback: (error: Error) => void): void;
}

// Implementation will be in provider-specific files:
// - deepgram.ts
// - whisper.ts
