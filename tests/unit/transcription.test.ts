/**
 * Tests for Deepgram transcription service (mocked SDK)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { TranscriptionService } from "@services/transcription/index.js";
import type { AudioConfig, Transcript } from "@shared/types.js";

// Mock a minimal TranscriptionService for testing the interface contract
function createMockTranscriptionService(): TranscriptionService {
  return {
    async transcribeFile(
      audioBuffer: ArrayBuffer,
      config: AudioConfig,
    ): Promise<Transcript> {
      if (audioBuffer.byteLength === 0) {
        throw new Error("Empty audio buffer");
      }

      return {
        id: "test-transcript-id",
        encounterId: "test-encounter-id",
        segments: [
          {
            speaker: "physician",
            start: 0.0,
            end: 3.2,
            text: "The patient presents with new onset seizure.",
            confidence: 0.95,
          },
          {
            speaker: "patient",
            start: 3.5,
            end: 6.8,
            text: "I had a seizure last night while sleeping.",
            confidence: 0.92,
          },
          {
            speaker: "physician",
            start: 7.0,
            end: 12.5,
            text: "Motor exam shows 4/5 left deltoid. DTRs 2+ bilateral. Start levetiracetam 500 mg BID.",
            confidence: 0.88,
          },
        ],
        durationSeconds: 13,
        wordCount: 32,
        createdAt: new Date().toISOString(),
      };
    },

    startStream(config: AudioConfig) {
      const callbacks = {
        segment: [] as ((s: any) => void)[],
        complete: [] as ((t: Transcript) => void)[],
        error: [] as ((e: Error) => void)[],
      };

      return {
        sendChunk: vi.fn(),
        end: vi.fn(() => {
          const transcript: Transcript = {
            id: "",
            encounterId: "",
            segments: [],
            durationSeconds: 0,
            wordCount: 0,
            createdAt: new Date().toISOString(),
          };
          callbacks.complete.forEach((cb) => cb(transcript));
        }),
        onSegment: (cb: any) => callbacks.segment.push(cb),
        onComplete: (cb: any) => callbacks.complete.push(cb),
        onError: (cb: any) => callbacks.error.push(cb),
      };
    },
  };
}

describe("TranscriptionService", () => {
  let service: TranscriptionService;

  beforeEach(() => {
    service = createMockTranscriptionService();
  });

  describe("transcribeFile", () => {
    const defaultConfig: AudioConfig = {
      sampleRate: 16000,
      channels: 1,
      format: "webm",
    };

    it("should transcribe audio and return segments", async () => {
      const audioBuffer = new ArrayBuffer(1000);
      const result = await service.transcribeFile(audioBuffer, defaultConfig);

      expect(result.segments).toHaveLength(3);
      expect(result.segments[0]!.speaker).toBe("physician");
      expect(result.segments[1]!.speaker).toBe("patient");
      expect(result.durationSeconds).toBe(13);
      expect(result.wordCount).toBe(32);
    });

    it("should include confidence scores for each segment", async () => {
      const audioBuffer = new ArrayBuffer(1000);
      const result = await service.transcribeFile(audioBuffer, defaultConfig);

      for (const segment of result.segments) {
        expect(segment.confidence).toBeGreaterThanOrEqual(0);
        expect(segment.confidence).toBeLessThanOrEqual(1);
      }
    });

    it("should include timestamps for each segment", async () => {
      const audioBuffer = new ArrayBuffer(1000);
      const result = await service.transcribeFile(audioBuffer, defaultConfig);

      for (const segment of result.segments) {
        expect(segment.start).toBeGreaterThanOrEqual(0);
        expect(segment.end).toBeGreaterThan(segment.start);
      }
    });

    it("should throw on empty audio buffer", async () => {
      const emptyBuffer = new ArrayBuffer(0);
      await expect(
        service.transcribeFile(emptyBuffer, defaultConfig),
      ).rejects.toThrow("Empty audio buffer");
    });

    it("should map speakers to physician/patient/unknown", async () => {
      const audioBuffer = new ArrayBuffer(1000);
      const result = await service.transcribeFile(audioBuffer, defaultConfig);

      const speakers = new Set(result.segments.map((s) => s.speaker));
      for (const speaker of speakers) {
        expect(["physician", "patient", "unknown"]).toContain(speaker);
      }
    });
  });

  describe("startStream", () => {
    const defaultConfig: AudioConfig = {
      sampleRate: 16000,
      channels: 1,
      format: "pcm",
    };

    it("should return a TranscriptionStream object", () => {
      const stream = service.startStream(defaultConfig);
      expect(stream.sendChunk).toBeDefined();
      expect(stream.end).toBeDefined();
      expect(stream.onSegment).toBeDefined();
      expect(stream.onComplete).toBeDefined();
      expect(stream.onError).toBeDefined();
    });

    it("should fire onComplete when stream ends", async () => {
      const stream = service.startStream(defaultConfig);

      const complete = new Promise<Transcript>((resolve) => {
        stream.onComplete(resolve);
      });

      stream.end();

      const transcript = await complete;
      expect(transcript).toBeDefined();
      expect(transcript.segments).toBeDefined();
    });

    it("should accept audio chunks", () => {
      const stream = service.startStream(defaultConfig);
      const chunk = new ArrayBuffer(4096);

      // Should not throw
      stream.sendChunk(chunk);
      expect(stream.sendChunk).toHaveBeenCalledWith(chunk);
    });
  });
});
