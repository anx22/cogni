/* global React */
// COGNI — Projekt-Karte (drei Varianten)
//   Variante A · "Liste" — schmale Zeile für die Sidebar (Linear-style)
//   Variante B · "Karte" — sekundäres Tile, mittlere Größe
//   Variante C · "Hero"  — große Karte für Übersichts-Grid
//
// Alle zeigen denselben Signal-Indikator: bis zu zwei Punkte (calm/review/action/conflict),
// der dominante Signal pulsiert wenn live=true.

const { Ic, SignalStack, Monogram } = window.CogniCommon;

/* --------- A · Sidebar-Listenzeile ----------- */
function ProjectRow({ project, active = false, hover = false }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        height: 32,
        padding: "0 10px",
        borderRadius: 8,
        background: active ? "var(--surface-3)" : hover ? "var(--surface-2)" : "transparent",
        cursor: "pointer",
      }}
    >
      <span
        className="mono"
        style={{ fontSize: 10.5, color: "var(--ink-3)", width: 28, letterSpacing: "-.02em" }}
      >
        {project.initial}
      </span>
      <span
        style={{
          flex: 1,
          fontSize: 13.5,
          color: active ? "var(--ink)" : "var(--ink-2)",
          fontWeight: active ? 500 : 400,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {project.name}
      </span>
      {project.openCount > 0 && (
        <span className="mono tabular" style={{ fontSize: 11, color: "var(--ink-3)" }}>
          {project.openCount}
        </span>
      )}
      <SignalStack signals={project.signals} live={project.live} size="sm" />
    </div>
  );
}

/* --------- B · Karte (mittel) ----------- */
function ProjectCard({ project, dense = false }) {
  const dominant = project.signals?.[0] || "calm";
  return (
    <div
      className="card"
      style={{
        padding: 18,
        width: 320,
        display: "flex",
        flexDirection: "column",
        gap: dense ? 12 : 16,
        cursor: "pointer",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
        <Monogram initial={project.initial} size={48} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 16,
              fontWeight: 500,
              letterSpacing: "-.015em",
              color: "var(--ink)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {project.name}
          </div>
          <div className="mono" style={{ marginTop: 4, fontSize: 11, color: "var(--ink-3)" }}>
            {project.last}
          </div>
        </div>
        <SignalStack signals={project.signals} live={project.live} />
      </div>

      {!dense && (
        <>
          <div className="hairline" />
          <div style={{ display: "flex", gap: 16, color: "var(--ink-3)", fontSize: 11.5 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
              <span
                style={{ width: 5, height: 5, borderRadius: 999, background: "var(--ink-3)" }}
              />
              {project.openCount || 0} offen
            </span>
            <span
              style={{
                marginLeft: "auto",
                color: dominant === "conflict" ? "var(--sig-conflict)" : "var(--ink-3)",
              }}
            >
              {dominant === "conflict"
                ? "Review fällig"
                : dominant === "review"
                  ? "Review fällig"
                  : dominant === "action"
                    ? "In Bearbeitung"
                    : "Ruhig"}
            </span>
          </div>
        </>
      )}
    </div>
  );
}

/* --------- C · Hero-Karte (large, mit Lagezeile) ----------- */
function ProjectHero({ project, lageLine, dense = false }) {
  const dominant = project.signals?.[0] || "calm";
  const stateLabel =
    dominant === "conflict"
      ? "Konflikt offen"
      : dominant === "review"
        ? "Review fällig"
        : dominant === "action"
          ? "Aktiv"
          : "Ruhig";

  return (
    <div
      className="card"
      style={{
        padding: 22,
        width: 460,
        cursor: "pointer",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
        <Monogram initial={project.initial} signals={project.signals} size={56} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: "var(--ink-3)",
              fontSize: 11.5,
              letterSpacing: "0.02em",
              textTransform: "uppercase",
            }}
          >
            <span
              className={`dot dot--${dominant}${project.live ? " dot--live" : ""}`}
              style={{ position: "relative" }}
            />
            <span style={{ color: `var(--sig-${dominant})`, fontWeight: 500 }}>{stateLabel}</span>
            <span style={{ color: "var(--ink-4)" }}>·</span>
            <span className="mono" style={{ textTransform: "none", letterSpacing: 0 }}>
              {project.last}
            </span>
          </div>
          <h3
            style={{
              margin: "4px 0 0 0",
              fontSize: 22,
              fontWeight: 500,
              letterSpacing: "-.018em",
              color: "var(--ink)",
            }}
          >
            {project.name}
          </h3>
        </div>
        <button
          style={{
            background: "transparent",
            border: "1px solid var(--hair-2)",
            borderRadius: 8,
            width: 30,
            height: 30,
            color: "var(--ink-3)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ic.arrowR />
        </button>
      </div>

      {lageLine && !dense && (
        <>
          <div className="hairline" style={{ margin: "16px 0" }} />
          <p
            style={{
              margin: 0,
              color: "var(--ink-2)",
              fontSize: 13.5,
              lineHeight: 1.55,
              letterSpacing: "-.005em",
            }}
          >
            {lageLine}
          </p>
        </>
      )}

      {!dense && (
        <div
          style={{
            marginTop: 16,
            display: "flex",
            gap: 6,
            flexWrap: "wrap",
          }}
        >
          {project.openCount > 0 && (
            <span className="chip">
              <span style={{ color: "var(--ink-3)" }}>offen</span>
              <span className="mono tabular" style={{ marginLeft: 2 }}>
                {project.openCount}
              </span>
            </span>
          )}
          {project.signals?.includes("conflict") && (
            <span className="chip chip--conflict">Konflikt</span>
          )}
          {project.signals?.includes("review") && (
            <span className="chip chip--review">Review fällig</span>
          )}
        </div>
      )}
    </div>
  );
}

window.CogniCards = { ProjectRow, ProjectCard, ProjectHero };
