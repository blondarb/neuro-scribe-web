/**
 * Amazon Transcribe Medical Transcription Provider
 *
 * Implements TranscriptionService using Amazon Transcribe Medical Streaming.
 * Supports file upload (pre-recorded) via streaming API for inline transcription.
 *
 * MIGRATION NOTES from Deepgram:
 * -----------------------------------------------------------------------
 * MEDICAL VOCABULARY DIFFERENCES:
 * - Deepgram Nova-2 Medical supported a custom `keywords` parameter for vocabulary
 *   boosting (e.g., neurology-specific terms like "Babinski", "levetiracetam").
 *   Amazon Transcribe Medical does NOT support custom vocabulary boosting in the
 *   same way. It has a built-in medical vocabulary but does not accept keyword hints.
 *   For custom medical vocabulary, you must create a Custom Vocabulary resource via
 *   the Transcribe console or API (CreateMedicalVocabulary) and reference it by name.
 *   TODO: Create a custom medical vocabulary with neurology terms and pass
 *   VocabularyName in the streaming config.
 *
 * SPEAKER DIARIZATION DIFFERENCES:
 * - Deepgram: word-level speaker labels (each word tagged with a speaker index).
 *   Allows fine-grained segmentation within a single utterance.
 * - Amazon Transcribe Medical Streaming: does NOT support speaker diarization
 *   in the streaming API (StartMedicalStreamTranscription). Speaker diarization
 *   is only available in the batch API (StartMedicalTranscriptionJob with S3 input).
 *   The streaming implementation below assigns all segments to "unknown" speaker.
 *   TODO: For production speaker diarization, either:
 *     (a) Use batch Transcribe Medical with S3 upload (adds latency), or
 *     (b) Post-process with a separate speaker diarization model, or
 *     (c) Use Amazon Transcribe (non-medical) streaming which DOES support
 *         diarization via ShowSpeakerLabel, but lacks the medical vocabulary.
 *
 * STREAMING DIFFERENCES:
 * - Deepgram: WebSocket-based, sends raw audio chunks, receives word-level results.
 * - Amazon Transcribe: HTTP/2-based event stream using AWS SDK. Sends audio events,
 *   receives TranscriptEvent objects. The SDK handles the HTTP/2 framing.
 *   The real-time streaming implementation below is marked as a complex migration
 *   TODO because the event-stream API differs significantly from Deepgram's WebSocket.
 * -----------------------------------------------------------------------
 *
 * PHI handling: Audio is streamed to AWS Transcribe and NOT persisted.
 * AWS BAA is REQUIRED for production use with medical data.
 */

import {
  TranscribeStreamingClient,
  StartMedicalStreamTranscriptionCommand,
  type AudioEvent,
  type AudioStream,
  type MedicalTranscriptResultStream,
} from "@aws-sdk/client-transcribe-streaming";
import type {
  TranscriptionService,
  TranscriptionStream,
} from "./index.js";
import type {
  Transcript,
  TranscriptSegment,
  AudioConfig,
} from "@shared/types.js";
import { logger } from "@shared/logger.js";

/**
 * Map audio format to Amazon Transcribe MediaEncoding.
 * Amazon Transcribe Medical Streaming supports: pcm, ogg-opus, flac
 */
function getMediaEncoding(format: AudioConfig["format"]): "pcm" | "ogg-opus" | "flac" {
  switch (format) {
    case "pcm":
    case "wav":
      return "pcm";
    case "webm":
      // WebM/Opus is not directly supported by Transcribe Medical Streaming.
      // Audio must be converted to PCM before streaming.
      // For file upload, we attempt PCM interpretation.
      logger.info("transcribe.format.warning", {
        message: "WebM format not natively supported by Transcribe Medical Streaming. Audio should be PCM-encoded.",
      });
      return "pcm";
    default:
      return "pcm";
  }
}

export class AmazonTranscribeService implements TranscriptionService {
  private client: TranscribeStreamingClient;

  constructor() {
    const region = process.env.AWS_REGION || "us-east-2";
    this.client = new TranscribeStreamingClient({ region });
  }

  /**
   * Transcribe a complete audio file (pre-recorded) using Transcribe Medical Streaming.
   *
   * Sends the entire audio buffer as a stream of chunks to the Transcribe Medical
   * streaming API, then collects the full transcript from the result stream.
   */
  async transcribeFile(
    audioBuffer: ArrayBuffer,
    config: AudioConfig,
  ): Promise<Transcript> {
    const startTime = Date.now();

    logger.info("transcribe.file.start", {
      message: `Starting Amazon Transcribe Medical transcription (${audioBuffer.byteLength} bytes)`,
    });

    const audioChunks = this.chunkAudioBuffer(audioBuffer);

    // Create an async generator that yields audio events
    const audioStream: AsyncIterable<AudioStream> = this.createAudioStream(audioChunks);

    const command = new StartMedicalStreamTranscriptionCommand({
      LanguageCode: "en-US",
      MediaEncoding: getMediaEncoding(config.format),
      MediaSampleRateHertz: config.sampleRate || 16000,
      Specialty: "NEUROLOGY",
      Type: "DICTATION",
      AudioStream: audioStream,
      // NOTE: ShowSpeakerLabel is NOT available for Medical Streaming.
      // See migration notes above about diarization limitations.
      // TODO: VocabularyName: "neuro-scribe-custom-vocab" — create via AWS console/API first
    });

    const response = await this.client.send(command);

    // Collect results from the transcript stream
    const segments: TranscriptSegment[] = [];
    let totalText = "";

    if (response.TranscriptResultStream) {
      for await (const event of response.TranscriptResultStream as AsyncIterable<MedicalTranscriptResultStream>) {
        if ("TranscriptEvent" in event && event.TranscriptEvent?.Transcript?.Results) {
          for (const result of event.TranscriptEvent.Transcript.Results) {
            // Skip partial results — only use final
            if (result.IsPartial) continue;

            if (result.Alternatives && result.Alternatives.length > 0) {
              const alt = result.Alternatives[0]!;
              const transcript = alt.Transcript || "";

              if (transcript.trim()) {
                const startSeconds = result.StartTime ?? 0;
                const endSeconds = result.EndTime ?? 0;

                // Build segment from items (words) if available
                const items = alt.Items || [];
                const avgConfidence = items.length > 0
                  ? items.reduce((sum, item) => sum + (item.Confidence ?? 0), 0) / items.length
                  : 0.8;

                segments.push({
                  // Amazon Transcribe Medical Streaming does NOT provide speaker labels.
                  // All segments are marked "unknown" — see migration notes above.
                  speaker: "unknown",
                  start: startSeconds,
                  end: endSeconds,
                  text: transcript,
                  confidence: avgConfidence,
                });

                totalText += " " + transcript;
              }
            }
          }
        }
      }
    }

    const wordCount = totalText.trim().split(/\s+/).filter(Boolean).length;
    const durationSeconds = segments.length > 0
      ? (segments[segments.length - 1]!.end - segments[0]!.start)
      : 0;

    const elapsed = Date.now() - startTime;
    logger.info("transcribe.file.complete", {
      durationMs: elapsed,
      wordCount,
      segmentCount: segments.length,
    });

    return {
      id: "",
      encounterId: "",
      segments,
      durationSeconds: Math.round(durationSeconds),
      wordCount,
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Start a streaming transcription session.
   *
   * TODO: COMPLEX MIGRATION — Amazon Transcribe Medical Streaming uses an HTTP/2
   * event stream (AsyncIterable<AudioEvent>) rather than Deepgram's WebSocket.
   * The caller sends audio chunks into an async generator and reads results from
   * another async iterable. This requires significant refactoring of the client-side
   * WebSocket handler to work with AWS SDK's streaming model.
   *
   * For now, this returns a stub that collects audio chunks and transcribes them
   * as a batch when end() is called. This provides functional streaming-compatible
   * API but with batch latency instead of true real-time results.
   *
   * For true real-time streaming, implement a bidirectional adapter that:
   * 1. Accepts audio chunks via sendChunk()
   * 2. Feeds them into a PassThrough/Transform stream
   * 3. Pipes that into StartMedicalStreamTranscriptionCommand
   * 4. Reads result events and fires onSegment callbacks
   */
  startStream(config: AudioConfig): TranscriptionStream {
    const collectedChunks: ArrayBuffer[] = [];
    let segmentCallbacks: ((segment: TranscriptSegment) => void)[] = [];
    let completeCallbacks: ((transcript: Transcript) => void)[] = [];
    let errorCallbacks: ((error: Error) => void)[] = [];

    const self = this;

    return {
      sendChunk(chunk: ArrayBuffer): void {
        collectedChunks.push(chunk);
      },

      end(): void {
        // Concatenate all chunks and transcribe as a batch
        const totalLength = collectedChunks.reduce((sum, c) => sum + c.byteLength, 0);
        const combined = new Uint8Array(totalLength);
        let offset = 0;
        for (const chunk of collectedChunks) {
          combined.set(new Uint8Array(chunk), offset);
          offset += chunk.byteLength;
        }

        self.transcribeFile(combined.buffer as ArrayBuffer, config)
          .then((transcript) => {
            // Emit each segment individually
            for (const segment of transcript.segments) {
              for (const cb of segmentCallbacks) cb(segment);
            }
            // Then emit the complete transcript
            for (const cb of completeCallbacks) cb(transcript);
          })
          .catch((error) => {
            const err = error instanceof Error ? error : new Error(String(error));
            for (const cb of errorCallbacks) cb(err);
          });
      },

      onSegment(callback: (segment: TranscriptSegment) => void): void {
        segmentCallbacks.push(callback);
      },

      onComplete(callback: (transcript: Transcript) => void): void {
        completeCallbacks.push(callback);
      },

      onError(callback: (error: Error) => void): void {
        errorCallbacks.push(callback);
      },
    };
  }

  // --- Private helpers ---

  /**
   * Split an audio buffer into chunks suitable for streaming to Transcribe.
   * AWS recommends chunks of ~8KB-32KB for streaming.
   */
  private chunkAudioBuffer(audioBuffer: ArrayBuffer, chunkSize = 16384): Uint8Array[] {
    const buffer = new Uint8Array(audioBuffer);
    const chunks: Uint8Array[] = [];
    for (let i = 0; i < buffer.length; i += chunkSize) {
      chunks.push(buffer.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Create an async iterable of AudioStream events from audio chunks.
   * Yields each chunk as an AudioEvent, then signals completion.
   */
  private async *createAudioStream(chunks: Uint8Array[]): AsyncGenerator<AudioStream> {
    for (const chunk of chunks) {
      yield { AudioEvent: { AudioChunk: chunk } } as AudioStream;
    }
  }
}
