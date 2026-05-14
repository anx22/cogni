/* global React */
// COGNI — Dialog-Overlay (Gesprächsraum) · Redesign
//
// PARADIGMA: Kein Wizard. Kein Screen-per-Frage.
// cogni hat alles vorentschieden. Mensch scannt, überschreibt inline, drückt Enter.
// Ziel: 10 Sekunden für eine typische Review-Session.
//
// Wie ein Git-Diff: grüne Rows = nichts zu tun. Orangene = kurz anschauen.
// Rote = einmal klicken → inline auflösen → weiter.

const { Ic, Monogram } = window.CogniCommon;

/* ============================================================
   CSS
   ============================================================ */
const DIALOG2_CSS = `
.dlg2-root {
  position: absolute; inset: 0;
  background: var(--surface-0);
  color: var(--ink);
  font-family: "Geist", -apple-system, system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
  display: flex; flex-direction: column;
  overflow: hidden;
}
.dlg2-root, .dlg2-root * { box-sizing: border-box; }

/* Map --d-* to theme tokens so the overlay respects Tag/Nacht */
.dlg2-root {
  --d-ink:      var(--ink);
  --d-ink-2:    var(--ink-2);
  --d-ink-3:    var(--ink-3);
  --d-ink-4:    var(--ink-4);
  --d-surf:     var(--surface-1);
  --d-surf-2:   var(--surface-2);
  --d-surf-3:   var(--surface-3);
  --d-hair:     var(--hair);
  --d-hair-2:   var(--hair-2);
  --d-ok:       var(--sig-action);
  --d-ok-soft:  var(--sig-action-soft);
  --d-warn:     var(--sig-review);
  --d-warn-soft:var(--sig-review-soft);
  --d-conf:     var(--sig-conflict);
  --d-conf-soft:var(--sig-conflict-soft);
  --d-blue:     var(--accent);
  --d-blue-soft:var(--accent-soft);
  --d-shadow:   var(--shadow-pop);
}

/* Session header */
.dlg2-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px 44px;
  border-bottom: 1px solid var(--d-hair);
  flex: 0 0 auto;
}

/* Review list */
.dlg2-list {
  flex: 1; overflow: hidden;
  display: flex; flex-direction: column;
  margin: 28px 44px 0;
  border-radius: 16px;
  border: 1px solid var(--d-hair);
  background: var(--d-surf);
  overflow: hidden;
}

/* Row */
.dlg2-row {
  display: flex; align-items: center;
  padding: 0 18px;
  border-bottom: 1px solid var(--d-hair);
  transition: background .1s;
  min-height: 48px;
  position: relative;
  cursor: default;
}
.dlg2-row:last-child { border-bottom: none; }
.dlg2-row:hover { background: var(--d-surf-2); }

/* Status stripe — left edge */
.dlg2-stripe {
  position: absolute; left: 0; top: 0; bottom: 0; width: 3px;
  border-radius: 2px 0 0 2px;
}

/* Type chip */
.dlg2-type {
  font-family: "Geist Mono", monospace;
  font-size: 9.5px; font-weight: 600;
  letter-spacing: .06em; text-transform: uppercase;
  padding: 2px 6px; border-radius: 5px;
  white-space: nowrap; flex: 0 0 auto;
  width: 88px;
}

/* Expand panel inside row */
.dlg2-expand {
  padding: 14px 18px 18px 109px;
  background: var(--d-surf-2);
  border-bottom: 1px solid var(--d-hair);
}

/* Option chips (inline conflict resolution) */
.dlg2-chip-opt {
  display: inline-flex; align-items: center;
  height: 26px; padding: 0 10px; border-radius: 8px;
  border: 1px solid var(--d-hair-2);
  font-size: 12.5px; cursor: pointer; transition: all .12s;
  background: transparent; color: var(--d-ink-2);
  font-family: inherit;
}
.dlg2-chip-opt:hover { border-color: var(--d-hair-2); color: var(--d-ink); background: var(--d-surf-3); }
.dlg2-chip-opt.active {
  background: var(--d-warn-soft) !important;
  border-color: var(--d-warn) !important;
  color: var(--d-warn) !important;
}

/* Commit bar */
.dlg2-commitbar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px 44px 32px;
  flex: 0 0 auto;
}
.dlg2-btn-commit {
  display: inline-flex; align-items: center; gap: 10px;
  height: 44px; padding: 0 22px; border-radius: 12px;
  background: var(--d-ink); color: hsl(222,20%,6%);
  border: none; font: inherit; font-size: 14.5px; font-weight: 600;
  cursor: pointer; transition: background .12s, box-shadow .15s;
}
.dlg2-btn-commit:hover { background: #fff; }
.dlg2-btn-commit.ready {
  background: hsl(218,72%,65%);
  box-shadow: 0 0 0 6px rgba(107,148,255,.18), 0 8px 24px -8px rgba(107,148,255,.5);
  color: hsl(222,20%,6%);
}
.dlg2-btn-secondary {
  display: inline-flex; align-items: center; gap: 8px;
  height: 40px; padding: 0 16px; border-radius: 11px;
  background: transparent; color: var(--d-ink-3);
  border: 1px solid var(--d-hair-2);
  font: inherit; font-size: 13.5px; cursor: pointer;
  transition: color .12s, background .12s;
}
.dlg2-btn-secondary:hover { color: var(--d-ink); background: var(--d-surf-3); }
`;

if (typeof document !== "undefined" && !document.getElementById("cogni-dialog2-css")) {
  const s = document.createElement("style");
  s.id = "cogni-dialog2-css";
  s.textContent = DIALOG2_CSS;
  document.head.appendChild(s);
}

/* ============================================================
   Shared Session Header
   ============================================================ */
function DlgHeader({ source, summary, current, total }) {
  return (
    <header className="dlg2-header">
      <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 13 }}>
        <span style={{
          width: 7, height: 7, borderRadius: 999,
          background: "var(--d-blue)", position: "relative", flex: "0 0 auto",
        }}>
          <span style={{
            position: "absolute", inset: -3, borderRadius: 999,
            background: "var(--d-blue)", opacity: .25,
            animation: "cogni-pulse 1.8s ease-out infinite",
          }}/>
        </span>
        <span style={{ color: "var(--d-ink)", fontWeight: 500 }}>Review</span>
        <span style={{ color: "var(--d-ink-3)" }}>·</span>
        <span style={{ fontFamily: "Geist Mono, monospace", color: "var(--d-ink-2)", fontSize: 12 }}>{source}</span>
        {summary && (
          <>
            <span style={{ color: "var(--d-ink-3)" }}>·</span>
            <span style={{ color: "var(--d-ink-3)", fontSize: 12 }}>{summary}</span>
          </>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <span style={{ fontFamily: "Geist Mono, monospace", fontSize: 12, color: "var(--d-ink-3)" }}>
          {current} / {total}
        </span>
        <button className="dlg2-btn-secondary" style={{ height: 28, fontSize: 12 }}>
          esc
        </button>
      </div>
    </header>
  );
}

/* ============================================================
   Row Renderers
   ============================================================ */
function RowAccepted({ type, content, sub, project, typeColor = "rgba(255,255,255,.06)", typeTextColor = "var(--d-ink-3)" }) {
  return (
    <div className="dlg2-row">
      <div className="dlg2-stripe" style={{ background: "transparent" }} />
      {/* Check */}
      <span style={{
        width: 16, height: 16, borderRadius: 999, flex: "0 0 auto",
        border: "1.5px solid var(--d-ink-4)",
        marginRight: 14, display: "flex", alignItems: "center", justifyContent: "center",
        color: "var(--d-ink-4)",
      }}>
        <svg width="9" height="9" viewBox="0 0 10 8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 4l3 3 5-6"/>
        </svg>
      </span>
      {/* Type */}
      <span className="dlg2-type" style={{ background: typeColor, color: typeTextColor }}>{type}</span>
      {/* Content */}
      <span style={{ flex: 1, fontSize: 13.5, color: "var(--d-ink-2)", letterSpacing: "-.008em", marginLeft: 4 }}>
        {content}
        {sub && <span style={{ color: "var(--d-ink-4)", marginLeft: 8, fontSize: 12 }}>{sub}</span>}
      </span>
      {/* Project */}
      {project && (
        <span style={{
          fontFamily: "Geist Mono, monospace", fontSize: 11, color: "var(--d-ink-3)",
          marginLeft: 12, flex: "0 0 auto",
        }}>{project}</span>
      )}
    </div>
  );
}

function RowConflict({ expanded = false, chosen = 0 }) {
  return (
    <>
      <div className="dlg2-row" style={{ minHeight: 52 }}>
        <div className="dlg2-stripe" style={{ background: "var(--d-warn)" }} />
        {/* signal */}
        <span style={{
          width: 16, height: 16, borderRadius: 999, flex: "0 0 auto",
          background: "var(--d-warn-soft)", border: "1.5px solid var(--d-warn)",
          marginRight: 14, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ width: 5, height: 5, borderRadius: 999, background: "var(--d-warn)" }}/>
        </span>
        {/* type */}
        <span className="dlg2-type" style={{ background: "var(--d-warn-soft)", color: "var(--d-warn)" }}>Konflikt</span>
        {/* content */}
        <span style={{ flex: 1, fontSize: 13.5, color: "var(--d-ink)", letterSpacing: "-.008em", marginLeft: 4 }}>
          Go-Live-Termin widersprüchlich
          <span style={{ color: "var(--d-ink-4)", marginLeft: 8, fontSize: 12 }}>15 Mai vs 1 Jun</span>
        </span>
        {/* inline chips */}
        <div style={{ display: "flex", gap: 6, marginLeft: 12, flex: "0 0 auto" }}>
          <button className={`dlg2-chip-opt${chosen === 0 ? " active" : ""}`}>15. Mai</button>
          <button className={`dlg2-chip-opt${chosen === 1 ? " active" : ""}`}>1. Juni</button>
          <button className={`dlg2-chip-opt`} style={{ color: "var(--d-ink-4)" }}>offen lassen</button>
        </div>
        <button style={{
          marginLeft: 12, background: "transparent", border: "none",
          color: "var(--d-ink-3)", fontSize: 11.5, cursor: "pointer",
          fontFamily: "Geist Mono, monospace", letterSpacing: ".02em",
          flex: "0 0 auto",
        }}>Details {expanded ? "▲" : "▼"}</button>
      </div>
      {expanded && (
        <div className="dlg2-expand">
          <div style={{ display: "flex", gap: 12, alignItems: "stretch" }}>
            {/* Quelle A */}
            <div style={{
              flex: 1, padding: "14px 18px", borderRadius: 12,
              background: chosen === 0 ? "var(--d-warn-soft)" : "var(--d-surf-3)",
              border: chosen === 0 ? "1px solid var(--d-warn)" : "1px solid var(--d-hair)",
            }}>
              <div style={{ fontSize: 10, fontFamily: "Geist Mono, monospace", color: "var(--d-ink-3)", letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 6 }}>Quelle A — Mail Berger</div>
              <div style={{ fontSize: 22, fontWeight: 500, letterSpacing: "-.02em", color: chosen === 0 ? "var(--d-warn)" : "var(--d-ink-2)" }}>15. Mai 2026</div>
              <div style={{ fontSize: 11, fontFamily: "Geist Mono, monospace", color: "var(--d-ink-3)", marginTop: 6 }}>09.04.2026 · 14:22 · informell</div>
            </div>
            {/* vs */}
            <div style={{
              width: 36, flex: "0 0 auto",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "Geist Mono, monospace", fontSize: 10, color: "var(--d-conf)",
              letterSpacing: ".04em",
            }}>vs</div>
            {/* Quelle B */}
            <div style={{
              flex: 1, padding: "14px 18px", borderRadius: 12,
              background: chosen === 1 ? "var(--d-warn-soft)" : "var(--d-surf-3)",
              border: chosen === 1 ? "1px solid var(--d-warn)" : "1px solid var(--d-hair)",
            }}>
              <div style={{ fontSize: 10, fontFamily: "Geist Mono, monospace", color: "var(--d-ink-3)", letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 6 }}>Quelle B — Steering-Protokoll v3</div>
              <div style={{ fontSize: 22, fontWeight: 500, letterSpacing: "-.02em", color: chosen === 1 ? "var(--d-warn)" : "var(--d-ink-2)" }}>1. Juni 2026</div>
              <div style={{ fontSize: 11, fontFamily: "Geist Mono, monospace", color: "var(--d-ink-3)", marginTop: 6 }}>12.04.2026 · Seite 3 · formell</div>
            </div>
          </div>
          <div style={{ marginTop: 10, fontSize: 12, color: "var(--d-ink-3)" }}>
            cogni empfiehlt <span style={{ color: "var(--d-warn)" }}>15. Mai</span> — jüngere direkte Aussage des PM. Klick zum Überschreiben.
          </div>
        </div>
      )}
    </>
  );
}

function RowGap({ inputVisible = false }) {
  return (
    <>
      <div className="dlg2-row" style={{ minHeight: 52 }}>
        <div className="dlg2-stripe" style={{ background: "var(--d-warn)" }} />
        <span style={{
          width: 16, height: 16, borderRadius: 999, flex: "0 0 auto",
          background: "var(--d-warn-soft)", border: "1.5px solid var(--d-warn)",
          marginRight: 14, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ width: 5, height: 5, borderRadius: 999, background: "transparent", border: "1px solid var(--d-warn)", borderRadius: 999 }}/>
        </span>
        <span className="dlg2-type" style={{ background: "var(--d-warn-soft)", color: "var(--d-warn)" }}>Lücke</span>
        <span style={{ flex: 1, fontSize: 13.5, color: "var(--d-ink)", letterSpacing: "-.008em", marginLeft: 4 }}>
          Latenzziel fehlt
          <span style={{ color: "var(--d-ink-3)", marginLeft: 8, fontSize: 12 }}>→ blockiert API-Architektur</span>
        </span>
        {inputVisible ? (
          <div style={{ display: "flex", alignItems: "center", gap: 6, flex: "0 0 auto" }}>
            <input readOnly value="< 200ms p95" style={{
              height: 28, padding: "0 10px", borderRadius: 8,
              border: "1px solid var(--d-blue)", background: "var(--d-blue-soft)",
              color: "var(--d-blue)", fontFamily: "Geist Mono, monospace", fontSize: 12,
              outline: "none", width: 110,
            }}/>
            <button className="dlg2-chip-opt" style={{ borderColor: "var(--d-ok)", color: "var(--d-ok)", background: "var(--d-ok-soft)" }}>✓</button>
          </div>
        ) : (
          <button className="dlg2-chip-opt" style={{ flex: "0 0 auto", borderColor: "var(--d-warn)", color: "var(--d-warn)" }}>Eingeben</button>
        )}
      </div>
    </>
  );
}

function RowReady({ type, content, project }) {
  return (
    <div className="dlg2-row">
      <div className="dlg2-stripe" style={{ background: "var(--d-ok)", opacity: .7 }} />
      <span style={{
        width: 16, height: 16, borderRadius: 999, flex: "0 0 auto",
        background: "var(--d-ok-soft)", border: "1.5px solid var(--d-ok)",
        marginRight: 14, display: "flex", alignItems: "center", justifyContent: "center",
        color: "var(--d-ok)",
      }}>
        <svg width="9" height="9" viewBox="0 0 10 8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 4l3 3 5-6"/>
        </svg>
      </span>
      <span className="dlg2-type" style={{ background: "var(--d-ok-soft)", color: "var(--d-ok)" }}>{type}</span>
      <span style={{ flex: 1, fontSize: 13.5, color: "var(--d-ink-2)", letterSpacing: "-.008em", marginLeft: 4 }}>{content}</span>
      {project && (
        <span style={{ fontFamily: "Geist Mono, monospace", fontSize: 11, color: "var(--d-ink-3)", marginLeft: 12 }}>{project}</span>
      )}
    </div>
  );
}

/* ============================================================
   Szene A — Batch Review (Konflikt + Lücke collapsed)
   ============================================================ */
function SceneBatchReview() {
  return (
    <div className="dlg2-root">
      <DlgHeader
        source="Steering-Protokoll-v3.docx"
        summary="7 Erkenntnisse · 1 Konflikt · 1 Lücke"
        current={1} total={1}
      />
      <div className="dlg2-list">
        <RowAccepted type="Termin"       content="Go-Live 15. Mai 2026"              project="Hafen Nord" />
        <RowAccepted type="Entscheidung" content="Timeline um 2 Wochen verschoben"   project="Hafen Nord" />
        <RowConflict expanded={false} chosen={0} />
        <RowAccepted type="Stakeholder"  content="Maria Schulz · Projektsteuerung"   project="Hafen Nord" />
        <RowGap      inputVisible={false} />
        <RowAccepted type="Entscheidung" content="React als Frontend-Framework"       project="Hafen Nord" />
        <RowAccepted type="Dokument"     content="Steering-Protokoll v3 hochgeladen" project="—" />
      </div>
      <div className="dlg2-commitbar">
        <button className="dlg2-btn-secondary">Alle verwerfen</button>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 12.5, color: "var(--d-ink-3)" }}>
            <span style={{ color: "var(--d-warn)", fontWeight: 500 }}>2 offen</span> · 5 bereit
          </span>
          <button className="dlg2-btn-commit">
            5 übernehmen
            <span style={{ opacity: .5, fontSize: 12, fontFamily: "Geist Mono, monospace" }}>↵</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Szene B — Konflikt aufgeklappt (Details inline)
   ============================================================ */
function SceneBatchConfliktExpanded() {
  return (
    <div className="dlg2-root">
      <DlgHeader
        source="Steering-Protokoll-v3.docx"
        summary="7 Erkenntnisse · 1 Konflikt · 1 Lücke"
        current={1} total={1}
      />
      <div className="dlg2-list">
        <RowAccepted type="Termin"       content="Go-Live 15. Mai 2026"              project="Hafen Nord" />
        <RowAccepted type="Entscheidung" content="Timeline um 2 Wochen verschoben"   project="Hafen Nord" />
        <RowConflict expanded={true} chosen={0} />
        <RowAccepted type="Stakeholder"  content="Maria Schulz · Projektsteuerung"   project="Hafen Nord" />
        <RowGap      inputVisible={true} />
        <RowAccepted type="Entscheidung" content="React als Frontend-Framework"       project="Hafen Nord" />
        <RowAccepted type="Dokument"     content="Steering-Protokoll v3 hochgeladen" project="—" />
      </div>
      <div className="dlg2-commitbar">
        <button className="dlg2-btn-secondary">Alle verwerfen</button>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 12.5, color: "var(--d-ink-3)" }}>
            <span style={{ color: "var(--d-warn)", fontWeight: 500 }}>1 offen</span> · 6 bereit
          </span>
          <button className="dlg2-btn-commit">
            6 übernehmen
            <span style={{ opacity: .5, fontSize: 12, fontFamily: "Geist Mono, monospace" }}>↵</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Szene C — Alles bereit, Commit
   ============================================================ */
function SceneBatchCommit() {
  return (
    <div className="dlg2-root">
      <DlgHeader
        source="Steering-Protokoll-v3.docx"
        summary="7 Erkenntnisse · alle bereit"
        current={1} total={1}
      />
      <div className="dlg2-list">
        <RowReady type="Termin"       content="Go-Live 15. Mai 2026"              project="Hafen Nord" />
        <RowReady type="Entscheidung" content="Timeline um 2 Wochen verschoben"   project="Hafen Nord" />
        <RowReady type="Konflikt"     content="Go-Live 15. Mai gewählt (Berger)"  project="Hafen Nord" />
        <RowReady type="Stakeholder"  content="Maria Schulz · Projektsteuerung"   project="Hafen Nord" />
        <RowReady type="Lücke"        content="Latenzziel < 200ms p95 ergänzt"   project="Hafen Nord" />
        <RowReady type="Entscheidung" content="React als Frontend-Framework"       project="Hafen Nord" />
        <RowReady type="Dokument"     content="Steering-Protokoll v3 hochgeladen" project="—" />
      </div>
      <div className="dlg2-commitbar">
        <button className="dlg2-btn-secondary">Zurück</button>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 12.5, color: "var(--d-ink-3)" }}>
            <span style={{ color: "var(--d-ok)" }}>7 bereit</span> · nichts offen
          </span>
          <button className="dlg2-btn-commit ready">
            Alles übernehmen →
            <span style={{ opacity: .55, fontSize: 12, fontFamily: "Geist Mono, monospace" }}>↵</span>
          </button>
        </div>
      </div>
    </div>
  );
}

window.CogniDialog = { SceneBatchReview, SceneBatchConfliktExpanded, SceneBatchCommit };

/* ============================================================
   FAKT-DRILL Modi — geöffnet aus Projekt-Detail heraus
   Einstieg: Klick auf Handlungsbedarf-Item (Konflikt / Gap etc.)
   Kontext-Frame oben zeigt den Ursprung.
   ============================================================ */

function DrillHeader({ itemTitle, source, backLabel = "← Handlungsbedarf" }) {
  return (
    <header style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "16px 44px",
      borderBottom: "1px solid var(--d-hair)",
      flex: "0 0 auto",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <button className="dlg2-btn-secondary" style={{ height: 28, fontSize: 12, gap: 6 }}>
          {backLabel}
        </button>
        <span style={{ color: "var(--d-ink-4)" }}>·</span>
        <span style={{ fontSize: 13.5, color: "var(--d-ink-2)", fontWeight: 450 }}>{itemTitle}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {source && (
          <span style={{ fontFamily: "Geist Mono, monospace", fontSize: 11, color: "var(--d-ink-3)" }}>{source}</span>
        )}
        <button className="dlg2-btn-secondary" style={{ height: 28, fontSize: 12 }}>esc</button>
      </div>
    </header>
  );
}

/* Fakt-Drill · Konflikt — volle Gegenüberstellung */
function SceneFaktKonflikt() {
  return (
    <div className="dlg2-root">
      <DrillHeader
        itemTitle="Go-Live-Termin festlegen"
        source="Hafen Nord Erweiterung · Konflikt #k1"
      />
      <div style={{ flex: 1, padding: "36px 56px 0", display: "flex", flexDirection: "column", gap: 20, overflow: "hidden" }}>

        {/* Widerspruch-Banner */}
        <div style={{
          display: "flex", alignItems: "center", gap: 14,
          padding: "14px 20px", borderRadius: 14,
          background: "var(--d-conf-soft)",
          border: "1px solid rgba(215,70,60,.22)",
          flex: "0 0 auto",
        }}>
          <Ic.conflict />
          <div>
            <div style={{ fontSize: 15, fontWeight: 500, color: "var(--d-conf)", letterSpacing: "-.01em" }}>
              Zwei Quellen widersprechen sich
            </div>
            <div style={{ fontSize: 12.5, color: "var(--d-ink-3)", marginTop: 2 }}>
              Beide nennen den Go-Live-Termin, aber mit unterschiedlichem Datum. Eine muss stimmen.
            </div>
          </div>
        </div>

        {/* Räumliche Gegenüberstellung */}
        <div style={{ display: "flex", gap: 0, flex: "0 0 auto" }}>
          {/* A */}
          <div style={{
            flex: 1, padding: "22px 28px", borderRadius: "16px 0 0 16px",
            background: "var(--d-surf)",
            border: "1px solid var(--d-warn)",
            borderRight: "none",
          }}>
            <div style={{ fontSize: 10, fontFamily: "Geist Mono, monospace", color: "var(--d-ink-3)", letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 12 }}>Quelle A</div>
            <div style={{ fontSize: 38, fontWeight: 500, letterSpacing: "-.032em", color: "var(--d-ink)", lineHeight: 1.0 }}>15. Mai<br/>2026</div>
            <div style={{ marginTop: 16, padding: "10px 14px", borderRadius: 10, background: "var(--d-surf-3)" }}>
              <div style={{ fontSize: 12, color: "var(--d-ink-2)" }}>Mail · Thomas Berger</div>
              <div style={{ fontFamily: "Geist Mono, monospace", fontSize: 11, color: "var(--d-ink-4)", marginTop: 3 }}>09.04.2026 · 14:22 · informell</div>
            </div>
            <div style={{ marginTop: 14, display: "flex", gap: 6, alignItems: "center" }}>
              <span style={{ width: 5, height: 5, borderRadius: 999, background: "var(--d-warn-soft)", border: "1px solid var(--d-warn)" }}/>
              <span style={{ fontSize: 12, color: "var(--d-ink-3)" }}>älter · direkter Absender</span>
            </div>
          </div>

          {/* vs */}
          <div style={{
            width: 60, flex: "0 0 auto",
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "var(--d-conf-soft)",
            borderTop: "1px solid rgba(215,70,60,.2)", borderBottom: "1px solid rgba(215,70,60,.2)",
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: 999,
              background: "var(--d-surf)", border: "1px solid var(--d-conf)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "Geist Mono, monospace", fontSize: 10, fontWeight: 600,
              color: "var(--d-conf)", letterSpacing: ".04em",
            }}>vs</div>
          </div>

          {/* B */}
          <div style={{
            flex: 1, padding: "22px 28px", borderRadius: "0 16px 16px 0",
            background: "var(--d-surf)",
            border: "1px solid var(--d-hair-2)",
            borderLeft: "none",
          }}>
            <div style={{ fontSize: 10, fontFamily: "Geist Mono, monospace", color: "var(--d-ink-3)", letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 12 }}>Quelle B</div>
            <div style={{ fontSize: 38, fontWeight: 500, letterSpacing: "-.032em", color: "var(--d-ink-2)", lineHeight: 1.0 }}>1. Juni<br/>2026</div>
            <div style={{ marginTop: 16, padding: "10px 14px", borderRadius: 10, background: "var(--d-surf-3)" }}>
              <div style={{ fontSize: 12, color: "var(--d-ink-2)" }}>Steering-Protokoll v3</div>
              <div style={{ fontFamily: "Geist Mono, monospace", fontSize: 11, color: "var(--d-ink-4)", marginTop: 3 }}>12.04.2026 · Seite 3 · formell</div>
            </div>
            <div style={{ marginTop: 14, display: "flex", gap: 6, alignItems: "center" }}>
              <span style={{ width: 5, height: 5, borderRadius: 999, background: "var(--d-surf-3)", border: "1px solid var(--d-hair-2)" }}/>
              <span style={{ fontSize: 12, color: "var(--d-ink-3)" }}>neuer · formelles Protokoll</span>
            </div>
          </div>
        </div>

        {/* Auswahl */}
        <div style={{
          padding: "18px 22px", borderRadius: 14,
          background: "var(--d-surf)", border: "1px solid var(--d-hair-2)",
          flex: "0 0 auto",
        }}>
          <div style={{ fontSize: 12.5, color: "var(--d-ink-3)", marginBottom: 12 }}>Was stimmt?</div>
          <div style={{ display: "flex", gap: 10 }}>
            {[
              { label: "15. Mai · Mail Berger",          hint: "jüngere Quelle, direkter Absender", sel: true },
              { label: "1. Juni · Steering-Protokoll",   hint: "formell, Steering-Beschluss", sel: false },
              { label: "Offen lassen",                   hint: "als Handlungsbedarf weiterführen", sel: false },
            ].map((o, i) => (
              <button key={i} style={{
                flex: 1, padding: "12px 14px", borderRadius: 10, cursor: "pointer",
                border: o.sel ? "1px solid var(--d-warn)" : "1px solid var(--d-hair)",
                background: o.sel ? "var(--d-warn-soft)" : "transparent",
                textAlign: "left", font: "inherit",
                display: "flex", flexDirection: "column", gap: 4,
              }}>
                <span style={{ fontSize: 13.5, color: o.sel ? "var(--d-warn)" : "var(--d-ink-2)", fontWeight: 450 }}>{o.label}</span>
                <span style={{ fontSize: 11.5, color: "var(--d-ink-3)" }}>{o.hint}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "22px 56px 32px" }}>
        <button className="dlg2-btn-secondary">Als Handlungsbedarf markieren</button>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="dlg2-btn-secondary">Verwerfen</button>
          <button className="dlg2-btn-commit">Entscheidung speichern →</button>
        </div>
      </div>
    </div>
  );
}

/* Fakt-Drill · Gap + Eingabe */
function SceneFaktGap() {
  return (
    <div className="dlg2-root">
      <DrillHeader
        itemTitle="Performance-Anforderung definieren"
        source="Hafen Nord Erweiterung · Gap #g1"
      />
      <div style={{ flex: 1, padding: "36px 56px 0", display: "flex", gap: 20, overflow: "hidden" }}>
        {/* Links: Kontext */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{
            padding: "22px 24px", borderRadius: 16,
            background: "var(--d-surf)", border: "1px solid var(--d-hair-2)",
            flex: "0 0 auto",
          }}>
            <div style={{ fontSize: 10, fontFamily: "Geist Mono, monospace", color: "var(--d-ink-3)", letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 12 }}>Kontext</div>
            <div style={{ fontSize: 20, fontWeight: 500, letterSpacing: "-.016em", color: "var(--d-ink)", lineHeight: 1.2 }}>
              API-Architektur-Entscheidung
            </div>
            <div style={{ marginTop: 10, fontSize: 13.5, color: "var(--d-ink-2)", lineHeight: 1.55 }}>
              Das Caching-Layer-Design setzt ein Latenzziel voraus. Ohne diesen Wert ist die Architekturentscheidung nicht treffbar.
            </div>
            <div style={{ marginTop: 14, fontSize: 11, fontFamily: "Geist Mono, monospace", color: "var(--d-ink-3)" }}>
              API-Architektur-Memo.docx · Seite 2
            </div>
          </div>

          {/* Abhängigkeiten */}
          <div style={{
            padding: "16px 20px", borderRadius: 14,
            background: "transparent", border: "1px solid var(--d-hair)",
          }}>
            <div style={{ fontSize: 10, fontFamily: "Geist Mono, monospace", color: "var(--d-ink-3)", letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 10 }}>Blockiert</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { what: "Caching-Layer-Design", strong: true },
                { what: "CDN-Strategie", strong: false },
                { what: "Load-Test-Planung", strong: false },
              ].map((d, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: d.strong ? "var(--d-conf)" : "var(--d-ink-3)" }}>
                  <span style={{ width: 5, height: 5, borderRadius: 999, background: d.strong ? "var(--d-conf)" : "var(--d-ink-4)", flex: "0 0 auto" }}/>
                  {d.what}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Rechts: Gap + Eingabe */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{
            padding: "22px 24px", borderRadius: 16,
            background: "var(--d-warn-soft)", border: "1px solid var(--d-warn)",
            flex: "0 0 auto",
          }}>
            <div style={{ fontSize: 10, fontFamily: "Geist Mono, monospace", color: "var(--d-warn)", letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 12 }}>Lücke</div>
            <div style={{ fontSize: 24, fontWeight: 500, letterSpacing: "-.02em", color: "var(--d-warn)", lineHeight: 1.1 }}>
              Latenzziel fehlt
            </div>
            <div style={{ marginTop: 10, fontSize: 13, color: "var(--d-ink-2)", lineHeight: 1.5 }}>
              Performance-Anforderung wurde in keinem Dokument definiert.
            </div>
            <div style={{ fontFamily: "Geist Mono, monospace", fontSize: 11, color: "var(--d-ink-3)", marginTop: 10 }}>
              offen seit 6 Tagen
            </div>
          </div>

          <div style={{
            padding: "20px 24px", borderRadius: 16,
            background: "var(--d-surf)", border: "1px solid var(--d-hair-2)",
          }}>
            <div style={{ fontSize: 13.5, color: "var(--d-ink-2)", marginBottom: 14 }}>
              Was ist das Ziel-Latenzziel?
            </div>
            <div style={{
              display: "flex", alignItems: "center", gap: 0,
              borderRadius: 10, overflow: "hidden",
              background: "var(--d-surf-3)", border: "1px solid var(--d-blue)",
            }}>
              <input readOnly value="< 200 ms für 95% der Requests" style={{
                flex: 1, background: "transparent", border: "none",
                padding: "12px 16px",
                fontFamily: "Geist, sans-serif", fontSize: 15, color: "var(--d-ink)", outline: "none",
              }}/>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              {["< 100ms", "< 200ms", "< 500ms"].map((s, i) => (
                <button key={i} style={{
                  height: 28, padding: "0 12px", borderRadius: 8,
                  border: "1px solid var(--d-hair-2)",
                  background: i === 1 ? "var(--d-blue-soft)" : "transparent",
                  color: i === 1 ? "var(--d-blue)" : "var(--d-ink-3)",
                  fontSize: 12, fontFamily: "Geist Mono, monospace", cursor: "pointer",
                }}>{s}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "22px 56px 32px" }}>
        <button className="dlg2-btn-secondary">Lücke für später markieren</button>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="dlg2-btn-secondary">Überspringen</button>
          <button className="dlg2-btn-commit">Wert speichern →</button>
        </div>
      </div>
    </div>
  );
}

window.CogniDialogDrill = { SceneFaktKonflikt, SceneFaktGap };
