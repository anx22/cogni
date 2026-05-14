# DECISIONS — Append-only

Format: `[YYYY-MM-DD] Problem → Choice → Reason`

## 2026-05-14 — UI-Overhaul v2 Phase 1

- `2026-05-14` Theme-System wechselt von `:root`/`.dark` HSL auf cogni-Hex-Tokens → **dual betrieben**: shadcn-Tokens (`:root`/`.dark`, HSL) bleiben, cogni-Tokens kommen additiv unter `[data-theme="day"|"night"]` (Hex). Vorteil: shadcn-Komponenten unverändert, neuer cogni-Layer überlagert. `data-theme="day"` als Default am `<html>` in `App.tsx` gesetzt. Tailwind-Aliase `c-surface-*`, `c-ink-*`, `sig-*`, `c-accent*` zeigen direkt auf die CSS-Vars (kein `hsl()` Wrapper). Geist + Geist Mono über Google Fonts in `index.html`. Utility-Klassen `.t-*`, `.dot--*`, `.chip*`, `.cogni-btn*`, `.kbd`, `.cogni-card`, `.hairline`, `.atmosphere-stripe`, `cogni-pulse`, `cogni-entity-breathe` in `src/index.css`. Verify: Vitest 60/60.


## 2026-05-14 — Welle B Detektoren

- `2026-05-14` Dependency-Erkennung könnte LLM-basiert im AOL-Service laufen → **deterministisch in `commit-fact/dependencyDetector.ts`** → Trigger-Phrase + Title-Substring (Token-Länge ≥ 4), kinds `blockiert_durch` (task) und `wartet_auf` (deadline → decision); `haengt_ab_von` bleibt im Kernel für `reference`. Idempotent über `(source_id, target_id, type)`, fail-soft, 8 Pure-Tests. Welle B damit komplett.
- `2026-05-14` Gap-Erkennung könnte LLM-basiert im AOL-Service laufen → **deterministisch in `commit-fact/gapDetector.ts`** (analog B-W2) → drei Kinds (deadline_without_owner, decision_without_deadline, task_without_due_date), idempotent über `(canonical_fact_id, metadata.gap_kind)`, fail-soft, 8 Pure-Tests. LLM-Heuristik bleibt Wave 3.


## 2026-05-14 — Tier B4 + Audit

- `2026-05-14` Session-Factories duplizierten `{id, anlass, context, boxes}`-Scaffold → **`mkSession()`-Helper in `sessionFactories.ts`** → 8 Factories teilen sich den Kern, öffentliche Signaturen 1:1.
- `2026-05-14` Edge-Function-Boilerplate `createLogger` + `handleOptions` + `try/finally flush` mehrfach kopiert → **`_shared/withLogging.ts`** → migrierbar nur dort, wo der catch-Pfad an `withErrorBoundary` delegiert werden darf. **Skips dokumentiert**: `aol-callback` (gibt 400 statt 500 im catch), `voice-transcribe` & `commit-fact` (eigene Body-Shape `{ok:false, error: msg}` statt `internal_error`-Hülle), `intake-trigger` (updated `aol_runs.status='failed'` im catch). Migriert: `asset-delete`, `project-delete`.
- `2026-05-14` `linkAgainstExisting` & `factSummary` mit hardcodierten Type-Switches in `intake-understand/index.ts` → **`intake-understand/factRules.ts`** mit `LINKABLE_FACT_TYPES` Set + `FACT_SUMMARIZERS` Record → neue Fact-Types nur Map-Eintrag, kein switch.
- `2026-05-14` Abschluss-**Audit aller A/B-Tier-Punkte** in `docs/audit-2026-05-14.md` mit Tool-Evidenz pro Anspruch. Findings (Graphiti-Sync 60 %/24h, 9 `console.warn` in `_shared/`, LOC-Budget gerissen, Vier-Rollen-User-Smoke offen) als separate Loops, kein Refactoring-Backlog mehr.

## 2026-05-14 — Doku-System & QA-Härtung

- `2026-05-14` Detail-Docs in der Wurzel verstreut → **alle nach `docs/` verschoben, nur `AGENTS.md` + `README.md` bleiben in der Wurzel** → klare Trennung Karte (Wurzel) / Inhalt (`docs/`).
- `2026-05-14` `docs/qa-historie.md` doppelte Buchführung zu `NOW.md`/`DECISIONS.md` → **aufgelöst**: 4-Phasen-Methodik (Bestand/Instrumentierung/Tests/Automatisierung) und Stages 1–7 leben als Einträge hier; aktuelle Endmetriken in `NOW.md`. `docs/qa-seam-inventar.md` bleibt als lebende Referenztabelle (Frontend/Edge/DB/Externe-Seams mit Risiko 1–5).
- `2026-05-14` QA-Methodik rückwirkend dokumentiert: **Phase 1 Seam-Bestand → Phase 2 Logger + `pipeline_events` + ErrorBoundary → Phase 3 Fixtures + Unit/Edge/E2E-Smokes → Phase 4 ESLint scharf + Husky + CI + `withErrorBoundary` + console.log-Smoke**. Reihenfolge ergibt sich aus Top-10-Risiko-Liste im Seam-Inventar.

- `2026-05-14` Edge Functions stürzen ohne Spur → **Pflicht-Wrapper `withErrorBoundary("fn", handler)`** → Last-Resort-Catch + 500-Hülle mit `correlation_id`, CORS-Preflight automatisch.
- `2026-05-14` `commit-fact`-Logik nur via HTTP-Curl prüfbar → **pure `commitFact({admin,user,payload,log})` extrahiert, Deno.serve bleibt dünner Adapter** → ermöglicht 3 Deno-Integrationstests (Happy/NEEDS_ASSIGNMENT/Reject).
- `2026-05-14` `aol-callback` analog nicht testbar → **pure `handleCallback({admin,payload,log})`** → 5 Deno-Tests für Status-Übergänge.
- `2026-05-14` Logger-Disziplin nur via Lint nicht verlässlich → **CI-Smoke-Job `qa.yml::smoke` blockt jeden `console.log` außer `_shared/logger.ts`**.
- `2026-05-14` Async-Pipeline-Hänger unsichtbar → **`createLogger` in jede Hot-Path-Edge-Function** (`commit-fact`, `intake-trigger/process/understand`, `aol-callback`, `voice-transcribe`, `asset-delete`, `project-delete`, `graphiti-reconcile`, `graphiti-backfill`, `test-data-sweep`). Inspector-/Admin-Funktionen bewusst ausgespart.
- `2026-05-14` Graphiti `/messages` 422 (Mirror-Ausfall) → **`addMessage()` setzt `role="user"` als Pflichtfeld-Default**, `graphiti-backfill` Edge Function zieht ungemirrorte canonical_facts nach.
- `2026-05-14` ESLint-Warnings ohne Druck → **`no-unused-vars`, `prefer-const`, `eqeqeq`, `no-console` (Browser) auf `error`** hochgezogen, Husky 9 + lint-staged 17 als Pre-commit-Gate, Prettier 3 als letztes Extends.
- `2026-05-14` Test-Daten-Leichen → **Marker `metadata.test_run_id`** in allen Fixtures, `test-data-sweep` Edge Function + Nightly-Cron `qa-nightly.yml` 03:17 UTC.
- `2026-05-14` MSW-basierte Browser-E2Es zu schwer → **Hook-Integrationstests mit `vi.mock`** (`src/test/e2e-smokes.test.ts`: Note→intake-trigger / Asset-Delete / Fakt-Retract). Echte Browser-E2E-Lane bleibt optionaler Backlog-Punkt.

## Vor 2026-05-14 (rückdatiert aus Memory + Implementierungs-Doku)

- `2026-05-13` Knowledge Graph → **Graphiti statt Cognee** → bessere Episode-Semantik, native LangGraph-Integration.
- `2026-05-13` Graphiti-Mirror nicht im kritischen Pfad → **async `POST /messages`, Client-seitige UUID** → Idempotenz; Mirror-Fehler brechen den Commit nicht.
- `2026-05-13` Railway darf nicht in Supabase schreiben → **Besitzschnitt: AOL-Service nur Read über Graphiti**, Schreibpfade ausschließlich in Cloud-Edge-Functions.
- `2026-05-12` Projekt-Zuordnung beim Intake → **Lexikalisches Scoring + Assignment-Agent als Tie-Breaker** → `NEEDS_ASSIGNMENT`-Pfad in `commit-fact`.
- `2026-05-12` Manuelle Eingaben → **kein eigenes Datenmodell**, nur visueller Marker `SourceMarker.manuell={true}` → Konflikte folgen normaler Delta-Logik.
- `2026-05-11` Navigation → **keine klassische Sidebar**, Orientierung über Zustandswechsel zwischen Entität / Projekt / Overlay.
- `2026-05-11` Entity-Visual → **CSS-Gradients statt Canvas** → ruhige Performance, Theme-Tokens nutzbar.
- `2026-05-10` Pipeline-Trace → **eigene Tabelle `pipeline_events`** mit RLS, Index auf `(asset_id)`, `(run_id)`, `(fn,ts)`. Kein Parallel-Logging.
- `2026-05-14` QA-Begleitung → **Drei fiktionale Sandbox-Projekte** (Hase & Söhne Couture / Tübingen Tower / Spätzbohrer 4.0) unter `account@animatex.de`. Agent submittet Facts selbstständig via `supabase--insert` (Bulk-Seed) + `supabase--curl_edge_functions` → `commit-fact` (echter Pfad inkl. Graphiti-Spiegel). Diese Projekte sind never-ending-stories: bei jedem neuen Feature/Fact-Typ würfelt der Agent neue Mails/Konflikte hinein. Kein neuer Code, keine Migration — reine Daten + Tool-Aufrufe. Vorteil: realistische, wiederkehrende Test-Daten ohne Persona-Setup. Nachteil: nur unter einem User, kein Multi-User-Test.
- `2026-05-14` JSONB-Validierung → **Trigger statt CHECK-Constraint** auf `canonical_facts.content` + `proposed_facts.content`. Begründung: CHECK muss IMMUTABLE sein, was bei künftigen Erweiterungen (z.B. NOW()-Vergleich für Deadlines) bricht. Trigger ist flexibel und liefert klare `RAISE EXCEPTION`-Messages.
- `2026-05-14` God-Hook-Pattern → **3-Schichten-Aufteilung** als Vorlage: `useXData.ts` (Queries + Realtime, dünn) + `xViewModel.ts` (pure Mapper, testbar) + `useX.ts` (Composition, ~40 LOC). Erstmals angewandt auf `useProject` — Vorbild für künftige große Hooks.

## 2026-05-14 — Shared `_shared/http.ts` + `_shared/auth.ts` als Edge-Pattern

**Problem:** Pro Edge Function eigene `corsHeaders`/`ok`/`fail`-Definitionen +
inline Bearer-Token-Auth. Drift bei CORS-Headern und Fehler-Response-Format.

**Choice:** Zwei kanonische Module:
- `_shared/http.ts` → `corsHeaders`, `ok(payload, init?)`, `fail(message, status?, extra?)`,
  `handleOptions(req)`.
- `_shared/auth.ts` → `getAuthenticatedUser(req)` mit Discriminated Union
  (`{ok:true, userId, user, client, token} | {ok:false, error, status}`).

`withErrorBoundary` und `inspect-auth` re-exportieren `corsHeaders` aus
`_shared/http.ts` — eine Quelle der Wahrheit, keine Duplikate.

**Reason:** Sicherheitskritischer Pfad (Auth) bekommt eine getestete Quelle.
Functions, die spezifische Response-Shapes brauchen (z. B. `{ok:true, ...}`
in `commit-fact`/`intake-trigger`), behalten lokale `ok`/`fail`-Wrapper, nutzen
aber die geteilten `corsHeaders` — Verhalten unverändert.

[2026-05-14] Realtime-Subscriptions → Problem: Channel-Boilerplate (subscribe/removeChannel/Debounce) in 8+ Stellen mit Drift-Risiko. → Choice: Zentraler `useRealtimeTables(channelName, listeners, opts)` mit per-Listener-Handlern und optionalem debounced `onTrigger`. → Reason: Eine Quelle für Cleanup, stabile Channel-Namen erzwungen, Debounce nicht mehr ad hoc.

[2026-05-14] Inspector-Skeleton → Problem: 3 inspect-* Functions mit ~95 % identischem Skelett (CORS, Auth, Logger, Body-Parse, Action-Dispatch). → Choice: `_shared/inspector.ts` als Action-Map-Wrapper. `inspect-pipeline` bewusst NICHT migriert (Selektor-API statt Action-Dispatch). → Reason: Wartung an einer Stelle, Inspector wird zu reiner Probe-Map; bricht keine Caller.

[2026-05-14] External-Service-Clients → Problem: Fetch-Logik für Railway/LangSmith mehrfach dupliziert mit divergentem Token-/Header-Handling. → Choice: `_shared/clients/{railway,langsmith}.ts` als typsichere Mini-Clients. `railway-admin` nutzt sie via dünnem Adapter-Shim ohne Call-Site-Änderungen. → Reason: Ein Token-Pfad pro Service; ermöglicht spätere B3.2-Modularisierung von `railway-admin`.

[2026-05-14] railway-admin Modularisierung (B3.2) → Problem: 599-LOC-Monolith mit 18 Action-Branches, vermischte Domänen (Railway-GraphQL, LangSmith-Debug, Graphiti, AOL, PromptHub, Diagnose). Nicht testbar, schwer auffindbar. → Choice: Verzeichnis-Layout mit `index.ts` als Router (~70 LOC), `_helpers.ts` (gql-Shim, listAll/setVars/redeploy/autoDiscover), und `handlers/<domain>.ts` mit jeweils `export const handlers: Record<string, Handler>`. Action-Map wird im Router via Spread zusammengebaut. → Reason: Jede Domäne <210 LOC und einzeln lesbar/testbar; keine Action umbenannt; dynamische Imports im PromptHub-Handler erhalten (Cold-Start-Schutz).

[2026-05-14] B3.1 Box-Builder bewusst zurückgeschnitten → Problem: Originalplan B3.1 verlangte konfig-getriebenen `BoxBuilder` mit `BoxConfig.renderContent`. Realitätscheck: 8 Boxen = 558 LOC, Scaffolding bereits in `BoxFrame` extrahiert; ein BoxBuilder hätte denselben Code in `renderContent`-Callbacks umgehängt — kein Lines-Win, +1 Indirektionsschicht, +Risiko. → Choice: Stattdessen ein kleiner Hook `useBoxSubmit(box, opts)` in `src/lib/dialog/`, der das tatsächlich wiederholte Pattern (updateBoxPayload + commitBox + optional markManual) kapselt. Migriert: AuswahlBox, KonfliktBox, GapBox. EingabeBox/ZuordnungsBox bleiben (eigene Pfade). → Reason: Ehrliches Refactor an realer Wiederholung statt Indirektion ohne Substanzgewinn.

[2026-05-15] Welle C — Godfile-Eliminierung nachgezogen
- C1: commit-fact/index.ts 673 → 70 LOC, Logik in kernel.ts/assignment.ts/snapshot.ts/notifications.ts/mirror.ts. Tests grün (4/4 commitFact + 10/10 projectScoring).
- C2: intake-understand/index.ts 561 → 56 LOC, Orchestrierung in understandRun.ts, Splits agentBridge/linker/helpers. runUnderstand returnt typisiertes Result statt Response.
- C3: projectViewModel.ts 467 → 160 LOC (Composer + Barrel), 9 Mapper unter src/lib/project/mappers/. Re-Exports erhalten.
- C4: ok/fail-Sweep — alle 6 Edge Functions mit lokalem `{ok:true|false}`-Envelope explizit als `// custom shape, intentional` markiert. Shared `_shared/http.ts` bleibt für neue Functions ohne Envelope-Anforderung.
- C5: Postponed (IntakeSessionsPanel split nicht zwingend nötig).

[2026-05-14] B-W1 Linker auf Graph-Match. Problem: Linker mappte Facts nur über exakten Title-Match — semantische Synonyme (z. B. "Bibliothek aufbauen" vs. "Bibliothek einrichten") wurden als neue Facts geführt. Choice: Async-Erweiterung von `linkAgainstExisting` mit optionalen `searchHits` aus neuem `_shared/clients/graphitiSearch.ts`. Reihenfolge: 1) exact title, 2) Hit-Substring + same-fact_type-Title, 3) add. Reason: Graphiti `/search` liefert Edges/Facts (keine source_description-Mappings zurück), daher Hit als Evidenz, nicht als ID-Quelle. Fail-soft auf Title-only bei Graphiti-Ausfall — Backwards-compat. Tests: 6 neue Linker-Tests + Bestand grün (20/20).

[2026-05-14] B-W2 Conflict-Detector deterministisch im commit-fact-Pfad. Problem: Widersprüche zwischen Facts wurden bisher nur via `delta_type=contradict` aus dem Linker propagiert; semantische Konflikte (zwei deadlines mit gleichem Titel und unterschiedlichem Datum, zwei decisions mit unterschiedlichem outcome) blieben unerkannt. Choice: Neuer pure Detektor `commit-fact/conflictDetector.ts` läuft nach `mirrorToGraphiti` und vergleicht den frischen Canonical-Fakt deterministisch gegen alle Facts gleichen Typs im Projekt. Schreibt in `contradictions` (idempotent über Typ + sortiertes Paar). Fail-soft: jeder Fehler → `log.warn`, niemals throw, Commit bleibt grün. Reason: Konflikte sind Kern des Produkts; deterministische Regeln (gleicher Titel + abweichende Kerngröße) sind robust und ohne LLM-Roundtrip; Graph-/LLM-Detektion folgt erst, wenn Sandbox-Daten zeigen, dass deterministischer Recall zu niedrig ist. Tests: 6 Pure-Tests, commit-fact-Suite 20/20 grün.

[2026-05-14] B-W3 Gap-Detector deterministisch. Problem: Lückenhafte Fakten (Deadline ohne Owner, Decision ohne Deadline, Task ohne Fälligkeit) blieben unsichtbar bis zum nächsten Review. Choice: `commit-fact/gapDetector.ts` läuft nach Conflict-Detektor parallel via `Promise.all`. Drei Kinds, alle deterministisch + idempotent über (project_id, kind, canonical_fact_id):
  - `deadline_without_owner`: fact_type=deadline ohne assignee/owner/responsible im content.
  - `decision_without_deadline`: fact_type=decision, im selben Projekt existiert keine deadline mit case-insensitive Title-Substring auf den Decision-Title.
  - `task_without_due_date`: fact_type=task ohne content.due_date.
  Fail-soft: log.warn + return, kein throw. Schreibt in `gap_signals` mit metadata `{source: "commit-fact/gapDetector", kind}`. Reason: gleiche Heuristik-Familie wie B-W2; LLM-Verfeinerung ist Wave 3. Tests: 8 Pure-Tests (alle 3 Kinds + Edge-Cases: leerer Content, mehrere Tasks, Title-Match-Variationen). Suite 28/28 grün.

[2026-05-14] B-W4 Dependency-Detector deterministisch. Problem: Abhängigkeiten zwischen Facts (Task wartet auf Decision, Deadline hängt an Decision) wurden nur sichtbar, wenn ein Reference-Fakt explizit committed wurde — Mehrheit der echten Abhängigkeiten blieb unverdrahtet. Choice: `commit-fact/dependencyDetector.ts` läuft im Promise.all neben Conflict + Gap. Zwei Kinds, deterministisch, fail-soft, idempotent über (source_id, target_id, dependency_type):
  - `blockiert_durch`: fact_type=task, dessen content.title/description/text/note eine Trigger-Phrase enthält (`blockiert von`, `blockiert durch`, `wartet auf`, `abhängig von`, `depends on`, `blocked by`) UND danach den Title eines anderen Facts (task/decision/deadline) im selben Projekt als Substring matcht. Token-Längenfilter ≥ 4, case-insensitive, Whitespace normalisiert. Self-Match ausgeschlossen.
  - `wartet_auf`: fact_type=deadline, dessen Title oder Description einen Decision-Title als Substring enthält. Self-Match ausgeschlossen.
  - `haengt_ab_von` (für fact_type=reference) bleibt im Kernel — Detektor doppelt nicht.
  Schreibt in `dependencies` mit metadata `{source: "commit-fact/dependencyDetector"}`. Reason: bewusst eng (Substring + Trigger), keine LLM-Roundtrips in Wave B; semantische Erweiterung folgt in Wave 3 wenn Sandbox False-Negatives liefert. Tests: 8 Pure-Tests (Trigger-Hit, kein Trigger, Trigger ohne Match, Deadline→Decision, Deadline ohne Match, Reference ignoriert, Self-Match-Ausschluss, Token-Länge). Suite commit-fact 36/36 grün.

[2026-05-14] Heuristik-Familie Welle B insgesamt → Choice: alle vier Detektoren (Linker B-W1, Conflict B-W2, Gap B-W3, Dependency B-W4) folgen demselben Vertrag: pure `detectXPure(fresh, projectFacts)` exportiert + `detectAndPersistX(admin, args)` als fail-soft Side-Effect, idempotent über fachlichen Schlüssel, parallel via `Promise.all` nach `mirrorToGraphiti`. Reason: einheitliche Erweiterbarkeit (Wave 3 LLM-Schicht kann pro Detektor unabhängig nachgezogen werden), einheitliche Test-Struktur (Pure-Tests ohne Supabase-Mocks), einheitliche Fehler-Semantik (kein Detektor-Fehler bricht je den Commit).

## 2026-05-14 — Doku-Konsolidierung Schritt 3 + Endstände

- `2026-05-14` `agent-execution-plan.md` (476 LOC, historischer Tier-A/B-Plan) → **aufgelöst**. Endstand: A1/A2/A3 ✅ · B1/B2 ✅ · B3 ⚠ partial (B3.1 als `useBoxSubmit`-Hook umgesetzt, kein Builder; B3.2 modular) · B4 ⚠ partial (B4.1+B4.3 done, B4.2 nur 2/6 wegen catch-Pfaden, dokumentiert oben) · Welle B (B-W1…B-W4) ✅. LOC-Targets bewusst überschritten, akzeptiert. Verification-Master-Checklist lebt jetzt in `NOW.md`.
- `2026-05-14` `audit-2026-05-14.md` (5 Audit-Schichten) → **aufgelöst**. Endstand: 8/10 Master-Checks grün, 2 LOC-Budgets akzeptiert. Findings (Graphiti-Sync 24h-Fenster, 12 `console.warn` in `_shared/`, Vier-Rollen-User-Smoke offen) als Loops in `NOW.md` Backlog.
- `2026-05-14` `agent_review.md` (Strategie-Review) → **aufgelöst**. Vision/Stand-Diff: Datenmodell + Review-First-UI + Vier-Rollen-Screen vollständig umgesetzt; Kernlücken (LLM-Verfeinerung, React Query, Browser-E2E, LOC-Reduktion) als Wave-3-Backlog.
- `2026-05-14` Claude-Review (9 Punkte) → **7 erledigt vor Review-Eingang** (Graphiti-422, commit-fact Godfile, useProject God-Hook, strictNullChecks, JSONB-Validation, E2E-Smokes, Logger 16/16). 1 zurückgestellt (React Query). 1 gestartet (Wave B → komplett).
- `2026-05-14` `docs/`-Endstand: nur noch `PRODUCT`, `ARCHITECTURE`, `NOW`, `DECISIONS`, `qa-seam-inventar`, `design-implementation-plan` (aktiv für UI-Milestone), plus `input/` (Quellmaterial). Workspace-5-Datei-Modell + 2 lebende Arbeitsdateien.

## 2026-05-14 — Welle-B-Use-Case-Smoke (Sandbox „Hase & Söhne Couture")

- `2026-05-14` Smoke-Pfad: temporäre Edge Function `smoke-welle-b` mintet Magiclink + verifyOtp für `account@animatex.de` und ruft `commit-fact` als realer User. Erlaubt Agent-getriebene End-to-End-Smokes ohne UI-Klicks. Nur Sandbox; Function bleibt deployed (verify_jwt=false, klarer Header-Kommentar).
- `2026-05-14` Smoke-Ergebnis: 4 commits → **B-W2 Conflict 1×** (deadline-Kollision), **B-W3 Gap 4×** (2× deadline_without_owner, 1× decision_without_deadline, 1× task_without_due_date), **B-W4 Dependency 2×** (`blockiert_durch` Task → beide Deadlines, je ein sortiertes Paar). Detektoren feuern wie spezifiziert, idempotent über fachliche Schlüssel, Commit nie gebrochen. Graphiti-Sync queued → läuft async. Backlog-Item „Welle-B-Use-Case-Smoke" geschlossen.
