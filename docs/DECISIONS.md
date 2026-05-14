# DECISIONS — Append-only

Format: `[YYYY-MM-DD] Problem → Choice → Reason`

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
