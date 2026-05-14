# UI-Overhaul — Audit & Screen-für-Screen Plan

## Audit (Stand jetzt)

**Bereits sauber getrennt** (laut Plan v2 §"Was Lovable bereits erledigt hat"):

- `src/lib/project/mappers/*`, `projectViewModel.ts`, `useProjectData.ts`, `useProject.ts`
- `src/lib/realtime/useRealtimeTables.ts`, `dialogContext.ts`, `useDialog.ts`
- `src/components/project/shared/*` (CardSurface, SectionLabel, …)
- Edge Functions, kernel, detectors

**Aktueller UI-Stand vs. Zielbild:**


| Bereich                       | Ist                                                                                    | Soll (v2)                                                                 | Risiko                   |
| ----------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | ------------------------ |
| Theme                         | shadcn `:root` HSL + `.dark`                                                           | `[data-theme="day"|"night"]` Hex-Tokens *zusätzlich*                      | mittel — beides parallel |
| Schrift                       | Inter-ähnlich                                                                          | Geist + Geist Mono                                                        | niedrig                  |
| Home (`Index.tsx`)            | Entity zentriert + `SideGrid` links + `IntakeSessionsPanel` rechts                     | 240px AppSidebar + Entity-Center + 280px ImpactPipelinePanel              | mittel                   |
| Projekt (`ProjectScreen.tsx`) | Vollbreite, "← Entität" links, **VerlaufFeed links / Handlungsbedarf rechts** (falsch) | AppSidebar + Mini-Entity oben, **Handlungsbedarf links / Verlauf rechts** | mittel                   |
| LageZone                      | klein, ohne Atmosphären-Streifen                                                       | 44px Title, 24px Lage, animierter Atmosphären-Stripe + Glow               | niedrig                  |
| Dialog                        | 8 BoxKomponenten + BoxRenderer                                                         | BatchReviewOverlay (multi-box) + FaktDrillOverlay (single-box)            | **hoch**                 |
| AssetOrbit                    | nicht vorhanden                                                                        | optional Phase 6                                                          | niedrig                  |


**Stopp-Bedingungen aus v2 (werden eingehalten):**

- Keine Änderungen in `src/lib/**` (außer Format-Dateien)
- `ProjectViewModel`-Interface unberührt
- Keine Schema-/Edge-Function-Änderungen
- Alte Box-Komponenten erst löschen, wenn neue Dialoge produktiv

---

## Vorbereitung (vor Phase 1)

1. **Prototyp-Code als Referenz im Repo ablegen** (nicht gebundlet, reine Lese-Quelle):
  `docs/input/prototype/` ← `cogni/src/{tokens.css, dialog-overlay.jsx, project-detail.jsx, home.jsx, entity.jsx, app.jsx, common.jsx, project-card.jsx, data.js}` und Screenshots.
   → Erlaubt 1:1 Übernahme von Markup/Klassen.  
    
  ja richtig, aber NICHT CODEBASIS verschmutzen, lege die referenzen im DOCS ordner in einem eigenen redesign unterordner an und sammel dort.
2. **Backup-Branch** entfällt (Lovable History übernimmt). Trotzdem nach jeder Phase: vitest + tsc grün, smoke per Browser.
3. **Doku-Setup:** in `docs/NOW.md` neuen Sprint-Block "UI-Overhaul v2" anlegen mit Phasen-Checkliste; in `AGENTS.md` Routing auf `design-implementation-plan.md` ergänzen (Phase-Status-Zeile).

---

## Phasen (strikt sequentiell — keine zwei parallel)

### Phase 1 — Tokens + Geist + Utility-Klassen

**Files:** `index.html`, `src/index.css`, `tailwind.config.ts`, `src/App.tsx` (data-theme-Wrapper)

- Geist/Geist Mono via Google Fonts.
- `[data-theme="day|night"]`-Tokens 1:1 aus `prototype/tokens.css` + Zusatzblöcke aus v2 §1.2.
- Utility-Klassen (`.t-*`, `.dot--*`, `.chip--*`, `.btn*`, `.kbd`, `.card`, `.hairline`, `.atmosphere-stripe`, `entity-breathe`, `cogni-pulse`).
- Tailwind: hex-CSS-Vars als `colors`-Aliase (kein `hsl()` Wrapper).
- **shadcn-Tokens (`:root`, `.dark`) bleiben** — nur additiv.
- App-Root: `<div data-theme="day"> ... </div>` (festwert, Theme-Switch kommt später).

**Verify:** App startet, Geist sichtbar, `data-theme` im DOM, Konsole sauber, vitest grün.
**Doku:** `docs/DECISIONS.md` Eintrag "Dual-Token-Layer (shadcn + cogni)".

---

### Phase 2 — LageZone Hero

**Files:** `src/components/project/LageZone.tsx`, `src/index.css` (atmosphere-Klassen)

- Atmosphären-Streifen 3px + 60px Glow am Top.
- Title 44px / Lage 24px light / Metadata-Block (nächster Termin + letzte Änderung).
- `is-active` an Pipeline-State koppeln (best effort: `useIntake`-Status, falls vorhanden, sonst statisch off).

**Verify:** Tag/Nacht visuell auf `/projekt/<echte-id>`. Snapshot-Test bleibt grün.

---

### Phase 3 — AppSidebar + ProjectScreen-Layout

**Files:** `src/components/sidebar/AppSidebar.tsx` (NEU), `src/components/project/ProjectScreen.tsx`

- AppSidebar 240px wie v2 §3.1. Mini-Entity als Button (`onEntityClick=onBack`), Pipeline-Label optional.
- Signal-State pro Projekt aus `useProjects()`-Daten ableiten (vorhandene Felder); Logik in eine kleine UI-Helper-Funktion in der Komponente — kein lib/-Eingriff.
- ProjectScreen: Outer flex-row → Sidebar + Content. **Grid umdrehen:** `HandlungsbedarfList` links (3fr), `VerlaufFeed` rechts (2fr). Alten "← Entität"-Button entfernen.

**Verify:** Sidebar persistiert, Mini-Orb pulsiert, Klick → Home, aktive Projekt-Row hervorgehoben, Smoke `/projekt/<id>`.

---

### Phase 4 — Home-Screen

**Files:** `src/pages/Index.tsx`, `src/components/home/HomePrompt.tsx` (NEU), `src/components/home/ImpactPipelinePanel.tsx` (NEU)

- Index Layout: Sidebar | Center (Entity + HomePrompt) | ImpactPipelinePanel.
- HomePrompt = "Was gibt es neues?" 48px light + 4 Kreis-Buttons (Datei/Einfügen/Link/Sprache) → bestehende `intake`/`overlayOpen`-Handler wiederverwenden.
- ImpactPipelinePanel: Daten aus `useProjects()` + `change_events` (vorhandener Hook bzw. neuer minimaler Read-Hook in `src/lib/home/`) + `useIntake`-Pipeline-Snapshot.
- `SideGrid` und `IntakeSessionsPanel` werden auf Home **nicht mehr gerendert** (Code bleibt erstmal, Löschung erst nach Phase 5-Verify).

**Verify:** Drei-Spalten-Layout, Drop noch funktional (Window-Drag-Handler bleibt), Realtime-Auto-Open intakt.

---

### Phase 5 — Dialog-System (BatchReview + FaktDrill) — **größtes Risiko**

**Files (NEU):** `src/components/dialog/BatchReviewOverlay.tsx`, `src/components/dialog/FaktDrillOverlay.tsx`, ggf. `src/components/dialog/parts/*` (Row, SourcePair, DecisionTiles).
**Files (geändert):** `src/components/dialog/DialogOverlay.tsx` (Router), `src/index.css` (`[data-dialog]`-Tokens, `.dialog-backdrop`).
**Strategie:**

1. Beide Overlays **parallel** zur bestehenden Box-UI bauen, hinter Feature-Flag (`?dialogV2=1` URL-Param oder `localStorage.cogniDialogV2`).
2. `DialogOverlay`: bei aktivem Flag → Router (`session.boxes.length > 1` → Batch, sonst Drill); ohne Flag → alter `BoxRenderer`.
3. `useDialog`/`commitBox`/`gateReason`/`session`-Vertrag bleibt **unberührt**.
4. Markup/Klassen weitgehend aus `prototype/dialog-overlay.jsx` übernehmen, mit Token-Mapping `--d-* → var(--accent|sig-*)` (v2 §5.1, `**--d-blue = --accent**`).
5. Konflikt-Row Inline-Optionen + Details-Toggle; Gap-Row Suggestion-Chips aus `box.payload.suggestions`/`box.suggestions`.
6. Smoke mit `smoke-welle-b` + Hase&Söhne-Sandbox: Conflict, Gap, Dependency triggern → BatchReview prüft sich; Single-Drill-Pfad über HandlungsbedarfList-Klick.
7. **Erst nach grünem Smoke** Flag entfernen → alte Boxen + `BoxRenderer` löschen.

**Verify-Matrix (Tag+Nacht je):**

- BatchReview öffnet bei Multi-Box-Session, Type-Chips korrekt, Konflikt-Expand zeigt Quellen-Cards, Suggestion-Chips dynamisch, Commit-Glow bei `open===0`, Commit speichert (vergleich `change_events`-Count vor/nach).
- FaktDrill: Konflikt-Variante mit 38px-Datum, 3 Tiles; Gap-Variante mit Suggestion-Chips; ESC schließt; "Speichern" disabled ohne Auswahl.

---

### Phase 6 — AssetOrbit (optional)

Nur wenn Phase 1–5 ruhig laufen. Files: `src/components/entity/AssetOrbit.tsx`. Daten aus `assets`-Tabelle (uncommitted). Keine Backend-Änderung.

---

## Querschnitt: Verify nach jeder Phase

1. `bun run lint` + `tsc --noEmit` (vom Harness ausgelöst).
2. `bunx vitest run` — alle 60+ Tests grün.
3. Browser-Smoke: Home + `/projekt/<echte HafenSöhne-id>` + Dialog-Pfade per `smoke-welle-b`.
4. `code--read_console_logs` & `code--read_network_requests` durchsehen — keine neuen 4xx/5xx.
5. Devlog-Einträge sichten (Pipeline + Realtime).

## Doku-Updates (durchgängig)

- `**docs/NOW.md**`: Sprint-Block "UI-Overhaul v2" mit Phasen-Checkboxen; nach jeder Phase Häkchen + 1-Zeiler.
- `**docs/DECISIONS.md**`: Pro Phase ein Eintrag (Token-Layer, Layout-Drehung Handlungsbedarf↔Verlauf, Dialog-Router/Flag, Box-Komponenten-Löschung).
- `**docs/ARCHITECTURE.md**`: [HARD]-Regel "UI darf nur `ProjectViewModel`-Typen lesen, nie Supabase-Rows" + neue Ordner `src/components/sidebar`, `src/components/home`, `src/components/dialog/parts`.
- `**docs/design-implementation-plan.md**`: bleibt Master-Quelle; nach Abschluss aller Phasen archivieren (Hinweisblock oben + in `DECISIONS.md` referenzieren), nicht löschen.
- `**AGENTS.md**`: Phase-Status-Zeile aktualisieren.

## Rückrollbarkeit

- Phase 1–4: kleine, isolierte Edits → Lovable-History reicht.
- Phase 5: Feature-Flag = harter Schalter; alte Boxen bleiben bis Verify.

## Was ich am Ende abliefere

Nach jeder Phase: kurze Statusnachricht (was gebaut, was verifiziert, Tag/Nacht-Smoke-Resultat) + Doku-Updates committet. Nach Phase 5 zusätzlich: explizite Bestätigung dass alte Box-UI entfernt ist und keine Referenzen mehr existieren (`rg`-Check).