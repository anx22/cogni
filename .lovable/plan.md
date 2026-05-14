# UI-Overhaul v2 — Phase 4 + Phase 5 (Plan)

> Master: `docs/design-implementation-plan.md`. Phase 1–3 sind ✅. Stopp-Bedingungen aus `NOW.md` gelten weiter (kein `src/lib/**`-Edit außer Format, kein `ProjectViewModel`-Vertragsbruch, kein Schema-/Edge-Function-Edit).

---

## Phase 4 — Home-Screen 3-spaltig (Risiko: Mittel)

Ziel: `Sidebar (240px) | Entity + HomePrompt (Zentrum) | ImpactPipelinePanel (280px)`. `SideGrid` & `IntakeSessionsPanel` aus dem Home-Layout entfernen (Dateien stehen lassen — Cleanup nach Phase-5-Verify).

### 4.1 Neue Komponenten
- `src/components/home/HomePrompt.tsx` — H1 „Was gibt es neues?" + Subline + 4 kreisförmige Buttons (Datei / Einfügen / Link / Sprache) gemäß Prototyp `home.jsx::IdlePrompt + FloatingAction`. Props: `onUpload`, `onPaste`, `onLink`, `onVoice`, `onNote`. Reine UI.
- `src/components/home/ImpactPipelinePanel.tsx` — Right-Aside 280px mit drei Sections:
  - **Letzter Impact** — letzte 4–6 Einträge aus `change_events` (24h, je `created_at desc`), formatiert via `fmtRelative` aus `dateFormatters`. Pro Eintrag: `timeAgo`, Beschreibung, `→ Projektname`. Datenquelle: neuer Hook `useRecentChanges()` als reine Read-Wrapper-Datei in `src/lib/home/useRecentChanges.ts` (DB-Read, keine Geschäftslogik → erlaubt da `home/` keine Vertragsfile ist; alternativ inline im Component-File, um `src/lib/`-Touch ganz zu vermeiden — **wir wählen inline im Component**).
  - **Jetzt** — aktiver Pipeline-Snapshot aus `useIntake()`-Status. Wenn keine Aktivität: Section weglassen.
  - **Pipeline** — Aggregation aus `useProjects()` (`signal`-Counts). Vier Zeilen: Intake / Verstehen / Review fällig / Konflikt mit `dot--*` und Counts. Footerzeile „heute · X eingegangen · Y committed" aus `assets`+`change_events` Today-Count (lazy, kann Phase 4.x später, MVP zeigt Counts ohne Footer).

### 4.2 Index.tsx Layout-Umbau
- Root: `flex` Row, `min-h-screen`, `background: var(--surface-0)`.
- Mounten:
  - `<AppSidebar projects={liveProjects} activeProjectId={undefined} onProjectSelect={handleProjectClick} onCreateProject={handleCreateProject} showMiniEntity={false} />`
  - Zentrum: `<main>` mit `Entity` + `HomePrompt` + bestehendem `EntityVoice` + `InputOverlay`-Logik unverändert.
  - `<ImpactPipelinePanel />`.
- Entferne aus dem Markup: `SideGrid`-Block + `IntakeSessionsPanel`-Block. `MobileNavSheet`, `HomeDropOverlay`, `AccountDrawer`, `CreateProjectDialog` bleiben.
- Drag/Drop-Handler, Realtime, Voice-Logik **unverändert**.

### 4.3 Verify Phase 4
- `bun run lint`, `tsc --noEmit`, `vitest` (60+ grün halten).
- Browser-Smoke: Desktop (1440×900) → 3-Spalten visible. Mobile (375×812) → Sidebar hidden via `md:flex` (bestehend), Entity zentriert, HomePrompt sichtbar.
- Drop-Smoke: Datei droppen → `intake()` triggert wie zuvor, Overlay öffnet bei review-ready.

---

## Phase 5 — Dialog-System Overhaul (Risiko: Hoch)

> Strategie: Neue Overlays **parallel** zur alten `BoxRenderer`-Welt bauen, hinter Feature-Flag aktivierbar. Erst nach grünem Smoke alten Code entfernen.

### 5.1 Token-Mapping + Backdrop
- `src/index.css` — `[data-dialog]` Block mit `--d-*` → `var(--surface-*) / var(--ink*) / var(--accent*) / var(--sig-*)`. `--d-blue = var(--accent)` (NICHT sig-action, kritisch).
- `.dialog-backdrop` Klasse mit `backdrop-filter: blur(28px) saturate(1.1)` und `color-mix(in oklab, var(--surface-0) 78%, transparent)`.

### 5.2 Neue Komponenten
- `src/components/dialog/parts/ReviewRow.tsx` — drei Varianten via Discriminated Union: `accepted` | `conflict` | `gap`. Stripe-Border, Type-Chip (mono uppercase), Inline-Chips für Konflikt-Optionen, Suggestion-Chips für Gap. Props beziehen sich auf `DialogBox` (`type === "konflikt" | "gap" | sonst angenommen`).
- `src/components/dialog/parts/SessionHeader.tsx` — Geteilt von Batch & Drill. Liest `session.anlass` als `source`, baut Summary aus `boxes`-Counts.
- `src/components/dialog/BatchReviewOverlay.tsx` — Vollbild (`fixed inset-0 z-[100]`), `data-dialog`, Backdrop-Klasse, `SessionHeader` + Liste aller `session.boxes` (außer `kontext`/`zuordnung` als gestackte Hinweise oben) + `CommitBar`.
  - **Mapping `DialogBox → Row`:**
    - `wissen` / `aktion` / `auswahl` (state ∈ END_STATES) → `accepted`
    - `konflikt` → `conflict` Row, Optionen aus `payload.options[]`
    - `gap` → `gap` Row, Suggestions aus `payload.suggestions[]`
    - `eingabe` → `gap`-Variante mit Input (gleiche Komponente, `mode="input"`)
    - `zuordnung` → fix oben, blockiert „Übernehmen" (gateReason aus `useDialog()` re-use)
  - `useDialog()`-Vertrag unverändert: `commitBox(boxId, "confirm"|"reject", userDecision)` für jede Row, „M übernehmen ↵" iteriert Pending-Boxen confirm.
- `src/components/dialog/FaktDrillOverlay.tsx` — Single-Box-Pfad (`session.boxes.length === 1`).
  - Konflikt-Variante: Alert-Banner + 2-Quellen-Card (38px Datum) + 3 Decision-Tiles + Footer (`Verwerfen` / `Entscheidung speichern →`).
  - Gap-Variante: 2/5+3/5 Split-Layout, Eingabe + Suggestions.
  - Quelle: `box.payload.{sourceA,sourceB,suggestions,...}` — vorhandene Felder wie in `KonfliktBox`/`GapBox` nutzen, **keine Schema-Änderung**.

### 5.3 Router-Switch in `DialogOverlay.tsx`
- Feature-Flag: `localStorage.cogniDialogV2 === "1"` ODER URL `?dialogV2=1` → neue Overlays. Sonst alte `BoxRenderer`-Pfad bleibt aktiv.
- Wenn V2:
  - `decisionBoxes.length === 1` → `<FaktDrillOverlay />`
  - sonst → `<BatchReviewOverlay />`

### 5.4 Verify Phase 5 (vor Cleanup)
- `vitest` grün, `lint`, `tsc`.
- Live-Smoke in Sandbox-Workspace „Hase & Söhne Couture": Datei droppen → BatchReview öffnet sich (V2-Flag), App-Theme erbt (Tag hell), Konflikt-Row inline-Chips funktionieren, „M übernehmen" committed via `commit-fact` (Edge-Function-Logs prüfen via `inspect-pipeline`).
- Single-Box-Pfad: Eskalierte Konfliktbox aus Project-Screen → FaktDrill öffnet sich, ESC schließt.
- Token-Sanity: `--d-blue` resolved zu `--accent` (DevTools-Inspect).

### 5.5 Alte Boxen entfernen (nur wenn 5.4 grün)
- Lösche: `BoxRenderer.tsx`, `boxes/{Aktion,Auswahl,Eingabe,Gap,Konflikt,Kontext,Wissen,Zuordnung}Box.tsx`, `BoxFrame.tsx`, `BoxStateBadge.tsx`.
- `DialogOverlay.tsx`: Flag-Logik raus, V2 als einziger Pfad.
- Re-run `vitest` + `lint` + `tsc`.

---

## Phase 6 — AssetOrbit (Skip in dieser Runde)
Optional, laut Master-Plan nice-to-have. Nicht Teil dieses Tickets — wenn Phase 4+5 grün, separat anstoßen.

---

## Doku-Updates
- `docs/NOW.md` — Phase 4 / 5 Sprint-Block aktualisieren (✅ nach jedem Schritt), Recently-Completed-Eintrag pro Phase.
- `docs/DECISIONS.md` — pro Phase ein Eintrag: 2026-05-14 · Problem → Choice → Reason (Phase 4: 3-Spalten-Home + ImpactPipeline aus useProjects/change_events; Phase 5: V2-Overlays parallel via Flag, Token-Mapping `--d-blue → --accent`).
- `design-implementation-plan.md` bleibt Master, am Ende von Phase 5 archiviert (Hinweis-Zeile, Datei nicht löschen).

## Reihenfolge & Stop-Gates
1. Phase 4 vollständig + Verify → Doku-Update.
2. Phase 5.1 + 5.2 + 5.3 (Flag-Pfad) + Verify 5.4 → erst dann 5.5 Cleanup.
3. Wenn 5.4 rot: V2-Komponenten reparieren, alte Boxen bleiben Default, kein Cleanup.

## Was nicht passiert
- Keine Edits in `src/lib/dialog/**`, `src/lib/project/**`, `supabase/functions/**`.
- `ProjectViewModel`-Vertrag unangetastet.
- Phase 6 (AssetOrbit) später.
- Keine neuen Dependencies.
