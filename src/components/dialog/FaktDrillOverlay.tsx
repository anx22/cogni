// =============================================================================
//  FaktDrillOverlay (Dialog V2) — Bühne für ein einzelnes Entscheiden.
//  Konflikt-Drill: Gegenüberstellung mit vs-Achse, "Was stimmt?"-Tiles.
//  Gap-Drill:      Kontext + Blockiert links, Lücke + Eingabe rechts.
//  Quellen-Metadata + Begründung + Suggestions + Blockiert kommen aus dem
//  Box-Payload, falls vorhanden — sonst stillschweigend weglassen (REVIEW C1).
// =============================================================================

import { useDialog } from "./DialogProvider";
import SessionHeader from "./parts/SessionHeader";
import { END_STATES } from "@/lib/dialog/types";
import { useState } from "react";
import { ArrowLeft, AlertTriangle } from "lucide-react";

type SourceMeta = {
  label?: string; // "Mail · Thomas Berger"
  meta?: string; // "09.04.2026 · 14:22 · informell"
  hint?: string; // "älter · direkter Absender"
  recommend?: boolean;
};

const FaktDrillOverlay = ({ onClose }: { onClose: () => void }) => {
  const { session, commitBox } = useDialog();
  const box = session?.boxes.find((b) => b.type !== "kontext" && !END_STATES.includes(b.state));

  // Konflikt-Auswahl
  const recA = (box?.payload?.sourceA as SourceMeta | undefined)?.recommend ?? true;
  const [selected, setSelected] = useState<"A" | "B" | "open" | null>(recA ? "A" : null);
  // Gap-Input
  const [gapInput, setGapInput] = useState<string>("");
  // Inline-Korrektur (Bezug / Frist / Entscheidung) für Modality-Renderer
  const [editing, setEditing] = useState<"bezug" | "due_date" | "decide" | null>(null);
  const [editInput, setEditInput] = useState<string>("");

  if (!session || !box) return null;

  const projectLabel = session.projectName ?? undefined;
  const drillSource = `${projectLabel ? projectLabel + " · " : ""}${session.context ?? ""}`.trim();

  // ───────────────────────────────────── Drill-Header (back/esc) ──
  const DrillHeader = () => (
    <header
      className="flex items-center justify-between"
      style={{
        padding: "14px 44px",
        borderBottom: "1px solid var(--d-hair)",
        flex: "0 0 auto",
      }}
    >
      <div className="flex items-center" style={{ gap: 12, fontSize: 13 }}>
        <button
          type="button"
          onClick={onClose}
          className="dlg2-btn-secondary"
          style={{ height: 28, fontSize: 12, gap: 6, display: "inline-flex", alignItems: "center" }}
        >
          <ArrowLeft size={12} /> Handlungsbedarf
        </button>
        <span style={{ color: "var(--d-ink-4)" }}>·</span>
        <span style={{ fontSize: 13.5, color: "var(--d-ink-2)", fontWeight: 450 }}>
          {box.title}
        </span>
      </div>
      <div className="flex items-center" style={{ gap: 10 }}>
        {drillSource && (
          <span className="mono" style={{ fontSize: 11, color: "var(--d-ink-3)" }}>
            {drillSource}
          </span>
        )}
        <button
          type="button"
          onClick={onClose}
          className="kbd"
          style={{
            background: "transparent",
            border: "1px solid var(--d-hair-2)",
            color: "var(--d-ink-3)",
            padding: "4px 10px",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 12,
          }}
        >
          esc
        </button>
      </div>
    </header>
  );

  // ───────────────────────────────────── Konflikt ─────────────────
  const renderConflict = () => {
    const faktA = box.payload?.faktA as string | undefined;
    const faktB = box.payload?.faktB as string | undefined;
    const beschreibung = box.payload?.beschreibung as string | undefined;
    const sourceA = (box.payload?.sourceA ?? {}) as SourceMeta;
    const sourceB = (box.payload?.sourceB ?? {}) as SourceMeta;
    const empfehlung = box.payload?.empfehlung as string | undefined;

    const save = () => {
      if (selected === "A") commitBox(box.id, "confirm", { auswahl: "A", wert: faktA });
      else if (selected === "B") commitBox(box.id, "confirm", { auswahl: "B", wert: faktB });
      else if (selected === "open") commitBox(box.id, "reject");
    };

    const SourceCard = ({
      side,
      fakt,
      meta,
    }: {
      side: "A" | "B";
      fakt: string | undefined;
      meta: SourceMeta;
    }) => {
      const isRec = meta.recommend ?? (side === "A" ? recA : false);
      return (
        <div
          style={
            {
              flex: 1,
              padding: "22px 28px",
              borderRadius: side === "A" ? "16px 0 0 16px" : "0 16px 16px 0",
              background: "var(--d-surf)",
              border: `1px solid ${isRec ? "var(--d-warn)" : "var(--d-hair-2)"}`,
              [side === "A" ? "borderRight" : "borderLeft"]: "none",
            } as React.CSSProperties
          }
        >
          <div
            className="mono"
            style={{
              fontSize: 10,
              color: "var(--d-ink-3)",
              letterSpacing: ".06em",
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            Quelle {side}
          </div>
          <div
            style={{
              fontSize: 32,
              fontWeight: 500,
              letterSpacing: "-.03em",
              color: isRec ? "var(--d-ink)" : "var(--d-ink-2)",
              lineHeight: 1.1,
            }}
          >
            {fakt ?? "—"}
          </div>
          {(meta.label || meta.meta) && (
            <div
              style={{
                marginTop: 16,
                padding: "10px 14px",
                borderRadius: 10,
                background: "var(--d-surf-3)",
              }}
            >
              {meta.label && (
                <div style={{ fontSize: 12, color: "var(--d-ink-2)" }}>{meta.label}</div>
              )}
              {meta.meta && (
                <div
                  className="mono"
                  style={{ fontSize: 11, color: "var(--d-ink-4)", marginTop: 3 }}
                >
                  {meta.meta}
                </div>
              )}
            </div>
          )}
          {meta.hint && (
            <div style={{ marginTop: 14, display: "flex", gap: 6, alignItems: "center" }}>
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: 999,
                  background: isRec ? "var(--d-warn-soft)" : "var(--d-surf-3)",
                  border: `1px solid ${isRec ? "var(--d-warn)" : "var(--d-hair-2)"}`,
                }}
              />
              <span style={{ fontSize: 12, color: "var(--d-ink-3)" }}>{meta.hint}</span>
            </div>
          )}
        </div>
      );
    };

    const tiles: Array<{ key: "A" | "B" | "open"; label: string; hint?: string }> = [
      { key: "A", label: faktA ?? "Quelle A", hint: sourceA.hint ?? "cogni-Empfehlung" },
      { key: "B", label: faktB ?? "Quelle B", hint: sourceB.hint },
      { key: "open", label: "Offen lassen", hint: "als Handlungsbedarf weiterführen" },
    ];

    return (
      <div
        style={{
          flex: 1,
          padding: "32px 56px 0",
          display: "flex",
          flexDirection: "column",
          gap: 20,
          overflowY: "auto",
        }}
      >
        {/* Widerspruch-Banner */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "14px 20px",
            borderRadius: 14,
            background: "var(--d-conf-soft)",
            border: "1px solid var(--d-conf)",
            flex: "0 0 auto",
          }}
        >
          <AlertTriangle size={18} style={{ color: "var(--d-conf)", flex: "0 0 auto" }} />
          <div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 500,
                color: "var(--d-conf)",
                letterSpacing: "-.01em",
              }}
            >
              Zwei Quellen widersprechen sich
            </div>
            {beschreibung && (
              <div style={{ fontSize: 12.5, color: "var(--d-ink-3)", marginTop: 2 }}>
                {beschreibung}
              </div>
            )}
          </div>
        </div>

        {/* Gegenüberstellung mit vs-Achse */}
        <div style={{ display: "flex", gap: 0, flex: "0 0 auto" }}>
          <SourceCard side="A" fakt={faktA} meta={sourceA} />
          <div
            style={{
              width: 60,
              flex: "0 0 auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "var(--d-conf-soft)",
              borderTop: "1px solid var(--d-conf)",
              borderBottom: "1px solid var(--d-conf)",
            }}
          >
            <div
              className="mono"
              style={{
                width: 34,
                height: 34,
                borderRadius: 999,
                background: "var(--d-surf)",
                border: "1px solid var(--d-conf)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 10,
                fontWeight: 600,
                color: "var(--d-conf)",
                letterSpacing: ".04em",
              }}
            >
              vs
            </div>
          </div>
          <SourceCard side="B" fakt={faktB} meta={sourceB} />
        </div>

        {/* "cogni empfiehlt" Hint-Zeile, falls vorhanden */}
        {empfehlung && (
          <div style={{ fontSize: 12.5, color: "var(--d-ink-3)" }}>
            cogni empfiehlt <span style={{ color: "var(--d-warn)" }}>{empfehlung}</span>
          </div>
        )}

        {/* Auswahl-Tiles */}
        <div
          style={{
            padding: "18px 22px",
            borderRadius: 14,
            background: "var(--d-surf)",
            border: "1px solid var(--d-hair-2)",
            flex: "0 0 auto",
          }}
        >
          <div style={{ fontSize: 12.5, color: "var(--d-ink-3)", marginBottom: 12 }}>
            Was stimmt?
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {tiles.map((t) => {
              const isSel = selected === t.key;
              const isOpen = t.key === "open";
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setSelected(t.key)}
                  style={{
                    flex: 1,
                    padding: "12px 14px",
                    borderRadius: 10,
                    cursor: "pointer",
                    border: `1px solid ${
                      isSel ? (isOpen ? "var(--d-ink-3)" : "var(--d-warn)") : "var(--d-hair)"
                    }`,
                    background: isSel
                      ? isOpen
                        ? "var(--d-surf-3)"
                        : "var(--d-warn-soft)"
                      : "transparent",
                    textAlign: "left",
                    font: "inherit",
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                    color: "inherit",
                  }}
                >
                  <span
                    style={{
                      fontSize: 13.5,
                      fontWeight: 450,
                      color: isSel ? (isOpen ? "var(--d-ink)" : "var(--d-warn)") : "var(--d-ink-2)",
                    }}
                  >
                    {t.label}
                  </span>
                  {t.hint && (
                    <span style={{ fontSize: 11.5, color: "var(--d-ink-3)" }}>{t.hint}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 0 28px",
            marginTop: "auto",
          }}
        >
          <button
            type="button"
            className="dlg2-btn-secondary"
            onClick={() => commitBox(box.id, "reject", { escalate: true })}
            title="Bleibt in der Pipeline und erscheint als Handlungsbedarf"
          >
            Als Handlungsbedarf markieren
          </button>
          <div style={{ display: "flex", gap: 10 }}>
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
      </div>
    );
  };

  // ───────────────────────────────────── Gap ─────────────────────
  const renderGap = () => {
    const wirkung = box.payload?.wirkung as string | undefined;
    const betrifft = box.payload?.betrifft as string | undefined;
    const lebensdauer = box.payload?.lebensdauer as string | undefined;
    const quelle = box.payload?.quelle as string | undefined;
    const suggestions = (box.payload?.suggestions as string[] | undefined) ?? [];
    const blockiert =
      (box.payload?.blockiert as Array<{ what: string; strong?: boolean }> | undefined) ?? [];

    const submit = () => {
      const t = gapInput.trim();
      if (!t) return;
      const key = box.type === "gap" ? "antwort" : "text";
      commitBox(box.id, "confirm", { [key]: t });
    };

    return (
      <div
        style={{
          flex: 1,
          padding: "32px 56px 0",
          display: "grid",
          gridTemplateColumns: "2fr 3fr",
          gap: 20,
          overflowY: "auto",
        }}
      >
        {/* Links: Kontext + Blockiert */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {betrifft && (
            <div
              style={{
                padding: "22px 24px",
                borderRadius: 16,
                background: "var(--d-surf)",
                border: "1px solid var(--d-hair-2)",
              }}
            >
              <div
                className="mono"
                style={{
                  fontSize: 10,
                  color: "var(--d-ink-3)",
                  letterSpacing: ".06em",
                  textTransform: "uppercase",
                  marginBottom: 12,
                }}
              >
                Kontext
              </div>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 500,
                  letterSpacing: "-.016em",
                  color: "var(--d-ink)",
                  lineHeight: 1.2,
                }}
              >
                {betrifft}
              </div>
              {wirkung && (
                <div
                  style={{
                    marginTop: 10,
                    fontSize: 13.5,
                    color: "var(--d-ink-2)",
                    lineHeight: 1.55,
                  }}
                >
                  {wirkung}
                </div>
              )}
              {quelle && (
                <div
                  className="mono"
                  style={{ marginTop: 14, fontSize: 11, color: "var(--d-ink-3)" }}
                >
                  {quelle}
                </div>
              )}
            </div>
          )}

          {blockiert.length > 0 && (
            <div
              style={{
                padding: "16px 20px",
                borderRadius: 14,
                background: "transparent",
                border: "1px solid var(--d-hair)",
              }}
            >
              <div
                className="mono"
                style={{
                  fontSize: 10,
                  color: "var(--d-ink-3)",
                  letterSpacing: ".06em",
                  textTransform: "uppercase",
                  marginBottom: 10,
                }}
              >
                Blockiert
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {blockiert.map((d, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: 13,
                      color: d.strong ? "var(--d-conf)" : "var(--d-ink-3)",
                    }}
                  >
                    <span
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: 999,
                        background: d.strong ? "var(--d-conf)" : "var(--d-ink-4)",
                        flex: "0 0 auto",
                      }}
                    />
                    {d.what}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Rechts: Lücke + Eingabe */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              padding: "22px 24px",
              borderRadius: 16,
              background: "var(--d-warn-soft)",
              border: "1px solid var(--d-warn)",
            }}
          >
            <div
              className="mono"
              style={{
                fontSize: 10,
                color: "var(--d-warn)",
                letterSpacing: ".06em",
                textTransform: "uppercase",
                marginBottom: 12,
              }}
            >
              Lücke
            </div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 500,
                letterSpacing: "-.02em",
                color: "var(--d-warn)",
                lineHeight: 1.1,
              }}
            >
              {box.title}
            </div>
            {wirkung && !betrifft && (
              <div
                style={{ marginTop: 10, fontSize: 13, color: "var(--d-ink-2)", lineHeight: 1.5 }}
              >
                {wirkung}
              </div>
            )}
            {lebensdauer && (
              <div
                className="mono"
                style={{ fontSize: 11, color: "var(--d-ink-3)", marginTop: 10 }}
              >
                offen seit {lebensdauer}
              </div>
            )}
          </div>

          <div
            style={{
              padding: "20px 24px",
              borderRadius: 16,
              background: "var(--d-surf)",
              border: "1px solid var(--d-hair-2)",
            }}
          >
            <div style={{ fontSize: 13.5, color: "var(--d-ink-2)", marginBottom: 14 }}>
              Wert eingeben
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                borderRadius: 10,
                overflow: "hidden",
                background: "var(--d-surf-3)",
                border: `1px solid ${gapInput.trim() ? "var(--d-blue)" : "var(--d-hair-2)"}`,
              }}
            >
              <input
                type="text"
                value={gapInput}
                onChange={(e) => setGapInput(e.target.value)}
                placeholder="Antwort, Notiz oder Korrektur…"
                onKeyDown={(e) => {
                  if (e.key === "Enter") submit();
                }}
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  padding: "12px 16px",
                  fontFamily: "inherit",
                  fontSize: 15,
                  color: "var(--d-ink)",
                  outline: "none",
                }}
              />
            </div>
            {suggestions.length > 0 && (
              <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                {suggestions.map((s, i) => {
                  const isActive = gapInput === s;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setGapInput(s)}
                      className="mono"
                      style={{
                        height: 28,
                        padding: "0 12px",
                        borderRadius: 8,
                        border: `1px solid ${isActive ? "var(--d-blue)" : "var(--d-hair-2)"}`,
                        background: isActive ? "var(--d-blue-soft)" : "transparent",
                        color: isActive ? "var(--d-blue)" : "var(--d-ink-3)",
                        fontSize: 12,
                        cursor: "pointer",
                      }}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 0 28px",
              marginTop: "auto",
            }}
          >
            <button
              type="button"
              className="dlg2-btn-secondary"
              onClick={() => commitBox(box.id, "reject")}
            >
              Lücke für später markieren
            </button>
            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" className="dlg2-btn-secondary" onClick={onClose}>
                Überspringen
              </button>
              <button
                type="button"
                className={`dlg2-btn-commit${gapInput.trim() ? " ready" : ""}`}
                onClick={submit}
                disabled={!gapInput.trim()}
              >
                Wert speichern →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ───────────────────────────────────── Modality (alles außer konflikt/gap) ──
  //  Modality-aware Generic-Renderer für Single-Box-Sessions. Zeigt
  //  understood/attaches_to und passende Aktion-Buttons pro BoxType.
  //  Sekundär-Aktionen öffnen Inline-Korrektur (Bezug / Frist / Entscheidung).
  const TYPE_LABEL: Record<string, string> = {
    wissen: "Wissen",
    zuordnung: "Projekt",
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

  type ModalityAction = {
    primaryLabel: string;
    secondaryLabel?: string;
    inlineEdit?: "bezug" | "due_date" | "decide";
  };
  const MODALITY: Record<string, ModalityAction> = {
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
    wissen: { primaryLabel: "Bestätigen" },
    kontext: { primaryLabel: "Bestätigen" },
  };

  const renderGeneric = () => {
    const understood = (box.payload?.understood as string | null) ?? null;
    const attachesTo = (box.payload?.attaches_to as string | null) ?? null;
    const evidence = (box.payload?.evidence as string | null) ?? null;
    // Kontext-Boxen (aus Factory-Sessions) tragen Daten im klassischen
    // auszug/begruendung/quelle/sachverhalt-Schema — auch rendern.
    const auszug = (box.payload?.auszug as string | null) ?? null;
    const begruendung = (box.payload?.begruendung as string | null) ?? null;
    const sachverhalt = (box.payload?.sachverhalt as string | null) ?? null;
    const quelle = (box.payload?.quelle as string | null) ?? null;
    const action = MODALITY[box.type] ?? { primaryLabel: "Bestätigen" };
    const aktionen: string[] = Array.isArray(box.payload?.aktionen) ? box.payload.aktionen : [];

    const inlineKey =
      action.inlineEdit === "bezug"
        ? "attaches_to"
        : action.inlineEdit === "due_date"
          ? "due_date"
          : "";
    const inlineHint =
      action.inlineEdit === "bezug"
        ? "Worauf bezieht sich das?"
        : action.inlineEdit === "due_date"
          ? "Frist (z. B. 15.06.2026)"
          : "";

    return (
      <div
        style={{
          flex: 1,
          padding: "32px 56px",
          display: "flex",
          flexDirection: "column",
          gap: 20,
          overflowY: "auto",
        }}
      >
        <div className="cogni-card" style={{ padding: 28 }}>
          <div
            className="mono"
            style={{
              fontSize: 10,
              color: "var(--d-ink-3)",
              letterSpacing: ".06em",
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            {TYPE_LABEL[box.type] ?? box.type.toUpperCase()}
          </div>
          <div
            style={{
              fontSize: 24,
              fontWeight: 500,
              letterSpacing: "-.018em",
              color: "var(--d-ink)",
              lineHeight: 1.25,
            }}
          >
            {box.title}
          </div>
          {understood && (
            <div style={{ marginTop: 14, fontSize: 14, color: "var(--d-ink-2)", lineHeight: 1.5 }}>
              <span
                className="mono"
                style={{ fontSize: 11, color: "var(--d-ink-3)", marginRight: 6 }}
              >
                VERSTANDEN:
              </span>
              {understood}
            </div>
          )}
          {/* Factory-Session-Felder (Thema/Dokument/Verlauf/Source/Handlungsbedarf) */}
          {(auszug || sachverhalt) && (
            <div style={{ marginTop: 14, fontSize: 15, color: "var(--d-ink)", lineHeight: 1.5 }}>
              {auszug ?? sachverhalt}
            </div>
          )}
          {begruendung && (
            <div style={{ marginTop: 10, fontSize: 13, color: "var(--d-ink-3)", lineHeight: 1.5 }}>
              {begruendung}
            </div>
          )}
          {attachesTo && (
            <div style={{ marginTop: 12, display: "inline-flex", alignItems: "center" }}>
              <span
                className="mono"
                style={{
                  fontSize: 10.5,
                  padding: "3px 9px",
                  borderRadius: 999,
                  border: "1px solid var(--d-hair-2)",
                  color: "var(--d-ink-3)",
                  background: "var(--d-surf-3)",
                }}
              >
                → {attachesTo}
              </span>
            </div>
          )}
          {evidence && (
            <div
              style={{
                marginTop: 14,
                padding: "10px 14px",
                background: "var(--d-surf-3)",
                borderRadius: 8,
                fontSize: 12.5,
                color: "var(--d-ink-3)",
                fontStyle: "italic",
                lineHeight: 1.5,
                borderLeft: "2px solid var(--d-hair-2)",
              }}
            >
              „{evidence}"
            </div>
          )}
          {quelle && (
            <div className="mono" style={{ marginTop: 14, fontSize: 11, color: "var(--d-ink-3)" }}>
              {quelle}
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            marginTop: "auto",
            paddingTop: 20,
            borderTop: "1px solid var(--d-hair)",
            flexWrap: "wrap",
          }}
        >
          {/* aktion: konfigurierbare Buttons aus payload.aktionen[] */}
          {box.type === "aktion" && aktionen.length > 0 ? (
            <>
              <button
                type="button"
                className="dlg2-btn-secondary"
                onClick={() => commitBox(box.id, "reject")}
              >
                Verwerfen
              </button>
              {aktionen.map((label, i) => (
                <button
                  key={`${label}-${i}`}
                  type="button"
                  className={i === 0 ? "dlg2-btn-commit ready" : "dlg2-btn-secondary"}
                  onClick={() => commitBox(box.id, "confirm", { aktion: label })}
                >
                  {label}
                  {i === 0 && " →"}
                </button>
              ))}
            </>
          ) : editing && action.inlineEdit ? (
            // Inline-Korrektur erfasst (Bezug / Frist / Entscheidung)
            action.inlineEdit === "decide" ? (
              <>
                <button
                  type="button"
                  className="dlg2-btn-secondary"
                  onClick={() => setEditing(null)}
                >
                  Abbrechen
                </button>
                <button
                  type="button"
                  className="dlg2-btn-secondary"
                  onClick={() => {
                    setEditing(null);
                    commitBox(box.id, "reject");
                  }}
                >
                  Nein, verwerfen
                </button>
                <button
                  type="button"
                  className="dlg2-btn-commit ready"
                  onClick={() => {
                    setEditing(null);
                    commitBox(box.id, "confirm", { entscheidung: "ja" });
                  }}
                >
                  Ja, übernehmen →
                </button>
              </>
            ) : (
              <>
                <input
                  value={editInput}
                  onChange={(e) => setEditInput(e.target.value)}
                  placeholder={inlineHint}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && editInput.trim()) {
                      commitBox(box.id, "confirm", { [inlineKey]: editInput.trim() });
                      setEditing(null);
                    }
                    if (e.key === "Escape") setEditing(null);
                  }}
                  style={{
                    flex: 1,
                    minWidth: 200,
                    height: 36,
                    padding: "0 14px",
                    borderRadius: 10,
                    border: "1px solid var(--d-blue)",
                    background: "var(--d-blue-soft)",
                    color: "var(--d-blue)",
                    fontFamily: "Geist Mono, monospace",
                    fontSize: 14,
                    outline: "none",
                  }}
                />
                <button
                  type="button"
                  className="dlg2-btn-secondary"
                  onClick={() => setEditing(null)}
                >
                  Abbrechen
                </button>
                <button
                  type="button"
                  className="dlg2-btn-commit ready"
                  disabled={!editInput.trim()}
                  onClick={() => {
                    if (!editInput.trim()) return;
                    commitBox(box.id, "confirm", { [inlineKey]: editInput.trim() });
                    setEditing(null);
                  }}
                >
                  Speichern →
                </button>
              </>
            )
          ) : (
            // Standard: Primary + optional Secondary + Verwerfen + Schließen
            <>
              <button type="button" className="dlg2-btn-secondary" onClick={onClose}>
                Schließen
              </button>
              <button
                type="button"
                className="dlg2-btn-secondary"
                onClick={() => commitBox(box.id, "reject")}
              >
                Verwerfen
              </button>
              {action.secondaryLabel && action.inlineEdit && (
                <button
                  type="button"
                  className="dlg2-btn-secondary"
                  onClick={() => {
                    if (action.inlineEdit === "bezug" && attachesTo) {
                      setEditInput(attachesTo);
                    } else {
                      setEditInput("");
                    }
                    setEditing(action.inlineEdit!);
                  }}
                >
                  {action.secondaryLabel}
                </button>
              )}
              <button
                type="button"
                className="dlg2-btn-commit ready"
                onClick={() => commitBox(box.id, "confirm")}
              >
                {action.primaryLabel} →
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div data-dialog className="dlg2-root dialog-backdrop">
      <SessionHeader
        source={session.context ?? ""}
        summary={projectLabel}
        onClose={onClose}
        mode="drill"
      />
      <DrillHeader />
      {box.type === "konflikt"
        ? renderConflict()
        : box.type === "gap"
          ? renderGap()
          : renderGeneric()}
    </div>
  );
};

export default FaktDrillOverlay;
