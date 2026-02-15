/**
 * Transcript Review — Speaker-labeled segments with inline editing.
 *
 * Physician reviews the transcript, corrects text, fixes speaker labels,
 * then proceeds to note generation.
 */

import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getEncounter, generateNote } from "../api/encounters";
import type { TranscriptSegment } from "../api/encounters";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function TranscriptReview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [segments, setSegments] = useState<TranscriptSegment[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await getEncounter(id!);
      if (res.data.transcript) {
        setSegments(res.data.transcript.segments);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load transcript");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  function handleEditStart(idx: number) {
    setEditingIdx(idx);
    setEditText(segments[idx]!.text);
  }

  function handleEditSave() {
    if (editingIdx === null) return;
    setSegments((prev) =>
      prev.map((seg, i) => (i === editingIdx ? { ...seg, text: editText } : seg)),
    );
    setEditingIdx(null);
  }

  function toggleSpeaker(idx: number) {
    setSegments((prev) =>
      prev.map((seg, i) =>
        i === idx
          ? { ...seg, speaker: seg.speaker === "physician" ? "patient" : "physician" }
          : seg,
      ),
    );
  }

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    try {
      await generateNote(id!);
      navigate(`/encounters/${id}/note`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Note generation failed");
      setGenerating(false);
    }
  }

  if (loading) return <div className="loading">Loading transcript...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Transcript Review</h1>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
            {segments.length} segments
          </span>
          <button className="btn btn-primary" onClick={handleGenerate} disabled={generating || segments.length === 0}>
            {generating ? "Generating Note..." : "Generate Note"}
          </button>
        </div>
      </div>

      {error && (
        <div className="card" style={{ borderColor: "var(--color-danger)", marginBottom: 16, color: "var(--color-danger)" }}>
          {error}
        </div>
      )}

      {segments.length === 0 ? (
        <div className="empty-state">
          <h3>No transcript available</h3>
          <p>Record or upload audio first.</p>
        </div>
      ) : (
        <div className="card">
          <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 16 }}>
            Click speaker label to toggle. Click text to edit.
          </div>

          {segments.map((seg, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: 12,
                padding: "10px 0",
                borderBottom: i < segments.length - 1 ? "1px solid var(--color-border)" : undefined,
                alignItems: "flex-start",
              }}
            >
              {/* Timestamp */}
              <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--color-text-secondary)", minWidth: 48, paddingTop: 2 }}>
                {formatTime(seg.startTime)}
              </span>

              {/* Speaker label (clickable to toggle) */}
              <button
                onClick={() => toggleSpeaker(i)}
                style={{
                  background: "none",
                  border: "1px solid var(--color-border)",
                  borderRadius: 4,
                  padding: "2px 8px",
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                  color: seg.speaker === "physician" ? "var(--color-primary)" : "var(--color-success)",
                  minWidth: 28,
                }}
              >
                {seg.speaker === "physician" ? "DR" : "PT"}
              </button>

              {/* Text (editable) */}
              <div style={{ flex: 1 }}>
                {editingIdx === i ? (
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      autoFocus
                      onKeyDown={(e) => { if (e.key === "Enter") handleEditSave(); if (e.key === "Escape") setEditingIdx(null); }}
                      style={{ flex: 1, fontSize: 14 }}
                    />
                    <button className="btn" style={{ fontSize: 12 }} onClick={handleEditSave}>Save</button>
                  </div>
                ) : (
                  <span
                    onClick={() => handleEditStart(i)}
                    style={{
                      cursor: "text",
                      lineHeight: 1.6,
                      fontSize: 14,
                      opacity: seg.confidence < 0.7 ? 0.6 : 1,
                      textDecoration: seg.confidence < 0.7 ? "underline wavy var(--color-warning)" : undefined,
                    }}
                  >
                    {seg.text}
                  </span>
                )}
              </div>

              {/* Confidence */}
              {seg.confidence < 0.7 && (
                <span style={{ fontSize: 11, color: "var(--color-warning)", minWidth: 36, textAlign: "right" }}>
                  {Math.round(seg.confidence * 100)}%
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
