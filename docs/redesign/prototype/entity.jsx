/* global React */
// COGNI — Entität (Orb)
// Geschichtete Aurora aus radialen + konischen Gradients,
// dezent atmend, dreht sich langsam. Unterstützt beide Themes.
// Wird auf dem Home-Screen als zentrales Element verwendet.

const ENTITY_CSS = `
@keyframes cogni-orb-breathe {
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(1.04); }
}
@keyframes cogni-orb-rotate-slow {
  from { transform: rotate(0deg); } to { transform: rotate(360deg); }
}
@keyframes cogni-orb-rotate-rev {
  from { transform: rotate(0deg); } to { transform: rotate(-360deg); }
}
@keyframes cogni-orb-halo {
  0%, 100% { transform: scale(1); opacity: .85; }
  50%      { transform: scale(1.06); opacity: 1; }
}

.entity {
  position: relative;
  display: inline-grid;
  place-items: center;
  filter: saturate(1.05);
}
.entity__halo {
  position: absolute; inset: -22%;
  border-radius: 50%;
  background:
    radial-gradient(closest-side, var(--entity-aurora-c) 0%, transparent 70%);
  filter: blur(40px);
  opacity: .55;
  animation: cogni-orb-halo 7s ease-in-out infinite;
  pointer-events: none;
}
.entity__orb {
  position: relative;
  width: var(--orb-size, 360px);
  height: var(--orb-size, 360px);
  border-radius: 50%;
  overflow: hidden;
  background: radial-gradient(circle at 35% 30%,
    var(--entity-aurora-d) 0%,
    var(--entity-aurora-a) 18%,
    var(--entity-aurora-b) 48%,
    var(--entity-aurora-c) 82%);
  box-shadow:
    inset 0 -2px 30px rgba(0,0,0,.22),
    inset 0 4px 24px rgba(255,255,255,.18),
    0 30px 80px -20px rgba(0,0,0,.35),
    0 0 0 1px var(--entity-rim);
  animation: cogni-orb-breathe 6s ease-in-out infinite;
}
.entity__layer {
  position: absolute; inset: -10%;
  pointer-events: none;
}
.entity__layer--a {
  background: conic-gradient(from 90deg,
    transparent 0deg,
    var(--entity-aurora-b) 60deg,
    transparent 140deg,
    var(--entity-aurora-c) 220deg,
    transparent 320deg);
  mix-blend-mode: screen;
  filter: blur(30px);
  opacity: .85;
  animation: cogni-orb-rotate-slow 28s linear infinite;
}
.entity__layer--b {
  background: conic-gradient(from 0deg,
    var(--entity-aurora-a) 0deg,
    transparent 80deg,
    var(--entity-aurora-d) 180deg,
    transparent 280deg,
    var(--entity-aurora-a) 360deg);
  mix-blend-mode: screen;
  filter: blur(36px);
  opacity: .6;
  animation: cogni-orb-rotate-rev 40s linear infinite;
}
.entity__hotspot {
  position: absolute;
  left: 28%; top: 22%;
  width: 30%; height: 25%;
  background: radial-gradient(closest-side, rgba(255,255,255,.9), transparent 70%);
  filter: blur(8px);
  pointer-events: none;
}
.entity__rim {
  position: absolute; inset: 0;
  border-radius: 50%;
  box-shadow: inset 0 0 0 1px rgba(255,255,255,.12);
  pointer-events: none;
}

/* Asset-Orbit — kleine umlaufende Partikel */
.entity-orbit {
  position: absolute; inset: -14%;
  pointer-events: none;
  animation: cogni-orb-rotate-slow 80s linear infinite;
}
.entity-orbit__dot {
  position: absolute; top: 50%; left: 50%;
  width: 6px; height: 6px; border-radius: 999px;
  background: var(--ink-3); opacity: .35;
}
.entity-orbit__doc {
  position: absolute;
  top: 50%; left: 50%;
  padding: 4px 8px; border-radius: 6px;
  background: var(--surface-1);
  border: 1px solid var(--hair);
  font-family: "Geist Mono", monospace;
  font-size: 10px; color: var(--ink-3);
  white-space: nowrap;
  box-shadow: var(--shadow-card);
  transform-origin: 0 0;
}
`;

if (typeof document !== "undefined" && !document.getElementById("cogni-entity-css")) {
  const s = document.createElement("style");
  s.id = "cogni-entity-css";
  s.textContent = ENTITY_CSS;
  document.head.appendChild(s);
}

function Entity({ size = 360 }) {
  return (
    <div className="entity" style={{ "--orb-size": `${size}px` }}>
      <div className="entity__halo" />
      <div className="entity__orb">
        <div className="entity__layer entity__layer--a" />
        <div className="entity__layer entity__layer--b" />
        <div className="entity__hotspot" />
        <div className="entity__rim" />
      </div>
    </div>
  );
}

/** AssetOrbit — schwebende Hinweise um den Kern.
 *  Items haben Typ + Status + Alter. Distanz = Alter (neuer = näher).
 *  Statuspunkt rechts: parsing / understanding / review-ready / failed.
 *  Click → öffnet Review für das Asset (in echt; hier nur Layout).
 */
function AssetOrbit({ items = [], radius = 230, arc = Math.PI * 1.25 }) {
  // Items werden im oberen Bogen verteilt (kein Item unten beim Input-Bereich).
  const n = items.length;
  const startAngle = -Math.PI / 2 - arc / 2;
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {items.map((it, i) => {
        const angle = n === 1 ? -Math.PI / 2 : startAngle + (i / (n - 1)) * arc;
        // Alter shiftet die Distanz: neu = -20px, alt = +40px
        const ageOffset = (it.ageRing ?? 0) * 60 - 10;
        const r = radius + ageOffset;
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;
        const opacity = 1 - (it.ageRing ?? 0) * 0.45;

        const StatusDot = () => {
          if (it.status === "review-ready")
            return (
              <span
                className="dot dot--review dot--live"
                style={{ width: 6, height: 6, position: "relative", flex: "0 0 auto" }}
              />
            );
          if (it.status === "failed")
            return (
              <span
                className="dot dot--conflict"
                style={{ width: 6, height: 6, flex: "0 0 auto" }}
              />
            );
          if (it.status === "understanding")
            return (
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 999,
                  flex: "0 0 auto",
                  border: "1.5px solid var(--sig-action)",
                  borderTopColor: "transparent",
                  animation: "cogni-orb-rotate-slow 1.2s linear infinite",
                  display: "inline-block",
                }}
              />
            );
          // parsing: animated dashed ring (we just show a calm dot here)
          return (
            <span className="dot dot--calm" style={{ width: 6, height: 6, flex: "0 0 auto" }} />
          );
        };

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              top: `calc(50% + ${y}px)`,
              left: `calc(50% + ${x}px)`,
              transform: "translate(-50%,-50%)",
              padding: "6px 10px 6px 8px",
              borderRadius: 999,
              background: "var(--surface-1)",
              border:
                it.status === "parsing" ? "1px dashed var(--hair-3)" : "1px solid var(--hair-2)",
              boxShadow:
                it.status === "review-ready"
                  ? "0 0 0 3px var(--sig-review-soft), var(--shadow-card)"
                  : "var(--shadow-card)",
              fontFamily: "Geist Mono, monospace",
              fontSize: 10.5,
              color: "var(--ink-2)",
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              gap: 7,
              opacity,
            }}
          >
            <span
              style={{
                width: 14,
                height: 14,
                borderRadius: 4,
                background: "var(--surface-2)",
                color: "var(--ink-3)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 9,
                letterSpacing: "0.02em",
                textTransform: "uppercase",
                flex: "0 0 auto",
              }}
            >
              {it.type ?? "·"}
            </span>
            <span style={{ color: "var(--ink)" }}>{it.label}</span>
            {it.age && <span style={{ color: "var(--ink-4)" }}>· {it.age}</span>}
            <StatusDot />
          </div>
        );
      })}
    </div>
  );
}

window.CogniEntity = { Entity, AssetOrbit };
