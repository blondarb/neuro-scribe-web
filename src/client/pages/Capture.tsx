/**
 * Capture Page — Audio recording with real-time transcript preview.
 *
 * Records via MediaRecorder, streams audio over WebSocket,
 * and displays live transcript segments as they arrive.
 */

import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAudio } from "../hooks/useAudio";
import { useWebSocket } from "../hooks/useWebSocket";
import { transcribeAudio } from "../api/encounters";
import AudioMeter from "../components/AudioMeter";

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function Capture() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [mode, setMode] = useState<"idle" | "streaming" | "upload">("idle");

  const ws = useWebSocket({
    encounterId: id!,
    onSegment: () => {}, // segments tracked in ws.segments
  });

  const audio = useAudio({
    onChunk: mode === "streaming" ? ws.sendAudio : undefined,
  });

  const handleStartStream = useCallback(async () => {
    setMode("streaming");
    ws.connect();
    await audio.start();
  }, [ws, audio]);

  const handleStartRecord = useCallback(async () => {
    setMode("upload");
    await audio.start();
  }, [audio]);

  const handleStop = useCallback(async () => {
    const blob = await audio.stop();

    if (mode === "streaming") {
      ws.disconnect();
      // Streaming already sent audio; navigate to transcript
      navigate(`/encounters/${id}/transcript`);
    } else if (mode === "upload" && blob.size > 0) {
      // Upload the recording for batch transcription
      setUploading(true);
      try {
        await transcribeAudio(id!, blob, blob.type || "audio/webm");
        navigate(`/encounters/${id}/transcript`);
      } catch (err) {
        console.error("Upload failed:", err);
        setUploading(false);
      }
    }

    setMode("idle");
  }, [audio, mode, ws, id, navigate]);

  return (
    <div>
      <div className="page-header">
        <h1>Capture</h1>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--color-text-secondary)" }}>
          {id?.slice(0, 8)}
        </span>
      </div>

      {/* Recording controls */}
      <div className="card" style={{ textAlign: "center", padding: 32, marginBottom: 24 }}>
        <AudioMeter level={audio.level} isRecording={audio.isRecording} />

        <div style={{ fontSize: 48, fontFamily: "var(--font-mono)", fontWeight: 600, margin: "24px 0" }}>
          {formatDuration(audio.duration)}
        </div>

        {audio.error && (
          <div style={{ color: "var(--color-danger)", fontSize: 14, marginBottom: 16 }}>{audio.error}</div>
        )}

        {!audio.isRecording ? (
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button className="btn btn-primary btn-lg" onClick={handleStartStream}>
              Stream + Transcribe
            </button>
            <button className="btn btn-lg" onClick={handleStartRecord}>
              Record for Upload
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            {audio.isPaused ? (
              <button className="btn btn-lg" onClick={audio.resume}>Resume</button>
            ) : (
              <button className="btn btn-lg" onClick={audio.pause}>Pause</button>
            )}
            <button className="btn btn-danger btn-lg" onClick={handleStop} disabled={uploading}>
              {uploading ? "Uploading..." : "Stop"}
            </button>
          </div>
        )}
      </div>

      {/* Live transcript preview (streaming mode) */}
      {mode === "streaming" && ws.segments.length > 0 && (
        <div className="card">
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: "var(--color-text-secondary)" }}>
            Live Transcript
          </h3>
          <div style={{ maxHeight: 300, overflowY: "auto" }}>
            {ws.segments.map((seg, i) => (
              <div key={i} style={{ marginBottom: 8, lineHeight: 1.6 }}>
                <span style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: seg.speaker === "physician" ? "var(--color-primary)" : "var(--color-success)",
                  marginRight: 8,
                }}>
                  {seg.speaker === "physician" ? "DR" : "PT"}
                </span>
                <span style={{ fontSize: 14 }}>{seg.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Connection status */}
      {mode === "streaming" && (
        <div style={{ marginTop: 8, fontSize: 12, color: "var(--color-text-secondary)" }}>
          WebSocket: {ws.connectionState}
        </div>
      )}
    </div>
  );
}
