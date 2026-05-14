// =============================================================================
//  FaktDrillOverlay (Dialog V2) — Single-Box-Pfad. Kommt zum Einsatz, wenn die
//  Session genau eine Decision-Box hat (z.B. eskalierter Konflikt).
//  Nutzt useDialog().commitBox unverändert. App-Theme via [data-dialog].
// =============================================================================

import { useDialog } from "./DialogProvider";
import SessionHeader from "./parts/SessionHeader";
import { END_STATES } from "@/lib/dialog/types";
import { useState } from "react";

const FaktDrillOverlay = ({ onClose }: { onClose: () => void }) => {
  const { session, commitBox } = useDialog();
  const box = session?.boxes.find((b) => b.type !== "kontext" && !END_STATES.includes(b.state));
  const [selected, setSelected] = useState<"A" | "B" | "open" | null>(null);
  const [gapInput, setGapInput] = useState<string>("");

  if (!session || !box) return null;

  const renderConflict = () => {
    const faktA = box.payload?.faktA as string | undefined;
    const faktB = box.payload?.faktB as string | undefined;
    const beschreibung = box.payload?.beschreibung as string | undefined;

    const save = () => {
      if (selected === "A") commitBox(box.id, "confirm", { auswahl: "A" });
      else if (selected === "B") commitBox(box.id, "confirm", { auswahl: "B" });
      else if (selected === "open") commitBox(box.id, "reject");
    };

    return (
      <div style={{ padding: "32px 44px", flex: 1, overflowY: "auto" }}>
        <div
          style={{
            padding: "14px 18px",
            borderRadius: 12,
            background: "var(--d-conf-soft)",
            border: "1px solid var(--d-conf)",
            display: "flex",
            gap: 10,
            marginBottom: 28,
          }}
        >
          <span style={{ color: "var(--d-conf)", fontSize: 18 }}>⚠</span>
          <div>
            <div style={{ color: "var(--d-conf)", fontWeight: 500, fontSize: 14 }}>
              Zwei Quellen widersprechen sich
            </div>
            {beschreibung && (
              <div className="t-small" style={{ color: "var(--d-ink-2)", marginTop: 4 }}>
                {beschreibung}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 16 }}>
          {(["A", "B"] as const).map((k) => {
            const isSel = selected === k;
            const fakt = k === "A" ? faktA : faktB;
            return (
              <button
                key={k}
                type="button"
                onClick={() => setSelected(k)}
                style={{
                  padding: 24,
                  borderRadius: 14,
                  border: `1px solid ${isSel ? "var(--d-warn)" : "var(--d-hair-2)"}`,
                  background: isSel ? "var(--d-warn-soft)" : "var(--d-surf)",
                  textAlign: "left",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  color: "var(--d-ink)",
                }}
              >
                <div className="mono t-micro" style={{ color: "var(--d-ink-3)", marginBottom: 10 }}>
                  Variante {k}
                </div>
                <div style={{ fontSize: 22, fontWeight: 500, lineHeight: 1.25, color: "var(--d-ink)" }}>
                  {fakt ?? "—"}
                </div>
              </button>
            );
          })}
          {/* VS in zweiter Spalte */}
        </div>

        <div style={{ marginTop: 24 }}>
          <button
            type="button"
            onClick={() => setSelected("open")}
            className="dlg2-chip-opt"
            style={{
              borderColor: selected === "open" ? "var(--d-ink-3)" : "var(--d-hair-2)",
              color: selected === "open" ? "var(--d-ink)" : "var(--d-ink-3)",
            }}
          >
            Offen lassen — als Handlungsbedarf weiterführen
          </button>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: 24,
            marginTop: 24,
            borderTop: "1px solid var(--d-hair)",
          }}
        >
          <button type="button" className="dlg2-btn-secondary" onClick={onClose}>
            Verwerfen
          </button>
          <button
            type="button"
            className={`dlg2-btn-commit${selected ? " ready" : ""}`}
            onClick={save}
            disabled={!selected}
          >
            Entscheidung speichern →
          </button>
        </div>
      </div>
    );
  };

  const renderGap = () => {
    const wirkung = box.payload?.wirkung as string | undefined;
    const betrifft = box.payload?.betrifft as string | undefined;
    const submit = () => {
      const t = gapInput.trim();
      if (!t) return;
      const key = box.type === "gap" ? "antwort" : "text";
      commitBox(box.id, "confirm", { [key]: t });
    };
    return (
      <div style={{ padding: "32px 44px", flex: 1, display: "grid", gridTemplateColumns: "2fr 3fr", gap: 24 }}>
        <div>
          {betrifft && (
            <div
              className="cogni-card"
              style={{ padding: 20, marginBottom: 16 }}
            >
              <div className="t-micro" style={{ color: "var(--d-ink-4)", marginBottom: 8 }}>
                KONTEXT
              </div>
              <div className="t-body" style={{ color: "var(--d-ink)" }}>{betrifft}</div>
            </div>
          )}
        </div>
        <div>
          <div
            style={{
              padding: 20,
              borderRadius: 14,
              background: "var(--d-warn-soft)",
              border: "1px solid var(--d-warn)",
            }}
          >
            <div className="t-micro" style={{ color: "var(--d-warn)", marginBottom: 8 }}>
              LÜCKE
            </div>
            <div className="t-body" style={{ color: "var(--d-ink)", fontWeight: 500 }}>{box.title}</div>
            {wirkung && (
              <div className="t-small" style={{ color: "var(--d-ink-2)", marginTop: 6 }}>
                {wirkung}
              </div>
            )}
          </div>

          <input
            type="text"
            value={gapInput}
            onChange={(e) => setGapInput(e.target.value)}
            placeholder="Wert eingeben…"
            onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
            style={{
              width: "100%",
              marginTop: 16,
              padding: "12px 14px",
              borderRadius: 10,
              border: "1px solid var(--d-hair-2)",
              background: "var(--d-surf)",
              color: "var(--d-ink)",
              fontSize: 14,
              outline: "none",
              fontFamily: "inherit",
            }}
          />

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 10,
              marginTop: 24,
              paddingTop: 20,
              borderTop: "1px solid var(--d-hair)",
            }}
          >
            <button type="button" className="dlg2-btn-secondary" onClick={onClose}>
              Später
            </button>
            <button
              type="button"
              className={`dlg2-btn-commit${gapInput.trim() ? " ready" : ""}`}
              onClick={submit}
              disabled={!gapInput.trim()}
            >
              Speichern →
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div data-dialog className="dlg2-root dialog-backdrop">
      <SessionHeader source={box.title} summary={session.projectName ?? undefined} onClose={onClose} />
      {box.type === "konflikt" ? renderConflict() : renderGap()}
    </div>
  );
};

export default FaktDrillOverlay;
