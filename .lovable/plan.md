
# Plan — Fact-Seed, Pipeline-Verifikation & Audit-Response

Zwei Blöcke: zuerst **echter Pipeline-Durchlauf** mit Fakten, dann **Audit-Findings** mit Konsequenz + Lösung pro Punkt. Du entscheidest pro Finding (fix / defer / ignore), bevor ich code.

---

## Phase 1 — Facts seeden & End-to-End verifizieren

**Ziel:** Beweisen, dass `asset → parsed_document → proposed_facts → review_cases → canonical_facts → graphiti_sync_log → Neo4j` real durchläuft, nicht nur in Tests.

**Schritte:**
1. **Seed-Asset einspielen** (text + ein PDF/Mail) über bestehenden Intake-Flow als eingeloggter Preview-User. Kein neuer Code, nur Trigger.
2. **Pipeline tracen** über echte Tools:
   - `supabase--read_query` auf `pipeline_events` (correlation_id), `proposed_facts`, `review_cases`, `canonical_facts`, `graphiti_sync_log`
   - `inspect-pipeline` Edge Function für Endzustand pro Asset
   - `inspect-graphiti` + `railway-admin graphiti-probe` für Spiegel-Vertrag (Episode + Entities in Neo4j sichtbar?)
   - `inspect-langsmith` für Prompt-/Trace-Verifikation
3. **RAG-Smoke**: Graphiti-Search auf einen geseedten Fakt → erwartete Treffer? `_shared/clients/graphitiSearch.ts` direkt über eine Test-Edge-Funktion oder `railway-admin raw`.
4. **Report**: Tabelle „Stage · Soll · Ist · OK/Fail · Hinweis". Bei Fail → Ursache (RLS / Sync-Queue / Graphiti-URL / Prompt) benennen, Fix-Vorschlag.

**Bezug zum Tech-Schulden-Punkt „10 failed / 24 queued"**: in diesem Schritt prüfe ich `graphiti_sync_log` mit status='failed' explizit, gruppiere die Errors, schlage Reconcile-Strategie vor (vermutlich `graphiti-reconcile` Function).

---

## Phase 2 — Audit-Findings: Konsequenz + Lösung

Format pro Punkt: **Was passiert real · Risiko · Vorschlag · Aufwand (S/M/L)**.

### Tech-Schulden

**T1 · `RawProjectData: any[]`** (`projectViewModel.ts:36`)
- Real: Mapper sind robust, aber jede Schema-Drift in Supabase fällt erst zur Render-Zeit auf.
- Risiko: M — Silent Breakage bei DB-Änderung.
- Vorschlag: Generische Row-Types aus `supabase/types.ts` ableiten (`Tables<'canonical_facts'>` etc.) als `RawProjectData`. Kein neues Lib, kein Zod nötig auf dieser Layer.
- Aufwand: **S**.

**T2 · Graphiti-Sync-Backlog (10 fail / 24 queued)**
- Real: Fakten in Supabase, nicht im Graphen → RAG liefert veraltetes Bild.
- Vorschlag: (a) `graphiti_sync_log` nach Phase 1 auswerten, (b) `graphiti-reconcile` Function targeted laufen lassen, (c) Dashboard-Zeile in `PipelineHealth.tsx` für „queued/failed > Schwelle" mit Re-Sync-Button.
- Aufwand: **M**.

**T3 · `aol-service/app/graph.py` Stubs vs. TS-Detektion**
- Real: Zwei Welten, semantische Drift.
- Vorschlag: Header-Kommentar in `graph.py` „CANONICAL DETECTION LIVES IN supabase/functions/commit-fact/*. These stubs are intentional no-ops." + Eintrag in `DECISIONS.md`. Kein Code-Verschieben.
- Aufwand: **S**.

### Backlog-Risiken

**B1 · React Query fehlt**
- Real: Nach Mutation kein Auto-Invalidate, Realtime-Hooks tragen die Last.
- Vorschlag: Nur einführen, wenn ein konkretes Bug-Pattern auftritt. Vorher: dokumentieren in `NOW.md` als bewusstes Defer. Falls Kapazität → in einem isolierten Schritt `useProject` + `useProjects` migrieren, nichts anderes.
- Aufwand: **L** (nicht jetzt empfohlen).

**B2 · Keine echten E2Es**
- Real: Vor UI-Overhaul blind.
- Vorschlag: 3 Playwright-Smokes (Login → Drop Asset → sehe Review-Box / Konflikt commit → sehe canonical / Project Rename → DB updated). Mehr nicht. Lokal + CI nightly.
- Aufwand: **M**.

**B3 · LOC-Budget**
- Real: 17.9k FE-LOC.
- Vorschlag: Kein Refactor um des Refactors willen. Im Redesign-Plan Komponenten-Konsolidierung (Dialog-Parts, Project-Shared) als Akzeptanzkriterium aufnehmen.

### Bugs (priorisiert)

**U1 · Umbenennen no-op** (`LageZone.tsx:18-19`, `ProjectScreen.tsx`)
- Real: User klickt, nichts passiert. Vertrauensbruch.
- Vorschlag: `forceEdit`/`onEditDone` real verdrahten — `useEffect` mit `ref.current?.focus()` + `document.execCommand('selectAll')` wenn `forceEdit`. `onEditDone` nach `onBlur`/Enter aufrufen.
- Aufwand: **S**. **Fix sofort.**

**U2 · Bulk-Confirm stumm** (`BatchReviewOverlay.tsx:36-42`)
- Real: Klick ohne Reaktion = Freeze-Gefühl.
- Vorschlag: `canBulk` enger fassen: nur true wenn ≥1 Box auto-bestätigbar (also nicht konflikt/gap/eingabe/auswahl). Sonst Button disabled mit Tooltip „Nur manuelle Entscheidungen offen". Plus Toast wenn handler 0 verarbeitet.
- Aufwand: **S**. **Fix sofort.**

### Reibungspunkte

**U3 · Konflikt-Inhalt hinter „Details"** (`ReviewRow.tsx:76-173`)
- Real: Kritischste Boxen brauchen Extra-Klick.
- Vorschlag: Für `box.type === 'konflikt'` Variante A/B default expanded, sonst collapsed. Kein neuer State.
- Aufwand: **S**.

**U4 · ↵-Hint ohne Handler** (`BatchReviewOverlay.tsx:89`)
- Vorschlag: Entweder `keydown` Enter→Bulk-Confirm verdrahten (mit Guard auf Focus außerhalb von Inputs), oder Symbol entfernen. Ich empfehle **verdrahten**, da konsistent mit Drill-Overlay.
- Aufwand: **S**.

**U5 · contentEditable Projektname** (`LageZone.tsx:36-45`)
- Vorschlag: `spellCheck={false}`, `onBlur` mit Empty-Guard → Original wiederherstellen + Toast „Name darf nicht leer sein".
- Aufwand: **S**. Im selben Diff wie U1.

**U6 · Fake Voice-Visualizer** (`InputOverlay.tsx:258-263`)
- Real: Ehrlichkeitsproblem, kein Feedback ob Mic wirklich hört.
- Vorschlag: Echten RMS aus `useVoiceRecorder` (gibt's bereits via `MediaStream`) auf 8 Bins mappen, `requestAnimationFrame`. Kein neues Package.
- Aufwand: **M**.

**U7 · AssetOrbit-Label-Truncation** (`AssetOrbit.tsx:154`)
- Vorschlag: Bei URL-Pattern Domain extrahieren (`new URL(x).hostname`) statt char-cut. Touch-Fallback: long-press → Popover mit Volltext.
- Aufwand: **S** (Domain-Extract), **M** (Long-Press Popover).

**U8 · Keine Client-Typvalidierung im File-Drop** (`InputOverlay.tsx:212-219`)
- Vorschlag: Whitelist (`pdf, txt, md, eml, msg, docx, png, jpg, ...`) als Konstante in `lib/intake/`, beim Drop früh ablehnen mit Toast. Server-Side Check bleibt Source of Truth.
- Aufwand: **S**.

**U9 · „Offen lassen" = Reject** (`ReviewRow.tsx:110-114`)
- Real: Semantisch falsch, nicht reversibel.
- Vorschlag: Drei Optionen — (a) Button entfernen (Review-First-Konsequenz), (b) Label zu „Verwerfen" + Confirm-Modal, (c) neuen `BoxState 'deferred'` einführen. Empfehlung: **(b)** kurzfristig, **(c)** als Decision für später.
- Aufwand: **S** für (b), **L** für (c).

**U10 · Kein Undo nach Commit**
- Real: Architektonisch gewollt laut Memory („Review-First, final"), aber UX-Risiko.
- Vorschlag: Kein Undo. Stattdessen **Confirm-Schwelle**: Bulk-Confirm > N Boxen → `ConfirmDestructive`-Dialog mit Liste. Single-Box: optimistisches UI mit 5s-Snackbar „Rückgängig" (lokaler Revert vor `commit-fact`-Antwort, danach hart final). Decision-Eintrag.
- Aufwand: **M**.

---

## Vorgeschlagene Reihenfolge nach deiner Freigabe

1. **Phase 1** komplett (Seed + Verifikation + Sync-Backlog-Auswertung).
2. **Sofort-Fixes**: U1, U2, U5, U4, U8 (alles S, ein Diff pro Datei-Cluster).
3. **Reibung**: U3, U7-Domain, U9(b).
4. **Tech-Schulden**: T1, T3.
5. **Größere Brocken** (nach Bestätigung): U6 (echter Visualizer), U10 (Confirm-Schwelle), T2 (Reconcile-UI), B2 (Playwright-Smokes).

Sag mir nach Phase 1: welche Findings JA, welche raus, welche später.
