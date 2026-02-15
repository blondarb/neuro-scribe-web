/**
 * Settings — User preferences for note format, specialty defaults, templates.
 */

import { useState } from "react";
import { useAuth } from "../hooks/useAuth";

export default function Settings() {
  const { user } = useAuth();
  const [noteFormat, setNoteFormat] = useState("soap");
  const [saved, setSaved] = useState(false);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    // TODO: Persist to server
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div>
      <div className="page-header">
        <h1>Settings</h1>
      </div>

      <div style={{ maxWidth: 560 }}>
        {/* Profile */}
        <div className="card" style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, marginBottom: 16 }}>Profile</h2>
          <div style={{ fontSize: 14, lineHeight: 2 }}>
            <div>
              <span style={{ color: "var(--color-text-secondary)" }}>Email: </span>
              {user?.email}
            </div>
            <div>
              <span style={{ color: "var(--color-text-secondary)" }}>Role: </span>
              {user?.role}
            </div>
            <div>
              <span style={{ color: "var(--color-text-secondary)" }}>User ID: </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{user?.userId}</span>
            </div>
          </div>
        </div>

        {/* Note Preferences */}
        <form onSubmit={handleSave}>
          <div className="card" style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, marginBottom: 16 }}>Note Preferences</h2>

            <label style={{ display: "block", fontSize: 14, marginBottom: 8, color: "var(--color-text-secondary)" }}>
              Default Note Format
            </label>
            <select
              value={noteFormat}
              onChange={(e) => setNoteFormat(e.target.value)}
              style={{ marginBottom: 16 }}
            >
              <option value="soap">SOAP Note</option>
              <option value="hp">H&P Note</option>
              <option value="progress">Progress Note</option>
              <option value="consult">Consult Note</option>
              <option value="procedure">Procedure Note</option>
            </select>
          </div>

          <button className="btn btn-primary" type="submit">
            {saved ? "Saved!" : "Save Preferences"}
          </button>
        </form>
      </div>
    </div>
  );
}
