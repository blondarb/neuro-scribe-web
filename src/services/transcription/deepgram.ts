/**
 * Deepgram Transcription Provider
 *
 * Implements TranscriptionService using Deepgram's Nova-2 Medical model.
 * Supports both file upload (pre-recorded) and streaming transcription.
 *
 * PHI handling: Audio is streamed to Deepgram and NOT persisted.
 * Deepgram BAA is REQUIRED for production use.
 */

import { createClient, type DeepgramClient } from "@deepgram/sdk";
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

/** Neurology vocabulary boost keywords for Deepgram */
const NEURO_KEYWORDS = [
  "seizure",
  "epilepsy",
  "hemiparesis",
  "hemiplegia",
  "aphasia",
  "dysarthria",
  "ataxia",
  "nystagmus",
  "MRI",
  "EEG",
  "EMG",
  "lumbar puncture",
  "cerebrospinal fluid",
  "CSF",
  "demyelination",
  "multiple sclerosis",
  "Parkinson",
  "levodopa",
  "carbidopa",
  "gabapentin",
  "pregabalin",
  "carbamazepine",
  "valproate",
  "lamotrigine",
  "topiramate",
  "lacosamide",
  "levetiracetam",
  "phenytoin",
  "triptans",
  "sumatriptan",
  "Babinski",
  "Romberg",
  "pronator drift",
  "cranial nerves",
  "fundoscopic",
  "papilledema",
  "optic neuritis",
  "trigeminal neuralgia",
  "myasthenia gravis",
  "Guillain-Barre",
  "neuropathy",
  "radiculopathy",
  "myelopathy",
  "stroke",
  "TIA",
  "thrombolysis",
  "thrombectomy",
  "tPA",
  "alteplase",
  "tenecteplase",
  "NIH stroke scale",
  "NIHSS",
  "Glasgow coma scale",
  "GCS",
];

/**
 * Map Deepgram speaker index to clinical role.
 * In a two-speaker encounter, speaker 0 is typically the physician.
 */
function mapSpeaker(
  speakerIndex: number,
): TranscriptSegment["speaker"] {
  if (speakerIndex === 0) return "physician";
  if (speakerIndex === 1) return "patient";
  return "unknown";
}

/**
 * Map audio format to Deepgram mimetype.
 */
function getMimeType(format: AudioConfig["format"]): string {
  switch (format) {
    case "webm":
      return "audio/webm";
    case "wav":
      return "audio/wav";
    case "pcm":
      return "audio/l16";
    default:
      return "audio/webm";
  }
}

export class DeepgramTranscriptionService implements TranscriptionService {
  private client: DeepgramClient;

  constructor(apiKey: string) {
    this.client = createClient(apiKey);
  }

  /**
   * Transcribe a complete audio file (pre-recorded).
   */
  async transcribeFile(
    audioBuffer: ArrayBuffer,
    config: AudioConfig,
  ): Promise<Transcript> {
    const startTime = Date.now();

    logger.info("deepgram.transcribe.start", {
      message: `Starting Deepgram transcription (${audioBuffer.byteLength} bytes)`,
    });

    const { result, error } = await this.client.listen.prerecorded.transcribeFile(
      Buffer.from(audioBuffer),
      {
        model: "nova-2-medical",
        smart_format: true,
        diarize: true,
        language: "en",
        punctuate: true,
        paragraphs: true,
        keywords: NEURO_KEYWORDS,
        sample_rate: config.sampleRate,
        channels: config.channels,
        mimetype: getMimeType(config.format),
      },
    );

    if (error) {
      logger.info("deepgram.transcribe.error", {
        error: error.message,
        errorCode: "DEEPGRAM_ERROR",
      });
      throw new Error(`Deepgram transcription failed: ${error.message}`);
    }

    if (!result?.results?.channels?.[0]?.alternatives?.[0]) {
      throw new Error("Deepgram returned empty results");
    }

    const channel = result.results.channels[0]!;
    const alternative = channel.alternatives[0]!;
    const words = alternative.words || [];

    // Build segments from word-level diarization
    const segments: TranscriptSegment[] = [];
    let currentSegment: TranscriptSegment | null = null;

    for (const word of words) {
      const speaker = mapSpeaker(word.speaker ?? 0);

      if (
        !currentSegment ||
        currentSegment.speaker !== speaker ||
        (word.start - currentSegment.end) > 2.0 // gap > 2s = new segment
      ) {
        if (currentSegment) {
          segments.push(currentSegment);
        }
        currentSegment = {
          speaker,
          start: word.start,
          end: word.end,
          text: word.punctuated_word || word.word,
          confidence: word.confidence,
        };
      } else {
        currentSegment.end = word.end;
        currentSegment.text += " " + (word.punctuated_word || word.word);
        currentSegment.confidence =
          (currentSegment.confidence + word.confidence) / 2;
      }
    }
    if (currentSegment) {
      segments.push(currentSegment);
    }

    const durationSeconds = result.metadata?.duration || 0;
    const wordCount = words.length;

    const elapsed = Date.now() - startTime;
    logger.info("deepgram.transcribe.complete", {
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
   */
  startStream(config: AudioConfig): TranscriptionStream {
    const connection = this.client.listen.live({
      model: "nova-2-medical",
      smart_format: true,
      diarize: true,
      language: "en",
      punctuate: true,
      encoding: config.format === "pcm" ? "linear16" : undefined,
      sample_rate: config.sampleRate,
      channels: config.channels,
      keywords: NEURO_KEYWORDS,
    });

    const segments: TranscriptSegment[] = [];
    let segmentCallbacks: ((segment: TranscriptSegment) => void)[] = [];
    let completeCallbacks: ((transcript: Transcript) => void)[] = [];
    let errorCallbacks: ((error: Error) => void)[] = [];

    connection.on("Results", (data: {
      channel?: {
        alternatives?: Array<{
          words?: Array<{
            word: string;
            punctuated_word?: string;
            start: number;
            end: number;
            confidence: number;
            speaker?: number;
          }>;
          transcript?: string;
        }>;
      };
      is_final?: boolean;
      speech_final?: boolean;
      duration?: number;
    }) => {
      if (!data.channel?.alternatives?.[0]) return;

      const words = data.channel.alternatives[0]!.words || [];
      if (words.length === 0) return;

      const firstWord = words[0]!;
      const lastWord = words[words.length - 1]!;

      const segment: TranscriptSegment = {
        speaker: mapSpeaker(firstWord.speaker ?? 0),
        start: firstWord.start,
        end: lastWord.end,
        text: words.map((w) => w.punctuated_word || w.word).join(" "),
        confidence:
          words.reduce((sum, w) => sum + w.confidence, 0) / words.length,
      };

      if (data.is_final) {
        segments.push(segment);
        for (const cb of segmentCallbacks) cb(segment);
      }
    });

    connection.on("error", (err: Error) => {
      for (const cb of errorCallbacks) cb(err);
    });

    connection.on("close", () => {
      const wordCount = segments.reduce(
        (sum, s) => sum + s.text.split(/\s+/).length,
        0,
      );
      const duration =
        segments.length > 0
          ? segments[segments.length - 1]!.end - segments[0]!.start
          : 0;

      const transcript: Transcript = {
        id: "",
        encounterId: "",
        segments,
        durationSeconds: Math.round(duration),
        wordCount,
        createdAt: new Date().toISOString(),
      };

      for (const cb of completeCallbacks) cb(transcript);
    });

    return {
      sendChunk(chunk: ArrayBuffer): void {
        // Send raw ArrayBuffer to Deepgram WebSocket
        (connection as unknown as { send(data: ArrayBuffer): void }).send(chunk);
      },
      end(): void {
        connection.requestClose();
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
}
