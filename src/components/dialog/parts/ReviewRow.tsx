// =============================================================================
//  ReviewRow — Renderer-Matrix für die Batch-Liste.
// -----------------------------------------------------------------------------
//  Generalistisches Prinzip (siehe docs/DECISIONS.md "Modalitäts-Vertrag"):
//
//    Jede Aussage hat drei orthogonale Achsen:
//      1. Modalität     — Sprechhandlung (assertion/condition/question/…)
//      2. Bezug         — steht alleine oder hängt an Bezugsobjekt
//      3. Erwartung     — `asks` ist gesetzt = User soll antworten, sonst nicht
//
//  Diese Datei rendert für jede Modalität eine eigene Box mit eigener
//  Default-Aktion und eigener Aktionsleiste. Eingabefeld existiert NUR, wenn
//  `payload.asks` gesetzt ist — sonst keine "Wert eingeben"-Sackgasse.
//
//  Die Aktionsspalte (rechts) wird immer aus 2 Komponenten gebaut:
//    - Primary  (Default-Aktion, hervorgehoben)
//    - Bezug ändern / Verwerfen (sekundär, optional)
// =============================================================================

import { useState } from "react";
import type { DialogBox } from "@/lib/dialog/types";
import { END_STATES } from "@/lib/dialog/types";
import ConfirmDestructive from "@/components/shared/ConfirmDestructive";
import AssignmentOptions from "./AssignmentOptions";
import { DeltaChip, RefToken } from "./deltaTokens";
import { useDialog } from "@/components/dialog/dialogContext";

// -----------------------------------------------------------------------------
//  Labels + Farben pro Modalität.
//  Drei Stimmungs-Klassen:
//    INFO   = blau (Wissen, Notiz, Kontext, Beziehung, Attribut, stille Substanz)
//    AKTION = grün (Aktion, Vorschlag)
//    WARN   = amber (Konflikt, Lücke, Eingabe, Frage, Bedingung, Ausschluss,
//                    Annahme, Risiko, Unklar — alles was Klärung verlangt)
// -----------------------------------------------------------------------------
const TYPE_LABEL: Record<string, string> = {
  wissen: "Wissen",
  zuordnung: "Projekt",
  konflikt: "Konflikt",
  gap: "Lücke",
  auswahl: "Auswahl",
  eingabe: "Eingabe",
  kontext: "Kontext",
  aktion: "Aktion",
  bedingung: "Bedingung",
  ausschluss: "Ausschluss",
  annahme: "Annahme",
  vorschlag: "Vorschlag",
  frage: "Frage",
  notiz: "Notiz",
  beziehung: "Beziehung",
  attribut: "Detail",
  risiko: "Risiko",
  unklar: "Unklar",
};

type Tone = "info" | "warn" | "action";
const TYPE_TONE: Record<string, Tone> = {
  wissen: "info",
  kontext: "info",
  notiz: "info",
  beziehung: "info",
  attribut: "info",
  auswahl: "info",
  aktion: "action",
  vorschlag: "action",
  konflikt: "warn",
  gap: "warn",
  eingabe: "warn",
  frage: "warn",
  bedingung: "warn",
  ausschluss: "warn",
  annahme: "warn",
  risiko: "warn",
  unklar: "warn",
  zuordnung: "warn",
};

const toneToColors = (t: Tone) =>
  t === "warn"
    ? { stripe: "var(--d-warn)", chipBg: "var(--d-warn-soft)", chipFg: "var(--d-warn)" }
    : t === "action"
      ? {
          stripe: "var(--d-ok)",
          chipBg: "color-mix(in oklab, var(--d-ok) 18%, transparent)",
          chipFg: "var(--d-ok)",
        }
      : { stripe: "var(--d-blue)", chipBg: "var(--d-blue-soft)", chipFg: "var(--d-blue)" };

// -----------------------------------------------------------------------------
interface ReviewRowProps {
  box: DialogBox;
  projectName?: string | null;
  blocked?: boolean;
  blockedReason?: string | null;
  onConfirm: (userDecision?: Record<string, unknown>) => void;
  onReject: () => void;
}

const Stripe = ({ color }: { color: string }) => (
  <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: color }} />
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

/** Source-Card mit Datums-/Wert-Anchor + Mono-Eyebrow + optionalem Metadata-Footer. */
const SourceCard = ({
  eyebrow,
  value,
  meta,
  active,
}: {
  eyebrow: string;
  value: string;
  meta?: string;
  active?: boolean;
}) => (
  <div
    style={{
      flex: 1,
      padding: "14px 18px",
      borderRadius: 12,
      background: active ? "var(--d-warn-soft)" : "var(--d-surf-3)",
      border: `1px solid ${active ? "var(--d-warn)" : "var(--d-hair)"}`,
    }}
  >
    <div
      className="mono"
      style={{
        fontSize: 10,
        color: "var(--d-ink-3)",
        letterSpacing: ".06em",
        textTransform: "uppercase",
        marginBottom: 6,
      }}
    >
      {eyebrow}
    </div>
    <div
      style={{
        fontSize: 22,
        fontWeight: 500,
        letterSpacing: "-.02em",
        color: active ? "var(--d-warn)" : "var(--d-ink)",
        lineHeight: 1.25,
      }}
    >
      {value}
    </div>
    {meta && (
      <div className="mono" style={{ fontSize: 11, color: "var(--d-ink-3)", marginTop: 6 }}>
        {meta}
      </div>
    )}
  </div>
);

// -----------------------------------------------------------------------------
// Sekundär-Aktionen, die eine Inline-Korrektur erfassen.
// kind = welches Feld der User korrigieren will (→ Payload-Key beim Commit)
// label = was im Header steht, hint = Placeholder im Input
type InlineEditKind = "bezug" | "due_date" | "decide";

const INLINE_EDIT_CONFIG: Record<InlineEditKind, { label: string; hint: string; key: string }> = {
  bezug: { label: "Bezug ändern", hint: "Worauf bezieht sich das?", key: "attaches_to" },
  due_date: { label: "Frist setzen", hint: "Frist (z. B. 15.06.2026)", key: "due_date" },
  decide: { label: "Jetzt entscheiden", hint: "", key: "" }, // sondergebauter Render
};

const ReviewRow = ({ box, projectName, blocked, onConfirm, onReject }: ReviewRowProps) => {
  const { readonly } = useDialog();
  const [expanded, setExpanded] = useState(box.type === "konflikt" || box.type === "zuordnung");
  const [rejectOpen, setRejectOpen] = useState(false);
  const [askInput, setAskInput] = useState<string>(
    (box.payload?.antwort as string) ?? (box.payload?.text as string) ?? "",
  );
  // Aktive Sekundär-Korrektur (Bezug ändern / Frist setzen / Jetzt entscheiden).
  // null = kein Inline-Edit offen.
  const [editing, setEditing] = useState<InlineEditKind | null>(null);
  const [editInput, setEditInput] = useState<string>("");

  const isFinal = END_STATES.includes(box.state);
  const asks = (box.payload?.asks as string | null) ?? null;
  const understood = (box.payload?.understood as string | null) ?? null;
  const attachesTo = (box.payload?.attaches_to as string | null) ?? null;

  // -------------------------------------------------------------------------
  //  ZUORDNUNG (kritisches Gate, eigene laute Variante)
  // -------------------------------------------------------------------------
  if (box.type === "zuordnung" && !isFinal) {
    const reason = (box.payload?.agent_reason as string | undefined) ?? null;

    return (
      <>
        <div
          className="dlg2-row"
          style={{
            minHeight: 64,
            position: "relative",
            background: "color-mix(in oklab, var(--d-warn-soft) 50%, transparent)",
            borderBottom: "1px solid var(--d-warn)",
          }}
        >
          <Stripe color="var(--d-warn)" />
          <span
            className="dlg2-status-dot"
            style={{
              background: "var(--d-warn)",
              border: "1.5px solid var(--d-warn)",
              color: "var(--surface-0)",
              fontWeight: 700,
              fontSize: 10,
            }}
          >
            1
          </span>
          <TypeChip kind="zuordnung" color={{ bg: "var(--d-warn)", fg: "var(--surface-0)" }} />
          <div style={{ flex: 1, marginLeft: 8, minWidth: 0 }}>
            <div style={{ fontSize: 13.5, color: "var(--d-ink)", fontWeight: 500 }}>
              Projektzuordnung erforderlich
            </div>
            {(reason || box.title) && (
              <div style={{ fontSize: 12, color: "var(--d-ink-3)", marginTop: 2, lineHeight: 1.4 }}>
                {reason ?? box.title}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="mono"
            style={{
              marginLeft: 12,
              background: "transparent",
              border: "none",
              color: "var(--d-warn)",
              fontSize: 11.5,
              cursor: "pointer",
              flex: "0 0 auto",
              fontWeight: 600,
            }}
          >
            {expanded ? "Weniger ▲" : "Projekt wählen ▼"}
          </button>
        </div>
        {expanded && (
          <div className="dlg2-expand" style={{ paddingLeft: 109, paddingRight: 24 }}>
            <AssignmentOptions payload={box.payload} onPick={onConfirm} />
          </div>
        )}
      </>
    );
  }

  // -------------------------------------------------------------------------
  //  Visuelle Sperre, solange Gate aktiv ist
  // -------------------------------------------------------------------------
  const dim = blocked && !isFinal;
  const dimStyle: React.CSSProperties = dim
    ? { opacity: 0.45, pointerEvents: "none" as const }
    : {};

  // -------------------------------------------------------------------------
  //  KONFLIKT (existierte schon, hier nur leicht aufgeräumt)
  // -------------------------------------------------------------------------
  if (box.type === "konflikt" && !isFinal) {
    const faktA = (box.payload?.faktA as string | undefined) ?? "Variante A";
    const faktB = (box.payload?.faktB as string | undefined) ?? "Variante B";
    const beschreibung = box.payload?.beschreibung as string | undefined;
    const sourceA = box.payload?.sourceA as
      | { label?: string; meta?: string; hint?: string }
      | undefined;
    const sourceB = box.payload?.sourceB as
      | { label?: string; meta?: string; hint?: string }
      | undefined;
    const recommendation = box.payload?.recommendation as
      | { auswahl?: "A" | "B"; reason?: string }
      | undefined;
    const chosen =
      (box.payload?.auswahl as "A" | "B" | "open" | undefined) ?? recommendation?.auswahl ?? null;

    const labelA = faktA.length > 28 ? faktA.slice(0, 26) + "…" : faktA;
    const labelB = faktB.length > 28 ? faktB.slice(0, 26) + "…" : faktB;

    return (
      <>
        <div className="dlg2-row" style={{ minHeight: 52, position: "relative", ...dimStyle }}>
          <Stripe color="var(--d-warn)" />
          <span
            className="dlg2-status-dot"
            style={{ background: "var(--d-warn-soft)", border: "1.5px solid var(--d-warn)" }}
          >
            <span style={{ width: 5, height: 5, borderRadius: 999, background: "var(--d-warn)" }} />
          </span>
          <TypeChip kind="konflikt" color={{ bg: "var(--d-warn-soft)", fg: "var(--d-warn)" }} />
          <span style={{ flex: 1, fontSize: 13.5, color: "var(--d-ink)", marginLeft: 8 }}>
            {box.title}
            <span style={{ color: "var(--d-ink-4)", marginLeft: 8, fontSize: 12 }}>
              {labelA} vs {labelB}
            </span>
          </span>
          {blocked ? (
            <span
              className="mono"
              style={{ fontSize: 10.5, color: "var(--d-ink-3)", marginLeft: 12 }}
            >
              nach Projektzuordnung
            </span>
          ) : (
            <>
              <div style={{ display: "flex", gap: 6, marginLeft: 12, flex: "0 0 auto" }}>
                <button
                  type="button"
                  className={`dlg2-chip-opt${chosen === "A" ? " active" : ""}`}
                  style={
                    chosen === "A"
                      ? {
                          background: "var(--d-warn-soft)",
                          borderColor: "var(--d-warn)",
                          color: "var(--d-warn)",
                        }
                      : undefined
                  }
                  onClick={() => onConfirm({ auswahl: "A" })}
                  title={faktA}
                >
                  {labelA}
                </button>
                <button
                  type="button"
                  className={`dlg2-chip-opt${chosen === "B" ? " active" : ""}`}
                  style={
                    chosen === "B"
                      ? {
                          background: "var(--d-warn-soft)",
                          borderColor: "var(--d-warn)",
                          color: "var(--d-warn)",
                        }
                      : undefined
                  }
                  onClick={() => onConfirm({ auswahl: "B" })}
                  title={faktB}
                >
                  {labelB}
                </button>
                <button
                  type="button"
                  className="dlg2-chip-opt"
                  style={{ color: "var(--d-ink-4)" }}
                  onClick={() => onConfirm({ auswahl: "open" })}
                >
                  offen lassen
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
                  letterSpacing: ".02em",
                }}
              >
                Details {expanded ? "▲" : "▼"}
              </button>
            </>
          )}
        </div>
        {expanded && !blocked && (
          <div className="dlg2-expand">
            {beschreibung && (
              <p style={{ margin: "0 0 12px", fontSize: 13, color: "var(--d-ink-2)" }}>
                {beschreibung}
              </p>
            )}
            <div style={{ display: "flex", gap: 12, alignItems: "stretch" }}>
              <SourceCard
                eyebrow={sourceA?.label ?? "Quelle A"}
                value={faktA}
                meta={sourceA?.meta}
                active={chosen === "A"}
              />
              <div
                style={{
                  width: 36,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "Geist Mono, monospace",
                  fontSize: 10,
                  color: "var(--d-conf)",
                  letterSpacing: ".04em",
                }}
              >
                vs
              </div>
              <SourceCard
                eyebrow={sourceB?.label ?? "Quelle B"}
                value={faktB}
                meta={sourceB?.meta}
                active={chosen === "B"}
              />
            </div>
            {recommendation && (
              <div style={{ marginTop: 10, fontSize: 12, color: "var(--d-ink-3)" }}>
                cogni empfiehlt{" "}
                <span style={{ color: "var(--d-warn)" }}>
                  {recommendation.auswahl === "A" ? labelA : labelB}
                </span>
                {recommendation.reason && <> — {recommendation.reason}. Klick zum Überschreiben.</>}
              </div>
            )}
          </div>
        )}
        <ConfirmDestructive
          open={rejectOpen}
          onOpenChange={setRejectOpen}
          title="Konflikt verwerfen?"
          description="Der Punkt wird endgültig verworfen und fließt nicht in den Projektzustand."
          confirmLabel="Endgültig verwerfen"
          onConfirm={() => onReject()}
        />
      </>
    );
  }

  // -------------------------------------------------------------------------
  //  GAP / EINGABE / FRAGE — überall, wo der User wirklich antworten soll
  // -------------------------------------------------------------------------
  const wantsInput =
    (box.type === "gap" || box.type === "eingabe" || box.type === "frage") && !isFinal;

  if (wantsInput) {
    const placeholder =
      asks ??
      (box.type === "frage"
        ? "Antwort eingeben…"
        : box.type === "gap"
          ? "Information ergänzen…"
          : "Antwort eingeben…");
    const suggestions: string[] = Array.isArray(box.payload?.suggestions)
      ? box.payload.suggestions
      : [];
    const submit = (value?: string) => {
      const trimmed = (value ?? askInput).trim();
      if (!trimmed) return;
      const key = box.type === "gap" ? "antwort" : "text";
      onConfirm({ [key]: trimmed });
    };
    return (
      <>
        <div className="dlg2-row" style={{ minHeight: 52, position: "relative", ...dimStyle }}>
          <Stripe color="var(--d-warn)" />
          <span
            className="dlg2-status-dot"
            style={{ background: "var(--d-warn-soft)", border: "1.5px solid var(--d-warn)" }}
          >
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: 999,
                border: "1px solid var(--d-warn)",
                background: "transparent",
              }}
            />
          </span>
          <TypeChip kind={box.type} color={{ bg: "var(--d-warn-soft)", fg: "var(--d-warn)" }} />
          <span style={{ flex: 1, fontSize: 13.5, color: "var(--d-ink)", marginLeft: 8 }}>
            {asks ?? box.title}
            {(box.payload?.hinweis as string | undefined) && (
              <span
                style={{ display: "block", fontSize: 11.5, color: "var(--d-ink-4)", marginTop: 2 }}
              >
                {box.payload.hinweis}
              </span>
            )}
          </span>
          {blocked ? (
            <span
              className="mono"
              style={{ fontSize: 10.5, color: "var(--d-ink-3)", marginLeft: 12 }}
            >
              nach Projektzuordnung
            </span>
          ) : !expanded ? (
            <button
              type="button"
              className="dlg2-chip-opt"
              style={{ borderColor: "var(--d-warn)", color: "var(--d-warn)", flex: "0 0 auto" }}
              onClick={() => setExpanded(true)}
            >
              Eingeben
            </button>
          ) : (
            <div style={{ display: "flex", gap: 6, alignItems: "center", flex: "0 0 auto" }}>
              <input
                value={askInput}
                onChange={(e) => setAskInput(e.target.value)}
                placeholder={placeholder}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") submit();
                }}
                style={{
                  height: 28,
                  padding: "0 10px",
                  borderRadius: 8,
                  border: "1px solid var(--d-blue)",
                  background: "var(--d-blue-soft)",
                  color: "var(--d-blue)",
                  fontFamily: "Geist Mono, monospace",
                  fontSize: 12.5,
                  outline: "none",
                  width: 220,
                }}
              />
              <button
                type="button"
                className="dlg2-chip-opt"
                style={{
                  borderColor: "var(--d-ok)",
                  color: "var(--d-ok)",
                  background: "var(--d-ok-soft)",
                }}
                onClick={() => submit()}
                disabled={!askInput.trim()}
              >
                ✓
              </button>
            </div>
          )}
        </div>
        {expanded && !blocked && suggestions.length > 0 && (
          <div className="dlg2-expand" style={{ paddingTop: 10, paddingBottom: 14 }}>
            <div className="t-micro" style={{ color: "var(--d-ink-3)", marginBottom: 8 }}>
              Vorschläge
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  className="dlg2-chip-opt"
                  onClick={() => submit(s)}
                  title="Klick zum Übernehmen"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </>
    );
  }

  // -------------------------------------------------------------------------
  //  AUSWAHL
  // -------------------------------------------------------------------------
  if (box.type === "auswahl" && !isFinal) {
    const opts: string[] = box.payload?.optionen ?? [];
    return (
      <div className="dlg2-row" style={{ minHeight: 52, position: "relative", ...dimStyle }}>
        <Stripe color="var(--d-blue)" />
        <span
          className="dlg2-status-dot"
          style={{ background: "var(--d-blue-soft)", border: "1.5px solid var(--d-blue)" }}
        >
          <span style={{ width: 5, height: 5, borderRadius: 999, background: "var(--d-blue)" }} />
        </span>
        <TypeChip kind="auswahl" color={{ bg: "var(--d-blue-soft)", fg: "var(--d-blue)" }} />
        <span style={{ flex: 1, fontSize: 13.5, color: "var(--d-ink)", marginLeft: 8 }}>
          {box.title}
        </span>
        {blocked ? (
          <span
            className="mono"
            style={{ fontSize: 10.5, color: "var(--d-ink-3)", marginLeft: 12 }}
          >
            nach Projektzuordnung
          </span>
        ) : (
          <div
            style={{
              display: "flex",
              gap: 6,
              marginLeft: 12,
              flexWrap: "wrap",
              flex: "0 0 auto",
              maxWidth: "60%",
              justifyContent: "flex-end",
            }}
          >
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
        )}
      </div>
    );
  }

  // -------------------------------------------------------------------------
  //  AKTION — konfigurierbare Buttons aus payload.aktionen[]
  //  Erste Button = primäre Tonalität, Rest neutral. Jeder Click sendet das
  //  Label als user_decision.aktion. Fallback (kein aktionen[]): "Bestätigen".
  // -------------------------------------------------------------------------
  if (box.type === "aktion" && !isFinal) {
    const aktionen: string[] = Array.isArray(box.payload?.aktionen) ? box.payload.aktionen : [];
    const fallback = aktionen.length === 0 ? ["Bestätigen"] : aktionen;
    return (
      <>
        <div className="dlg2-row" style={{ minHeight: 56, position: "relative", ...dimStyle }}>
          <Stripe color="var(--d-ok)" />
          <span
            className="dlg2-status-dot"
            style={{
              background: "color-mix(in oklab, var(--d-ok) 18%, transparent)",
              border: "1.5px solid var(--d-ok)",
            }}
          >
            <span style={{ width: 5, height: 5, borderRadius: 999, background: "var(--d-ok)" }} />
          </span>
          <TypeChip
            kind="aktion"
            color={{ bg: "color-mix(in oklab, var(--d-ok) 18%, transparent)", fg: "var(--d-ok)" }}
          />
          <div style={{ flex: 1, marginLeft: 8, minWidth: 0 }}>
            <div style={{ fontSize: 13.5, color: "var(--d-ink)", fontWeight: 500 }}>
              {box.title}
            </div>
            {understood && (
              <div style={{ fontSize: 12, color: "var(--d-ink-3)", marginTop: 2, lineHeight: 1.4 }}>
                Kontext: {understood}
              </div>
            )}
          </div>
          {attachesTo && <RefToken to={attachesTo} />}
          {blocked ? (
            <span
              className="mono"
              style={{ fontSize: 10.5, color: "var(--d-ink-3)", marginLeft: 12 }}
            >
              nach Projektzuordnung
            </span>
          ) : (
            <div
              style={{
                display: "flex",
                gap: 6,
                marginLeft: 12,
                flex: "0 0 auto",
                flexWrap: "wrap",
                justifyContent: "flex-end",
                maxWidth: "60%",
              }}
            >
              {fallback.map((label, i) => (
                <button
                  key={`${label}-${i}`}
                  type="button"
                  className="dlg2-chip-opt"
                  style={i === 0 ? { borderColor: "var(--d-ok)", color: "var(--d-ok)" } : undefined}
                  onClick={() => onConfirm({ aktion: label })}
                >
                  {label}
                </button>
              ))}
              <button
                type="button"
                className="dlg2-chip-opt"
                style={{ color: "var(--d-ink-4)" }}
                onClick={() => setRejectOpen(true)}
              >
                Verwerfen
              </button>
            </div>
          )}
        </div>
        <ConfirmDestructive
          open={rejectOpen}
          onOpenChange={setRejectOpen}
          title="Aktion verwerfen?"
          description="Die Aktion wird endgültig verworfen und nicht ausgeführt."
          confirmLabel="Endgültig verwerfen"
          onConfirm={() => onReject()}
        />
      </>
    );
  }

  // -------------------------------------------------------------------------
  //  SPRECHHANDLUNGS-MATRIX (condition/exclusion/assumption/suggestion/
  //                           note/relation/attribute/risk/unclear)
  //  Gemeinsamer Renderer: TypeChip, "Verstanden: …", optionaler RefToken,
  //  passende Primäraktion. KEIN Eingabefeld (Eingabe nur bei wantsInput oben).
  // -------------------------------------------------------------------------
  // Sekundär-Aktion mit `inlineEdit` öffnet ein Inline-Korrektur-Feld
  // (Bezug / Frist / Entscheidung) statt eines toten Sofort-Confirms.
  // `annahme` hatte vormals "Bestätigen" — semantisch identisch zur Primary,
  // deshalb entfernt. `notiz`/`unklar` haben bewusst keine Sekundär-Aktion.
  const SPRECHHANDLUNGEN: Record<
    string,
    { primaryLabel: string; secondaryLabel?: string; inlineEdit?: InlineEditKind }
  > = {
    bedingung: { primaryLabel: "Übernehmen", secondaryLabel: "Bezug ändern", inlineEdit: "bezug" },
    ausschluss: { primaryLabel: "Übernehmen", secondaryLabel: "Bezug ändern", inlineEdit: "bezug" },
    annahme: { primaryLabel: "Als Annahme" },
    vorschlag: {
      primaryLabel: "Vormerken",
      secondaryLabel: "Jetzt entscheiden",
      inlineEdit: "decide",
    },
    notiz: { primaryLabel: "Ablegen" },
    beziehung: {
      primaryLabel: "Kante übernehmen",
      secondaryLabel: "Bezug ändern",
      inlineEdit: "bezug",
    },
    attribut: {
      primaryLabel: "Aktualisieren",
      secondaryLabel: "Bezug ändern",
      inlineEdit: "bezug",
    },
    risiko: {
      primaryLabel: "Risiko aufnehmen",
      secondaryLabel: "Frist setzen",
      inlineEdit: "due_date",
    },
    unklar: { primaryLabel: "Verstehe ich das richtig?" },
  };

  const spr = SPRECHHANDLUNGEN[box.type];
  if (spr && !isFinal) {
    const tone = TYPE_TONE[box.type] ?? "info";
    const colors = toneToColors(tone);
    const silentSubstanz = box.payload?.kind === "silent_substanz";
    return (
      <>
        <div className="dlg2-row" style={{ minHeight: 56, position: "relative", ...dimStyle }}>
          <Stripe color={colors.stripe} />
          <span
            className="dlg2-status-dot"
            style={{ background: colors.chipBg, border: `1.5px solid ${colors.stripe}` }}
          >
            <span style={{ width: 5, height: 5, borderRadius: 999, background: colors.stripe }} />
          </span>
          <TypeChip kind={box.type} color={{ bg: colors.chipBg, fg: colors.chipFg }} />
          <DeltaChip delta={box.payload?.delta_type as string | null | undefined} />
          <div style={{ flex: 1, marginLeft: 8, minWidth: 0 }}>
            <div style={{ fontSize: 13.5, color: "var(--d-ink)", fontWeight: 500 }}>
              {box.title}
            </div>
            {understood && (
              <div style={{ fontSize: 12, color: "var(--d-ink-3)", marginTop: 2, lineHeight: 1.4 }}>
                Kontext: {understood}
              </div>
            )}
          </div>
          {attachesTo && <RefToken to={attachesTo} />}
          {blocked ? (
            <span
              className="mono"
              style={{ fontSize: 10.5, color: "var(--d-ink-3)", marginLeft: 12 }}
            >
              nach Projektzuordnung
            </span>
          ) : silentSubstanz ? (
            <span className="mono" style={{ fontSize: 10.5, color: "var(--d-ok)", marginLeft: 12 }}>
              ✓ {box.payload?.count ?? 0} übernommen
            </span>
          ) : editing && spr.inlineEdit ? (
            // Inline-Korrektur: Bezug / Frist / Entscheidung erfasst.
            // "decide" rendert binäre Buttons statt Input-Feld.
            editing === "decide" ? (
              <div style={{ display: "flex", gap: 6, marginLeft: 12, flex: "0 0 auto" }}>
                <button
                  type="button"
                  className="dlg2-chip-opt"
                  style={{ borderColor: "var(--d-ok)", color: "var(--d-ok)" }}
                  onClick={() => {
                    setEditing(null);
                    onConfirm({ entscheidung: "ja" });
                  }}
                >
                  Ja, übernehmen
                </button>
                <button
                  type="button"
                  className="dlg2-chip-opt"
                  style={{ borderColor: "var(--d-warn)", color: "var(--d-warn)" }}
                  onClick={() => {
                    setEditing(null);
                    onReject();
                  }}
                >
                  Nein, verwerfen
                </button>
                <button
                  type="button"
                  className="dlg2-chip-opt"
                  style={{ color: "var(--d-ink-4)" }}
                  onClick={() => setEditing(null)}
                >
                  Abbrechen
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 6, alignItems: "center", flex: "0 0 auto" }}>
                <input
                  value={editInput}
                  onChange={(e) => setEditInput(e.target.value)}
                  placeholder={INLINE_EDIT_CONFIG[editing].hint}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && editInput.trim()) {
                      const key = INLINE_EDIT_CONFIG[editing].key;
                      onConfirm({ [key]: editInput.trim() });
                      setEditing(null);
                    }
                    if (e.key === "Escape") setEditing(null);
                  }}
                  style={{
                    height: 28,
                    padding: "0 10px",
                    borderRadius: 8,
                    border: `1px solid ${colors.chipFg}`,
                    background: colors.chipBg,
                    color: colors.chipFg,
                    fontFamily: "Geist Mono, monospace",
                    fontSize: 12.5,
                    outline: "none",
                    width: 240,
                  }}
                />
                <button
                  type="button"
                  className="dlg2-chip-opt"
                  style={{
                    borderColor: "var(--d-ok)",
                    color: "var(--d-ok)",
                    background: "var(--d-ok-soft)",
                  }}
                  onClick={() => {
                    if (!editInput.trim()) return;
                    const key = INLINE_EDIT_CONFIG[editing].key;
                    onConfirm({ [key]: editInput.trim() });
                    setEditing(null);
                  }}
                  disabled={!editInput.trim()}
                >
                  ✓
                </button>
                <button
                  type="button"
                  className="dlg2-chip-opt"
                  style={{ color: "var(--d-ink-4)" }}
                  onClick={() => setEditing(null)}
                  title="Abbrechen"
                >
                  ✕
                </button>
              </div>
            )
          ) : (
            <div style={{ display: "flex", gap: 6, marginLeft: 12, flex: "0 0 auto" }}>
              <button
                type="button"
                className="dlg2-chip-opt"
                style={{ borderColor: colors.chipFg, color: colors.chipFg }}
                onClick={() => onConfirm()}
              >
                {spr.primaryLabel}
              </button>
              {spr.secondaryLabel && spr.inlineEdit && (
                <button
                  type="button"
                  className="dlg2-chip-opt"
                  onClick={() => {
                    // Bei "bezug": Vorbefüllen mit aktuellem attaches_to, damit
                    // der User nur korrigieren statt von Null tippen muss.
                    if (spr.inlineEdit === "bezug" && attachesTo) {
                      setEditInput(attachesTo);
                    } else {
                      setEditInput("");
                    }
                    setEditing(spr.inlineEdit!);
                  }}
                >
                  {spr.secondaryLabel}
                </button>
              )}
              <button
                type="button"
                className="dlg2-chip-opt"
                style={{ color: "var(--d-ink-4)" }}
                onClick={() => setRejectOpen(true)}
              >
                Verwerfen
              </button>
            </div>
          )}
        </div>
        <ConfirmDestructive
          open={rejectOpen}
          onOpenChange={setRejectOpen}
          title="Eintrag verwerfen?"
          description="Die Aussage wird endgültig verworfen und fließt nicht in den Projektzustand."
          confirmLabel="Endgültig verwerfen"
          onConfirm={() => onReject()}
        />
      </>
    );
  }

  // -------------------------------------------------------------------------
  //  DEFAULT — wissen / kontext (Assertion, klassische Single-Confirm).
  //  `aktion` hat einen eigenen Branch weiter oben (payload.aktionen[]).
  // -------------------------------------------------------------------------
  // `aktion` hat einen eigenen Branch oben (payload.aktionen[]), darf hier nicht.
  const needsConfirm = !isFinal && !readonly && (box.type === "wissen" || box.type === "kontext");
  const hinweis = box.payload?.hinweis as string | undefined;
  return (
    <div className="dlg2-row" style={{ minHeight: 48, position: "relative", ...dimStyle }}>
      <Stripe color={isFinal ? "transparent" : "var(--d-blue)"} />
      <span
        className="dlg2-status-dot"
        style={{
          background: isFinal ? "transparent" : "var(--d-blue-soft)",
          border: `1.5px solid ${isFinal ? "var(--d-ink-4)" : "var(--d-blue)"}`,
          color: isFinal ? "var(--d-ink-4)" : "var(--d-blue)",
        }}
      >
        <svg
          width="9"
          height="9"
          viewBox="0 0 10 8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M1 4l3 3 5-6" />
        </svg>
      </span>
      <TypeChip kind={box.type} />
      <DeltaChip delta={box.payload?.delta_type as string | null | undefined} />
      <span
        style={{
          flex: 1,
          fontSize: 13.5,
          color: isFinal ? "var(--d-ink-3)" : "var(--d-ink-2)",
          marginLeft: 8,
        }}
      >
        {box.title}
        {readonly && hinweis && (
          <span style={{ display: "block", fontSize: 11.5, color: "var(--d-ink-4)", marginTop: 2 }}>
            {hinweis}
          </span>
        )}
      </span>
      {attachesTo && <RefToken to={attachesTo} />}
      {projectName && (
        <span
          className="mono"
          style={{ fontSize: 11, color: "var(--d-ink-3)", marginLeft: 12, flex: "0 0 auto" }}
        >
          {projectName}
        </span>
      )}
      {blocked && !isFinal ? (
        <span
          className="mono"
          style={{ fontSize: 10.5, color: "var(--d-ink-3)", marginLeft: 12, flex: "0 0 auto" }}
        >
          nach Projektzuordnung
        </span>
      ) : (
        needsConfirm && (
          <button
            type="button"
            className="dlg2-chip-opt"
            style={{ marginLeft: 12, borderColor: "var(--d-blue)", color: "var(--d-blue)" }}
            onClick={() => onConfirm()}
          >
            ✓
          </button>
        )
      )}
      {readonly && !blocked && (
        <span
          className="mono"
          style={{ fontSize: 10.5, color: "var(--d-ink-4)", marginLeft: 12, flex: "0 0 auto" }}
        >
          nur lesen
        </span>
      )}
    </div>
  );
};

export default ReviewRow;
