/* global React */
// COGNI — Home Screen
// Entität zentral, Projektliste sekundär links, Letzter Impact rechts.
// Layout 1440 × 900. Theme wird über das umschließende [data-theme] gesetzt.

const { Ic, SignalStack } = window.CogniCommon;
const { Entity, AssetOrbit } = window.CogniEntity;
const { ProjectRow } = window.CogniCards;

function ProjectsRail({ projects, activeId }) {
  return (
    <aside
      style={{
        width: 240,
        padding: "32px 16px",
        borderRight: "1px solid var(--hair)",
        flex: "0 0 auto",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 8px 12px",
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
        {projects.map((p, i) => (
          <ProjectRow key={p.id} project={p} active={p.id === activeId} hover={i === 1} />
        ))}
      </div>

      <button
        className="btn btn--ghost"
        style={{
          marginTop: 8,
          justifyContent: "flex-start",
          padding: "0 10px",
          color: "var(--ink-3)",
          height: 32,
          fontSize: 13,
        }}
      >
        <Ic.plus /> Neues Projekt
      </button>
    </aside>
  );
}

function PipelineWidget() {
  // Stages: intake → verstehen → review → konflikt
  // "verstehen" ist aktiv, "review" ist die wartende Eskalation
  const stages = [
    { key: "intake", label: "Intake", count: 0, state: "idle" },
    { key: "verstehe", label: "Verstehen", count: 1, state: "active" },
    {
      key: "review",
      label: "Review fällig",
      count: 3,
      state: "waiting",
      color: "var(--sig-review)",
    },
    {
      key: "konflikt",
      label: "Konflikt",
      count: 2,
      state: "waiting",
      color: "var(--sig-conflict)",
    },
  ];

  return (
    <div>
      {/* Live activity */}
      <div className="t-micro" style={{ color: "var(--ink-3)", marginBottom: 10 }}>
        Jetzt
      </div>
      <div
        style={{
          display: "flex",
          gap: 11,
          alignItems: "flex-start",
          padding: "10px 12px",
          borderRadius: 10,
          background: "var(--surface-2)",
          border: "1px solid var(--hair)",
          marginBottom: 18,
        }}
      >
        <span
          style={{
            width: 16,
            height: 16,
            borderRadius: 999,
            marginTop: 2,
            border: "1.6px solid var(--sig-action)",
            borderTopColor: "transparent",
            animation: "cogni-orb-rotate-slow 1.2s linear infinite",
            flex: "0 0 auto",
          }}
        />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontSize: 12,
              color: "var(--ink-3)",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            verstehe
            <span className="mono" style={{ color: "var(--ink-4)" }}>
              · 0:08
            </span>
          </div>
          <div
            style={{
              fontSize: 13,
              color: "var(--ink)",
              letterSpacing: "-.005em",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              marginTop: 2,
            }}
          >
            Steering-Protokoll v3
          </div>
          <div className="mono" style={{ fontSize: 10.5, color: "var(--ink-4)", marginTop: 2 }}>
            → Hafen Nord
          </div>
        </div>
      </div>

      {/* Stages */}
      <div className="t-micro" style={{ color: "var(--ink-3)", marginBottom: 10 }}>
        Pipeline
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {stages.map((s, i) => {
          const accent = s.color || (s.state === "active" ? "var(--sig-action)" : "var(--ink-3)");
          return (
            <div
              key={s.key}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "7px 0",
                borderBottom: i < stages.length - 1 ? "1px solid var(--hair)" : "none",
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 999,
                  flex: "0 0 auto",
                  background: s.count > 0 ? accent : "transparent",
                  border: s.count > 0 ? "none" : "1.5px solid var(--ink-4)",
                  boxShadow: s.state === "active" ? "0 0 0 4px var(--sig-action-soft)" : "none",
                  position: "relative",
                }}
              >
                {s.state === "active" && (
                  <span
                    style={{
                      position: "absolute",
                      inset: -3,
                      borderRadius: 999,
                      background: accent,
                      opacity: 0.3,
                      animation: "cogni-pulse 1.6s ease-out infinite",
                    }}
                  />
                )}
              </span>
              <span
                style={{
                  flex: 1,
                  fontSize: 12.5,
                  color: s.count > 0 ? "var(--ink)" : "var(--ink-3)",
                  fontWeight: s.state === "active" ? 500 : 400,
                }}
              >
                {s.label}
              </span>
              <span
                className="mono tabular"
                style={{
                  fontSize: 12,
                  color: s.count > 0 ? accent : "var(--ink-4)",
                  fontWeight: s.count > 0 ? 500 : 400,
                }}
              >
                {s.count}
              </span>
            </div>
          );
        })}
      </div>

      {/* Today summary */}
      <div
        className="mono"
        style={{
          marginTop: 14,
          fontSize: 10.5,
          color: "var(--ink-4)",
          letterSpacing: ".02em",
        }}
      >
        heute · 12 eingegangen · 9 committed
      </div>
    </div>
  );
}

function ImpactPanel({ impacts }) {
  return (
    <aside
      style={{
        width: 290,
        padding: "32px 28px",
        borderLeft: "1px solid var(--hair)",
        flex: "0 0 auto",
        display: "flex",
        flexDirection: "column",
        gap: 22,
      }}
    >
      <div>
        <div className="t-micro" style={{ color: "var(--ink-3)", marginBottom: 12 }}>
          Letzter Impact
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {impacts.map((it, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div className="mono" style={{ fontSize: 11, color: "var(--ink-4)" }}>
                {it.when}
              </div>
              <div
                style={{
                  fontSize: 14,
                  lineHeight: 1.4,
                  color: "var(--ink)",
                  letterSpacing: "-.01em",
                }}
              >
                {it.what}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 11.5,
                  color: "var(--ink-3)",
                }}
              >
                <Ic.arrowR /> {it.project}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="hairline" />

      <PipelineWidget />
    </aside>
  );
}

function FloatingAction({ icon, label, onClick, highlight = false }) {
  const [hover, setHover] = React.useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
        background: "transparent",
        border: "none",
        padding: 0,
        cursor: "pointer",
        transition: "transform .18s cubic-bezier(.2,.7,.3,1)",
        transform: hover ? "translateY(-3px)" : "translateY(0)",
      }}
    >
      <span
        style={{
          width: 76,
          height: 76,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--surface-1)",
          border: "1px solid var(--hair)",
          color: highlight ? "var(--accent)" : "var(--ink)",
          boxShadow: hover
            ? "0 0 0 4px var(--accent-soft), 0 18px 40px -16px rgba(10,11,13,.35), inset 0 1px 0 rgba(255,255,255,.04)"
            : "var(--shadow-card), inset 0 1px 0 rgba(255,255,255,.04)",
          transition: "box-shadow .2s, border-color .2s",
          borderRadius: "50px",
        }}
      >
        <span style={{ transform: "scale(1.6)", display: "inline-flex" }}>{icon}</span>
      </span>
      <span
        style={{ fontSize: 12, color: hover ? "var(--ink-2)" : "var(--ink-3)", fontWeight: 500 }}
      >
        {label}
      </span>
    </button>
  );
}

function IdlePrompt() {
  return (
    <>
      <div style={{ textAlign: "center", maxWidth: 720 }}>
        <h1
          style={{
            margin: 0,
            fontSize: 48,
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
            fontSize: 15,
            color: "var(--ink-3)",
            fontWeight: 400,
            letterSpacing: "-.005em",
          }}
        >
          Gebe mir Daten, tippe oder sprich. Ich ordne es ein.
        </p>
      </div>

      <div style={{ display: "flex", gap: 28, marginTop: 36 }}>
        <FloatingAction icon={<Ic.upload />} label="Datei" />
        <FloatingAction icon={<Ic.paste />} label="Einfügen" highlight />
        <FloatingAction icon={<Ic.link />} label="Link" />
        <FloatingAction icon={<Ic.mic />} label="Sprache" />
      </div>
    </>
  );
}

function ActiveInputPaste() {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: 580,
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <div
          className="mono"
          style={{
            fontSize: 11,
            color: "var(--ink-3)",
            letterSpacing: ".04em",
            textTransform: "uppercase",
          }}
        >
          Aus der Zwischenablage
        </div>
        <button
          className="btn btn--ghost"
          style={{ height: 24, padding: "0 8px", fontSize: 11, color: "var(--ink-4)" }}
        >
          verwerfen
        </button>
      </div>

      <div
        style={{
          padding: "22px 24px",
          borderRadius: 16,
          background: "var(--surface-1)",
          border: "1px solid var(--hair-2)",
          boxShadow: "var(--shadow-pop)",
          fontSize: 15,
          lineHeight: 1.55,
          color: "var(--ink)",
          letterSpacing: "-.005em",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 18,
            transform: "translateY(-50%)",
            padding: "3px 9px",
            borderRadius: 999,
            background: "var(--surface-1)",
            border: "1px solid var(--hair-2)",
            fontFamily: "Geist Mono, monospace",
            fontSize: 10,
            color: "var(--ink-3)",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: 999,
              border: "1.5px solid var(--sig-action)",
              borderTopColor: "transparent",
              animation: "cogni-orb-rotate-slow 1.2s linear infinite",
            }}
          />
          cogni liest…
        </div>
        <p style={{ margin: 0 }}>Hi Thomas,</p>
        <p style={{ margin: "8px 0" }}>
          kurze Info aus dem Steering heute: wir verschieben den Go-Live auf den
          <mark
            style={{
              background: "var(--sig-action-soft)",
              color: "var(--accent-ink)",
              padding: "0 4px",
              borderRadius: 4,
            }}
          >
            {" "}
            1. Juni 2026
          </mark>
          . Das deckt sich nicht mit der Mail von dir vom 9.04. — bitte mit
          <mark
            style={{
              background: "var(--sig-action-soft)",
              color: "var(--accent-ink)",
              padding: "0 4px",
              borderRadius: 4,
            }}
          >
            {" "}
            Maria Schulz
          </mark>{" "}
          abstimmen, sie übernimmt jetzt die Projektsteuerung.
        </p>
        <p style={{ margin: "8px 0 0", color: "var(--ink-2)" }}>
          Beste Grüße
          <br />
          Jens
        </p>
      </div>

      <div
        style={{
          marginTop: 14,
          padding: "12px 14px",
          borderRadius: 12,
          background: "var(--surface-2)",
          border: "1px solid var(--hair)",
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
          fontSize: 12.5,
        }}
      >
        <span className="t-micro" style={{ color: "var(--ink-3)" }}>
          erkannt
        </span>
        <span
          style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--ink-2)" }}
        >
          <span
            style={{ width: 6, height: 6, borderRadius: 999, background: "var(--sig-action)" }}
          />
          Termin · 1. Juni
        </span>
        <span
          style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--ink-2)" }}
        >
          <span
            style={{ width: 6, height: 6, borderRadius: 999, background: "var(--sig-conflict)" }}
          />
          Konflikt zu Mail · 09.04
        </span>
        <span
          style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--ink-2)" }}
        >
          <span
            style={{ width: 6, height: 6, borderRadius: 999, background: "var(--sig-action)" }}
          />
          Stakeholder · Maria Schulz
        </span>
        <span
          style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--ink-2)" }}
        >
          <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--ink-3)" }} />
          Projektvorschlag · Hafen Nord
        </span>
      </div>

      <div
        style={{
          marginTop: 18,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ fontSize: 12, color: "var(--ink-4)" }}>
          <span className="kbd">↵</span> öffnet Review
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn--ghost">Erst speichern</button>
          <button className="btn btn--primary">
            Review öffnen <Ic.arrowR />
          </button>
        </div>
      </div>
    </div>
  );
}

function HomeScreen({ density = "full", state = "idle" }) {
  const { projects } = window.COGNI_DATA;
  const lean = density === "lean";

  // Asset-Orbit — Material im Schwebezustand vor Commit.
  // ageRing: 0 = neu (nah am Kern), 1 = alt (weiter weg, dimmer)
  const orbitItems = lean
    ? [
        {
          type: "PDF",
          label: "Steering-Protokoll v3",
          age: "vor 1 min",
          status: "review-ready",
          ageRing: 0,
        },
        {
          type: "MAIL",
          label: "Berger · Go-Live",
          age: "vor 4 min",
          status: "understanding",
          ageRing: 0.2,
        },
      ]
    : [
        {
          type: "PDF",
          label: "Steering-Protokoll v3",
          age: "vor 1 min",
          status: "review-ready",
          ageRing: 0,
        },
        {
          type: "MAIL",
          label: "Berger · Go-Live",
          age: "vor 4 min",
          status: "understanding",
          ageRing: 0.15,
        },
        { type: "PPTX", label: "UX-Proto v3", age: "vor 12 min", status: "parsing", ageRing: 0.35 },
        {
          type: "VOC",
          label: "Memo · 1:24",
          age: "vor 28 min",
          status: "review-ready",
          ageRing: 0.6,
        },
        { type: "DOC", label: "Org-Update", age: "vor 2 h", status: "review-ready", ageRing: 0.85 },
      ];

  const impacts = lean
    ? [
        {
          when: "vor 2 h",
          what: "Neuer Go-Live-Termin erkannt — Konflikt mit Steering-Protokoll",
          project: "Hafen Nord Erweiterung",
        },
        {
          when: "vor 25 min",
          what: "Maria Schulz als Stakeholder hinzugefügt",
          project: "Hafen Nord Erweiterung",
        },
      ]
    : [
        {
          when: "vor 2 h",
          what: "Neuer Go-Live-Termin erkannt — Konflikt mit Steering-Protokoll",
          project: "Hafen Nord Erweiterung",
        },
        {
          when: "vor 25 min",
          what: "Maria Schulz als Stakeholder hinzugefügt",
          project: "Hafen Nord Erweiterung",
        },
        { when: "vor 4 h", what: "UX-Prototyp v2 ersetzt v1", project: "Aurora Rebrand" },
        {
          when: "vor 8 h",
          what: "Migrationsstrategie-Konflikt erkannt",
          project: "Hafen Nord Erweiterung",
        },
      ];

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "var(--surface-0)",
        color: "var(--ink)",
      }}
    >
      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        <ProjectsRail projects={lean ? projects.slice(0, 4) : projects} activeId={null} />

        <main
          style={{
            flex: 1,
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px 40px 56px",
            overflow: "hidden",
          }}
        >
          <div style={{ position: "relative", marginBottom: 36 }}>
            <Entity size={state === "pasted" ? 280 : 340} />
            <AssetOrbit items={orbitItems} radius={state === "pasted" ? 220 : 250} />
          </div>

          {state === "idle" ? <IdlePrompt /> : <ActiveInputPaste />}
        </main>

        <ImpactPanel impacts={impacts} />
      </div>
    </div>
  );
}

window.CogniHome = { HomeScreen };
