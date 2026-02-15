/**
 * NoteSection — Editable SOAP section with accept/reject/edit controls.
 */

import { useState } from "react";

interface Props {
  title: string;
  content: string;
  onUpdate: (content: string) => void;
  readOnly?: boolean;
}

const SECTION_LABELS: Record<string, string> = {
  chiefComplaint: "Chief Complaint",
  hpiNarrative: "History of Present Illness",
  reviewOfSystems: "Review of Systems",
  examination: "Physical Examination",
  assessment: "Assessment",
  plan: "Plan",
};

export default function NoteSection({ title, content, onUpdate, readOnly }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(content);

  const label = SECTION_LABELS[title] ?? title;

  function handleSave() {
    onUpdate(draft);
    setIsEditing(false);
  }

  function handleCancel() {
    setDraft(content);
    setIsEditing(false);
  }

  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, color: "var(--color-text-secondary)" }}>
          {label}
        </h3>
        {!readOnly && !isEditing && (
          <button className="btn" style={{ fontSize: 12, padding: "4px 10px" }} onClick={() => setIsEditing(true)}>
            Edit
          </button>
        )}
      </div>

      {isEditing ? (
        <>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={6}
            style={{ marginBottom: 8, fontFamily: "var(--font-sans)", lineHeight: 1.6 }}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-primary" style={{ fontSize: 12 }} onClick={handleSave}>
              Save
            </button>
            <button className="btn" style={{ fontSize: 12 }} onClick={handleCancel}>
              Cancel
            </button>
          </div>
        </>
      ) : (
        <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.6, fontSize: 14 }}>
          {content || <span style={{ color: "var(--color-text-secondary)", fontStyle: "italic" }}>No content</span>}
        </div>
      )}
    </div>
  );
}
