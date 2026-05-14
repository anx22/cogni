# NOW — Aktueller Sprint & Backlog

> Co-Doku zu `AGENTS.md`, `PRODUCT.md`, `ARCHITECTURE.md`, `DECISIONS.md`.
> Seam-Inventar (lebende QA-Karte) in `./qa-seam-inventar.md`.

---

## Aktueller Sprint — Welle B abgeschlossen, Konsolidierung

Stand 2026-05-14, post-Audit:

- **Welle B komplett:** B-W1 Linker (Graph-Match) · B-W2 Conflict · B-W3 Gap · B-W4 Dependency — alle live, fail-soft, idempotent, parallel via `Promise.all` nach `mirrorToGraphiti`.
- **Tests:** commit-fact 36/36 grün (4 commitFact + 6 conflict + 8 gap + 8 dep + 10 projectScoring) · Vitest 60/60 · Deno gesamt 50/50.
- **Detektor-Footprint Sandbox:** Reels-Projekt zeigt 1 Dep + 1 Gap; übrige Sandbox-Projekte zu klein/sauber für Treffer. Pfad ist verdrahtet — kein Bug, Datenmangel.
- **A-Tier + B-Tier + Welle B:** keine offene strukturelle Schuld. Verbleibende Punkte sind Loops (Sync-Diagnose, console.warn) oder bewusst Wave-3-Backlog.
- **Audit-Detail:** `docs/audit-2026-05-14.md` → Re-Audit-Abschnitt am Ende.

### Echte Restschuld (Loops, nicht Features)

1. **Graphiti-Sync-Diagnose** — 24h: 29 ok / 10 failed / 24 queued. Diagnose via `inspect-graphiti diagnose` als eigener Loop.
2. **`_shared/` console.warn → Logger** — 12 best-effort-Stellen (graphiti, promptHub, agentClient, testFixtures, logger).
3. **Vier-Rollen-Screen User-Smoke** — 5-min Klickpfad nach Welle B.
4. **Welle-B-Use-Case-Smoke** — 1 Task „blockiert von …" in Sandbox, Dep-Karte verifizieren.


### Vorheriger Sprint — Welle B-W3 Gap-Detector live

Stand 2026-05-14, 14:00 UTC:

- B-W3 Gap-Detector deployed (3 Kinds, idempotent, fail-soft, 8 Pure-Tests).

### Vorheriger Sprint — Welle B-W1 Linker live (Graph-Match)

Stand 2026-05-14, 12:50 UTC:

- **Wave-A-Stabilität verifiziert.** `graphiti-reconcile` invoked → 14/14 pending facts resolved, `canonical_facts.graphiti_uuid` 100 % befüllt. Latest-status-per-entity (24h): 29/29 ok. Master-Checklist Punkt 1 effektiv ✅.
- **Logger-Coverage 16/16.** Inspector-Funktionen (inspect-graphiti, inspect-langsmith, inspect-railway) sind über `_shared/inspector.ts` (`withErrorBoundary` + `createLogger`) bereits transitiv instrumentiert.
- **Claude-Review-Abgleich:** 5 von 9 Punkten veraltet (Graphiti-422, commit-fact-Godfile, useProject-God-Hook, strictNullChecks, JSONB-Validation, E2E-Smokes alle erledigt). Details in `audit-2026-05-14.md`.
- **B-W1 Linker auf Graph-Match deployed.** Neuer `_shared/clients/graphitiSearch.ts` (fail-soft Wrapper). `linker.ts` async-erweitert: zuerst exact title, dann Graph-Evidenz (Hit-Substring + same-fact_type-Title), Fallback bleibt Title-only. `understandRun.ts` holt Hits parallel pro Fakt. 6 Linker-Tests grün, 14 Bestandstests grün → 20/20.

### Vorheriger Sprint — Welle B vorbereitet (V1–V4 grün)

Stand 2026-05-14, 12:30 UTC:

- Re-Verifikation Master-Checklist: 8/10 grün, 2 LOC-Budgets dokumentiert akzeptiert.
- V1–V4 alle erfüllt; Nebenfix `inspect-graphiti` URL-Härtung deployed.

### Vorheriger Sprint — Tier B4 + Abschluss-Audit abgeschlossen

Stand 2026-05-14:

- **B4.1 Session-Factory generalisiert** → `mkSession()`-Helper in
  `sessionFactories.ts`. 8 Factories umgestellt, öffentliche Signaturen 1:1.
  Vitest 5/5 grün.
- **B4.2 `withLogging`-Wrapper** → `_shared/withLogging.ts` (createLogger +
  handleOptions + try/finally flush). **2 von 6 Functions migriert**
  (asset-delete, project-delete) — Curl 400/403 wie vorher. 4 weitere skipped
  (eigene catch-Pfade, s. DECISIONS).
- **B4.3 factRules extrahiert** → `intake-understand/factRules.ts` mit
  `LINKABLE_FACT_TYPES` Set + `FACT_SUMMARIZERS` Map. Neue Fact-Types nur
  noch via Map-Eintrag, kein switch mehr.
- **Audit** → `docs/audit-2026-05-14.md`: A-Tier komplett, B-Tier mit
  dokumentierten Verschiebungen abgeschlossen. Findings: Graphiti-Sync-Rate
  60 % / 24h (unter SLA), 9 `console.warn` in `_shared/`, LOC-Budget
  überschritten — alle als separate Loops, kein Refactor-Backlog mehr.

Verify: Vitest 60/60 grün · `intake-understand`, `asset-delete`,
`project-delete` deployed.

### Tier B3 — Größere Restrukturierungen (vorher)

- **B3.2 `railway-admin` modularisiert** → 599-LOC-Monolith → Router (72 LOC)
  + `_helpers.ts` (145 LOC) + 6 Domänen-Handler unter `handlers/`.
- **B3.1\* Box-Hook** → `useBoxSubmit(box, opts)` in
  `src/lib/dialog/useBoxSubmit.ts`. Migriert: AuswahlBox, KonfliktBox, GapBox.

---

## Vorheriger Sprint — Tier B2 abgeschlossen

Stand 2026-05-14 (Tier B2 — Mittlere Refactors):

- **B2.1 `useRealtimeTables`** → neuer Hook in `src/lib/realtime/useRealtimeTables.ts`
  (Multi-Table-Channel, optionaler `onTrigger` mit Debounce, per-Listener-Handler).
  Migriert (8 Stellen): `useProjectData`, `useProjects`, `Index.tsx`,
  `PipelineHealth`, `IntakeSessionsPanel`, `RecentAssets`, `useEntityVoice`,
  `useNamespace`. Channel-Boilerplate eliminiert, kein `Math.random()`-Channel
  mehr.
- **B2.4 Service-Clients** → `supabase/functions/_shared/clients/langsmith.ts`
  + `clients/railway.ts` (typsicherer GraphQL-Wrapper). Migriert:
  `inspect-langsmith`, `inspect-railway`, `railway-admin` (über Adapter-Shim,
  Call-Sites unverändert). Graphiti-Client (`_shared/graphiti.ts`) war bereits
  gut und blieb unverändert.
- **B2.3 Inspector-Skelett** → `_shared/inspector.ts` (`inspector(fnName,
  actions, opts)`) standardisiert CORS, Auth, Logger, Body-Parse, Action-
  Dispatch und Error-Wrapping. Migriert: `inspect-langsmith`, `inspect-railway`,
  `inspect-graphiti`. **`inspect-pipeline` bewusst belassen** — Selektor-API
  passt nicht ins Action-Map-Modell.
- **B2.2\* Mapper-Split** → verschoben. `projectViewModel.ts` ist nach A3.2
  bereits klar strukturiert; reiner Datei-Split bringt keinen funktionalen
  Gewinn.

Verify: Vitest 60/60 grün. Edge-Functions deployed. `railway-admin/list`
liefert 200 mit echten Workspace-Daten. Die 3 Inspektor-Errors (LangSmith
422, Railway-Token-Scope, Graphiti-URL) sind preexisting Konfig-Themen,
keine Regression.

### Vorher/jetzt-Endmetriken
Vitest 10 Files / 60 Tests · Deno 19 Tests · ESLint 0 Errors ·
Logger-Abdeckung 16/16 · Realtime-Channels via Shared-Hook ·
Service-Clients zentralisiert.

---

## Backlog (nach Priorität)

1. **Loops aus Re-Audit** *(operativ)*
   - Graphiti-Sync-Diagnose (`inspect-graphiti diagnose`, failed-Reasons gruppieren).
   - Vier-Rollen-Screen User-Smoke nach Welle B.
   - Welle-B-Use-Case-Smoke in Sandbox (Task „blockiert von …").
   - `_shared/` console.warn → Logger (12 Stellen, niedrige Priorität).

2. **Out of scope heute — Wave 3** *(bewusst zurückgestellt)*
   - LLM-Heuristiken für Linker/Conflict/Gap/Dep (über deterministische Pfade hinaus).
   - React Query (Caching/Mutations).
   - Browser-E2E mit Playwright (Persona-Cookies).
   - LOC-Budget-Reduktion auf Plan-Targets (FE <14k / BE <2.3k).


---

## Recently completed

- **2026-05-14 (Tier A3)** Architektur-Härtung abgeschlossen. **A3.3:** DB-Trigger `validate_fact_content` auf `canonical_facts` + `proposed_facts` — pro `fact_type` Pflichtfelder, `RAISE EXCEPTION` mit Prefix `fact_content_invalid:`. Garbage-Insert nachweislich blockiert. **A3.2:** `useProject.ts` (514 LOC) in 3 Dateien zerlegt — `useProjectData.ts` (Queries + Realtime), `projectViewModel.ts` (pure Mapper, 9 Funktionen), `useProject.ts` (40 LOC Composition). 20 neue Vitest-Tests in `projectViewModel.test.ts`, ProjectScreen-Interface 1:1 erhalten. **A3.1:** `strictNullChecks: true` in `tsconfig.app.json` + `tsconfig.json` aktiviert — `tsc --noEmit` grün ohne weitere Fixes (Code war robuster als erwartet). Endmetriken: Vitest 10 Files / **60 Tests** · ESLint 0 Errors auf neuem Code.
- **2026-05-14 (Sandbox-Seed)** Drei fiktionale QA-Sandbox-Projekte angelegt unter User `account@animatex.de`: **Hase & Söhne Couture** (Fashion, Frau Hase ändert ständig Farben), **Tübingen Tower** (Archviz, 72m vs 87m Konflikt), **Spätzbohrer 4.0** (Industrie, Maggus + ISO-Audit). Pro Projekt: Org + Persons + Stakeholder-Links + Note-Asset + Source + ParsedDocument + 3 ProposedFacts + 3 ReviewBoxes. 3 Boxes via `commit-fact` bestätigt → 3 canonical_facts + 3 change_events + 3 graphiti_sync_log (queued, async). Ab jetzt laufende QA-Begleitung — siehe DECISIONS-Eintrag.
- **2026-05-14 (A1+A2 Plan)** Tier A1 verifiziert (Graphiti-Mirror live ohne 422, `intake-trigger` instrumentiert, `console.log`-frei). A2.1 Kernel-Tests um `replace`-Pfad ergänzt (4 Deno-Tests). A2.3 Logger-Abdeckung **100 %** — `inspect-pipeline`/`-graphiti`/`-langsmith`/`-railway` + `railway-admin` instrumentiert (try/finally-Flush). A2.4 `lint-staged` auf `--max-warnings 0`, `qa-nightly.yml` um Lint+Typecheck+Vitest+Prettier+Build+Deno-Tests erweitert.
- **2026-05-14 (Stage 7)** Audit-Restschuld geschlossen: Logger in `voice-transcribe`/`asset-delete`/`project-delete`, CI-Smoke-Job `smoke` in `qa.yml` blockt jeden neuen `console.log` außer `_shared/logger.ts`. `aol-callback` refaktoriert zu pure `handleCallback({admin,payload,log})` mit 5 Deno-Tests. Drei E2E-Smokes in `src/test/e2e-smokes.test.ts` (Note→intake-trigger / Asset-Delete / Fakt-Retract).
- **2026-05-14 (Stage 5–6)** Phase-4-Gate scharf: ESLint-Regeln `no-unused-vars`/`prefer-const`/`eqeqeq`/`no-console` (Browser) → **error**. Prettier 3 + Husky 9 + lint-staged 17, Nightly-Cron `qa-nightly.yml` (03:17 UTC). `_shared/withErrorBoundary.ts` als Pflicht-Wrapper auf alle 16 Edge Functions. `pollAolRun` getestet (4 Pfade, Fake-Timers).
- **2026-05-14 (Stage 3–4)** `commit-fact` testbar: pure `commitFact()` aus `Deno.serve` extrahiert, `mockAdmin()` mit Stub-Queue + Call-Recorder, 3 Deno-Tests (Happy / NEEDS_ASSIGNMENT / Reject). Console-Sweep in `intake-process`/`intake-understand`/`commit-fact`.
- **2026-05-14 (Sprint Sofort)** Graphiti-422-Fix: `addMessage()` setzt `role="user"`-Default, `graphiti-backfill` Edge Function zieht 20 ungemirrorte canonical_facts nach. `intake-trigger` voll instrumentiert.
- **2026-05-14** Doku-Konsolidierung Schritt 2: alle Detail-Docs (`PRODUCT`/`ARCHITECTURE`/`NOW`/`DECISIONS`) nach `docs/` verschoben, in der Wurzel bleiben nur `AGENTS.md` + `README.md`. `docs/qa-historie.md` aufgelöst (Methodik + Stages → `DECISIONS.md`, Endmetriken → hier oben). `docs/qa-seam-inventar.md` bleibt als lebende Referenztabelle.
- **2026-05-14** Doku-Konsolidierung Schritt 1: Workspace-5-Datei-System eingeführt. Alte `docs/produkt-gesamt.md`/`implementierung-aktuell.md`/`geplant.md` entfernt.

## 2026-05-15 — Welle C
- Godfiles eliminiert: commit-fact (-603 LOC), intake-understand (-505 LOC), projectViewModel (-307 LOC im Hauptfile)
- Vitest 60/60 grün, Deno-Tests 14/14 grün, Smokes 400/401 wie erwartet
