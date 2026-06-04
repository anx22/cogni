# DECISIONS — Append-only

Format: `[YYYY-MM-DD] Entscheidung — Reason`

---

## 2026-06-03 — Wave 3 / 10x-Triage

- `2026-06-03` **Wave 3 „Lebendiges System"**: LS-1 Confidence Decay · LS-2 Project Pulse · LS-3 Review-Badge — auf bestehenden Flächen, kein Dashboard. Backlog L6–L14. 10x-Analyse (2026-05-18) ausgewertet und aufgelöst.
- `2026-06-03` **Email-Direct-Connect (L4)**: stärkster Adoptions-Hebel, aber V2/Privacy/OAuth → bewusst geparkt.

## 2026-06-03 — M4: Bedeutungs-Integrität & Entity-Identität

- `2026-06-03` **Risk-Gate + Impact in `isRisky()` (S1)**: `canSilent` gated nur auf Confidence → `isRisky()` in `factRules.ts` blockiert zusätzlich `decision`, `modality∈{risk,exclusion,condition,assumption}`, `delta_type∈{replace,contradict,merge}`, `against_fact_id` auf decision/deadline/status; Impact (Architektur/Budget-Bezug) gefaltet. Confidence ≠ Tragweite.
- `2026-06-03` **„Anders"/Related-not-same (S2)**: kontextuelle Aktion nur bei confirm-Kandidat; committet als `add` + Negativ-Link-Saat. Ähnlich ≠ Gleich verhindert häufigste KG-Korruption.
- `2026-06-03` **`entity_link_rejections` statt `change_events`**: `change_events.event_type` ist `public.delta_type` — kein freies `link_rejected` möglich. Eigene Tabelle mit S3, gelesen in S4/S5. S2 migrationsfrei.
- `2026-06-03` **Generische `entities` + `entity_aliases`** (bounded enum: person/organization/topic/tool/artifact): `persons`/`organizations` nie geschrieben → Identitäts-Schicht. Nur Identität, keine Beziehungen/Prädikate.
- `2026-06-03` **Graphiti-primär + lokaler Guard**: Graphiti semantisch, Guard (normalisierter Name + E-Mail) fängt Fail-soft-Loch. `matched_via` geloggt. `linker.ts` wird ersetzt.
- `2026-06-03` **Feedback-Schleife minimal (S5)**: Resolver konsumiert `entity_link_rejections`; Reject = Negativ-Signal mit Grund-Taxonomie. Kein Prompt-Lernen (L1).
- `2026-06-03` **Beleg via Segment-Referenz (S0)**: Zitat auf `parsed_documents.segments[].element_id` abgebildet, Modell + Prompt-Version in `provenance`; an jeder Review-Card. Kein Rohtext-Speichern (DSGVO).
- `2026-06-03` **Fakt-Status abgeleitet (S7)**: `factStatus()` aus `valid_until/superseded_by` + offenen `contradictions` → `active|superseded|contradicted|deprecated|needs_review`. Keine Spalte, kein Drift.
- `2026-06-03` **Needs-source + Escalate (S8)**: `escalate:true` wird bisher ignoriert (Bug); Needs-source fehlt ganz → beide als echte Aktionen. Split bleibt gestrichen.
- `2026-06-03` **Pre-commit Supersede-Emission (S9, spätere Stufe)**: Resolver markiert replace/contradict vor dem Commit → Review-Case sofort als Supersede/Konflikt. Größerer Umbau → nach S3/S4.

## 2026-06-02 — Entity-Core-Modul

- `2026-06-02` **`src/lib/entity/` als eigenständiges Modul**: Zustand war `useState` in `Index.tsx`, Verhalten verteilt, keine Tests → reines Gehirn (machine/signals/interaction/signalMapping/deriveExpression/capabilities), Signal-Interface, `EntityProvider`-Singleton. Phasen A+0 auf dev. Spec: `docs/entity-core.md`.
- `2026-06-02` **Ordner-Hygiene (Phase A)**: 7 Fremd-Komponenten raus aus `components/entity/` → `home/` + `project/`. `RecentAssets` (kein Importeur) gelöscht.
- `2026-06-02` **kein ⌘+Space-Overlay**: gestrichen, Entität bleibt persistent via `EntityRail` (M2).

## 2026-05-30 — M1: Empfehlung-First

- `2026-05-30` **Empfehlung dominiert**: Konflikt-Drill von A/B-neutral zu Empfehlung-First (36px) + Vergleich sekundär. `payload.empfehlungBlock` zentral in `buildKonfliktSession`. Vergleich bleibt Fallback bei ähnlicher Confidence.
- `2026-05-30` **Bausteine statt Prozentwerte**: „5 Tage neuer · direkte Quelle" statt „87 %". Berater-Stimme statt Maschinen-Stimme.
- `2026-06-01` **Empfehlungs-Vertrag über alle Drilldowns**: einheitliches `Empfehlung`-Interface in `types.ts`, deterministische Heuristiken in den Mappern. Kein LLM-Signal.

## 2026-05-26 — UX-Konzepttreue

- `2026-05-26` **Sprachschicht beim Mapper**: Pipeline-Vokabular gehört nicht ins UI → `quelle` als fachliche Kategorie in `toHandlungsbedarf`/`sessionFactories`.
- `2026-05-26` **Lage ≠ Verlauf**: `humanizeSnapshotSummary` filtert generische Commit-Log-Muster; Lagetext aus aktuellem Zustand (Konflikte/Blocker/Ruhefall).
- `2026-05-26` **Objekt-spezifisches Drill-Routing**: `buildKonfliktSession` / `buildGapSession` / `buildDependencySession` statt generischer Frame.
- `2026-05-26` **Overlay-Surfaces mit Cogni-Tokens**: `--surface-1` + `--hair-2` + `--shadow-pop` statt `bg-popover`-Bridge (Drift im Day-Theme).
- `2026-05-26` **Substanz als Wissensfläche**: Themen-Karten mit Beschreibung + Mini-Zeilen statt Titel + Zahlen.

## 2026-05-24 — Redesign + Doku-Cleanup

- `2026-05-24` Redesign-Pässe 1–6 durch. `.lovable/plan.md`, `REVIEW.md`, `Cogni.zip` gelöscht. Visuelle Quelle: `docs/redesign/prototype/` + `screenshots/`.
- `2026-05-24` Stopp-Linie: keine `src/lib/**`-Eingriffe für reine Designwünsche.

## 2026-05-22 — K1/K2/K4 + Test-Overhaul + Doku-MainCompass

- `2026-05-22` **K1 `delta_type_unclear`-Migration**: ENUM-Erweiterung als Vorrats-Fix (Wert in TS seit 05-19, DB hatte ihn nicht).
- `2026-05-22` **K2 Vier-Rollen-E2E-Smoke**: Playwright `04-vier-rollen-smoke.spec.ts` + `_persona.ts`. Node-TS in `e2e/` statt Deno (Playwright läuft ohnehin in Node).
- `2026-05-22` **K4 Graphiti-Retry-Loop**: `graphiti_sync_log.last_retry_at`, Partial-Index, `selectRetryCandidates()` als Pure-Function, Cron via `pg_net`.
- `2026-05-22` **Vitest 70 → 89**: neue Tests für `deriveSignal`, `loadSession`, `assignment`, `factRules`; Drift-Fixes; Stub gelöscht.
- `2026-05-22` **`NOW.md` als MainCompass**: drei Achsen (Vision/Status/Pläne), alle Sprint-Docs aufgelöst. Pflege-Regel: Einträge > 14 Tage → DECISIONS.

## 2026-05-21 — Detektoren + Drilldowns

- `2026-05-21` **`inspect-graphiti` Diagnose-Action**: Reason-Normalisierung als Pure-Module, UUID/Zahlen gebucketed. 7 Tests.
- `2026-05-21` **`agentClient` Logger-Thread**: `log.stage` statt `console.warn` für Prompt-Version-Breadcrumbs.
- `2026-05-21` **SubstanzSection-Drilldown**: `ThemaVM.items` (decisions + open_points via `canonical_fact_id`), `buildThemaSession` als reichhaltiger Inspect-Dialog.
- `2026-05-21` **Topic-Merge Full-Stack**: `sync_topic_from_canonical_fact`-Trigger, `topic_merge_candidates`-Tabelle, `topicMergeDetector`, `topic-merge` Edge Function, `__submitIntent.kind=topic_merge`-Routing.

## 2026-05-20 — Antwort-Pipeline + Modality-Audit

- `2026-05-20` **`__submitIntent`-Pattern**: Factory-Sessions persistieren über `submitNote` → `intake-trigger`. Ein Pipeline-Pfad, kein `note-create`-EF. `hinweis: "Persistenz folgt"` entfernt.
- `2026-05-20` **Delta-Tag in ReviewRow**: `review_cases.context.delta_type` → `DeltaChip` (add/replace/contradict/merge; confirm zeigt nichts).
- `2026-05-20` **Modality-Audit**: 7 tote Click-Pfade gefixt (`aktion`-Branch, Sekundär-Inline-Edit, `LageZone`-Button-Verdrahtung, Factory-„folgt"-Lügen entfernt).

## 2026-05-18 — Modalitäts-Vertrag

- `2026-05-18` **Drei Achsen statt `fact_type` allein**: Modalität (11 Werte) · `attaches_to` · `asks` (`null` = kein Eingabefeld). `understood` + `evidence` zusätzlich.
- `2026-05-18` **`mapToBoxType` priorisiert Modalität**: Konflikt schlägt alles; Legacy ohne Modalität fällt auf altes Verhalten.
- `2026-05-18` **Stille Substanz**: `confidence ≥ 0.9 && asks=null && !conflict && modality∉{question,unclear}` → kein Review-Click. Schwelle in `SILENT_COMMIT_CONFIDENCE`.
- `2026-05-18` **Drift-Telemetrie**: `modality=unclear` → `pipeline_events warn` mit Samples.

## 2026-05-14 — Welle B + QA-Härtung + Refactors

- `2026-05-14` **Detektoren (B-W1–B-W4)**: Linker (Graph-Match), ConflictDetector, GapDetector, DependencyDetector — alle pure + fail-soft + idempotent + `Promise.all` nach `mirrorToGraphiti`. LLM-Verfeinerung = Wave 3.
- `2026-05-14` **Godfile-Eliminierung (Welle C)**: `commit-fact` 673→70, `intake-understand` 561→56, `projectViewModel` 467→160 LOC.
- `2026-05-14` **`withErrorBoundary`**: Pflicht-Wrapper für alle Edge Functions. Last-Resort-Catch + 500 mit `correlation_id`.
- `2026-05-14` **`_shared/http.ts` + `_shared/auth.ts`**: eine Quelle für CORS-Headers + Auth. Functions mit eigener Response-Shape behalten lokale Wrapper.
- `2026-05-14` **`useRealtimeTables`**: zentraler Channel-Boilerplate statt 8× Drift.
- `2026-05-14` **`_shared/inspector.ts`**: Action-Map-Wrapper für inspect-\* Functions.
- `2026-05-14` **`_shared/clients/{railway,langsmith}.ts`**: typsichere Mini-Clients statt duplizierter Fetch-Logik.
- `2026-05-14` **`railway-admin` modular**: `index.ts` Router (~70 LOC) + `handlers/<domain>.ts`.
- `2026-05-14` **B3.1 → `useBoxSubmit`-Hook**: konfig-getriebener BoxBuilder abgelehnt (kein Lines-Win, +Indirektion). Tatsächliche Wiederholung gekapselt.
- `2026-05-14` **`factRules.ts`**: `LINKABLE_FACT_TYPES` + `FACT_SUMMARIZERS` statt hardcodierter Type-Switches.
- `2026-05-14` **3-Schichten-Hook-Pattern**: `useXData` (Queries) + `xViewModel` (Mapper, testbar) + `useX` (Composition).
- `2026-05-14` **JSONB-Validierung via Trigger** statt CHECK (CHECK muss IMMUTABLE sein).
- `2026-05-14` **ESLint `no-unused-vars`/`prefer-const`/`eqeqeq`/`no-console` auf `error`**, Husky 9 + lint-staged + Prettier 3.
- `2026-05-14` **Theme-System**: Cogni-Hex-Tokens unter `[data-theme="day|night"]` additiv zu shadcn-HSL. `c-surface-*`, `sig-*`, `cogni-btn*` als Tailwind-Aliase.
- `2026-05-14` **`pipeline_events`-Tabelle** mit RLS + Index auf `(asset_id)`, `(run_id)`, `(fn,ts)`.
- `2026-05-14` **Graphiti-422-Fix**: `addMessage()` setzt `role="user"` als Default; `graphiti-backfill` zieht ungemirrorte Facts nach.
- `2026-05-14` **`test_run_id`-Marker** in Fixtures + `test-data-sweep` Edge Function + Nightly-Cron.
- `2026-05-14` **Docs nach `docs/`**: nur `AGENTS.md` + `README.md` in der Wurzel.
- `2026-05-15` **`graphiti_sync_log.status='ok'` direkt**: Mirror-Send synchron → sofort `ok` statt `queued`.
- `2026-05-15` **`canBulk` enger**: nur `wissen|aktion|zuordnung|kontext`; Disabled-Tooltip; Enter-Shortcut.
- `2026-05-15` **`supportedFileTypes.ts`**: Client-Validierung für Drop/Upload (Archive/Programme abgelehnt).

## Vor 2026-05-14

- `2026-05-13` **Graphiti statt Cognee**: bessere Episode-Semantik, native LangGraph-Integration.
- `2026-05-13` **Graphiti-Mirror async + Client-UUID**: Mirror-Fehler brechen Commit nicht.
- `2026-05-13` **AOL-Service nur Read über Graphiti**: Schreibpfade ausschließlich in Cloud-Edge-Functions.
- `2026-05-12` **Projekt-Zuordnung**: Lexikalisches Scoring + Assignment-Agent als Tie-Breaker.
- `2026-05-12` **Manuelle Eingaben**: nur `SourceMarker.manuell=true`, kein eigenes Datenmodell.
- `2026-05-11` **Keine klassische Sidebar**: Orientierung über Zustandswechsel. **Revidiert 2026-05-18**: persistente `AppSidebar` (Projektliste, Home + Projekt-Detail) eingeführt — User-Test zeigte fehlende Projekt-Übersicht, Zustandswechsel allein reichte nicht. Vision-Doks 2026-06-03 entsprechend angepasst.
- `2026-05-11` **Entity-Visual: CSS-Gradients** statt Canvas — Theme-Tokens nutzbar, ruhige Performance.
