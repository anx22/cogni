# cogni — Design Implementation Plan
> **Adressat:** Lovable Agent
> **Stand:** 2026-05-14 (nach großem Refactor-Commit)
> **Quelle:** HANDOFF.md + Codebase-Analyse Claude Code

---

## Vorab: Was Lovable bereits erledigt hat ✅

Nicht nochmal anfassen — diese Schicht steht:

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

**Layout-Positiv-Überraschung:** `ProjectScreen.tsx` hat bereits `VerlaufFeed (col-span-3 links) | HandlungsbedarfList (col-span-2 rechts)` — genau wie HANDOFF. Nicht ändern.

---

## Architektur-Grundsatz: UI ↔ Logik-Trennung (STRIKT)

```
DARF SICH ÄNDERN (UI-Layer):
  src/index.css                     ← Tokens, Fonts
  tailwind.config.ts                ← Token-Aliase
  src/components/project/*.tsx      ← Visuelle Komponenten
  src/components/entity/*.tsx       ← Entity, SideGrid, Orbit
  src/components/dialog/*.tsx       ← Dialog UI
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
<!-- Ersetze bestehende Font-Links durch: -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;450;500;600;700&family=Geist+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
```

**Datei:** `src/index.css` — Body-Font updaten:
```css
body {
  font-family: "Geist", -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
}
code, kbd, .mono {
  font-family: "Geist Mono", ui-monospace, monospace;
}
```

### 1.2 Design-Tokens ersetzen

**Datei:** `src/index.css` — Den `:root`-Block **vollständig ersetzen** durch:

```css
:root {
  /* ── Tag-Modus (Apple-Oblivion, warmes Papier) ── */
  --surface-0: 40 20% 97%;     /* #faf9f5 — page */
  --surface-1: 0 0% 100%;      /* #ffffff — card */
  --surface-2: 40 15% 93%;     /* #f1efe8 — sunken */
  --surface-3: 40 12% 90%;     /* #ebe9e1 — hover */

  --ink:   220 15% 5%;         /* #0a0b0d */
  --ink-2: 220 8% 26%;         /* #3f4147 */
  --ink-3: 220 5% 47%;         /* #76787f */
  --ink-4: 220 4% 67%;         /* #a8a9ae */
  --hair:  220 15% 5% / 0.08;  /* rgba(10,11,13,.08) */

  /* Signal-Farben */
  --sig-calm:         220 5% 56%;
  --sig-review:       38 92% 41%;
  --sig-review-soft:  42 85% 88%;
  --sig-action:       220 70% 51%;
  --sig-action-soft:  220 65% 92%;
  --sig-conflict:     4 62% 47%;
  --sig-conflict-soft: 6 75% 89%;

  /* Entity-Atmosphäre */
  --entity-aurora-a: oklch(65% 0.22 250);
  --entity-aurora-b: oklch(60% 0.18 280);
  --entity-aurora-c: oklch(68% 0.20 220);

  /* Legacy-Kompatibilität (shadcn/Tailwind) */
  --background:    var(--surface-0);
  --foreground:    var(--ink);
  --card:          var(--surface-1);
  --border:        var(--hair);
  --muted:         var(--surface-2);
  --muted-foreground: var(--ink-3);
  --primary:       var(--sig-action);
  --primary-foreground: 0 0% 100%;
  --radius: 0.75rem;

  /* Schatten */
  --shadow-card: 0 1px 0 rgba(10,11,13,.04), 0 10px 30px -18px rgba(10,11,13,.18);
  --shadow-pop:  0 2px 0 rgba(10,11,13,.05), 0 24px 60px -28px rgba(10,11,13,.25);
}

.dark {
  /* ── Nacht-Modus (Linear-Tech-Dark) ── */
  --surface-0: 228 22% 6%;     /* #0a0b0e */
  --surface-1: 228 20% 11%;    /* #11131a */
  --surface-2: 228 18% 15%;    /* #15171f */
  --surface-3: 228 16% 18%;    /* #1c1f29 */

  --ink:   210 25% 94%;        /* #ecedf0 */
  --ink-2: 220 10% 73%;        /* #b6b8c0 */
  --ink-3: 220 6% 52%;         /* #80828c */
  --ink-4: 220 5% 37%;         /* #5b5d68 */
  --hair:  0 0% 100% / 0.06;

  --sig-calm:         220 5% 52%;
  --sig-review:       42 90% 59%;
  --sig-review-soft:  42 85% 59% / 0.14;
  --sig-action:       225 95% 71%;
  --sig-action-soft:  225 95% 71% / 0.14;
  --sig-conflict:     8 100% 67%;
  --sig-conflict-soft: 8 100% 67% / 0.16;

  --shadow-card: 0 1px 0 rgba(255,255,255,.03), 0 10px 30px -18px rgba(0,0,0,.5);
  --shadow-pop:  0 2px 0 rgba(255,255,255,.03), 0 24px 60px -28px rgba(0,0,0,.6);
}
```

### 1.3 Tailwind-Tokens ergänzen

**Datei:** `tailwind.config.ts` — Im `colors`-Block ergänzen:

```ts
colors: {
  // bestehende behalten, ergänzen:
  'ink':       'hsl(var(--ink))',
  'ink-2':     'hsl(var(--ink-2))',
  'ink-3':     'hsl(var(--ink-3))',
  'ink-4':     'hsl(var(--ink-4))',
  'sig-calm':     'hsl(var(--sig-calm))',
  'sig-review':   'hsl(var(--sig-review))',
  'sig-review-soft': 'hsl(var(--sig-review-soft))',
  'sig-action':   'hsl(var(--sig-action))',
  'sig-action-soft': 'hsl(var(--sig-action-soft))',
  'sig-conflict': 'hsl(var(--sig-conflict))',
  'sig-conflict-soft': 'hsl(var(--sig-conflict-soft))',
}
```

**Verify Phase 1:** App startet, Farben sind warm/neutral (nicht mehr cool blue), Schrift ist Geist. Keine Konsolen-Fehler.

---

## Phase 2 — LageZone Hero-Upgrade
**Dauer:** 1h | **Risiko:** Niedrig | **Datei:** `src/components/project/LageZone.tsx`

### Ziel
Größere, luftigere Typografie. Atmosphären-Streifen oben. Sonst: Struktur unverändert.

### 2.1 Atmosphären-Streifen (oben einfügen)

**Am Anfang der Root-`<div>` in `LageZone.tsx`** folgendes als erstes Kind einfügen:

```tsx
{/* Atmosphären-Streifen */}
<div
  className="absolute top-0 left-0 right-0 h-[3px] z-10 pointer-events-none"
  style={{
    background: `linear-gradient(90deg,
      transparent 0%,
      hsl(var(--entity-aurora-c)) 20%,
      hsl(var(--entity-aurora-b)) 50%,
      hsl(var(--entity-aurora-a)) 80%,
      transparent 100%)`,
    animation: 'cogni-atmosphere-pulse 6s ease-in-out infinite',
  }}
/>
```

In `src/index.css` ergänzen:
```css
@keyframes cogni-atmosphere-pulse {
  0%, 100% { opacity: 0.6; }
  50%       { opacity: 1; }
}
```

Root-`<div>` von LageZone: `relative` hinzufügen falls nicht vorhanden.

### 2.2 Projekt-Titel größer

```tsx
// VORHER:
<h1 className="text-4xl md:text-5xl font-light tracking-tight ...">

// NACHHER:
<h1 className="text-5xl md:text-6xl font-light tracking-[-0.025em] ...">
```

### 2.3 Lagebild-Text größer

```tsx
// VORHER: text-lg font-light
// NACHHER:
<p className="text-2xl font-light tracking-[-0.018em] leading-relaxed text-ink-2">
```

**Verify Phase 2:** Schmaler Gradient-Streifen ganz oben auf Projekt-Screen. Projekttitel deutlich größer. Lagebild-Text luftiger.

---

## Phase 3 — Mini-Entity auf Projekt-Screen
**Dauer:** 1–2h | **Risiko:** Mittel | **Dateien:** `ProjectScreen.tsx`, ggf. `Entity.tsx`

### Ziel
Den Text-Button `← Entität` durch einen kleinen lebendigen Orb + Text ersetzen.

### 3.1 Mini-Entity-Komponente

**Neue Datei:** `src/components/project/MiniEntity.tsx`

```tsx
import { useNavigate } from "react-router-dom";

interface MiniEntityProps {
  onBack: () => void;
  pipelineLabel?: string; // z.B. "verstehe · 0:08"
}

export const MiniEntity = ({ onBack, pipelineLabel }: MiniEntityProps) => {
  return (
    <button
      onClick={onBack}
      className="fixed top-5 left-6 z-50 flex items-center gap-2.5 group"
      title="Zurück zur Entität (⌘ ␣)"
    >
      {/* Mini-Orb */}
      <div
        className="w-[44px] h-[44px] rounded-full relative flex-shrink-0 overflow-hidden"
        style={{
          background: `conic-gradient(
            hsl(var(--entity-aurora-a)) 0deg,
            hsl(var(--entity-aurora-b)) 120deg,
            hsl(var(--entity-aurora-c)) 240deg,
            hsl(var(--entity-aurora-a)) 360deg
          )`,
          animation: 'entity-breathe 6s ease-in-out infinite',
          boxShadow: '0 0 16px hsl(var(--entity-aurora-b) / 0.4)',
        }}
      />
      {/* Label */}
      <div className="flex flex-col items-start">
        <span className="text-[10px] uppercase tracking-[0.2em] text-ink-3 group-hover:text-ink-2 transition-colors">
          Entität
        </span>
        {pipelineLabel && (
          <span className="text-[11px] text-sig-review font-mono">{pipelineLabel}</span>
        )}
      </div>
    </button>
  );
};
```

### 3.2 In ProjectScreen einbauen

**Datei:** `src/components/project/ProjectScreen.tsx`

```tsx
// Import ergänzen:
import { MiniEntity } from "./MiniEntity";

// Ersetze den bestehenden Back-Button:
// VORHER:
<button onClick={onBack} className="fixed top-6 left-8 z-50 text-xs ...">
  ← Entität
</button>

// NACHHER:
<MiniEntity onBack={onBack} />
```

**Verify Phase 3:** Kleiner lebendiger Orb oben links auf Projekt-Screen. Klick → zurück zur Entität.

---

## Phase 4 — Home-Screen Layout
**Dauer:** 2–3h | **Risiko:** Mittel | **Datei:** `src/pages/Index.tsx`

### 4.1 SideGrid Signal-Dots aktualisieren

**Datei:** `src/components/entity/SideGrid.tsx` oder `ProjectTile.tsx`

Signal-Dot-Klassen auf neue Signal-Tokens umstellen:
```tsx
// VORHER: bg-yellow-400, bg-red-400, bg-green-400
// NACHHER:
const signalClass = {
  calm:     'bg-sig-calm',
  review:   'bg-sig-review animate-pulse',
  action:   'bg-sig-action',
  conflict: 'bg-sig-conflict animate-pulse',
}
```

### 4.2 IdlePrompt — 4 schwebende Aktions-Buttons

**Neue Datei:** `src/components/entity/IdlePrompt.tsx`

```tsx
interface IdlePromptProps {
  onNote: () => void;
  onPaste: () => void;
  onUpload: () => void;
  onVoice: () => void;
}

export const IdlePrompt = ({ onNote, onPaste, onUpload, onVoice }: IdlePromptProps) => (
  <div className="flex flex-col items-center gap-4">
    {/* Haupt-Prompt */}
    <div className="h-12 px-6 rounded-full border border-hair bg-surface-1/60
                    backdrop-blur-sm flex items-center text-ink-3 text-[15px]
                    tracking-[-0.005em] cursor-text"
         onClick={onNote}>
      Was liegt an?
    </div>
    {/* 4 Aktions-Buttons */}
    <div className="flex gap-3">
      {[
        { label: 'Notiz', icon: '✏️', action: onNote },
        { label: 'Einfügen', icon: '⌘V', action: onPaste },
        { label: 'Datei', icon: '↑', action: onUpload },
        { label: 'Sprache', icon: '◎', action: onVoice },
      ].map(({ label, icon, action }) => (
        <button key={label} onClick={action}
                className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl
                           bg-surface-1/50 border border-hair hover:bg-surface-2
                           text-ink-3 hover:text-ink-2 transition-all">
          <span className="text-base">{icon}</span>
          <span className="text-[10px] uppercase tracking-[0.15em]">{label}</span>
        </button>
      ))}
    </div>
  </div>
);
```

**In `Index.tsx`:** Unterhalb der Entity-Komponente (wenn idle) einfügen.

### 4.3 Rechte Spalte: IntakeSessionsPanel → PipelineWidget

Das bestehende `IntakeSessionsPanel` ist gut, braucht aber eine schlankere Variante für die Seitenleiste.

**Kurzfristig:** IntakeSessionsPanel mit `compact`-Prop aufrufen oder Header-Bereich reduzieren — **kein Neuschreiben**.

**Verify Phase 4:** Home-Screen zeigt IdlePrompt unterhalb Orb. Signal-Dots pulsieren korrekt. Layout stabil.

---

## Phase 5 — Dialog-System: BatchReview + FaktDrill
**Dauer:** 4–6h | **Risiko:** Hoch | **Wichtigste Phase**

> ⚠️ **Strategie:** Neue Komponenten parallel zu bestehenden bauen. Erst wenn neue fertig und getestet: alten `BoxRenderer` + 8 Box-Komponenten entfernen. Nie mitten drin.

### 5.1 BatchReviewOverlay (Modus A — Intake)

**Neue Datei:** `src/components/dialog/BatchReviewOverlay.tsx`

Verwendet **dieselbe `useDialog()`-Infrastruktur** wie DialogOverlay. Kein neuer Context, kein neues State-Management.

**Layout:**
```tsx
// Portal über alles (z-[100]), dark-mode-erzwungen (className="dark")
// SessionHeader — source | summary "7 Erkenntnisse · 1 Konflikt" | N/N | ESC
// ReviewList — kompakte Tabelle, border-radius 16, 1px border
//   ReviewRow × N — height 48px, Status-Icon | Type-Chip | Content | Decision
// CommitBar — [Alle verwerfen] [N offen · M bereit] [M übernehmen ↵]
```

**Daten-Mapping aus `session.boxes`:**
```ts
// session.boxes aus useDialog() — kein neues Datenmodell nötig
// box.type → row type:
//   'wissen'     → accepted row (grün, gedimmt)
//   'konflikt'   → conflict row (amber left-stripe)
//   'gap_box'    → gap row (amber, empty-circle icon)
//   'zuordnung'  → unassigned row (projekt-auswahl inline)
//
// box.state → row state:
//   'proposed'   → offen, wartet auf Entscheidung
//   'confirmed'  → accepted
//   'rejected'   → verworfen
//   'modified'   → bearbeitet
```

**CommitBar-Logik:**
```ts
// Aus useDialog() bereits verfügbar:
const { session, commitBox, closeDialog } = useDialog();
const ready = session.boxes.filter(b => END_STATES.includes(b.state)).length;
const total = session.boxes.filter(b => b.type !== 'kontext').length;
// CommitButton = alle decided? → blau glühend
// "Alle übernehmen ↵" → session.boxes.forEach(b => commitBox(b.id, 'confirm', {}))
```

**CommitButton Glow (wenn alle ready):**
```css
.commit-btn-ready {
  box-shadow: 0 0 0 6px hsl(var(--sig-action) / 0.18),
              0 8px 24px -8px hsl(var(--sig-action) / 0.5);
}
```

### 5.2 ReviewRow-Implementierung

```tsx
// Row-States und ihre Darstellung:
//
// accepted:   opacity-50, check-icon (sig-calm), kein Interaktions-Element
// conflict:   left-stripe amber (3px), amber dot, zwei Option-Chips inline
// gap:        left-stripe amber, leerer Kreis-Icon, Eingabefeld inline (controlled)
// unassigned: project-select inline
//
// Conflict-Row expanded:
//   Inline-Panel (kein Routing!), zwei Quellen-Cards nebeneinander
//   "vs" (60px circle, conflict-soft bg) + cogni-Empfehlung-Text darunter
```

### 5.3 FaktDrillOverlay (Modus B — In-Projekt)

**Neue Datei:** `src/components/dialog/FaktDrillOverlay.tsx`

Öffnet wenn `session.boxes.length === 1` (Einzel-Fakt aus HandlungsbedarfList).
Folgt App-Theme (kein erzwungenes dark).

**Trigger:** In `HandlungsbedarfList.tsx` — `ActionRow onClick`:
```tsx
// BESTEHEND (nicht ändern):
const { openDialog } = useDialog();
// ERGÄNZEN (nur der onClick):
onClick={() => openDialog(buildHandlungsbedarfSession(item))}
// FaktDrillOverlay erkennt Single-Box-Sessions automatisch
```

**Layout Konflikt-Variante:**
```
[← Handlungsbedarf] · Titel · [source] [esc]
────────────────────────────────────────────
[Fakt A volle Breite]  (vs)  [Fakt B volle Breite]
[Option A] [Option B] [Offen lassen]
```

**Layout Gap-Variante:**
```
[Kontext + Blockiert-Liste (links 2/5)] | [Gap-Card + Eingabe (rechts 3/5)]
```

### 5.4 Router in DialogOverlay

**Datei:** `src/components/dialog/DialogOverlay.tsx` — Routing-Logik ergänzen:

```tsx
// DialogOverlay entscheidet welches UI zu rendern:
const isBatchReview = session.boxes.length > 1;
const isFaktDrill = session.boxes.length === 1;

if (isBatchReview) return createPortal(<BatchReviewOverlay />, document.body);
if (isFaktDrill)   return createPortal(<FaktDrillOverlay />, document.body);
return null; // Fallback
```

### 5.5 Alte Box-Komponenten entfernen (erst nach Verify)

Nach erfolgreicher Implementierung und manuellem Test aller drei Dialog-Pfade:
```
src/components/dialog/BoxRenderer.tsx        → löschen
src/components/dialog/boxes/AktionsBox.tsx   → löschen
src/components/dialog/boxes/AuswahlBox.tsx   → löschen
src/components/dialog/boxes/EingabeBox.tsx   → löschen
src/components/dialog/boxes/GapBox.tsx       → löschen
src/components/dialog/boxes/KonfliktBox.tsx  → löschen
src/components/dialog/boxes/KontextBox.tsx   → löschen
src/components/dialog/boxes/WissensBox.tsx   → löschen
src/components/dialog/boxes/ZuordnungsBox.tsx → löschen
```

**Verify Phase 5:**
1. Neue Datei ablegen → BatchReview öffnet sich, dark mode, kompakte Rows
2. Konflikt-Row: amber Stripe, zwei Option-Chips, expandiert inline
3. "M übernehmen ↵" → Daten korrekt committed, Dialog schließt
4. ActionRow in Handlungsbedarf klicken → FaktDrill öffnet sich, App-Theme
5. ESC schließt immer

---

## Phase 6 — AssetOrbit (Nice-to-have, nach Phase 5)
**Dauer:** 2–3h | **Risiko:** Niedrig | **Datei:** `src/components/entity/AssetOrbit.tsx`

Visualisiert Assets die noch nicht committed sind, als orbiting Chips um die Entität.

**Daten:** `assets[]` aus `useIntake()` oder direkte Supabase-Query mit RLS.
**Filter:** `status IN ('parsing', 'understanding', 'review-ready', 'failed')` AND `committed_at IS NULL`.

**Orbit-Spec:**
```ts
const ORBIT_ARC = 1.25 * Math.PI;       // 225°, startet bei -π/2 - arc/2
const RING_RADIUS = [250, 290];          // ageRing 0 = nah, 1 = weiter

// Asset-Position:
const angle = arcStart + (index / total) * ORBIT_ARC;
const r = RING_RADIUS[item.ageRing ?? 0];
const x = Math.cos(angle) * r;
const y = Math.sin(angle) * r;

// Opacity:
const opacity = 1 - (item.ageRing ?? 0) * 0.45;
```

**Status-Visual:**
```ts
parsing:      'border-dashed border-ink-3'
understanding: 'animate-spin border-t-transparent border-ink-2'  // ring spinner
review-ready: 'border-sig-review animate-pulse'
failed:       'border-sig-conflict'
```

**Verify Phase 6:** Assets die verarbeitet werden kreisen um die Entität. Klick auf Chip öffnet Dialog.

---

## Kritische Mapping-Korrekturen aus HANDOFF

### Was im HANDOFF-Prototype falsch ist (nicht implementieren):
```
❌ HANDOFF: project.lage.chips → neu bauen
✓ KORREKT: project.konflikte[] direkt nutzen (existiert in ProjectViewModel)

❌ HANDOFF: Neue project.lage.naechsterTermin-Prop
✓ KORREKT: project.stats.naechsterTermin (existiert bereits im ViewModel)

❌ HANDOFF: Seitenleiste Sidebar auf Projekt-Screen
✓ KORREKT: Kein Sidebar — bestehendes Layout (fullscreen, kein Grid-Sidebar) beibehalten
```

### Was HANDOFF korrekt identifiziert (implementieren):
```
✓ VerlaufFeed (3/5 links) | HandlungsbedarfList (2/5 rechts) — BEREITS KORREKT IN CODE
✓ Mini-Entity statt Text-Button (Phase 3)
✓ Atmosphären-Streifen (Phase 2)
✓ Geist-Font (Phase 1)
✓ Signal-Farben statt generische Farben (Phase 1)
✓ BatchReview als kompakte Tabelle statt Wizard (Phase 5)
✓ FaktDrill als räumliche Gegenüberstellung (Phase 5)
```

### Was BEHALTEN werden muss:
```
✓ HandlungsbedarfList Mode-Farben (violet/amber/emerald/cyan) — NICHT überschreiben
✓ VerlaufFeed Filter-Tabs — identisch lassen
✓ ConflictBanner, StakeholderPopover, ObjectToken, SourceMarker, FeedbackButton
✓ SideGrid Tile-Grid 2×4 — Layout korrekt, nur Signal-Dot-Visual updaten
✓ SubstanzSection — unverändert
✓ useDialog, DialogProvider — Infrastruktur bleibt, nur UI ersetzt
```

---

## Ausführungsreihenfolge für Lovable

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6

Jede Phase: implementieren → visuell prüfen → committen → weiter.
NIEMALS zwei Phasen gleichzeitig offen lassen.
```

## Stopp-Bedingungen

Agent MUSS stoppen und fragen wenn:
- Eine Datei in `src/lib/` (außer Format-Dateien) geändert werden soll
- `ProjectViewModel`-Interface geändert werden soll
- Supabase-Schema oder Edge Functions betroffen wären
- BoxRenderer oder bestehende Boxen VOR Fertigstellung von Phase 5 gelöscht werden sollen

---

## Verification Master-Checklist

```
Phase 1: [ ] Geist-Font sichtbar  [ ] Tokens warm/neutral  [ ] Dark-Mode ok
Phase 2: [ ] Atmosphäre-Streifen  [ ] H1 größer  [ ] Lagebild text-2xl
Phase 3: [ ] Mini-Orb oben links  [ ] Klick navigiert zurück
Phase 4: [ ] IdlePrompt sichtbar  [ ] Signal-Dots pulsieren
Phase 5: [ ] BatchReview öffnet   [ ] Commit funktioniert  [ ] FaktDrill öffnet
Phase 6: [ ] Orbit sichtbar       [ ] Status-Visuals korrekt
```
