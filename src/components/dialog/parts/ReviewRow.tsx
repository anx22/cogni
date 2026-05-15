// =============================================================================
//  ReviewRow — eine Zeile in BatchReviewOverlay. Drei Varianten:
//    accepted  — gedimmt, Check-Icon. Ergebnis von wissen/aktion/auswahl.
//    conflict  — amber Stripe + inline Optionen + Details-Toggle (Quellen-Card).
//    gap       — amber Stripe + Eingabefeld / Suggestion-Chips.
//
//  Die Komponente nutzt KEINEN eigenen State für commit — sie ruft Callbacks auf,
//  die in BatchReviewOverlay über useDialog() weitergereicht werden.
// =============================================================================

import { useState } from "react";
import type { DialogBox } from "@/lib/dialog/types";
import { END_STATES } from "@/lib/dialog/types";
import ConfirmDestructive from "@/components/shared/ConfirmDestructive";

const TYPE_LABEL: Record<string, string> = {
  wissen: "Wissen",
  zuordnung: "Zuordnung",
  konflikt: "Konflikt",
  gap: "Lücke",
  auswahl: "Auswahl",
  eingabe: "Eingabe",
  kontext: "Kontext",
  aktion: "Aktion",
};

interface ReviewRowProps {
  box: DialogBox;
  projectName?: string | null;
  onConfirm: (userDecision?: Record<string, unknown>) => void;
  onReject: () => void;
}

const Stripe = ({ color }: { color: string }) => (
  <div
    style={{
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      width: 3,
      background: color,
    }}
  />
);

const TypeChip = ({ kind, color }: { kind: string; color?: { bg: string; fg: string } }) => (
  <span
    className="mono"
    style={{
      fontSize: 9.5,
      fontWeight: 600,
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      padding: "3px 7px",
      borderRadius: 5,
      background: color?.bg ?? "var(--d-surf-3)",
      color: color?.fg ?? "var(--d-ink-3)",
      width: 88,
      textAlign: "center",
      flex: "0 0 auto",
    }}
  >
    {TYPE_LABEL[kind] ?? kind}
  </span>
);

const ReviewRow = ({ box, projectName, onConfirm, onReject }: ReviewRowProps) => {
  // Konflikte sind kritisch — Varianten default sichtbar, nicht hinter "Details" verstecken.
  const [expanded, setExpanded] = useState(box.type === "konflikt");
  const [rejectOpen, setRejectOpen] = useState(false);
  const [gapInput, setGapInput] = useState<string>(
    (box.payload?.antwort as string) ?? (box.payload?.text as string) ?? "",
  );

  const isFinal = END_STATES.includes(box.state);

  // KONFLIKT-Variante
  if (box.type === "konflikt" && !isFinal) {
    const faktA = box.payload?.faktA as string | undefined;
    const faktB = box.payload?.faktB as string | undefined;
    const beschreibung = box.payload?.beschreibung as string | undefined;
    return (
      <>
        <div className="dlg2-row" style={{ minHeight: 52, position: "relative" }}>
          <Stripe color="var(--d-warn)" />
          <span className="dlg2-status-dot" style={{ background: "var(--d-warn-soft)", border: "1.5px solid var(--d-warn)" }}>
            <span style={{ width: 5, height: 5, borderRadius: 999, background: "var(--d-warn)" }} />
          </span>
          <TypeChip kind="konflikt" color={{ bg: "var(--d-warn-soft)", fg: "var(--d-warn)" }} />
          <span style={{ flex: 1, fontSize: 13.5, color: "var(--d-ink)", marginLeft: 8 }}>
            {box.title}
          </span>
          <div style={{ display: "flex", gap: 6, marginLeft: 12, flex: "0 0 auto" }}>
            <button
              type="button"
              className="dlg2-chip-opt"
              onClick={() => onConfirm({ auswahl: "A" })}
              title={faktA}
            >
              Variante A
            </button>
            <button
              type="button"
              className="dlg2-chip-opt"
              onClick={() => onConfirm({ auswahl: "B" })}
              title={faktB}
            >
              Variante B
            </button>
            <button
              type="button"
              className="dlg2-chip-opt"
              style={{ color: "var(--d-ink-4)" }}
              onClick={() => setRejectOpen(true)}
              title="Endgültig verwerfen — keine Wirkung auf den Projektzustand"
            >
              Verwerfen
            </button>
          </div>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="mono"
            style={{
              marginLeft: 12,
              background: "transparent",
              border: "none",
              color: "var(--d-ink-3)",
              fontSize: 11.5,
              cursor: "pointer",
              flex: "0 0 auto",
            }}
          >
            Details {expanded ? "▲" : "▼"}
          </button>
        </div>
        {expanded && (
          <div className="dlg2-expand">
            {beschreibung && (
              <p style={{ margin: "0 0 12px", fontSize: 13, color: "var(--d-ink-2)" }}>
                {beschreibung}
              </p>
            )}
            <div style={{ display: "flex", gap: 12, alignItems: "stretch" }}>
              <div style={{
                flex: 1, padding: "14px 18px", borderRadius: 12,
                background: "var(--d-surf-3)", border: "1px solid var(--d-hair)",
              }}>
                <div className="mono" style={{ fontSize: 10, color: "var(--d-ink-3)", letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 6 }}>
                  Variante A
                </div>
                <div style={{ fontSize: 15, fontWeight: 500, color: "var(--d-ink)", lineHeight: 1.4 }}>
                  {faktA ?? "—"}
                </div>
              </div>
              <div style={{
                width: 36, display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "Geist Mono, monospace", fontSize: 10, color: "var(--d-conf)",
              }}>vs</div>
              <div style={{
                flex: 1, padding: "14px 18px", borderRadius: 12,
                background: "var(--d-surf-3)", border: "1px solid var(--d-hair)",
              }}>
                <div className="mono" style={{ fontSize: 10, color: "var(--d-ink-3)", letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 6 }}>
                  Variante B
                </div>
                <div style={{ fontSize: 15, fontWeight: 500, color: "var(--d-ink)", lineHeight: 1.4 }}>
                  {faktB ?? "—"}
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // GAP / EINGABE-Variante
  if ((box.type === "gap" || box.type === "eingabe") && !isFinal) {
    const placeholder =
      box.type === "gap" ? "Information ergänzen…" : "Antwort eingeben…";
    const submit = () => {
      const trimmed = gapInput.trim();
      if (!trimmed) return;
      const key = box.type === "gap" ? "antwort" : "text";
      onConfirm({ [key]: trimmed });
    };
    return (
      <div className="dlg2-row" style={{ minHeight: 52, position: "relative" }}>
        <Stripe color="var(--d-warn)" />
        <span className="dlg2-status-dot" style={{ background: "var(--d-warn-soft)", border: "1.5px solid var(--d-warn)" }}>
          <span style={{ width: 5, height: 5, borderRadius: 999, border: "1px solid var(--d-warn)", background: "transparent" }} />
        </span>
        <TypeChip kind={box.type} color={{ bg: "var(--d-warn-soft)", fg: "var(--d-warn)" }} />
        <span style={{ flex: 1, fontSize: 13.5, color: "var(--d-ink)", marginLeft: 8 }}>
          {box.title}
        </span>
        <div style={{ display: "flex", gap: 6, alignItems: "center", flex: "0 0 auto" }}>
          <input
            value={gapInput}
            onChange={(e) => setGapInput(e.target.value)}
            placeholder={placeholder}
            onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
            style={{
              height: 28, padding: "0 10px", borderRadius: 8,
              border: "1px solid var(--d-hair-2)", background: "var(--d-surf-2)",
              color: "var(--d-ink)", fontSize: 12.5, outline: "none", width: 200,
            }}
          />
          <button
            type="button"
            className="dlg2-chip-opt"
            style={{ borderColor: "var(--d-ok)", color: "var(--d-ok)" }}
            onClick={submit}
            disabled={!gapInput.trim()}
          >
            ✓
          </button>
        </div>
      </div>
    );
  }

  // AUSWAHL-Variante (mehrere Optionen)
  if (box.type === "auswahl" && !isFinal) {
    const opts: string[] = box.payload?.optionen ?? [];
    return (
      <div className="dlg2-row" style={{ minHeight: 52, position: "relative" }}>
        <Stripe color="var(--d-blue)" />
        <span className="dlg2-status-dot" style={{ background: "var(--d-blue-soft)", border: "1.5px solid var(--d-blue)" }}>
          <span style={{ width: 5, height: 5, borderRadius: 999, background: "var(--d-blue)" }} />
        </span>
        <TypeChip kind="auswahl" color={{ bg: "var(--d-blue-soft)", fg: "var(--d-blue)" }} />
        <span style={{ flex: 1, fontSize: 13.5, color: "var(--d-ink)", marginLeft: 8 }}>
          {box.title}
        </span>
        <div style={{ display: "flex", gap: 6, marginLeft: 12, flexWrap: "wrap", flex: "0 0 auto", maxWidth: "60%", justifyContent: "flex-end" }}>
          {opts.map((opt) => (
            <button
              key={opt}
              type="button"
              className="dlg2-chip-opt"
              onClick={() => onConfirm({ auswahl: opt })}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Default / accepted (auch wissen/aktion/zuordnung mit Single-Confirm)
  const needsConfirm = !isFinal && (box.type === "wissen" || box.type === "aktion" || box.type === "zuordnung" || box.type === "kontext");
  return (
    <div className="dlg2-row" style={{ minHeight: 48, position: "relative" }}>
      <Stripe color={isFinal ? "transparent" : "var(--d-blue)"} />
      <span
        className="dlg2-status-dot"
        style={{
          background: isFinal ? "transparent" : "var(--d-blue-soft)",
          border: `1.5px solid ${isFinal ? "var(--d-ink-4)" : "var(--d-blue)"}`,
          color: isFinal ? "var(--d-ink-4)" : "var(--d-blue)",
        }}
      >
        <svg width="9" height="9" viewBox="0 0 10 8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 4l3 3 5-6" />
        </svg>
      </span>
      <TypeChip kind={box.type} />
      <span style={{ flex: 1, fontSize: 13.5, color: isFinal ? "var(--d-ink-3)" : "var(--d-ink-2)", marginLeft: 8 }}>
        {box.title}
      </span>
      {projectName && (
        <span className="mono" style={{ fontSize: 11, color: "var(--d-ink-3)", marginLeft: 12, flex: "0 0 auto" }}>
          {projectName}
        </span>
      )}
      {needsConfirm && (
        <button
          type="button"
          className="dlg2-chip-opt"
          style={{ marginLeft: 12, borderColor: "var(--d-blue)", color: "var(--d-blue)" }}
          onClick={() => onConfirm()}
        >
          ✓
        </button>
      )}
    </div>
  );
};

export default ReviewRow;
