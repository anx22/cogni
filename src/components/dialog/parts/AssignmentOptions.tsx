// =============================================================================
//  AssignmentOptions — gemeinsame Wahl-Fläche der Projektzuordnung.
//  Genutzt von ReviewRow (Batch) UND FaktDrillOverlay (Drill) — eine Quelle,
//  damit beide Ansichten Kandidaten + editierbaren Neu-Titel zeigen.
//  Payload-Vertrag: src/lib/dialog/loadSession.ts (box_type "assignment").
// =============================================================================

import { useState } from "react";

interface ProjectLite {
  project_id: string;
  name: string;
}

export interface AssignmentPayload {
  candidates?: ProjectLite[];
  all_projects?: ProjectLite[];
  recommended_project_id?: string | null;
  suggested_new_name?: string | null;
  agent_reason?: string | null;
}

export type AssignmentPick = { project_id: string } | { new_project_name: string };

interface AssignmentOptionsProps {
  payload: AssignmentPayload | null | undefined;
  onPick: (decision: AssignmentPick) => void;
  /** Führungs-Satz oben anzeigen (Drill: ja; Batch: optional, da Zeile schon Reason zeigt). */
  showReason?: boolean;
}

const AssignmentOptions = ({ payload, onPick, showReason = false }: AssignmentOptionsProps) => {
  const candidates = payload?.candidates ?? [];
  const allProjects = payload?.all_projects ?? [];
  const recommended = payload?.recommended_project_id ?? undefined;
  const suggested = payload?.suggested_new_name ?? "";
  const reason = payload?.agent_reason ?? null;
  const list = candidates.length > 0 ? candidates : allProjects.slice(0, 8);

  const [newName, setNewName] = useState(suggested);
  const trimmed = newName.trim();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {showReason && reason && (
        <p style={{ fontSize: 13, color: "var(--d-ink-3)", lineHeight: 1.5, margin: 0 }}>
          {reason}
        </p>
      )}

      {/* Bestehende Projekte */}
      {list.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span
            className="mono"
            style={{ fontSize: 11, color: "var(--d-ink-3)", letterSpacing: 0.4 }}
          >
            BESTEHENDES PROJEKT
          </span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {list.map((c) => {
              const isRec = c.project_id === recommended;
              return (
                <button
                  key={c.project_id}
                  type="button"
                  className="dlg2-chip-opt"
                  style={{
                    height: 36,
                    padding: "0 16px",
                    fontSize: 13.5,
                    borderColor: isRec ? "var(--d-warn)" : "var(--d-hair-3, var(--d-hair-2))",
                    color: isRec ? "var(--d-warn)" : "var(--d-ink)",
                    fontWeight: isRec ? 600 : 450,
                    background: isRec ? "var(--d-warn-soft)" : "var(--surface-1)",
                  }}
                  onClick={() => onPick({ project_id: c.project_id })}
                  title={isRec ? "Von der Analyse empfohlen" : undefined}
                >
                  {isRec && <span style={{ marginRight: 6 }}>★</span>}
                  {c.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Neues Projekt — editierbarer Titel */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span
          className="mono"
          style={{ fontSize: 11, color: "var(--d-ink-3)", letterSpacing: 0.4 }}
        >
          NEUES PROJEKT ANLEGEN
        </span>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && trimmed) {
                e.preventDefault();
                onPick({ new_project_name: trimmed });
              }
            }}
            placeholder="Projektname…"
            style={{
              flex: 1,
              height: 38,
              padding: "0 14px",
              fontSize: 13.5,
              color: "var(--d-ink)",
              background: "var(--surface-1)",
              border: "1px solid var(--d-hair-3, var(--d-hair-2))",
              borderRadius: 8,
              outline: "none",
            }}
          />
          <button
            type="button"
            disabled={!trimmed}
            onClick={() => onPick({ new_project_name: trimmed })}
            className="dlg2-chip-opt"
            style={{
              height: 38,
              padding: "0 18px",
              fontSize: 13.5,
              fontWeight: 600,
              whiteSpace: "nowrap",
              opacity: trimmed ? 1 : 0.4,
              cursor: trimmed ? "pointer" : "not-allowed",
              borderColor: "var(--d-blue, var(--d-warn))",
              color: "var(--d-blue, var(--d-warn))",
              background: trimmed ? "var(--d-blue-soft, var(--d-warn-soft))" : "transparent",
            }}
          >
            Anlegen →
          </button>
        </div>
      </div>

      {list.length === 0 && !suggested && (
        <p style={{ fontSize: 12.5, color: "var(--d-ink-3)", margin: 0 }}>
          Noch keine passenden Projekte — leg oben eins an.
        </p>
      )}
    </div>
  );
};

export default AssignmentOptions;
