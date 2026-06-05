// =============================================================================
//  AssignmentOptions — gemeinsame Wahl-Fläche der Projektzuordnung.
//  Genutzt von ReviewRow (Batch) UND FaktDrillOverlay (Drill) — eine Quelle.
//  SELECT → CONFIRM: Klick wählt nur (Highlight), committet NICHT. Erst der
//  explizite Bestätigen-Button löst onPick aus (Vorbild dialog-overlay.jsx,
//  Produktprinzip „Review vor Commit"). Empfehlung ist vorausgewählt.
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
  /** Wird NUR beim expliziten Bestätigen ausgelöst — nie beim bloßen Klick. */
  onPick: (decision: AssignmentPick) => void;
  /** Führungs-Satz oben anzeigen (Drill: ja; Batch: optional). */
  showReason?: boolean;
}

const AssignmentOptions = ({ payload, onPick, showReason = false }: AssignmentOptionsProps) => {
  const candidates = payload?.candidates ?? [];
  const allProjects = payload?.all_projects ?? [];
  const recommended = payload?.recommended_project_id ?? undefined;
  const suggested = payload?.suggested_new_name ?? "";
  const reason = payload?.agent_reason ?? null;
  const list = candidates.length > 0 ? candidates : allProjects.slice(0, 8);

  // Vorauswahl: Empfehlung, sonst nichts. Klick ändert nur die Auswahl.
  const [selectedId, setSelectedId] = useState<string | null>(recommended ?? null);
  const [newName, setNewName] = useState(suggested);
  const trimmedNew = newName.trim();

  // „Neu" ist aktiv, wenn ein Name getippt ist UND kein Bestandsprojekt gewählt.
  const newActive = selectedId === null && trimmedNew.length > 0;
  const chosen: AssignmentPick | null = selectedId
    ? { project_id: selectedId }
    : newActive
      ? { new_project_name: trimmedNew }
      : null;

  const selectedName = selectedId ? list.find((p) => p.project_id === selectedId)?.name : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {showReason && reason && (
        <p style={{ fontSize: 13, color: "var(--d-ink-3)", lineHeight: 1.5, margin: 0 }}>
          {reason}
        </p>
      )}

      {/* Bestehende Projekte — Klick = auswählen (kein Commit) */}
      {list.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          <span
            className="mono"
            style={{ fontSize: 11, color: "var(--d-ink-3)", letterSpacing: 0.4 }}
          >
            BESTEHENDES PROJEKT
          </span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {list.map((c) => {
              const isSel = c.project_id === selectedId;
              const isRec = c.project_id === recommended;
              return (
                <button
                  key={c.project_id}
                  type="button"
                  className="dlg2-chip-opt"
                  aria-pressed={isSel}
                  style={{
                    height: 38,
                    padding: "0 16px",
                    fontSize: 13.5,
                    borderWidth: isSel ? 1.5 : 1,
                    borderStyle: "solid",
                    borderColor: isSel ? "var(--d-blue, var(--d-warn))" : "var(--d-hair-2)",
                    color: isSel ? "var(--d-blue, var(--d-warn))" : "var(--d-ink-2)",
                    fontWeight: isSel ? 600 : 450,
                    background: isSel
                      ? "var(--d-blue-soft, var(--d-warn-soft))"
                      : "var(--surface-1)",
                  }}
                  onClick={() => {
                    setSelectedId(c.project_id);
                    setNewName("");
                  }}
                  title={isRec ? "Von der Analyse empfohlen" : undefined}
                >
                  {isRec && <span style={{ marginRight: 6, opacity: 0.85 }}>★</span>}
                  {c.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Neues Projekt — editierbarer Titel; Tippen wählt „neu" */}
      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        <span
          className="mono"
          style={{ fontSize: 11, color: "var(--d-ink-3)", letterSpacing: 0.4 }}
        >
          ODER NEUES PROJEKT
        </span>
        <input
          type="text"
          value={newName}
          onChange={(e) => {
            setNewName(e.target.value);
            if (e.target.value.trim()) setSelectedId(null);
          }}
          onFocus={() => {
            if (trimmedNew) setSelectedId(null);
          }}
          placeholder="Projektname eingeben…"
          style={{
            height: 40,
            padding: "0 14px",
            fontSize: 13.5,
            color: "var(--d-ink)",
            background: "var(--surface-1)",
            border: newActive
              ? "1.5px solid var(--d-blue, var(--d-warn))"
              : "1px solid var(--d-hair-2)",
            borderRadius: 9,
            outline: "none",
          }}
        />
      </div>

      {list.length === 0 && !suggested && (
        <p style={{ fontSize: 12.5, color: "var(--d-ink-3)", margin: 0 }}>
          Noch keine passenden Projekte — gib oben einen Namen ein.
        </p>
      )}

      {/* Bestätigen — der EINZIGE Weg zum Commit */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginTop: 2,
        }}
      >
        <span style={{ fontSize: 12.5, color: "var(--d-ink-3)" }}>
          {chosen
            ? selectedId
              ? `Zuordnen zu „${selectedName}"`
              : `Neues Projekt „${trimmedNew}"`
            : "Projekt wählen oder Namen eingeben"}
        </span>
        <button
          type="button"
          disabled={!chosen}
          onClick={() => chosen && onPick(chosen)}
          className="dlg2-btn-commit"
          style={{
            height: 40,
            padding: "0 20px",
            fontSize: 13.5,
            fontWeight: 600,
            whiteSpace: "nowrap",
            opacity: chosen ? 1 : 0.4,
            cursor: chosen ? "pointer" : "not-allowed",
          }}
        >
          {selectedId ? "Zuordnen →" : "Anlegen →"}
        </button>
      </div>
    </div>
  );
};

export default AssignmentOptions;
