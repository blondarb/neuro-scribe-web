/**
 * Encounter List — Active and past encounters with status tracking.
 */

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { listEncounters, createEncounter } from "../api/encounters";
import type { Encounter } from "../api/encounters";
import StatusBadge from "../components/StatusBadge";

export default function EncounterList() {
  const navigate = useNavigate();
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await listEncounters();
      setEncounters(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load encounters");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate() {
    setCreating(true);
    try {
      const res = await createEncounter();
      navigate(`/encounters/${res.data.id}/capture`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create encounter");
      setCreating(false);
    }
  }

  function getNextAction(encounter: Encounter) {
    switch (encounter.status) {
      case "recording":
        return { label: "Capture", path: `/encounters/${encounter.id}/capture` };
      case "transcribed":
        return { label: "Review", path: `/encounters/${encounter.id}/transcript` };
      case "generating":
      case "drafted":
      case "reviewed":
        return { label: "Edit Note", path: `/encounters/${encounter.id}/note` };
      case "finalized":
        return { label: "View Note", path: `/encounters/${encounter.id}/note` };
      default:
        return { label: "Open", path: `/encounters/${encounter.id}/capture` };
    }
  }

  if (loading) return <div className="loading">Loading encounters...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Encounters</h1>
        <button className="btn btn-primary" onClick={handleCreate} disabled={creating}>
          {creating ? "Creating..." : "New Encounter"}
        </button>
      </div>

      {error && (
        <div className="card" style={{ borderColor: "var(--color-danger)", marginBottom: 16, color: "var(--color-danger)" }}>
          {error}
        </div>
      )}

      {encounters.length === 0 ? (
        <div className="empty-state">
          <h3>No encounters yet</h3>
          <p>Create your first encounter to start recording.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {encounters.map((enc) => {
            const action = getNextAction(enc);
            return (
              <div
                key={enc.id}
                className="card"
                style={{ display: "flex", alignItems: "center", cursor: "pointer" }}
                onClick={() => navigate(action.path)}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--color-text-secondary)" }}>
                      {enc.id.slice(0, 8)}
                    </span>
                    <StatusBadge status={enc.status} />
                  </div>
                  <div style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
                    {new Date(enc.createdAt).toLocaleString()}
                  </div>
                </div>
                <button className="btn" style={{ fontSize: 13 }}>
                  {action.label}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
