/* global React, ReactDOM */
// COGNI — Root App
// Wickelt alle Screens in einen Design Canvas und liefert ein Tweaks-Panel
// für Theme (Tag/Nacht) und Datendichte (lean/full → Progressive Disclosure).

const { useEffect } = React;
const { DesignCanvas, DCSection, DCArtboard } = window;
const { TweaksPanel, useTweaks, TweakSection, TweakRadio } = window;
const { Ic, SignalStack, Monogram, ModeMark, DeltaTag } = window.CogniCommon;
const { Entity } = window.CogniEntity;
const { ProjectRow, ProjectCard, ProjectHero } = window.CogniCards;
const { HomeScreen } = window.CogniHome;
const { ProjectDetail } = window.CogniDetail;
const { SceneBatchReview, SceneBatchConfliktExpanded, SceneBatchCommit } = window.CogniDialog;
const { SceneFaktKonflikt, SceneFaktGap } = window.CogniDialogDrill;

const DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme_mode": "split",
  "density": "full",
  "global_theme": "day"
}/*EDITMODE-END*/;

/** Ein Wrapper, der einer Artboard-Region ein Theme zuweist und die Tokens cascade-en lässt */
function Themed({ theme, children, style }) {
  return (
    <div data-theme={theme} style={{ width: "100%", height: "100%", ...style }}>
      {children}
    </div>
  );
}

/* ============================================================
   Artboard 1 — Projekt-Karten · Signal-System
   ============================================================ */
function CardsBoard({ theme, density }) {
  const dense = density === "lean";
  const sample = window.COGNI_DATA.projects;

  // Variant: kurzes Sample für jedes Signal
  const variants = [
    { ...sample[3], signals: ["calm"],     name: "Lieferkette 2026", last: "vor 1 d" },
    { ...sample[2], signals: ["action"],   name: "Kanban Migration", last: "vor 8 h", openCount: 1 },
    { ...sample[0], signals: ["review"],   name: "Aurora Rebrand",   last: "vor 2 h", openCount: 3 },
    { ...sample[1], signals: ["conflict","action"], name: "Hafen Nord Erweiterung", last: "vor 25 min", openCount: 5, live: true },
  ];

  const lageLines = [
    "Stabile Lage. Keine offenen Konflikte. Letzte Änderung lag vor einem Tag.",
    "Eine Migration läuft. Wireframes sind in der Iteration — keine Blocker.",
    "Drei Punkte warten auf dich. Reviewsession ist überfällig.",
    "Zwei Konflikte blockieren die Migration. Timeline rutschte um zwei Wochen.",
  ];

  return (
    <Themed theme={theme}>
      <div style={{
        padding: "44px 48px", height: "100%",
        display: "flex", flexDirection: "column", gap: 40,
        background: "var(--surface-0)",
      }}>
        <header style={{ display: "flex", alignItems: "baseline", gap: 18 }}>
          <h2 className="t-h2" style={{ margin: 0 }}>Projekt-Karte</h2>
          <span className="t-micro" style={{ color: "var(--ink-3)" }}>
            Vier Signal-Zustände · drei Größen
          </span>
        </header>

        {/* Row 1 — Hero cards */}
        <div>
          <div className="t-micro" style={{ color: "var(--ink-3)", marginBottom: 14 }}>Hero — Übersicht</div>
          <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
            {variants.map((p, i) => (
              <ProjectHero key={i} project={p} lageLine={lageLines[i]} dense={dense} />
            ))}
          </div>
        </div>

        {/* Row 2 — medium cards */}
        <div>
          <div className="t-micro" style={{ color: "var(--ink-3)", marginBottom: 14 }}>Karte — Liste</div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {variants.map((p, i) => (
              <ProjectCard key={i} project={p} dense={dense} />
            ))}
          </div>
        </div>

        {/* Row 3 — sidebar rows */}
        <div>
          <div className="t-micro" style={{ color: "var(--ink-3)", marginBottom: 14 }}>Zeile — Sidebar</div>
          <div style={{
            display: "flex", flexDirection: "column", gap: 1,
            padding: 12, borderRadius: 12,
            background: "var(--surface-2)", border: "1px solid var(--hair)",
            maxWidth: 360,
          }}>
            {variants.map((p, i) => <ProjectRow key={i} project={p} active={i === 3} />)}
          </div>
        </div>

        {/* Signal legend */}
        <div style={{
          marginTop: "auto", padding: 18, borderRadius: 12,
          background: "var(--surface-2)", border: "1px solid var(--hair)",
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 18,
        }}>
          {[
            { sig: "calm",     label: "ruhig",      sub: "keine Änderung seit > 24h" },
            { sig: "action",   label: "aktiv",      sub: "Arbeit im Gang, keine Blocker" },
            { sig: "review",   label: "review",     sub: "wartet auf dich" },
            { sig: "conflict", label: "konflikt",   sub: "blockiert — Klärung nötig" },
          ].map(s => (
            <div key={s.sig} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className={`dot dot--${s.sig}${s.sig === "conflict" ? " dot--live" : ""}`} style={{ position: "relative" }}/>
                <span style={{ color: `var(--sig-${s.sig})`, fontWeight: 500, fontSize: 13.5 }}>{s.label}</span>
              </div>
              <span style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{s.sub}</span>
            </div>
          ))}
        </div>
      </div>
    </Themed>
  );
}

/* ============================================================
   App — composes the design canvas
   ============================================================ */
function App() {
  const [t, setTweak] = useTweaks(DEFAULTS);

  // Wenn theme_mode === "split", zeigen wir Tag + Nacht nebeneinander.
  // Wenn === "global", werden alle Artboards auf t.global_theme gesetzt.
  const themeFor = (preferred) =>
    t.theme_mode === "split" ? preferred : t.global_theme;

  return (
    <>
      <DesignCanvas>
        <DCSection
          id="home"
          title="Home"
          subtitle="Entität zentral · Projektliste sekundär links · Letzter Impact rechts"
        >
          <DCArtboard id="home-day"   label="Tag · Idle"   width={1440} height={900}>
            <Themed theme={themeFor("day")}><HomeScreen density={t.density} state="idle" /></Themed>
          </DCArtboard>
          <DCArtboard id="home-night" label="Nacht · Idle" width={1440} height={900}>
            <Themed theme={themeFor("night")}><HomeScreen density={t.density} state="idle" /></Themed>
          </DCArtboard>
          <DCArtboard id="home-active-day" label="Tag · Text eingefügt" width={1440} height={900}>
            <Themed theme={themeFor("day")}><HomeScreen density={t.density} state="pasted" /></Themed>
          </DCArtboard>
        </DCSection>

        <DCSection
          id="dialog"
          title="Dialog-Overlay"
          subtitle="Batch-Review · cogni entscheidet vor · Mensch scannt + überschreibt inline · ~10 Sek"
        >
          <DCArtboard id="dlg-batch"    label="A · Batch · Intake"        width={1440} height={760}>
            <Themed theme="night"><SceneBatchReview /></Themed>
          </DCArtboard>
          <DCArtboard id="dlg-expanded" label="B · Konflikt expanded"      width={1440} height={760}>
            <Themed theme="night"><SceneBatchConfliktExpanded /></Themed>
          </DCArtboard>
          <DCArtboard id="dlg-commit"   label="C · Committed"              width={1440} height={760}>
            <Themed theme="night"><SceneBatchCommit /></Themed>
          </DCArtboard>
          <DCArtboard id="dlg-drill-konflikt" label="D · Fakt-Drill · Nacht" width={1440} height={820}>
            <Themed theme="night"><SceneFaktKonflikt /></Themed>
          </DCArtboard>
          <DCArtboard id="dlg-drill-day"      label="E · Fakt-Drill · Tag"   width={1440} height={820}>
            <Themed theme="day"><SceneFaktKonflikt /></Themed>
          </DCArtboard>
          <DCArtboard id="dlg-drill-gap"      label="F · Gap · Tag"          width={1440} height={820}>
            <Themed theme="day"><SceneFaktGap /></Themed>
          </DCArtboard>
        </DCSection>

        <DCSection
          id="detail"
          title="Projekt-Detail"
          subtitle="Vier Rollen mit typografischer Hierarchie — keine gleichwertigen Spalten"
        >
          <DCArtboard id="detail-day"   label="Tag"   width={1440} height={1520}>
            <Themed theme={themeFor("day")}><ProjectDetail density={t.density} /></Themed>
          </DCArtboard>
          <DCArtboard id="detail-night" label="Nacht" width={1440} height={1520}>
            <Themed theme={themeFor("night")}><ProjectDetail density={t.density} /></Themed>
          </DCArtboard>
          <DCArtboard id="detail-overlay" label="Tag · ⌘Space-Overlay" width={1440} height={1520}>
            <Themed theme={themeFor("day")}><ProjectDetail density={t.density} overlay /></Themed>
          </DCArtboard>
        </DCSection>
      </DesignCanvas>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Theme">
          <TweakRadio
            label="Modus"
            value={t.theme_mode}
            options={[
              { value: "split",  label: "Tag + Nacht" },
              { value: "global", label: "Nur eines" },
            ]}
            onChange={(v) => setTweak("theme_mode", v)}
          />
          {t.theme_mode === "global" && (
            <TweakRadio
              label="Aktiv"
              value={t.global_theme}
              options={[
                { value: "day",   label: "Tag" },
                { value: "night", label: "Nacht" },
              ]}
              onChange={(v) => setTweak("global_theme", v)}
            />
          )}
        </TweakSection>

        <TweakSection label="Datendichte">
          <TweakRadio
            label="Modus"
            value={t.density}
            options={[
              { value: "lean", label: "wenig" },
              { value: "full", label: "viel" },
            ]}
            onChange={(v) => setTweak("density", v)}
          />
          <p style={{ margin: "4px 4px 0", fontSize: 11.5, color: "rgba(255,255,255,.55)", lineHeight: 1.45 }}>
            Progressive Disclosure: bei wenig Daten zeigt cogni nur das Wesentliche,
            bei viel Material klappt mehr Material auf.
          </p>
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
