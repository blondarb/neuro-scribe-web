/**
 * Note Editor — Section-by-section SOAP note editing.
 *
 * Displays the AI-generated note with section-level accept/reject/edit.
 * Shows plan matches, ICD-10 suggestions, and medication info in a sidebar.
 * One-click copy-to-clipboard for EHR paste.
 */

import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { getEncounter, updateNote, finalizeNote } from "../api/encounters";
import type { ClinicalNote, NoteSections } from "../api/encounters";
import NoteSection from "../components/NoteSection";
import StatusBadge from "../components/StatusBadge";

const SECTION_ORDER = [
  "chiefComplaint",
  "hpiNarrative",
  "reviewOfSystems",
  "examination",
  "assessment",
  "plan",
];

export default function NoteEditor() {
  const { id } = useParams<{ id: string }>();
  const [note, setNote] = useState<ClinicalNote | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await getEncounter(id!);
      if (res.data.note) {
        setNote(res.data.note);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load note");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSectionUpdate(sectionKey: string, content: string) {
    if (!note) return;
    setSaving(true);
    try {
      const sections: Partial<NoteSections> = { [sectionKey]: content };
      const res = await updateNote(id!, sections);
      setNote(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleFinalize() {
    if (!note) return;
    setFinalizing(true);
    try {
      const res = await finalizeNote(id!);
      setNote(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to finalize");
    } finally {
      setFinalizing(false);
    }
  }

  function handleCopy() {
    if (!note) return;
    const text = SECTION_ORDER
      .filter((key) => note.sections[key])
      .map((key) => {
        const label = key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
        return `${label.toUpperCase()}\n${note.sections[key]}`;
      })
      .join("\n\n");

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (loading) return <div className="loading">Loading note...</div>;

  if (!note) {
    return (
      <div className="empty-state">
        <h3>No note generated yet</h3>
        <p>Generate a note from the transcript review page.</p>
      </div>
    );
  }

  const isFinalized = note.status === "finalized";

  return (
    <div style={{ display: "flex", gap: 24 }}>
      {/* Main note editor */}
      <div style={{ flex: 1 }}>
        <div className="page-header">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <h1>Clinical Note</h1>
            <StatusBadge status={note.status} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {saving && <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>Saving...</span>}
            <button className="btn" onClick={handleCopy}>
              {copied ? "Copied!" : "Copy to Clipboard"}
            </button>
            {!isFinalized && (
              <button className="btn btn-primary" onClick={handleFinalize} disabled={finalizing}>
                {finalizing ? "Finalizing..." : "Finalize"}
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="card" style={{ borderColor: "var(--color-danger)", marginBottom: 16, color: "var(--color-danger)" }}>
            {error}
          </div>
        )}

        {SECTION_ORDER.map((key) => (
          <NoteSection
            key={key}
            title={key}
            content={note.sections[key] ?? ""}
            onUpdate={(content) => handleSectionUpdate(key, content)}
            readOnly={isFinalized}
          />
        ))}
      </div>

      {/* Sidebar: plan matches, ICD-10, medications */}
      <aside style={{ width: 280, flexShrink: 0 }}>
        {/* Plan Matches */}
        {note.metadata?.planMatches && note.metadata.planMatches.length > 0 && (
          <div className="card" style={{ marginBottom: 12 }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 10 }}>
              Matched Plans
            </h3>
            {note.metadata.planMatches.map((pm, i) => (
              <div key={i} style={{ fontSize: 13, marginBottom: 6, display: "flex", justifyContent: "space-between" }}>
                <span>{pm.title}</span>
                <span style={{ color: "var(--color-text-secondary)" }}>{Math.round(pm.score * 100)}%</span>
              </div>
            ))}
          </div>
        )}

        {/* ICD-10 Suggestions */}
        {note.metadata?.icd10Suggestions && note.metadata.icd10Suggestions.length > 0 && (
          <div className="card" style={{ marginBottom: 12 }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 10 }}>
              ICD-10 Codes
            </h3>
            {note.metadata.icd10Suggestions.map((code, i) => (
              <div key={i} style={{ fontSize: 13, marginBottom: 6 }}>
                <span style={{ fontFamily: "var(--font-mono)", color: "var(--color-primary)" }}>{code.code}</span>
                <span style={{ color: "var(--color-text-secondary)", marginLeft: 8 }}>{code.description}</span>
              </div>
            ))}
          </div>
        )}

        {/* Medications */}
        {note.metadata?.medications && note.metadata.medications.length > 0 && (
          <div className="card">
            <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 10 }}>
              Medications
            </h3>
            {note.metadata.medications.map((med, i) => (
              <div key={i} style={{ fontSize: 13, marginBottom: 6, display: "flex", justifyContent: "space-between" }}>
                <span>{med.name}</span>
                {!med.doseValid && (
                  <span style={{ color: "var(--color-warning)", fontSize: 11 }}>Dose check</span>
                )}
              </div>
            ))}
          </div>
        )}
      </aside>
    </div>
  );
}
