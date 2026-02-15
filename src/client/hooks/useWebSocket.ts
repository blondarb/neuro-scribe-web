/**
 * useWebSocket — Managed WebSocket connection for real-time transcription.
 *
 * Sends audio chunks to the server and receives transcript segments back.
 * Handles reconnection, auth, and lifecycle.
 */

import { useState, useRef, useCallback, useEffect } from "react";
import type { TranscriptSegment } from "../api/encounters";
import { useAuth } from "./useAuth";

type ConnectionState = "disconnected" | "connecting" | "connected" | "error";

interface UseWebSocketOptions {
  encounterId: string;
  onSegment?: (segment: TranscriptSegment) => void;
  onFinished?: () => void;
}

export function useWebSocket({ encounterId, onSegment, onFinished }: UseWebSocketOptions) {
  const { token } = useAuth();
  const [connectionState, setConnectionState] = useState<ConnectionState>("disconnected");
  const [segments, setSegments] = useState<TranscriptSegment[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  const connect = useCallback(() => {
    if (!token) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const url = `${protocol}//${window.location.host}/api/encounters/${encounterId}/stream?token=${encodeURIComponent(token)}`;

    setConnectionState("connecting");
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnectionState("connected");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data as string) as
          | { type: "segment"; segment: TranscriptSegment }
          | { type: "finished" }
          | { type: "error"; message: string };

        if (data.type === "segment") {
          setSegments((prev) => [...prev, data.segment]);
          onSegment?.(data.segment);
        } else if (data.type === "finished") {
          onFinished?.();
        }
      } catch {
        // Non-JSON message, ignore
      }
    };

    ws.onerror = () => {
      setConnectionState("error");
    };

    ws.onclose = () => {
      setConnectionState("disconnected");
      wsRef.current = null;
    };
  }, [token, encounterId, onSegment, onFinished]);

  const sendAudio = useCallback((chunk: Blob) => {
    const ws = wsRef.current;
    if (ws?.readyState === WebSocket.OPEN) {
      chunk.arrayBuffer().then((buf) => ws.send(buf));
    }
  }, []);

  const disconnect = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
    setConnectionState("disconnected");
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      wsRef.current?.close();
    };
  }, []);

  return {
    connectionState,
    segments,
    connect,
    sendAudio,
    disconnect,
    clearSegments: () => setSegments([]),
  };
}
