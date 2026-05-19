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
  label?: string;     // "Mail · Thomas Berger"
  meta?: string;      // "09.04.2026 · 14:22 · informell"
  hint?: string;      // "älter · direkter Absender"
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
        <span style={{ fontSize: 13.5, color: "var(--d-ink-2)", fontWeight: 450 }}>{box.title}</span>
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
          style={{
            flex: 1,
            padding: "22px 28px",
            borderRadius: side === "A" ? "16px 0 0 16px" : "0 16px 16px 0",
            background: "var(--d-surf)",
            border: `1px solid ${isRec ? "var(--d-warn)" : "var(--d-hair-2)"}`,
            [side === "A" ? "borderRight" : "borderLeft"]: "none",
          } as React.CSSProperties}
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
              {meta.label && <div style={{ fontSize: 12, color: "var(--d-ink-2)" }}>{meta.label}</div>}
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
          <div style={{ fontSize: 12.5, color: "var(--d-ink-3)", marginBottom: 12 }}>Was stimmt?</div>
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
                      color: isSel
                        ? isOpen
                          ? "var(--d-ink)"
                          : "var(--d-warn)"
                        : "var(--d-ink-2)",
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
            onClick={() => commitBox(box.id, "reject")}
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
    const blockiert = (box.payload?.blockiert as Array<{ what: string; strong?: boolean }> | undefined) ?? [];

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
                  style={{ marginTop: 10, fontSize: 13.5, color: "var(--d-ink-2)", lineHeight: 1.55 }}
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
              <div style={{ marginTop: 10, fontSize: 13, color: "var(--d-ink-2)", lineHeight: 1.5 }}>
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

  // Andere Box-Typen: simple Bestätigung
  const renderGeneric = () => (
    <div style={{ flex: 1, padding: "32px 56px", display: "flex", flexDirection: "column", gap: 16 }}>
      <div
        className="cogni-card"
        style={{ padding: 24 }}
      >
        <div className="t-micro" style={{ color: "var(--d-ink-4)", marginBottom: 8 }}>
          {box.type.toUpperCase()}
        </div>
        <div style={{ fontSize: 20, fontWeight: 500, color: "var(--d-ink)" }}>{box.title}</div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 10,
          marginTop: "auto",
          paddingTop: 20,
          borderTop: "1px solid var(--d-hair)",
        }}
      >
        <button type="button" className="dlg2-btn-secondary" onClick={onClose}>
          Schließen
        </button>
        <button
          type="button"
          className="dlg2-btn-commit ready"
          onClick={() => commitBox(box.id, "confirm")}
        >
          Bestätigen →
        </button>
      </div>
    </div>
  );

  return (
    <div data-dialog className="dlg2-root dialog-backdrop">
      <SessionHeader source={session.context ?? ""} summary={projectLabel} onClose={onClose} mode="drill" />
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
