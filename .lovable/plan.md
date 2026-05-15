# Lösungsvorschläge — Audit-Punkte A3, A4, B1, B2, B3, B5, C2, C3, D1–D4

Präzise, umsetzbare Lösungen pro Punkt. Jeder Block: **Befund → Fix → Betroffene Dateien → Akzeptanzkriterium**. Reihenfolge nach Wirkung gruppiert.

---

## A3 · Vertikale Kollision Voice / Hint / HomePrompt auf Home

**Befund.** `EntityVoice` ist `absolute bottom-[8%]`, Hint `bottom-[3%]`, `HomePrompt` sitzt direkt unter dem 320px-Kern mit `marginTop: 28`. Auf 390×701 (iPhone) und allen Höhen < ~820 px überlappen Voice-Bubble und die 4 Action-Kreise.

**Fix.**

1. Home-Layout in einen **Flex-Column-Stack** umbauen statt absolute Positionierung:
  ```
   <main flex flex-col min-h-0 h-full>
     <div flex-1 grid place-items-center>  ← Entity + AssetOrbit
     <div shrink-0>                         ← HomePrompt | InputOverlay
     <div shrink-0>                         ← EntityVoice + Hint (Footer-Slot)
   </main>
  ```
2. `EntityVoice` und der Hint kommen aus dem `absolute`-Layer raus und werden zu einem regulären, niedrigen Footer (`min-height: 56px` reserviert, damit kein Layout-Sprung beim Erscheinen).
3. Entity-Größe wird responsive: `clamp(220px, 38vh, 320px)` statt fix 320 px.
4. `HomePrompt`-Buttons-Größe via Container-Query oder Breakpoint: `< 700 px Höhe → 48 px statt 64 px Buttons + gap 16 statt 24`.
5. `prefers-reduced-motion` respektieren (kein `animate-float-in`).

**Dateien.** `src/pages/Index.tsx`, `src/components/home/HomePrompt.tsx`, `src/components/entity/EntityVoice.tsx`.

**Akzeptanz.** Auf 390×701 und 1440×900: keine Element-Überlappung, Entität bleibt vertikal mittig im freien Raum, Voice-Footer ist immer sichtbar wenn aktiv.

---

## A4 · Doppelte Drag-Handler (Window + Entity)

**Befund.** `Index.tsx` und `Entity.tsx` haben jeweils eigene Drag-Handler mit unterschiedlichen States (`HomeDropOverlay` vs. `internal: "hover"`). Race-Conditions auf iOS/Safari werden mit Visibility/Blur-Resets nur kompensiert.

**Fix.**

1. Neuer Hook `src/lib/intake/useDropZone.ts`:
  ```ts
   useDropZone({
     scope: "window" | "element",
     ref?: RefObject<HTMLElement>,
     enabled: boolean,
     onDrop: (files: File[]) => void,
   }) → { isDragging: boolean }
  ```
   Kapselt: Counter-Logik, Window-Safety-Resets (visibility/blur/dragend), `dropEffect`-Setzung, MIME-Filter (`types.includes("Files")`).
2. In `Index.tsx` einmal mit `scope: "window"`. In `Entity.tsx` lokale Drag-Logik **entfernen** (oder optional `scope: "element"` für visuellen `hover`-State). Entity reagiert nur noch auf den `isDragging`-Flag des Window-Scopes.
3. Eine einzige State-Quelle für Drag-Status — `HomeDropOverlay` und Entity-Internal-State teilen sie.
4. Tests: `src/lib/intake/useDropZone.test.ts` mit jsdom (drag enter/leave-counter, busy-Pfad).

**Dateien.** Neu: `src/lib/intake/useDropZone.ts` (+ Test). Refactor: `src/pages/Index.tsx`, `src/components/entity/Entity.tsx`, `src/components/project/ProjectScreen.tsx` (gleiche Logik dort).

**Akzeptanz.** Drag/Drop-Verhalten unverändert für Endnutzer; ein einziger Counter, keine doppelten Listener; Entity zeigt visuellen Hover-State synchron mit `HomeDropOverlay`.

---

## B1 · Header-Switcher dupliziert Sidebar

**Befund.** Sticky Header rechts trägt `ProjectSwitcher` + `ProjectHeaderActions`, gleichzeitig liegt die volle Projektliste in der linken Sidebar. Auf Desktop ist das redundant und drückt Hero nach unten.

**Fix.**

1. `ProjectSwitcher` aus dem projekt entfernen —  
  
Sticky Header schrumpft auf: linker Bereich = aktueller Projektname + Statusdot, rechter Bereich = nur `ProjectHeaderActions` (`MoreHorizontal`-Menu).
2. Auf Mobile (`useIsMobile`): aktiven Projektnamen als Tap-Target zeigen, der den ⌘K-Picker öffnet (kein Tastatur-Shortcut auf Touch).

**Dateien.** `src/App.tsx` (Palette-Singleton), `src/components/project/ProjectScreen.tsx` (Header schlanker), `src/components/project/ProjectSwitcher.tsx` (Trigger-Variante: `as="palette" | "button"`).

**Akzeptanz.** Header-Höhe ~52 px (statt aktuell ~58 px mit Switcher-Pill). ⌘K funktioniert auf jeder Route, nicht nur ProjectScreen. Mobile hat klaren Wechsler-Tap.

---

## B2 · Vier-Rollen-Modell visuell unsichtbar

**Befund.** `LageZone` hat keinen Eyebrow, `Substanz` hat einen, `Handlungsbedarf`/`Verlauf` haben `SectionLabel` aber unterschiedlich gewichtet. Die Memory-Entscheidung „Vier-Rollen" ist nicht erfahrbar.

**Fix.**

1. Neue Komponente `src/components/project/shared/RoleHeader.tsx`:
  ```tsx
   <RoleHeader role="lage|handlung|verlauf|substanz" title="…" right={…} />
  ```
   rendert konsistent: Eyebrow (uppercase 11 px tracking-0.2em) + H2 (`text-2xl font-light`) + optionalen Right-Slot (Counts, Filter).
2. Mapping fix:
  - **Lage** → Eyebrow „Status" + H1 = Projektname (Sonderfall, Inverse-Hierarchie)
  - **Handlungsbedarf** → Eyebrow „Operatives Zentrum"
  - **Verlauf** → Eyebrow „Chronologie"
  - **Substanz** → Eyebrow „Inhalt"
3. Atmosphären-Stripe (`atmosphere-stripe`) **nur** auf LageZone — sie ist die einzige Hero-Zone. Die anderen drei bekommen einen Section-Divider mit dünner Linie + 80 px Vertikalabstand zur klaren Rhythmik.
4. Optional: linker Margin-Indikator (4 px farbiger Balken in Section-Farbe) als persistente Rollen-Erkennung beim Scrollen.

**Dateien.** Neu: `RoleHeader.tsx`. Anpassen: `LageZone.tsx`, `HandlungsbedarfList.tsx`, `VerlaufFeed.tsx`, `SubstanzSection.tsx`.

**Akzeptanz.** Beim Scrollen erkennt der Nutzer sofort, in welcher der 4 Rollen er ist. Visual Snapshot Test: 4 Section-Header haben identische Typografie, unterschiedliche Eyebrows.

---

## B3 · Substanz mischt Themen + Dokumente ohne Hierarchie

**Befund.** Beide rendern als gleichwertige Surface-2-Cards. Themen sind konzeptuell Drilldown-Einstiege, Dokumente nur Quellenliste.

**Fix.**

1. Themen behalten **Card-Surface** (Drilldown-Einladung), bekommen Grid-Layout `md:grid-cols-3` und einen sanften Hover-Lift.
2. Dokumente verlieren das `bg-surface-2 + shadow-card-glow` und werden zur **klaren Tabellen-/Listen-Zeile** auf `bg-transparent` mit nur unteren Hairline-Dividers (`divide-y divide-border-subtle/40`). Spalten: Typ · Name · Datum · Quelle.
3. Reihenfolge umdrehen: erst **Dokumente** (Quellen → kompakt), dann **Themen** (Verdichtung → größer). Begründung: Quellen sind Substanz-Basis, Themen sind die Verarbeitung. Alternative: Toggle „Quellen | Themen" oben — diskutieren.
4. Vertikalabstand zwischen den beiden Blöcken: 96 px statt aktuell `space-y-14`.

**Dateien.** `src/components/project/SubstanzSection.tsx`.

**Akzeptanz.** Themen wirken als „Räume zum Reingehen", Dokumente als „Liste der Quellen". Visuell unterscheidbar ohne zu lesen.

---

## B5 · Empty-State von LageZone wirkt wie Skelett

**Befund.** Bei `status === "empty"` rendert die volle LageZone (Hero, Stripe, Stakeholder-Slots, Konflikt-Banner-Bereich) — alles leer — und darunter ein zentrierter Hinweis. Wirkt wie defekter Loader.

**Fix.**

1. `LageZone` erhält einen `variant: "full" | "shell"` Prop. Im Shell-Modus rendert sie nur:
  - Atmosphären-Stripe
  - Eyebrow „Projekt"
  - editierbaren Projektnamen (groß, zentriert)
  - eine einzige sanft animierte Zeile: „Noch keine Substanz. Lege etwas ab — ich beginne mit dem Verstehen."
2. Drag-Hint direkt unter dem Namen, mit Pfeil zur Mitte des Screens, optional kleiner pulsierender Dropzone-Outline.
3. Sektionen Handlungsbedarf/Verlauf/Substanz **nicht** rendern (`status === "empty"` Pfad in `ProjectScreen.tsx` macht das schon — aber LageZone selbst muss reduziert sein).

**Dateien.** `src/components/project/LageZone.tsx` (`variant`-Prop), `src/components/project/ProjectScreen.tsx` (Übergabe).

**Akzeptanz.** Empty-Project zeigt eine ruhige Bühne statt fragmentarischen Hero, ohne defekten Eindruck.

---

## C2 · Escape schließt Overlay ohne Sicherheitsabfrage

**Befund.** `DialogOverlay` ruft `closeDialog()` direkt bei `Escape`, auch wenn 6 Boxen offen sind. Verstößt gegen Review-First.

**Fix.**

1. In `DialogOverlay.tsx`: Bei Escape erst prüfen `openCount > 0`. Wenn ja, **nicht schließen**, stattdessen `dirtyCloseRequested` State setzen.
2. `BatchReviewOverlay` zeigt dann einen Inline-Hint im Commitbar-Bereich („Du hast {n} offene Erkenntnisse. Esc nochmal drücken zum Schließen.") + Mini-Timeout (3 s) bevor Hint verschwindet. Zweites Escape innerhalb des Fensters → echte Schließung über bestehenden `ConfirmDestructive`-Dialog: „Review schließen mit {n} offenen Punkten?".
3. Bei `openCount === 0` bleibt Esc-Verhalten unverändert (sofortiges Schließen).
4. Außerklick (Backdrop) verhält sich wie Escape (gleicher Pfad).

**Dateien.** `src/components/dialog/DialogOverlay.tsx`, `src/components/dialog/BatchReviewOverlay.tsx` (neuer optionaler Inline-Hint-Slot).

**Akzeptanz.** Esc bei offenen Boxen erfordert Bestätigung. Bei sauberem Stand schließt es sofort. Kein Datenverlust durch versehentliches Esc.

---

## C3 · Kein klarer Mode-Indikator (Batch vs. Drill)

**Befund.** `SessionHeader` zeigt nur Quelle + Summary. Nutzer erkennt nicht, in welchem Modus er ist.

**Fix.**

1. `SessionHeader` erhält einen `mode: "batch" | "drill"` Prop.
2. Visuelle Differenzierung im Eyebrow:
  - Batch: Pulse-Dot in `var(--d-blue)` + Label „Review · Batch · {sourceLabel}"
  - Drill: Pulse-Dot in `var(--c-accent)` + Label „Review · Detail · {factTitle}"
3. Beim Modus-Wechsel (Batch → Drill, weil nur noch 1 Box offen) eine 220 ms `framer-motion`-Crossfade auf dem Header und auf dem Content-Container. Kein Hart-Switch.
4. Im Drill-Modus zusätzlich „Zurück zur Übersicht"-Button im Header (nur wenn ursprünglich aus Batch gekommen — `useDialog()` muss einen `entryMode`-State führen).

**Dateien.** `src/components/dialog/parts/SessionHeader.tsx`, `src/components/dialog/DialogOverlay.tsx` (Crossfade-Wrapper), `src/components/dialog/dialogContext.ts` (entryMode), evtl. `framer-motion` (vermutlich schon installiert, sonst kleines `transition-opacity`-CSS).

**Akzeptanz.** Modus ist sofort erkennbar; Übergang wirkt ruhig statt sprunghaft; Drill kennt Rückweg in Batch.

---

## D1 · Drei verschiedene Card-Surfaces

**Befund.** `CardSurface` (rounded-xl, surface-2, shadow-card-glow), Inline-Cards in `HomePrompt` (Action-Buttons), `ProjectTile`, `ImpactPipelinePanel` — alle ähnlich aber leicht unterschiedlich.

**Fix.**

1. `CardSurface` um `variant`-Prop erweitern:
  ```tsx
   variant: "default" | "interactive" | "circular" | "flat"
  ```
  - `default`: aktueller Look
  - `interactive`: + Hover-Lift + Cursor
  - `circular`: 50% Radius (für HomePrompt-Action-Buttons)
  - `flat`: ohne Shadow (für nested Surfaces)
2. Inline-Card-Styles in `HomePrompt`, `ProjectTile`, `ImpactPipelinePanel` durch `<CardSurface variant="…" />` ersetzen.
3. Token `--shadow-card-glow` zentral in `index.css` halten — keine inline `boxShadow: "var(--shadow-card-cogni)"` mehr.

**Dateien.** `src/components/project/shared/CardSurface.tsx` (Variants), `src/components/home/HomePrompt.tsx`, `src/components/entity/ProjectTile.tsx`, `src/components/home/ImpactPipelinePanel.tsx`.

**Akzeptanz.** Eine Surface-Implementierung, vier dokumentierte Varianten. Visueller Snapshot identisch zu vorher.

---

## D2 · Inline-Style + Tailwind-Mix

**Befund.** `HomePrompt`, `AppSidebar`, `LageZone`, `Index.tsx`, `SessionHeader` mischen `style={{...}}` mit Tailwind. Token-Diziplin (HSL-Variablen über semantische Tokens) bricht.

**Fix.**

1. **Migration in zwei Schritten:**
  - Schritt A: Inline-Layout-Werte (`padding`, `gap`, `width`, `borderRadius`) → Tailwind-Klassen.
  - Schritt B: Inline-Farb-Tokens (`color: "var(--ink-3)"`, `background: "var(--surface-1)"`) → Tailwind-Klassen, die diese Tokens nutzen.
2. Tailwind-Config-Erweiterung in `tailwind.config.ts`:
  ```
   colors: {
     ink:   { DEFAULT: "hsl(var(--ink))", 2: "...", 3: "...", 4: "..." },
     surface: { 0, 1, 2, 3 },
     hair:  { DEFAULT, 2 },
     sig:   { conflict, review, action, calm }
   }
  ```
   plus Box-Shadow-Token `card-cogni`.
3. Lint-Regel ergänzen: ESLint-Custom-Rule oder grep-Pre-commit-Hook, der `style={{` in `src/components/**` warnt (nur explizit erlaubte Komponenten via Allowlist: `Entity.tsx`, dynamische Animationen).

**Dateien.** `tailwind.config.ts`, alle oben genannten Komponenten, `.husky/pre-commit` (oder eslint-rule).

**Akzeptanz.** `grep -R "style={{" src/components` hat < 10 Hits, alle in dokumentierten Animations-Komponenten. Theme-Wechsel (`data-theme="night"|"day"`) wirkt überall.

---

## D3 · Doppelte Typo-Skala (`t-*` vs. Tailwind)

**Befund.** `t-display`, `t-body`, `t-small`, `t-micro` (in `index.css`) parallel zu `text-xs/sm/base/lg/xl/2xl`. Manche Sections mischen beides.

**Fix.**

1. **Entscheidung:** `t-*` als Single Source — sie repräsentieren die Designhaltung („große Typo, Ruhefläche") besser als generische Tailwind-Stufen.
2. `t-*` in `tailwind.config.ts` als `fontSize`-Tokens spiegeln, damit Tailwind-Klassen verfügbar bleiben:
  ```
   fontSize: {
     "display": ["clamp(2rem, 5vw, 3rem)", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
     "body":    ["1rem", { lineHeight: "1.55" }],
     "small":   ["0.8125rem", ...],
     "micro":   ["0.6875rem", { letterSpacing: "0.06em", textTransform: "uppercase" }],
   }
  ```
   → `text-display`, `text-body`, `text-small`, `text-micro`.
3. Migration: `text-xs` → `text-micro`, `text-sm` → `text-small`, `text-base` → `text-body`, `text-2xl/3xl` für Section-Hero → `text-display`.
4. `t-*`-Klassen in `index.css` auf `@apply text-display` etc. umstellen, dann nach 1-2 Wochen entfernen.
5. Style-Guide in `docs/DECISIONS.md` ergänzen (kurzer Eintrag „Typo-Skala — vier Stufen, keine Tailwind-Default-Sizes").

**Dateien.** `tailwind.config.ts`, `src/index.css`, projektweite Codemod (`rg + sed` oder manueller Sweep), `docs/DECISIONS.md`.

**Akzeptanz.** Eine dokumentierte Skala. Keine `text-xs|sm|base|2xl` mehr in `src/components/{project,home,entity,dialog}/`.

---

## D4 · Body-Scroll-Lock an zwei Stellen

**Befund.** `Index.tsx` und `ProjectScreen.tsx` setzen jeweils `body.overflow=hidden` mit eigenem Cleanup. Race bei Route-Wechsel möglich.

**Fix.**

1. Neuer Hook `src/lib/ui/useBodyScrollLock.ts`:
  ```ts
   useBodyScrollLock(active: boolean): void
  ```
  - Hält ein Modul-internes Set aller aktiven Lock-Owner.
  - Setzt `body.overflow="hidden"` und `overscrollBehavior="none"` nur, wenn das Set zuvor leer war.
  - Cleanup entfernt nur den eigenen Owner; restauriert die Originalwerte erst, wenn das Set wieder leer ist.
2. `Index.tsx` und `ProjectScreen.tsx` rufen nur noch `useBodyScrollLock(true)`. Der bisherige Inline-`useEffect`-Block fliegt raus.
3. Tests: `useBodyScrollLock.test.ts` mit jsdom — Mount/Unmount-Reihenfolge prüfen, dass Body-Style nicht leakt.

**Dateien.** Neu: `src/lib/ui/useBodyScrollLock.ts` (+ Test). Refactor: `src/pages/Index.tsx`, `src/components/project/ProjectScreen.tsx`.

**Akzeptanz.** Bei Wechsel `/` → `/projekt/:id` → `/` bleibt Body korrekt locked, danach beim Verlassen (z.B. Navigate zu `/orb-lab`) sauber freigegeben.

---

## Empfohlene Implementations-Reihenfolge

1. **D4** (Body-Scroll-Lock) — kleinster Schnitt, sofortige Stabilität.
2. **A4** (Drop-Zone-Hook) — entkoppelt Drag vor allen Layout-Änderungen.
3. **D1, D2, D3** (Token-/Surface-/Typo-Hygiene) — Voraussetzung für saubere visuelle Refactors.
4. **B2, B5** (Rollen-Header, Empty-Variant) — Projekt-Screen-Klarheit.
5. **A3** (Home-Layout-Stack) — sichtbarste Mobile-Verbesserung.
6. **B1** (Header schlanker, ⌘K global) — UX-Vereinfachung.
7. **C2, C3** (Dialog-Sicherheit + Mode-Indikator) — Review-First-Härtung.

Geschätzter Gesamtaufwand: ~6–8 fokussierte Implementations-Slots à ~45–90 min.

## Offene Produktentscheidungen (vor Implementierung klären)

1. **B3-Reihenfolge**: Dokumente vor Themen oder umgekehrt? (Vorschlag: Dokumente zuerst, weil Quellen Vertrauensbasis sind.)
2. **C2-Verhalten**: Doppel-Esc oder direkter Modal-Confirm bei offenen Boxen?
3. **D3-Migration**: Codemod-Sweep auf einmal oder schrittweise pro Komponentengruppe?