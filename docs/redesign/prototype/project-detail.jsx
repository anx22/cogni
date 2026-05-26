/* global React */
// COGNI — Projekt-Detail Screen
// Vier Rollen mit harter typografischer Hierarchie:
//   LAGE          → größte Skala, full-width "Lagetext", oben
//   HANDLUNGSBEDARF → operatives Zentrum, breite Hauptspalte
//   VERLAUF       → schmaler chronologischer Feed, rechts neben Handlungsbedarf
//   SUBSTANZ      → kleinste Skala, unten als ruhige Themen/Dokumente-Zone

const { Ic, ModeMark, DeltaTag, SignalStack, Monogram, MODE_META } = window.CogniCommon;
const { ProjectRow } = window.CogniCards;
const { Entity, AssetOrbit } = window.CogniEntity;

/* ============================================================
   Aurora-Atmosphäre — feiner Lichtstreifen am oberen Bildschirmrand.
   Zeigt: "Die Entität ist da, auch wenn du im Projekt bist."
   Pulsiert dezent; wird heller wenn neues Material reinkommt.
   ============================================================ */
const ATMOSPHERE_CSS = `
@keyframes cogni-atmosphere-pulse {
  0%, 100% { opacity: .55; }
  50%      { opacity: .9; }
}
.cogni-atmosphere {
  position: absolute; top: 0; left: 0; right: 0; height: 3px;
  background: linear-gradient(90deg,
    transparent 0%,
    var(--entity-aurora-c) 20%,
    var(--entity-aurora-b) 50%,
    var(--entity-aurora-a) 80%,
    transparent 100%);
  pointer-events: none; z-index: 10;
  animation: cogni-atmosphere-pulse 6s ease-in-out infinite;
}
.cogni-atmosphere::after {
  content: ""; position: absolute;
  top: 0; left: 0; right: 0; height: 60px;
  background: linear-gradient(180deg,
    color-mix(in oklab, var(--entity-aurora-b) 18%, transparent),
    transparent);
  filter: blur(16px);
  pointer-events: none;
}
.cogni-atmosphere.is-active {
  animation: cogni-atmosphere-pulse 1.4s ease-in-out infinite;
}
.cogni-atmosphere.is-active::after {
  background: linear-gradient(180deg,
    color-mix(in oklab, var(--sig-review) 35%, transparent),
    transparent);
}
`;
if (typeof document !== "undefined" && !document.getElementById("cogni-atmosphere-css")) {
  const s = document.createElement("style");
  s.id = "cogni-atmosphere-css";
  s.textContent = ATMOSPHERE_CSS;
  document.head.appendChild(s);
}

/* ============================================================
   Sidebar — Linear-style projects, mit Mini-Entität ganz oben.
   Die Mini-Entität ist:  Identitäts-Anker · Drop-Zone · Klick-zurück
   ============================================================ */
function DetailSidebar({ activeId, projects, onCoreClick }) {
  const [hover, setHover] = React.useState(false);
  return (
    <aside
      style={{
        width: 240,
        padding: "20px 16px",
        borderRight: "1px solid var(--hair)",
        flex: "0 0 auto",
        background: "var(--surface-0)",
        display: "flex",
        flexDirection: "column",
        gap: 22,
      }}
    >
      {/* Mini-Entität — der Anker, der nie verschwindet */}
      <button
        onClick={onCoreClick}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        title="Zurück zur Entität · oder ablegen"
        style={{
          background: "transparent",
          border: "none",
          padding: "8px 8px 0",
          display: "flex",
          alignItems: "center",
          gap: 12,
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <div
          style={{
            position: "relative",
            transform: hover ? "scale(1.06)" : "scale(1)",
            transition: "transform .2s cubic-bezier(.2,.7,.3,1)",
            flex: "0 0 auto",
          }}
        >
          <Entity size={56} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div
            className="mono"
            style={{
              fontSize: 11.5,
              color: "var(--ink-2)",
              letterSpacing: "-.01em",
              fontWeight: 600,
            }}
          >
            cogni
          </div>
          <div
            className="mono"
            style={{
              fontSize: 10,
              color: hover ? "var(--accent)" : "var(--ink-4)",
              letterSpacing: ".04em",
              textTransform: "uppercase",
              marginTop: 2,
              transition: "color .15s",
            }}
          >
            {hover ? "öffnen ⌘ ␣" : "verstehe · 0:08"}
          </div>
        </div>
      </button>

      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 8px 8px",
          }}
        >
          <span className="t-micro" style={{ color: "var(--ink-3)" }}>
            Projekte
          </span>
          <span className="mono tabular" style={{ fontSize: 11, color: "var(--ink-4)" }}>
            {projects.length}
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {projects.map((p) => (
            <ProjectRow key={p.id} project={p} active={p.id === activeId} />
          ))}
        </div>
      </div>
    </aside>
  );
}

/* ============================================================
   LAGE — Hero, größte Typografie
   ============================================================ */
function LageHero({ project }) {
  const { lage } = project;
  return (
    <section
      style={{
        padding: "44px 56px 36px",
        borderBottom: "1px solid var(--hair)",
      }}
    >
      {/* breadcrumb + meta */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontSize: 12.5,
            color: "var(--ink-3)",
          }}
        >
          <Monogram initial={"HN"} size={28} />
          <span className="mono">{project.customer}</span>
          <span style={{ color: "var(--ink-4)" }}>·</span>
          <span>{project.phase}</span>
          <span style={{ color: "var(--ink-4)" }}>·</span>
          <span>{project.stakeholderCount} Stakeholder</span>
          <span style={{ color: "var(--ink-4)" }}>·</span>
          <span className="mono tabular">{project.budget}</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn--ghost">
            <Ic.upload /> Material
          </button>
          <button className="btn btn--primary">
            <Ic.spark /> Review öffnen
            <span style={{ marginLeft: 4 }}>
              <Ic.arrowR />
            </span>
          </button>
        </div>
      </div>

      {/* Lage-Etikett */}
      <div className="t-micro" style={{ color: "var(--ink-3)", marginBottom: 14 }}>
        Lage{" "}
        <span
          style={{ color: "var(--ink-4)", textTransform: "none", letterSpacing: 0, marginLeft: 6 }}
        >
          · rekonstruiert vor 2 Min
        </span>
      </div>

      {/* Projektname + Lagetext */}
      <h1
        style={{
          margin: 0,
          fontSize: 44,
          lineHeight: 1.04,
          letterSpacing: "-.03em",
          fontWeight: 500,
          color: "var(--ink)",
          maxWidth: 940,
        }}
      >
        {project.name}
      </h1>

      <p
        style={{
          margin: "20px 0 0",
          maxWidth: 880,
          fontSize: 24,
          lineHeight: 1.35,
          letterSpacing: "-.018em",
          fontWeight: 300,
          color: "var(--ink)",
        }}
      >
        {project.lage.kernsatz}
      </p>

      {/* Chips + key facts */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexWrap: "wrap",
          marginTop: 26,
        }}
      >
        {project.lage.chips.map((c, i) => (
          <span key={i} className={`chip chip--${c.kind}`}>
            {c.label}
          </span>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", gap: 28, fontSize: 12.5, color: "var(--ink-3)" }}>
          <div>
            <div className="t-micro" style={{ marginBottom: 4 }}>
              Nächster Termin
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, color: "var(--ink)" }}>
              <span
                className="mono tabular"
                style={{ fontSize: 18, fontWeight: 500, letterSpacing: "-.02em" }}
              >
                {project.lage.naechsterTermin.date}
              </span>
              <span style={{ color: "var(--ink-3)", fontSize: 13 }}>
                {project.lage.naechsterTermin.topic}
              </span>
            </div>
          </div>
          <div>
            <div className="t-micro" style={{ marginBottom: 4 }}>
              Letzte Änderung
            </div>
            <div style={{ color: "var(--ink)", fontSize: 13.5 }}>
              {project.lage.letzteAenderung.what}
            </div>
            <div className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>
              {project.lage.letzteAenderung.rel}
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: 22,
          padding: "10px 14px",
          borderRadius: 10,
          background: "var(--surface-2)",
          border: "1px solid var(--hair)",
          display: "flex",
          alignItems: "center",
          gap: 10,
          fontSize: 13,
          color: "var(--ink-2)",
        }}
      >
        <Ic.flag />{" "}
        <span className="t-micro" style={{ color: "var(--ink-3)" }}>
          Outcome
        </span>
        <span style={{ color: "var(--ink)" }}>{project.lage.outcome}</span>
      </div>
    </section>
  );
}

/* ============================================================
   HANDLUNGSBEDARF — operatives Zentrum
   ============================================================ */
function HandlungsbedarfList({ items, dense = false }) {
  // Gruppieren nach Arbeitsmodus
  const grouped = {};
  for (const it of items) (grouped[it.mode] ||= []).push(it);
  const order = ["entscheiden", "klaeren", "umsetzen", "pruefen"];

  return (
    <section style={{ padding: "32px 56px 0", flex: 1 }}>
      <header
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 14,
          marginBottom: 22,
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: 28,
            fontWeight: 500,
            letterSpacing: "-.02em",
            color: "var(--ink)",
          }}
        >
          Handlungsbedarf
        </h2>
        <span className="mono tabular" style={{ fontSize: 14, color: "var(--ink-3)" }}>
          {items.length}
        </span>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", gap: 4, fontSize: 12, color: "var(--ink-3)" }}>
          <button
            className="btn btn--ghost"
            style={{ height: 28, padding: "0 10px", fontSize: 12 }}
          >
            Alle
          </button>
          <button
            className="btn btn--ghost"
            style={{ height: 28, padding: "0 10px", fontSize: 12 }}
          >
            Nur Blocker
          </button>
          <button
            className="btn btn--ghost"
            style={{ height: 28, padding: "0 10px", fontSize: 12 }}
          >
            Ohne Frist
          </button>
        </div>
      </header>

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {order.map((mode) => {
          const list = grouped[mode];
          if (!list?.length) return null;
          const meta = MODE_META[mode];
          return (
            <div key={mode}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "0 0 8px 0",
                  fontSize: 12,
                  color: "var(--ink-3)",
                }}
              >
                <ModeMark mode={mode} />
                <span className="t-micro" style={{ color: meta.color, letterSpacing: ".06em" }}>
                  {meta.label}
                </span>
                <span className="mono tabular" style={{ color: "var(--ink-4)" }}>
                  {list.length}
                </span>
                <div style={{ flex: 1, marginLeft: 10, height: 1, background: "var(--hair)" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {list.map((a, i) => (
                  <ActionRow key={a.id} a={a} dense={dense} last={i === list.length - 1} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ActionRow({ a, dense, last }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: dense ? "10px 0" : "13px 4px",
        borderBottom: last ? "none" : "1px solid var(--hair)",
        cursor: "pointer",
      }}
    >
      {a.blocker && (
        <span
          title="Blocker"
          style={{
            width: 3,
            height: 32,
            borderRadius: 2,
            background: "var(--sig-conflict)",
            flex: "0 0 auto",
            marginLeft: -8,
          }}
        />
      )}
      <span
        title={a.kind}
        style={{
          width: 26,
          height: 26,
          borderRadius: 6,
          background: "var(--surface-2)",
          color: "var(--ink-3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flex: "0 0 auto",
        }}
      >
        {a.kind === "konflikt" ? (
          <Ic.conflict />
        ) : a.kind === "gap" ? (
          <Ic.gap />
        ) : a.kind === "feedback" ? (
          <Ic.bolt />
        ) : a.kind === "dependency" ? (
          <Ic.link />
        ) : (
          <Ic.flag />
        )}
      </span>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 14.5,
            color: "var(--ink)",
            fontWeight: 450,
            letterSpacing: "-.01em",
          }}
        >
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {a.title}
          </span>
          {a.manuell && (
            <span title="manuell ergänzt" style={{ color: "var(--ink-4)", display: "inline-flex" }}>
              <Ic.manuell />
            </span>
          )}
        </div>
        {!dense && (
          <div style={{ marginTop: 2, fontSize: 12.5, color: "var(--ink-3)", lineHeight: 1.4 }}>
            {a.sub}
          </div>
        )}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          flex: "0 0 auto",
          fontSize: 12,
          color: "var(--ink-3)",
        }}
      >
        {a.owner && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                width: 18,
                height: 18,
                borderRadius: 999,
                background: "var(--surface-3)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "Geist Mono, monospace",
                fontSize: 9,
                color: "var(--ink-2)",
              }}
            >
              {a.owner
                .split(" ")
                .map((s) => s[0])
                .join("")
                .slice(0, 2)}
            </span>
            <span style={{ color: "var(--ink-2)" }}>{a.owner.split(" ")[0]}</span>
          </span>
        )}
        {a.due && (
          <span className="mono tabular" style={{ color: "var(--ink-2)" }}>
            {a.due}
          </span>
        )}
        {!dense && (
          <span className="src" title={a.source}>
            {a.source}
          </span>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   VERLAUF — schmaler Feed
   ============================================================ */
function VerlaufFeed({ items, dense = false }) {
  const limit = dense ? 5 : 8;
  const list = items.slice(0, limit);

  return (
    <section
      style={{
        width: 340,
        padding: "32px 32px 0",
        borderLeft: "1px solid var(--hair)",
        flex: "0 0 auto",
      }}
    >
      <header style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 22 }}>
        <h2
          style={{
            margin: 0,
            fontSize: 20,
            fontWeight: 500,
            letterSpacing: "-.018em",
            color: "var(--ink)",
          }}
        >
          Verlauf
        </h2>
        <span className="mono tabular" style={{ fontSize: 12, color: "var(--ink-3)" }}>
          {items.length}
        </span>
      </header>

      <div style={{ display: "flex", flexDirection: "column", gap: 16, position: "relative" }}>
        <div
          style={{
            position: "absolute",
            left: 6,
            top: 4,
            bottom: 4,
            width: 1,
            background: "var(--hair)",
          }}
        />
        {list.map((e, i) => (
          <div key={e.id ?? i} style={{ display: "flex", gap: 14, position: "relative" }}>
            <div
              style={{
                width: 13,
                height: 13,
                borderRadius: 999,
                marginTop: 4,
                background: "var(--surface-1)",
                border: `2px solid ${
                  e.delta === "widersprochen"
                    ? "var(--sig-conflict)"
                    : e.delta === "neu"
                      ? "var(--sig-action)"
                      : e.delta === "ersetzt"
                        ? "var(--sig-review)"
                        : "var(--ink-3)"
                }`,
                flex: "0 0 auto",
                zIndex: 1,
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="mono tabular" style={{ fontSize: 11, color: "var(--ink-3)" }}>
                  {e.date}
                </span>
                <DeltaTag delta={e.delta} />
              </div>
              <div style={{ marginTop: 4, fontSize: 13.5, color: "var(--ink)", lineHeight: 1.4 }}>
                {e.text}
              </div>
              {!dense && (
                <div className="src" style={{ marginTop: 3 }}>
                  {e.source}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ============================================================
   SUBSTANZ — Themen + Dokumente, ruhig
   ============================================================ */
function SubstanzZone({ themen, documents, dense = false }) {
  return (
    <section
      style={{
        marginTop: 40,
        padding: "32px 56px 48px",
        borderTop: "1px solid var(--hair)",
        background: "var(--surface-0)",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: 22,
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: 18,
            fontWeight: 500,
            letterSpacing: "-.015em",
            color: "var(--ink-2)",
          }}
        >
          Substanz
        </h2>
        <span className="t-micro" style={{ color: "var(--ink-4)" }}>
          Themen · Dokumente
        </span>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 36 }}>
        {/* Themen */}
        <div>
          <div className="t-micro" style={{ color: "var(--ink-3)", marginBottom: 12 }}>
            Themen{" "}
            <span className="mono tabular" style={{ marginLeft: 6, color: "var(--ink-4)" }}>
              {themen.length}
            </span>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: dense ? 4 : 8,
            }}
          >
            {themen.slice(0, dense ? 4 : 8).map((t, i) => (
              <ThemaRow key={t.name} t={t} />
            ))}
          </div>
        </div>

        {/* Dokumente */}
        <div>
          <div className="t-micro" style={{ color: "var(--ink-3)", marginBottom: 12 }}>
            Dokumente{" "}
            <span className="mono tabular" style={{ marginLeft: 6, color: "var(--ink-4)" }}>
              {documents.length}
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {documents.slice(0, dense ? 3 : 5).map((d, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "8px 0",
                  borderBottom: i < documents.length - 1 ? "1px solid var(--hair)" : "none",
                  fontSize: 13,
                }}
              >
                <span
                  className="mono"
                  style={{
                    fontSize: 10,
                    padding: "2px 5px",
                    borderRadius: 4,
                    background: "var(--surface-2)",
                    color: "var(--ink-3)",
                    letterSpacing: ".02em",
                    textTransform: "uppercase",
                  }}
                >
                  {d.typ}
                </span>
                <span
                  style={{
                    flex: 1,
                    color: "var(--ink)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {d.name}
                </span>
                <span className="mono tabular" style={{ color: "var(--ink-3)", fontSize: 11 }}>
                  v{d.v}
                </span>
                <span
                  className="mono tabular"
                  style={{ color: "var(--ink-4)", fontSize: 11, width: 44, textAlign: "right" }}
                >
                  {d.date}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ThemaRow({ t }) {
  const total = t.e + t.p;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 12px",
        borderRadius: 8,
        background: "transparent",
        border: "1px solid var(--hair)",
        cursor: "pointer",
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div
          style={{ fontSize: 14, color: "var(--ink)", fontWeight: 450, letterSpacing: "-.01em" }}
        >
          {t.name}
        </div>
        <div className="mono" style={{ fontSize: 10.5, color: "var(--ink-4)", marginTop: 2 }}>
          {t.e}E · {t.p}P · {t.d}D
        </div>
      </div>
      <Ic.chevR />
    </div>
  );
}

/* ============================================================
   Composer — full project detail screen
   ============================================================ */

/** UniversalOverlay — was ⌘+Space öffnet:
 *  Vollbild-Overlay über dem Projekt-Screen, in dem die Entität wieder voll
 *  präsent ist. Backdrop blurrt das darunter liegende Projekt, Material das
 *  hier reingedroppt wird, wird trotzdem im globalen Intake verarbeitet
 *  (nicht zwangsläufig ins aktuelle Projekt).
 */
function UniversalOverlay({ pasted = false }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 50,
        background: "color-mix(in oklab, var(--surface-0) 78%, transparent)",
        backdropFilter: "blur(28px) saturate(1.1)",
        WebkitBackdropFilter: "blur(28px) saturate(1.1)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 56,
      }}
    >
      {/* close affordance + esc hint */}
      <div
        style={{
          position: "absolute",
          top: 24,
          right: 32,
          display: "flex",
          alignItems: "center",
          gap: 14,
          color: "var(--ink-3)",
          fontSize: 12,
        }}
      >
        <span>schließen</span>
        <span className="kbd">esc</span>
      </div>
      <div
        style={{
          position: "absolute",
          top: 24,
          left: 32,
          display: "flex",
          alignItems: "center",
          gap: 10,
          color: "var(--ink-3)",
          fontSize: 12,
        }}
      >
        <span className="mono">über</span>
        <span style={{ color: "var(--ink-2)" }}>Hafen Nord Erweiterung</span>
      </div>

      <div style={{ position: "relative", marginBottom: pasted ? 28 : 36 }}>
        <Entity size={pasted ? 220 : 300} />
        <AssetOrbit
          items={[
            {
              type: "PDF",
              label: "Steering v3",
              age: "vor 1 min",
              status: "review-ready",
              ageRing: 0,
            },
            {
              type: "MAIL",
              label: "Berger",
              age: "vor 4 min",
              status: "understanding",
              ageRing: 0.2,
            },
            {
              type: "VOC",
              label: "Memo · 1:24",
              age: "vor 28 min",
              status: "review-ready",
              ageRing: 0.6,
            },
          ]}
          radius={pasted ? 200 : 230}
        />
      </div>

      {!pasted ? (
        <>
          <div style={{ textAlign: "center", maxWidth: 720 }}>
            <h1
              style={{
                margin: 0,
                fontSize: 44,
                lineHeight: 1.08,
                letterSpacing: "-.028em",
                fontWeight: 300,
                color: "var(--ink)",
              }}
            >
              Was gibt es neues?
            </h1>
            <p
              style={{
                margin: "10px 0 0",
                fontSize: 14.5,
                color: "var(--ink-3)",
                fontWeight: 400,
                letterSpacing: "-.005em",
              }}
            >
              Material landet im globalen Intake — nicht automatisch in diesem Projekt.
            </p>
          </div>
          <div style={{ display: "flex", gap: 24, marginTop: 32 }}>
            {[
              { icon: <Ic.upload />, label: "Datei" },
              { icon: <Ic.paste />, label: "Einfügen" },
              { icon: <Ic.link />, label: "Link" },
              { icon: <Ic.mic />, label: "Sprache" },
            ].map((b, i) => (
              <div
                key={i}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}
              >
                <span
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "var(--surface-1)",
                    border: "1px solid var(--hair)",
                    color: "var(--ink)",
                    boxShadow: "var(--shadow-card), inset 0 1px 0 rgba(255,255,255,.04)",
                  }}
                >
                  <span style={{ transform: "scale(1.6)", display: "inline-flex" }}>{b.icon}</span>
                </span>
                <span style={{ fontSize: 12, color: "var(--ink-3)", fontWeight: 500 }}>
                  {b.label}
                </span>
              </div>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

function ProjectDetail({ density = "full", overlay = false }) {
  const { active, projects } = window.COGNI_DATA;
  const dense = density === "lean";

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: "var(--surface-0)",
        color: "var(--ink)",
        position: "relative",
      }}
    >
      {/* Aurora-Atmosphäre — Entität ist da, auch wenn sie nicht zentral ist */}
      <div className={`cogni-atmosphere${overlay ? "" : " is-active"}`} />

      <DetailSidebar activeId={active.id} projects={projects} />

      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <LageHero project={active} />

        <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
          <HandlungsbedarfList items={active.actions} dense={dense} />
          <VerlaufFeed items={active.timeline} dense={dense} />
        </div>

        <SubstanzZone themen={active.themen} documents={active.documents} dense={dense} />
      </div>

      {overlay && <UniversalOverlay />}
    </div>
  );
}

window.CogniDetail = { ProjectDetail };
