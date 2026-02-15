/**
 * useAudio — MediaRecorder hook for audio capture.
 *
 * Manages microphone access, recording state, audio level metering,
 * and produces audio blobs for upload or WebSocket streaming.
 */

import { useState, useRef, useCallback, useEffect } from "react";

export interface AudioState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  level: number; // 0-1 normalized audio level
  error: string | null;
}

interface UseAudioOptions {
  onChunk?: (chunk: Blob) => void;
  sampleRate?: number;
  timeslice?: number; // ms between ondataavailable events
}

export function useAudio(options: UseAudioOptions = {}) {
  const { onChunk, sampleRate = 16000, timeslice = 250 } = options;

  const [state, setState] = useState<AudioState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    level: 0,
    error: null,
  });

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const analyser = useRef<AnalyserNode | null>(null);
  const animationFrame = useRef<number>(0);
  const chunks = useRef<Blob[]>([]);
  const startTime = useRef(0);
  const durationInterval = useRef<ReturnType<typeof setInterval>>();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
      if (audioContext.current) audioContext.current.close();
      if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
      if (durationInterval.current) clearInterval(durationInterval.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateLevel = useCallback(() => {
    if (!analyser.current) return;
    const data = new Uint8Array(analyser.current.fftSize);
    analyser.current.getByteTimeDomainData(data);

    // RMS level
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      const val = (data[i]! - 128) / 128;
      sum += val * val;
    }
    const rms = Math.sqrt(sum / data.length);
    const level = Math.min(1, rms * 3); // amplify for UI

    setState((prev) => ({ ...prev, level }));
    animationFrame.current = requestAnimationFrame(updateLevel);
  }, []);

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { sampleRate, echoCancellation: true, noiseSuppression: true },
      });

      // Set up audio analysis for level metering
      audioContext.current = new AudioContext({ sampleRate });
      const source = audioContext.current.createMediaStreamSource(stream);
      analyser.current = audioContext.current.createAnalyser();
      analyser.current.fftSize = 256;
      source.connect(analyser.current);
      updateLevel();

      // Prefer webm/opus (browser-native), fallback to whatever's available
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorder.current = recorder;
      chunks.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.current.push(e.data);
          onChunk?.(e.data);
        }
      };

      recorder.start(timeslice);
      startTime.current = Date.now();

      // Duration counter
      durationInterval.current = setInterval(() => {
        setState((prev) => ({
          ...prev,
          duration: Math.floor((Date.now() - startTime.current) / 1000),
        }));
      }, 1000);

      setState({
        isRecording: true,
        isPaused: false,
        duration: 0,
        level: 0,
        error: null,
      });
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : "Microphone access denied",
      }));
    }
  }, [onChunk, sampleRate, timeslice, updateLevel]);

  const pause = useCallback(() => {
    if (mediaRecorder.current?.state === "recording") {
      mediaRecorder.current.pause();
      setState((prev) => ({ ...prev, isPaused: true }));
    }
  }, []);

  const resume = useCallback(() => {
    if (mediaRecorder.current?.state === "paused") {
      mediaRecorder.current.resume();
      setState((prev) => ({ ...prev, isPaused: false }));
    }
  }, []);

  const stop = useCallback((): Promise<Blob> => {
    return new Promise((resolve) => {
      if (!mediaRecorder.current || mediaRecorder.current.state === "inactive") {
        resolve(new Blob());
        return;
      }

      mediaRecorder.current.onstop = () => {
        const blob = new Blob(chunks.current, { type: mediaRecorder.current?.mimeType });
        chunks.current = [];

        // Stop all tracks
        mediaRecorder.current?.stream.getTracks().forEach((t) => t.stop());

        // Stop level metering
        if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
        if (durationInterval.current) clearInterval(durationInterval.current);

        setState((prev) => ({
          ...prev,
          isRecording: false,
          isPaused: false,
          level: 0,
        }));

        resolve(blob);
      };

      mediaRecorder.current.stop();
    });
  }, []);

  return { ...state, start, pause, resume, stop };
}
