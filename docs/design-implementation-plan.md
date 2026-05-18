# cogni — Design Implementation Plan (v2)

> **Adressat:** Lovable Agent
> **Stand:** 2026-05-14 — korrigiert nach ZIP-Analyse + Screenshot-Review
> **Quellen:** tokens.css + dialog-overlay.jsx + project-detail.jsx + app.jsx (aus ZIP), Screenshots Home/Detail/BatchReview/FaktDrill

---

## Vorab: Was Lovable bereits erledigt hat ✅

diese Schicht steht vermutlich:

```
src/lib/project/mappers/*.ts          — alle VM-Mapper extrahiert
src/lib/project/projectViewModel.ts   — Composition-Layer
src/lib/project/useProjectData.ts     — Datenfetching getrennt
src/lib/realtime/useRealtimeTables.ts — Realtime-Hook unified
src/lib/format/dateFormatters.ts      — Datums-Formatter
src/lib/utils.ts                      — Utilities
src/components/project/shared/CardSurface.tsx
src/components/project/shared/SectionLabel.tsx
supabase/functions/_shared/*          — Auth, HTTP, Inspector, Clients
supabase/functions/commit-fact/kernel.ts + detectors
supabase/functions/intake-understand/*.ts
supabase/functions/railway-admin/handlers/*.ts
```

---

## Architektur-Grundsatz: UI ↔ Logik-Trennung (STRIKT)

```
DARF SICH ÄNDERN (UI-Layer):
  src/index.css                     ← Tokens, Fonts, Utility-Klassen
  tailwind.config.ts                ← Token-Aliase
  src/components/project/*.tsx      ← Visuelle Komponenten
  src/components/entity/*.tsx       ← Entity, SideGrid, Orbit
  src/components/sidebar/*.tsx      ← NEU: AppSidebar, MiniEntity
  src/components/dialog/*.tsx       ← Dialog UI
  src/components/home/*.tsx         ← NEU: ImpactPipelinePanel
  src/pages/Index.tsx               ← Home-Layout

DARF SICH NICHT ÄNDERN (Logik-Layer):
  src/lib/project/mappers/*.ts      ← Daten bleiben unberührt
  src/lib/project/projectViewModel.ts
  src/lib/project/useProject.ts
  src/lib/project/useProjectData.ts
  src/lib/realtime/useRealtimeTables.ts
  src/lib/dialog/dialogContext.ts
  src/lib/dialog/sessionFactories.ts
  src/lib/intake/useIntake.ts
  src/lib/project/types.ts          ← ProjectViewModel-Interface = Vertrag
  supabase/functions/**             ← Keine Backend-Änderungen
```

**Regel:** Kein Design-Commit darf eine Datei in `src/lib/` ändern (außer Format-Dateien).
**Regel:** `ProjectViewModel` bleibt unberührt. UI lernt neue Props zu lesen, nicht umgekehrt.

---

## Phase 1 — Token & Font-System

**Dauer:** 1–2h | **Risiko:** Niedrig | **Blockiert:** Alle anderen Phasen

### 1.1 Geist-Font einbinden

**Datei:** `index.html`

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;450;500;600;700&family=Geist+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
```

### 1.2 Design-Token-System

> ⚠️ **KRITISCH:** Das Theme-System verwendet das `data-theme`-Attribut (`"day"` / `"night"`),
> **NICHT** die `.dark`-CSS-Klasse. Alle Token-Werte sind **Hex** (keine HSL-Werte).

**Datei:** `src/index.css` — Folgenden Block **ergänzen** (bestehende shadcn-`:root`-Tokens behalten,
cogni-Tokens werden in `[data-theme]`-Blöcken definiert):

```css
/* ============================================================
   COGNI — Design Tokens
   data-theme="day"  = Apple-Oblivion, warmes Papier
   data-theme="night" = Linear-Tech-Dark
   ============================================================ */

[data-theme="day"] {
  /* Surfaces */
  --surface-0:   #faf9f5;
  --surface-1:   #ffffff;
  --surface-2:   #f1efe8;
  --surface-3:   #ebe9e1;
  --surface-inv: #0d0e12;

  /* Text */
  --ink:        #0a0b0d;
  --ink-strong: #000;
  --ink-2:      #3f4147;
  --ink-3:      #76787f;
  --ink-4:      #a8a9ae;
  --ink-on-inv: #f4f3ef;

  /* Hairlines */
  --hair:   rgba(10, 11, 13, 0.08);
  --hair-2: rgba(10, 11, 13, 0.14);
  --hair-3: rgba(10, 11, 13, 0.22);

  /* Accent */
  --accent:      #2b66dd;
  --accent-soft: #dde6fa;
  --accent-ink:  #1f4cb0;

  /* Signale */
  --sig-calm:         #8d8f96;
  --sig-calm-soft:    #e8e7e2;
  --sig-review:       #c98a08;
  --sig-review-soft:  #fbecc6;
  --sig-action:       #2b66dd;
  --sig-action-soft:  #dde6fa;
  --sig-conflict:     #c4382c;
  --sig-conflict-soft:#f8dad5;

  /* Schatten */
  --shadow-card:  0 1px 0 rgba(10,11,13,.04), 0 10px 30px -18px rgba(10,11,13,.18);
  --shadow-pop:   0 2px 0 rgba(10,11,13,.05), 0 24px 60px -28px rgba(10,11,13,.25);
  --shadow-inset: inset 0 1px 0 rgba(255,255,255,.7);

  /* Entity-Atmosphäre (4 Aurora-Farben) */
  --entity-aurora-a: #ffd58a;   /* warm core */
  --entity-aurora-b: #ff8a7a;   /* coral mid */
  --entity-aurora-c: #7ba9ff;   /* cool edge */
  --entity-aurora-d: #ffffff;   /* hot spot */
  --entity-rim:      rgba(10,11,13,.06);

  --noise: 0.012;
}

[data-theme="night"] {
  /* Surfaces */
  --surface-0:   #0a0b0e;
  --surface-1:   #11131a;
  --surface-2:   #15171f;
  --surface-3:   #1c1f29;
  --surface-inv: #f4f3ef;

  /* Text */
  --ink:        #ecedf0;
  --ink-strong: #ffffff;
  --ink-2:      #b6b8c0;
  --ink-3:      #80828c;
  --ink-4:      #5b5d68;
  --ink-on-inv: #0d0e12;

  /* Hairlines */
  --hair:   rgba(255,255,255,.06);
  --hair-2: rgba(255,255,255,.10);
  --hair-3: rgba(255,255,255,.18);

  /* Accent */
  --accent:      #6b94ff;
  --accent-soft: rgba(107,148,255,.14);
  --accent-ink:  #b9cbff;

  /* Signale */
  --sig-calm:         #7d7f88;
  --sig-calm-soft:    rgba(125,127,136,.16);
  --sig-review:       #f4b73c;
  --sig-review-soft:  rgba(244,183,60,.14);
  --sig-action:       #6b94ff;
  --sig-action-soft:  rgba(107,148,255,.14);
  --sig-conflict:     #ff6a59;
  --sig-conflict-soft:rgba(255,106,89,.16);

  /* Schatten */
  --shadow-card:  0 1px 0 rgba(0,0,0,.4), 0 12px 36px -18px rgba(0,0,0,.7);
  --shadow-pop:   0 2px 0 rgba(0,0,0,.5), 0 24px 60px -28px rgba(0,0,0,.85);
  --shadow-inset: inset 0 1px 0 rgba(255,255,255,.04);

  /* Entity-Atmosphäre */
  --entity-aurora-a: #7ea4ff;
  --entity-aurora-b: #9c6bff;
  --entity-aurora-c: #2e3a6e;
  --entity-aurora-d: #d6e1ff;
  --entity-rim:      rgba(255,255,255,.08);

  --noise: 0.04;
}

/* Base — gilt für beide Themes */
[data-theme],
[data-theme] *,
[data-theme] *::before,
[data-theme] *::after { box-sizing: border-box; }

[data-theme] {
  background: var(--surface-0);
  color: var(--ink);
  font-family: "Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-feature-settings: "ss01", "cv11";
  -webkit-font-smoothing: antialiased;
}
```

### 1.3 Typografie-Utility-Klassen

**Datei:** `src/index.css` — ergänzen:

```css
/* Schriftschnitte */
.mono    { font-family: "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace;
           font-feature-settings: "zero","ss01"; }
.tabular { font-variant-numeric: tabular-nums; }

/* Display-Skala */
.t-display   { font-size: 76px; line-height: 0.96; letter-spacing: -0.035em; font-weight: 500; }
.t-display-2 { font-size: 56px; line-height: 0.98; letter-spacing: -0.03em;  font-weight: 500; }
.t-h1        { font-size: 40px; line-height: 1.04; letter-spacing: -0.025em; font-weight: 500; }
.t-h2        { font-size: 28px; line-height: 1.1;  letter-spacing: -0.02em;  font-weight: 500; }
.t-h3        { font-size: 20px; line-height: 1.2;  letter-spacing: -0.015em; font-weight: 500; }
.t-body      { font-size: 15px; line-height: 1.55; letter-spacing: -0.005em; font-weight: 400; }
.t-small     { font-size: 13px; line-height: 1.45; font-weight: 400; }
.t-micro     { font-size: 11px; line-height: 1.3;  font-weight: 500;
               letter-spacing: 0.04em; text-transform: uppercase; }

.ink-2 { color: var(--ink-2); }
.ink-3 { color: var(--ink-3); }
.ink-4 { color: var(--ink-4); }
```

### 1.4 Component-Utility-Klassen

**Datei:** `src/index.css` — ergänzen:

```css
/* Card */
.card {
  background: var(--surface-1);
  border-radius: 14px;
  box-shadow: var(--shadow-card), var(--shadow-inset);
  position: relative;
}

/* Hairline-Divider */
.hairline {
  background: linear-gradient(90deg, transparent, var(--hair), transparent);
  height: 1px;
}

/* Signal-Dots */
.dot {
  width: 8px; height: 8px; border-radius: 999px;
  display: inline-block; flex: 0 0 auto;
}
.dot--calm     { background: var(--sig-calm); }
.dot--review   { background: var(--sig-review);   box-shadow: 0 0 0 4px var(--sig-review-soft); }
.dot--action   { background: var(--sig-action);   box-shadow: 0 0 0 4px var(--sig-action-soft); }
.dot--conflict { background: var(--sig-conflict); box-shadow: 0 0 0 4px var(--sig-conflict-soft); }

@keyframes cogni-pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50%      { transform: scale(1.5); opacity: 0; }
}
.dot--live::after {
  content: ""; position: absolute; inset: 0;
  border-radius: 999px; background: inherit;
  animation: cogni-pulse 1.8s ease-out infinite;
}

/* Chips */
.chip {
  display: inline-flex; align-items: center; gap: 6px;
  height: 26px; padding: 0 10px; border-radius: 999px;
  background: var(--surface-2); color: var(--ink-2);
  font-size: 12.5px; font-weight: 500;
  border: 1px solid var(--hair);
}
.chip--strong   { background: var(--surface-3); color: var(--ink); }
.chip--review   { background: var(--sig-review-soft);   color: var(--sig-review);   border-color: transparent; }
.chip--action   { background: var(--sig-action-soft);   color: var(--sig-action);   border-color: transparent; }
.chip--conflict { background: var(--sig-conflict-soft); color: var(--sig-conflict); border-color: transparent; }

/* Source-Provenienz-Pill */
.src {
  font-family: "Geist Mono", ui-monospace, monospace;
  font-size: 11px; letter-spacing: 0.02em;
  color: var(--ink-3);
}

/* Buttons */
.btn {
  display: inline-flex; align-items: center; gap: 8px;
  height: 36px; padding: 0 14px; border-radius: 10px;
  background: var(--surface-2); color: var(--ink);
  border: 1px solid var(--hair-2);
  font-size: 13.5px; font-weight: 500;
  cursor: pointer; transition: background .15s, transform .05s;
}
.btn:hover  { background: var(--surface-3); }
.btn:active { transform: translateY(1px); }
.btn--ghost   { background: transparent; border-color: transparent; color: var(--ink-2); }
.btn--ghost:hover { background: var(--surface-2); color: var(--ink); }
.btn--primary { background: var(--ink); color: var(--surface-1); border-color: transparent; }

/* Keyboard-Hint */
.kbd {
  font-family: "Geist Mono", ui-monospace, monospace;
  font-size: 10.5px; padding: 2px 6px; border-radius: 5px;
  background: var(--surface-2); color: var(--ink-3);
  border: 1px solid var(--hair); border-bottom-width: 2px;
}
```

### 1.5 data-theme Attribut verdrahten

**Datei:** `src/App.tsx` (oder wo der Theme-Provider liegt) — das Root-Element braucht das Attribut:

```tsx
// Das Root-div (oder <html>) bekommt:
// data-theme={theme}   wobei theme = "day" | "night"
// ZUSÄTZLICH zur bestehenden .dark-Klasse (shadcn-Kompatibilität bleibt erhalten)

<div data-theme={theme} className={theme === 'night' ? 'dark' : ''}>
  {children}
</div>
```

Die `theme`-Variable kommt aus dem bestehenden Theme-State. Standard: `"day"`.

### 1.6 Tailwind-Tokens ergänzen

**Datei:** `tailwind.config.ts` — Im `colors`-Block ergänzen (hex-Vars, kein `hsl()` Wrapper):

```ts
colors: {
  // bestehende shadcn-Tokens behalten, NEU ergänzen:
  'surface-0':  'var(--surface-0)',
  'surface-1':  'var(--surface-1)',
  'surface-2':  'var(--surface-2)',
  'surface-3':  'var(--surface-3)',
  'surface-inv':'var(--surface-inv)',
  'ink':        'var(--ink)',
  'ink-2':      'var(--ink-2)',
  'ink-3':      'var(--ink-3)',
  'ink-4':      'var(--ink-4)',
  'accent':     'var(--accent)',
  'accent-soft':'var(--accent-soft)',
  'sig-calm':         'var(--sig-calm)',
  'sig-calm-soft':    'var(--sig-calm-soft)',
  'sig-review':       'var(--sig-review)',
  'sig-review-soft':  'var(--sig-review-soft)',
  'sig-action':       'var(--sig-action)',
  'sig-action-soft':  'var(--sig-action-soft)',
  'sig-conflict':     'var(--sig-conflict)',
  'sig-conflict-soft':'var(--sig-conflict-soft)',
}
```

**Verify Phase 1:** App startet, Farben sind warm-neutral im Day-Modus / dunkel im Night-Modus. Schrift ist Geist. `data-theme`-Attribut am Root sichtbar (DevTools). Keine Konsolen-Fehler.

---

## Phase 2 — LageZone Hero-Upgrade

**Dauer:** 1h | **Risiko:** Niedrig | **Datei:** `src/components/project/LageZone.tsx`

### Ziel

Größere, luftigere Typografie. Atmosphären-Streifen mit Glow. Struktur unverändert.

### 2.1 Atmosphären-Streifen

Am **Anfang** der Root-`<div>` einfügen:

```tsx
{/* Atmosphären-Streifen — 3px Linie + 60px Glow-Hauch */}
<div className="atmosphere-stripe" />
```

In `src/index.css` ergänzen:

```css
@keyframes atmosphere-breathe {
  0%, 100% { opacity: 0.5; }
  50%       { opacity: 1; }
}

.atmosphere-stripe {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    var(--entity-aurora-c) 20%,
    var(--entity-aurora-b) 50%,
    var(--entity-aurora-a) 80%,
    transparent 100%
  );
  animation: atmosphere-breathe 6s ease-in-out infinite;
  pointer-events: none;
  z-index: 10;
}

/* Glow-Hauch — 60px weicher Schimmer nach unten */
.atmosphere-stripe::after {
  content: "";
  position: absolute;
  inset-x: 0;
  top: 0;
  height: 60px;
  background: linear-gradient(180deg, var(--entity-aurora-b), transparent);
  opacity: 0.12;
  filter: blur(16px);
  pointer-events: none;
}

/* Aktiv-Zustand (wenn Pipeline läuft) — schnellere Pulsation, review-Signal */
.atmosphere-stripe.is-active {
  animation: atmosphere-breathe 3s ease-in-out infinite;
}
.atmosphere-stripe.is-active::after {
  background: linear-gradient(180deg, var(--sig-review), transparent);
  opacity: 0.18;
}
```

Root-`<div>` von LageZone: `position: relative` hinzufügen.

**`is-active`-Logik** in LageZone:

```tsx
// Beispiel: aktiv wenn Pipeline läuft
const isActive = project.pipeline?.isProcessing ?? false;
<div className={`atmosphere-stripe${isActive ? ' is-active' : ''}`} />
```

### 2.2 Projekt-Titel

```tsx
// Projekttitel: font-size 44px, font-weight 500, tracking tight
<h1 style={{ fontSize: '44px', fontWeight: 500, letterSpacing: '-0.025em', lineHeight: 1.04 }}>
  {project.name}
</h1>
```

### 2.3 Lagebild-Text

```tsx
// Lagebild: font-size 24px, font-weight 300, relaxed
<p style={{ fontSize: '24px', fontWeight: 300, lineHeight: 1.4, letterSpacing: '-0.015em' }}
   className="text-ink-2">
  {project.lage.text}
</p>
```

### 2.4 Metadata-Zeile (rechts von Signal-Chips)

Neben den Signal-Chips (Konflikte / Entscheidungen / Review) die beiden Datum-Felder ergänzen:

```tsx
<div className="flex items-center gap-8 ml-auto">
  {project.stats.naechsterTermin && (
    <div>
      <div className="t-micro ink-4">Nächster Termin</div>
      <div className="mono tabular text-ink" style={{ fontSize: '18px' }}>
        {project.stats.naechsterTermin}
      </div>
    </div>
  )}
  {project.lage.letzteAenderung && (
    <div>
      <div className="t-micro ink-4">Letzte Änderung</div>
      <div className="t-small ink-2">{project.lage.letzteAenderung}</div>
    </div>
  )}
</div>
```

`project.stats.naechsterTermin` existiert bereits im ViewModel — nicht neu anlegen.

**Verify Phase 2:** Schmaler Gradient-Streifen mit weichem Glow oben auf Projekt-Screen. Projekttitel deutlich größer. Lagebild-Text luftiger. Nächster Termin rechts sichtbar.

---

## Phase 3 — Persistente AppSidebar

**Dauer:** 2–3h | **Risiko:** Mittel | **Dateien:** NEU + `Index.tsx` + `ProjectScreen.tsx`

### Konzept (A+B aus Design-Chat)

Die Sidebar ist auf **beiden** Screens präsent und 240px breit:

- **Home:** Entity ist im Mittelpunkt (groß), Sidebar zeigt nur Projektliste
- **Projekt-Detail:** Entity schrumpft in die Sidebar (Mini-Entity oben), Projektliste darunter

### 3.1 AppSidebar-Komponente

**Neue Datei:** `src/components/sidebar/AppSidebar.tsx`

```tsx
interface AppSidebarProps {
  projects: Array<{
    id: string;
    initials: string;      // "HN", "AR" etc. — 2 Buchstaben
    name: string;
    signalCount: number;
    signalState: 'calm' | 'review' | 'action' | 'conflict';
  }>;
  activeProjectId?: string;
  onProjectSelect: (id: string) => void;
  // Mini-Entity
  showMiniEntity?: boolean;
  pipelineLabel?: string;   // "VERSTEHE · 0:08" — null wenn idle
  onEntityClick?: () => void;
}

export const AppSidebar = ({
  projects, activeProjectId, onProjectSelect,
  showMiniEntity, pipelineLabel, onEntityClick,
}: AppSidebarProps) => (
  <aside
    style={{
      width: 240,
      minWidth: 240,
      height: '100vh',
      background: 'var(--surface-2)',
      borderRight: '1px solid var(--hair)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}
  >
    {/* Mini-Entity — nur auf Projekt-Detail */}
    {showMiniEntity && (
      <button
        onClick={onEntityClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '16px 16px 12px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          borderBottom: '1px solid var(--hair)',
        }}
        className="group"
        title="Zur Entität (⌘ ␣)"
      >
        {/* Mini-Orb ~40px */}
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: `radial-gradient(circle at 35% 35%,
              var(--entity-aurora-d) 0%,
              var(--entity-aurora-a) 30%,
              var(--entity-aurora-b) 65%,
              var(--entity-aurora-c) 100%)`,
            flexShrink: 0,
            animation: 'entity-breathe 6s ease-in-out infinite',
          }}
        />
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>
            cogni
          </div>
          {pipelineLabel ? (
            <div className="t-micro" style={{ color: 'var(--sig-review)' }}>
              {pipelineLabel}
            </div>
          ) : (
            <div className="t-micro ink-4 group-hover:hidden">bereit</div>
          )}
          <div
            className="t-micro hidden group-hover:block"
            style={{ color: 'var(--accent)' }}
          >
            öffnen ⌘ ␣
          </div>
        </div>
      </button>
    )}

    {/* Projektliste */}
    <div style={{ padding: '12px 8px 8px', flex: 1, overflowY: 'auto' }}>
      <div
        className="t-micro ink-4"
        style={{ padding: '0 8px 8px' }}
      >
        PROJEKTE {projects.length}
      </div>

      {projects.map(p => (
        <button
          key={p.id}
          onClick={() => onProjectSelect(p.id)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 8px',
            borderRadius: 8,
            background: activeProjectId === p.id ? 'var(--surface-3)' : 'transparent',
            border: 'none',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          {/* Kürzel-Chip */}
          <span
            className="t-micro"
            style={{
              width: 24,
              color: activeProjectId === p.id ? 'var(--ink-3)' : 'var(--ink-4)',
              flexShrink: 0,
            }}
          >
            {p.initials}
          </span>

          {/* Projektname */}
          <span
            className="t-small"
            style={{
              flex: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              color: activeProjectId === p.id ? 'var(--ink)' : 'var(--ink-2)',
              fontWeight: activeProjectId === p.id ? 500 : 400,
            }}
          >
            {p.name}
          </span>

          {/* Signal-Dots */}
          {p.signalCount > 0 && (
            <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
              {/* Vereinfacht: ein Dot pro Signal-State */}
              <span className={`dot dot--${p.signalState}`} />
              {p.signalCount > 1 && (
                <span className="t-micro ink-4">{p.signalCount}</span>
              )}
            </div>
          )}
        </button>
      ))}

      <button
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 8px',
          borderRadius: 8,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--ink-4)',
          marginTop: 4,
        }}
        className="t-small hover:text-ink-2"
      >
        + Neues Projekt
      </button>
    </div>
  </aside>
);
```

CSS-Animation für Mini-Orb in `src/index.css`:

```css
@keyframes entity-breathe {
  0%, 100% { transform: scale(1); filter: brightness(1); }
  50%       { transform: scale(1.04); filter: brightness(1.08); }
}
```

### 3.2 ProjectScreen: Sidebar einbauen

**Datei:** `src/components/project/ProjectScreen.tsx`

```tsx
// Import ergänzen:
import { AppSidebar } from "../sidebar/AppSidebar";

// Layout-Wrapper ändern — Outer wird flex-row:
<div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
  <AppSidebar
    projects={allProjects}           // aus useProjects() oder prop
    activeProjectId={project.id}
    onProjectSelect={onProjectSelect}
    showMiniEntity={true}
    pipelineLabel={pipeline?.isProcessing
      ? `${pipeline.stage} · ${pipeline.elapsed}`
      : undefined}
    onEntityClick={onBack}
  />

  {/* Bestehender Projekt-Content — unverändert */}
  <div style={{ flex: 1, overflow: 'auto' }}>
    {/* Bestehender LageHero, HandlungsbedarfList, VerlaufFeed, Substanz */}
    {/* ACHTUNG: den alten "← Entität" Text-Button entfernen */}
  </div>
</div>
```

**Den `← Entität` Back-Button entfernen** — Navigation übernimmt jetzt die Sidebar-Entity.

### 3.3 Layout-Korrektur: Handlungsbedarf links, Verlauf rechts

> ⚠️ Aus Screenshots bestätigt: **HandlungsbedarfList ist links (breiter, ~60%), VerlaufFeed rechts (~40%)**

Falls der aktuelle Code noch VerlaufFeed links hat — korrigieren:

```tsx
// In ProjectScreen.tsx — Haupt-Content-Bereich:
<div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 24 }}>
  <HandlungsbedarfList project={project} onOpenDrill={onOpenDialog} />
  <VerlaufFeed project={project} />
</div>
```

**Verify Phase 3:** Sidebar sichtbar auf Projekt-Detail. Mini-Entity oben in Sidebar (kleiner Orb + "cogni" + Pipeline-Label). Projektliste darunter, aktives Projekt hervorgehoben. Klick auf Mini-Entity → zurück zu Home. Handlungsbedarf links, Verlauf rechts.

---

## Phase 4 — Home-Screen Layout

**Dauer:** 2–3h | **Risiko:** Mittel | **Dateien:** `src/pages/Index.tsx`, NEU

### Ziel

Dreispalten-Layout: Sidebar (240px) | Zentrum (Entity + Prompt) | Rechtes Panel (Impact + Pipeline)

### 4.1 Sidebar auf Home-Screen

**Datei:** `src/pages/Index.tsx`

```tsx
// Import:
import { AppSidebar } from "../components/sidebar/AppSidebar";

// Root-Layout wird flex-row:
<div style={{ display: 'flex', height: '100vh', background: 'var(--surface-0)' }}>
  <AppSidebar
    projects={allProjects}
    activeProjectId={undefined}      // keines aktiv auf Home
    onProjectSelect={onProjectSelect}
    showMiniEntity={false}           // Entity ist im Zentrum
  />

  {/* Zentrum: Entity + Prompt */}
  <main style={{ flex: 1, display: 'flex', flexDirection: 'column',
                 alignItems: 'center', justifyContent: 'center' }}>
    {/* Bestehende Entity-Komponente bleibt */}
    <Entity />

    {/* Prompt darunter */}
    <HomePrompt
      onNote={...} onPaste={...} onUpload={...} onVoice={...}
    />
  </main>

  {/* Rechtes Panel */}
  <ImpactPipelinePanel />
</div>
```

Das bestehende `SideGrid`-Grid (Projekt-Karten-Raster) **wird entfernt** — Navigation übernimmt die AppSidebar.

### 4.2 HomePrompt-Komponente

**Neue Datei:** `src/components/home/HomePrompt.tsx`

```tsx
export const HomePrompt = ({ onNote, onPaste, onUpload, onVoice }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, marginTop: 32 }}>
    {/* Haupt-Prompt */}
    <h2
      style={{ fontSize: '48px', fontWeight: 300, letterSpacing: '-0.02em',
               color: 'var(--ink)', textAlign: 'center', cursor: 'text' }}
      onClick={onNote}
    >
      Was gibt es neues?
    </h2>
    <p className="t-body ink-3" style={{ textAlign: 'center', marginTop: -16 }}>
      Gebe mir Daten, tippe oder sprich. Ich ordne es ein.
    </p>

    {/* 4 kreisförmige Icon-Buttons */}
    <div style={{ display: 'flex', gap: 20, marginTop: 8 }}>
      {[
        { label: 'Datei',    icon: <UploadIcon />,    action: onUpload },
        { label: 'Einfügen', icon: <ClipboardIcon />, action: onPaste },
        { label: 'Link',     icon: <LinkIcon />,      action: () => {} },
        { label: 'Sprache',  icon: <MicIcon />,       action: onVoice },
      ].map(({ label, icon, action }) => (
        <button
          key={label}
          onClick={action}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
            padding: 0, background: 'transparent', border: 'none', cursor: 'pointer',
          }}
        >
          {/* Kreis */}
          <div
            style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'var(--surface-2)',
              border: '1px solid var(--hair-2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--ink-3)',
              transition: 'background .15s, color .15s',
            }}
          >
            {icon}
          </div>
          <span className="t-small ink-3">{label}</span>
        </button>
      ))}
    </div>
  </div>
);
```

### 4.3 ImpactPipelinePanel (neu)

**Neue Datei:** `src/components/home/ImpactPipelinePanel.tsx`

Zeigt: letzter Impact (project-Changes, chronologisch) + Pipeline-Zustand + Tagesstatistik.

```tsx
export const ImpactPipelinePanel = () => {
  // Daten: bestehende Hooks nutzen
  // recentImpact = change_events der letzten 24h aus useRecentChanges() o.ä.
  // pipelineState = aus useIntake() oder eigenem Hook

  return (
    <aside
      style={{
        width: 280,
        minWidth: 280,
        height: '100vh',
        borderLeft: '1px solid var(--hair)',
        display: 'flex',
        flexDirection: 'column',
        padding: 20,
        gap: 24,
        overflowY: 'auto',
      }}
    >
      {/* LETZTER IMPACT */}
      <section>
        <div className="t-micro ink-4" style={{ marginBottom: 12 }}>LETZTER IMPACT</div>
        {recentImpact.map(item => (
          <div key={item.id} style={{ marginBottom: 14 }}>
            <div className="t-small ink-4">{item.timeAgo}</div>
            <div className="t-body ink" style={{ marginBottom: 2 }}>{item.title}</div>
            <div className="t-small ink-3 flex items-center gap-1">
              → {item.projectName}
            </div>
          </div>
        ))}
      </section>

      <div className="hairline" />

      {/* JETZT — aktive Pipeline */}
      <section>
        <div className="t-micro ink-4" style={{ marginBottom: 12 }}>JETZT</div>
        {currentPipeline && (
          <div
            style={{
              padding: '10px 12px',
              borderRadius: 10,
              background: 'var(--surface-2)',
              border: '1px solid var(--hair)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%',
                           background: 'var(--sig-action)',
                           animation: 'cogni-pulse 1.8s ease-out infinite' }} />
              <span className="t-small ink-3">
                {currentPipeline.stage} · {currentPipeline.elapsed}
              </span>
            </div>
            <div className="t-small ink" style={{ marginTop: 4 }}>
              {currentPipeline.assetName}
            </div>
            <div className="t-small ink-4">→ {currentPipeline.projectHint}</div>
          </div>
        )}
      </section>

      <div className="hairline" />

      {/* PIPELINE — Zusammenfassung */}
      <section>
        <div className="t-micro ink-4" style={{ marginBottom: 12 }}>PIPELINE</div>
        {[
          { label: 'Intake',       count: pipeline.intake,    dot: 'calm' },
          { label: 'Verstehen',    count: pipeline.processing, dot: 'action' },
          { label: 'Review fällig',count: pipeline.reviewReady, dot: 'review' },
          { label: 'Konflikt',     count: pipeline.conflicts, dot: 'conflict' },
        ].map(({ label, count, dot }) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between',
                                    alignItems: 'center', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className={`dot dot--${dot}`} />
              <span className="t-small ink-2">{label}</span>
            </div>
            <span className="t-small ink-3 tabular mono">{count}</span>
          </div>
        ))}
        <div className="t-micro ink-4" style={{ marginTop: 12 }}>
          heute · {pipeline.totalToday} eingegangen · {pipeline.committed} committed
        </div>
      </section>
    </aside>
  );
};
```

**Verify Phase 4:** Home-Screen dreispaltig. Sidebar links mit Projektliste. Orb + "Was gibt es neues?" + 4 kreisförmige Buttons in der Mitte. ImpactPipelinePanel rechts mit letzten Änderungen und Pipeline-Status.

---

## Phase 5 — Dialog-System: BatchReview + FaktDrill

**Dauer:** 4–6h | **Risiko:** Hoch | **Wichtigste Phase**

> ⚠️ **Strategie:** Neue Komponenten parallel zu bestehenden bauen. Erst wenn neue fertig und getestet: alten BoxRenderer + 8 Box-Komponenten entfernen.

> ⚠️ **KRITISCH — Theme:** Die Dialoge erben das App-Theme via `--d-*` Token-Mapping.
> **KEIN** `className="dark"`, **KEIN** forced dark mode.
> `--d-blue` = `var(--accent)` — **NICHT** `var(--sig-action)`.

### 5.1 Dialog-Token-Mapping

In `src/index.css` ergänzen:

```css
/* Dialog-Tokens — erben immer vom App-Theme */
[data-dialog] {
  --d-bg:        var(--surface-1);
  --d-surface:   var(--surface-2);
  --d-ink:       var(--ink);
  --d-ink-2:     var(--ink-2);
  --d-ink-3:     var(--ink-3);
  --d-hair:      var(--hair);
  --d-hair-2:    var(--hair-2);
  --d-blue:      var(--accent);         /* ← ACCENT, nicht sig-action */
  --d-blue-soft: var(--accent-soft);
  --d-amber:     var(--sig-review);
  --d-amber-soft:var(--sig-review-soft);
  --d-red:       var(--sig-conflict);
  --d-red-soft:  var(--sig-conflict-soft);
}
```

Dialog-Overlay Background:

```css
.dialog-backdrop {
  backdrop-filter: blur(28px) saturate(1.1);
  background: color-mix(in oklab, var(--surface-0) 78%, transparent);
}
```

### 5.2 BatchReviewOverlay

**Neue Datei:** `src/components/dialog/BatchReviewOverlay.tsx`

Verwendet **dieselbe `useDialog()`-Infrastruktur** wie DialogOverlay. Kein neuer Context.

**Layout:**

```
SessionHeader
  ● Review · [Dateiname] · "N Erkenntnisse · M Konflikte · K Lücken" | N/Total | esc

ReviewList (kompakte Tabelle, border-radius 16, 1px var(--d-hair) border)
  ReviewRow × N (Höhe 48px pro Zeile)
    ✓/○/!  |  TYPE-CHIP  |  Content-Text  |  Projekt  |  [Option-Chips / Suggestion-Chips]

CommitBar
  [Alle verwerfen]  ·  "N offen · M bereit"  ·  [M übernehmen ↵]
```

**Type-Chips** (Klassen: `chip`, klein, mono, uppercase):

```
TERMIN · ENTSCHEIDUNG · KONFLIKT · STAKEHOLDER · LÜCKE · DOKUMENT
```

**Row-Varianten:**

```tsx
// Angenommen (accepted) — gedimmt, Check-Icon
//   opacity: 0.5, check-circle icon in sig-calm color

// Konflikt-Row — amber left-stripe (3px), amber dot
//   left border: 3px solid var(--d-amber)
//   Am Ende der Zeile: 3 inline Option-Chips + "Details ▲" Toggle
//   Option-Chips: [Datum A] [Datum B] [offen lassen] — je ~60px pill
//
//   Expanded (via "Details ▲"):
//     Zwei Quellen-Cards nebeneinander:
//     ┌─────────────────┐ (vs) ┌─────────────────────────────┐
//     │ QUELLE A        │  ○   │ QUELLE B                    │
//     │ [Datum groß]    │      │ [Datum groß]                │
//     │ [Quelle-Meta]   │      │ [Quelle-Meta]               │
//     └─────────────────┘      └─────────────────────────────┘
//     cogni empfiehlt [Datum X] — [Begründung]. Klick zum Überschreiben.

// Lücke-Row — amber left-stripe, leerer Kreis-Icon
//   Am Ende der Zeile: Suggestion-Chips aus box.suggestions[]
//   Suggestion-Chips: ["< 200ms p95"] etc. — values kommen aus Session-Daten
//   Danach: ✓ Accept-Button (kleines Pill-Icon)
```

**CommitBar-Logik:**

```ts
const { session, commitBox } = useDialog();
const ready = session.boxes.filter(b => END_STATES.includes(b.state)).length;
const open  = session.boxes.filter(b => b.state === 'proposed').length;
const isAllReady = open === 0;
```

**CommitButton Glow** wenn alle bereit:

```css
.commit-btn-ready {
  box-shadow: 0 0 0 6px rgba(107,148,255,.18),
              0 8px 24px -8px rgba(107,148,255,.5);
  /* night-mode accent ist #6b94ff = rgba(107,148,255) */
}
```

**SessionHeader:**

```tsx
<header>
  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
    <span className="dot dot--action dot--live" />
    <span className="t-small ink-2">Review</span>
    <span className="t-small ink" style={{ fontWeight: 500 }}>
      {session.sourceName}
    </span>
    <span className="t-small ink-3">
      {totalFacts} Erkenntnisse
      {conflictCount > 0 && ` · ${conflictCount} Konflikte`}
      {gapCount > 0 && ` · ${gapCount} Lücken`}
    </span>
  </div>
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 'auto' }}>
    <span className="t-small ink-4 mono">{currentIdx + 1} / {totalPages}</span>
    <button onClick={onClose} className="kbd">esc</button>
  </div>
</header>
```

### 5.3 FaktDrillOverlay — Konflikt-Variante

**Neue Datei:** `src/components/dialog/FaktDrillOverlay.tsx`

Öffnet wenn `session.boxes.length === 1`. Vollfläche, App-Theme geerbt (kein forced dark).

**Header:**

```tsx
<header>
  <button className="btn btn--ghost">← Handlungsbedarf</button>
  <span className="t-body ink" style={{ fontWeight: 500 }}>
    {session.boxes[0].title}
  </span>
  <span className="t-small ink-3 ml-auto">
    {project.name} · Konflikt #{konflikt.id}
  </span>
  <button onClick={onClose} className="kbd">esc</button>
</header>
```

**Alert-Banner:**

```tsx
<div style={{
  padding: '14px 18px',
  borderRadius: 12,
  background: 'var(--sig-conflict-soft)',
  border: '1px solid var(--sig-conflict)',
  display: 'flex', gap: 10,
}}>
  <span>⚠</span>
  <div>
    <div className="t-body" style={{ color: 'var(--sig-conflict)', fontWeight: 500 }}>
      Zwei Quellen widersprechen sich
    </div>
    <div className="t-small ink-2">
      Beide nennen den Go-Live-Termin, aber mit unterschiedlichem Datum.
    </div>
  </div>
</div>
```

**Zwei-Quellen-Gegenüberstellung:**

```tsx
<div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 16, marginTop: 24 }}>
  {/* QUELLE A */}
  <div style={{
    padding: 24, borderRadius: 14,
    border: '1px solid var(--sig-review)',    /* amber outline = empfohlen */
    background: 'var(--surface-1)',
    boxShadow: 'var(--shadow-card)',
  }}>
    <div className="t-micro ink-4">QUELLE A</div>
    {/* Datum GROSS — 38px */}
    <div style={{ fontSize: '38px', fontWeight: 500, letterSpacing: '-0.02em',
                  lineHeight: 1.1, margin: '12px 0' }}>
      {konflikt.sourceA.dateLabel}
    </div>
    {/* Provenienz-Card */}
    <div style={{ background: 'var(--surface-2)', borderRadius: 10, padding: '10px 14px' }}>
      <div className="t-small ink">{konflikt.sourceA.title}</div>
      <div className="src">{konflikt.sourceA.meta}</div>
    </div>
    <div className="t-small ink-3" style={{ marginTop: 10 }}>
      • {konflikt.sourceA.hint}
    </div>
  </div>

  {/* VS-Kreis */}
  <div style={{
    width: 48, height: 48, borderRadius: '50%',
    background: 'var(--sig-conflict-soft)',
    border: '1px solid var(--sig-conflict)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center', flexShrink: 0,
    color: 'var(--sig-conflict)', fontSize: 12, fontWeight: 600,
  }}>
    vs
  </div>

  {/* QUELLE B */}
  <div style={{
    padding: 24, borderRadius: 14,
    border: '1px solid var(--hair-2)',
    background: 'var(--surface-1)',
    boxShadow: 'var(--shadow-card)',
  }}>
    <div className="t-micro ink-4">QUELLE B</div>
    <div style={{ fontSize: '38px', fontWeight: 500, letterSpacing: '-0.02em',
                  lineHeight: 1.1, margin: '12px 0' }}>
      {konflikt.sourceB.dateLabel}
    </div>
    <div style={{ background: 'var(--surface-2)', borderRadius: 10, padding: '10px 14px' }}>
      <div className="t-small ink">{konflikt.sourceB.title}</div>
      <div className="src">{konflikt.sourceB.meta}</div>
    </div>
    <div className="t-small ink-3" style={{ marginTop: 10 }}>
      • {konflikt.sourceB.hint}
    </div>
  </div>
</div>
```

**"Was stimmt?" — 3 Entscheidungs-Tiles:**

```tsx
<div style={{ marginTop: 28 }}>
  <div className="t-small ink-3" style={{ marginBottom: 12 }}>Was stimmt?</div>
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
    {/* Tile A (empfohlen — amber hervorgehoben) */}
    <button
      onClick={() => onDecide('sourceA')}
      style={{
        padding: '14px 16px', borderRadius: 12, textAlign: 'left',
        background: selected === 'sourceA'
          ? 'var(--sig-review-soft)'
          : 'var(--surface-2)',
        border: `1px solid ${selected === 'sourceA'
          ? 'var(--sig-review)'
          : 'var(--hair)'}`,
        cursor: 'pointer',
      }}
    >
      <div className="t-body ink" style={{ fontWeight: 500 }}>
        {konflikt.sourceA.shortLabel}   {/* "15. Mai · Mail Berger" */}
      </div>
      <div className="t-small ink-3">{konflikt.sourceA.reasoning}</div>
    </button>

    {/* Tile B */}
    <button onClick={() => onDecide('sourceB')} /* analog zu Tile A */ />

    {/* Offen lassen */}
    <button
      onClick={() => onDecide('open')}
      style={{
        padding: '14px 16px', borderRadius: 12, textAlign: 'left',
        background: 'var(--surface-2)',
        border: '1px solid var(--hair)',
        cursor: 'pointer',
      }}
    >
      <div className="t-body ink" style={{ fontWeight: 500 }}>Offen lassen</div>
      <div className="t-small ink-3">als Handlungsbedarf weiterführen</div>
    </button>
  </div>
</div>
```

**Bottom-Leiste:**

```tsx
<footer style={{
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  paddingTop: 20, borderTop: '1px solid var(--hair)',
}}>
  <button className="btn btn--ghost" style={{ color: 'var(--ink-3)' }}>
    Als Handlungsbedarf markieren
  </button>
  <div style={{ display: 'flex', gap: 10 }}>
    <button className="btn" onClick={onReject}>Verwerfen</button>
    <button
      className="btn btn--primary"
      onClick={onSave}
      disabled={!selected}
    >
      Entscheidung speichern →
    </button>
  </div>
</footer>
```

### 5.4 FaktDrillOverlay — Gap-Variante

Split-Layout 2/5 | 3/5:

```tsx
// Linke Seite (2/5): Kontext-Card + "Blockiert"-Liste
// Rechte Seite (3/5): Gap-Card (amber) + Eingabefeld + Suggestion-Chips

<div style={{ display: 'grid', gridTemplateColumns: '2fr 3fr', gap: 24 }}>
  {/* Links */}
  <div>
    <div className="card" style={{ padding: 20 }}>
      <div className="t-micro ink-4" style={{ marginBottom: 8 }}>KONTEXT</div>
      <div className="t-body ink">{gap.contextText}</div>
    </div>
    {gap.blockedItems?.length > 0 && (
      <div style={{ marginTop: 16 }}>
        <div className="t-micro ink-4" style={{ marginBottom: 8 }}>BLOCKIERT</div>
        {gap.blockedItems.map(item => (
          <div key={item} className="t-small ink-2" style={{ marginBottom: 6 }}>
            • {item}
          </div>
        ))}
      </div>
    )}
  </div>

  {/* Rechts */}
  <div>
    {/* Gap-Card amber */}
    <div style={{
      padding: 20, borderRadius: 14,
      background: 'var(--sig-review-soft)',
      border: '1px solid var(--sig-review)',
    }}>
      <div className="t-micro" style={{ color: 'var(--sig-review)', marginBottom: 8 }}>
        LÜCKE
      </div>
      <div className="t-body ink" style={{ fontWeight: 500 }}>{gap.title}</div>
      <div className="t-small ink-2" style={{ marginTop: 6 }}>{gap.description}</div>
    </div>

    {/* Eingabefeld */}
    <input
      type="text"
      placeholder="Wert eingeben oder auswählen..."
      style={{
        width: '100%', marginTop: 16, padding: '12px 14px',
        borderRadius: 10, border: '1px solid var(--hair-2)',
        background: 'var(--surface-1)', color: 'var(--ink)',
        fontSize: 14,
      }}
    />

    {/* Suggestion-Chips — dynamisch aus box.suggestions[] */}
    {gap.suggestions?.length > 0 && (
      <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
        {gap.suggestions.map(s => (
          <button
            key={s}
            onClick={() => onSuggest(s)}
            className="chip chip--review"
            style={{ cursor: 'pointer' }}
          >
            {s}   {/* z.B. "< 100ms", "< 200ms p95", "< 500ms" */}
          </button>
        ))}
      </div>
    )}
  </div>
</div>
```

### 5.5 DialogOverlay Router

**Datei:** `src/components/dialog/DialogOverlay.tsx`

```tsx
const isBatchReview = session?.boxes.length > 1;
const isFaktDrill   = session?.boxes.length === 1;

if (isBatchReview) return createPortal(<BatchReviewOverlay />, document.body);
if (isFaktDrill)   return createPortal(<FaktDrillOverlay />, document.body);
return null;
```

Beide Overlays erhalten `data-dialog` Attribut für Token-Mapping:

```tsx
<div data-dialog style={{ ... }}>
```

### 5.6 Alte Box-Komponenten entfernen (erst nach Verify)

```
src/components/dialog/BoxRenderer.tsx       → löschen
src/components/dialog/boxes/AktionsBox.tsx  → löschen
src/components/dialog/boxes/AuswahlBox.tsx  → löschen
src/components/dialog/boxes/EingabeBox.tsx  → löschen
src/components/dialog/boxes/GapBox.tsx      → löschen
src/components/dialog/boxes/KonfliktBox.tsx → löschen
src/components/dialog/boxes/KontextBox.tsx  → löschen
src/components/dialog/boxes/WissensBox.tsx  → löschen
src/components/dialog/boxes/ZuordnungsBox.tsx → löschen
```

**Verify Phase 5:**

1. Datei ablegen → BatchReview öffnet sich, erbt App-Theme (Tag = hell, Nacht = dunkel)
2. Konflikt-Row: amber Stripe, 3 inline Chips, "Details ▲" expandiert zu Quellen-Cards
3. Lücke-Row: Suggestion-Chips aus Session-Daten sichtbar
4. CommitButton glüht blau wenn alle Rows entschieden
5. "M übernehmen ↵" → Daten committed, Dialog schließt
6. HandlungsbedarfList-Item klicken → FaktDrill öffnet sich, App-Theme geerbt
7. FaktDrill Konflikt: 38px Datum-Darstellung in beiden Quellen-Cards
8. FaktDrill Gap: Suggestion-Chips sichtbar
9. "Entscheidung speichern →" nur aktiv wenn Tile gewählt
10. ESC schließt immer

---

## Phase 6 — AssetOrbit (Nice-to-have, nach Phase 5)

**Dauer:** 2–3h | **Risiko:** Niedrig | **Datei:** `src/components/entity/AssetOrbit.tsx`

Visualisiert Assets die noch nicht committed sind, als orbitierende Chips um die Entität.

**Orbit-Bogen:** Oberer Halbkreis (225°), damit die Prompt-Buttons unten Platz haben.
**Daten:** Assets mit `status IN ('parsing', 'understanding', 'review-ready', 'failed')` AND `committed_at IS NULL`.

**Orbit-Spec:**

```ts
const ORBIT_ARC   = 1.25 * Math.PI;   // 225°
const ORBIT_START = -Math.PI / 2 - ORBIT_ARC / 2;
const RING_RADIUS = [250, 290];        // ageRing 0 = nah, 1 = weiter

const angle   = ORBIT_START + (index / total) * ORBIT_ARC;
const r       = RING_RADIUS[item.ageRing ?? 0];
const x       = Math.cos(angle) * r;
const y       = Math.sin(angle) * r;
const opacity = 1 - (item.ageRing ?? 0) * 0.45;
```

**Chip-Spec:**

```
parsing:       Gestrichelter Rand (border-dashed), ink-3
understanding: Rotierender Ring-Spinner, border-t-transparent
review-ready:  sig-review Rand, klickbar (öffnet BatchReview für dieses Asset)
failed:        sig-conflict Rand
```

Jeder Chip zeigt: `[TYPE] Name · vor X min ●`

**Verify Phase 6:** Assets kreisen im oberen Bogen um Orb. Status-Visuals korrekt. Klick auf review-ready → BatchReview für dieses Asset öffnet sich.

---

## Mapping-Korrekturen: Was stimmt, was nicht

### ✅ Korrekt implementieren (aus Screenshots + ZIP bestätigt):

```
✓ 240px Sidebar auf BEIDEN Screens — persistent (nicht nur Projekt-Detail)
✓ Mini-Entity OBEN in Sidebar auf Projekt-Detail (schrumpfender Orb = Spatial-Continuity)
✓ Mini-Entity auf Home: Entity ist im ZENTRUM, Sidebar zeigt nur Projektliste
✓ Atmosphären-Streifen mit ::after Glow (60px, blur 16px)
✓ HandlungsbedarfList LINKS (breiter) | VerlaufFeed RECHTS
✓ Dialog erbt App-Theme — kein forced dark
✓ --d-blue = --accent (nicht --sig-action)
✓ Suggestion-Chips in Gap-Rows aus box.suggestions[] (dynamisch)
✓ BatchReview: Type-Chips TERMIN/ENTSCHEIDUNG/KONFLIKT/STAKEHOLDER/LÜCKE/DOKUMENT
✓ FaktDrill Konflikt: 38px Datumsgröße, 3 Tile-Optionen mit Subtexten
✓ Geist-Font, alle 4 Aurora-Farben, Hex-Tokens
✓ project.stats.naechsterTermin existiert bereits im ViewModel
✓ ImpactPipelinePanel = neue eigenständige Komponente
```

### ❌ Nicht implementieren (war im alten Plan falsch):

```
✗ .dark CSS-Klasse für Themes — stattdessen: data-theme="day"/"night" Attribut
✗ HSL-Token-Format — stattdessen: Hex-Werte
✗ Kein Sidebar auf Projekt-Detail — FALSCH: Sidebar ist korrekt und nötig
✗ VerlaufFeed links (breiter) — FALSCH: HandlungsbedarfList ist links
✗ --d-blue = var(--sig-action) — FALSCH: --d-blue = var(--accent)
✗ Forced dark mode im BatchReview-Dialog
✗ "Was liegt an?" als Prompt-Text — KORREKT: "Was gibt es neues?"
```

### ✅ Was BEHALTEN wird:

```
✓ HandlungsbedarfList Mode-Farben (violet/amber/emerald/cyan) — nicht überschreiben
✓ VerlaufFeed Filter-Tabs
✓ ConflictBanner, StakeholderPopover, ObjectToken, SourceMarker
✓ SubstanzSection — unverändert
✓ useDialog, DialogProvider — Infrastruktur bleibt, nur UI ersetzt
✓ Alle src/lib/** — unberührt
```

---

## Ausführungsreihenfolge

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6

Jede Phase: implementieren → visuell prüfen (Tag + Nacht) → committen → weiter.
NIEMALS zwei Phasen gleichzeitig offen lassen.
```

## Stopp-Bedingungen

Agent MUSS stoppen und fragen wenn:

- Eine Datei in `src/lib/` (außer Format-Dateien) geändert werden soll
- `ProjectViewModel`-Interface geändert werden soll
- Supabase-Schema oder Edge Functions betroffen wären
- BoxRenderer oder bestehende Boxen VOR Fertigstellung von Phase 5 gelöscht werden sollen
- `data-theme` durch `.dark` ersetzt werden soll

---

## Verification Master-Checklist

```
Phase 1: [ ] Geist-Font sichtbar  [ ] data-theme Attribut am Root
         [ ] Day-Modus: warmes Papier  [ ] Night-Modus: dunkel-slate
         [ ] Dot-Klassen funktionieren  [ ] Chip-Klassen funktionieren

Phase 2: [ ] Atmosphäre-Streifen 3px  [ ] ::after Glow 60px
         [ ] is-active: schnellere Pulsation, review-Farbe
         [ ] H1 44px  [ ] Lagebild 24px light
         [ ] Nächster Termin rechts von Chips sichtbar

Phase 3: [ ] Sidebar auf Projekt-Detail (240px)
         [ ] Mini-Entity oben (Orb + "cogni" + Pipeline-Label)
         [ ] Projektliste mit Initialen + Signal-Dots
         [ ] Aktives Projekt hervorgehoben
         [ ] HandlungsbedarfList LINKS, VerlaufFeed RECHTS

Phase 4: [ ] Sidebar auf Home-Screen (ohne Mini-Entity)
         [ ] "Was gibt es neues?" 48px light
         [ ] 4 kreisförmige Icon-Buttons: Datei Einfügen Link Sprache
         [ ] ImpactPipelinePanel rechts: Letzter Impact + JETZT + Pipeline

Phase 5: [ ] BatchReview Day-Modus: helles Theme
         [ ] BatchReview Night-Modus: dunkles Theme
         [ ] Type-Chips korrekt (TERMIN, ENTSCHEIDUNG, etc.)
         [ ] Konflikt-Row: Inline-Chips + Details-Toggle
         [ ] Quellen-Cards expandiert: 2 Cards nebeneinander
         [ ] Lücke-Row: Suggestion-Chips aus Session-Daten
         [ ] CommitButton: blauer Glow wenn alle ready
         [ ] FaktDrill öffnet bei Single-Box-Session
         [ ] Konflikt-Drill: 38px Daten-Darstellung
         [ ] 3 Tiles mit Subtexten + "Als Handlungsbedarf markieren"
         [ ] Gap-Drill: Split-Layout, Suggestion-Chips

Phase 6: [ ] Orbit oberer Bogen (225°)
         [ ] Status-Visuals korrekt (parsing dashed, understanding spin)
         [ ] Klick → BatchReview für dieses Asset
```
