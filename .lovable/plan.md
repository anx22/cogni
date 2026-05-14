# QA-Masterplan — Produktintelligenz

Ziel: Reaktiven Brandlösch-Modus beenden. Sichtbarkeit über die gesamte Pipeline `asset → parsed_document → proposed_facts → review_cases → canonical_facts → graphiti_sync_log → Neo4j → RAG` herstellen, dann absichern.

Bestand (Ist-Stand der Codebase):

- 14 Edge Functions, ~3000 LOC. Schwergewichte: `commit-fact` (643), `intake-understand` (543), `railway-admin` (600), `graphiti-reconcile` (212).
- Frontend: `src/lib/{intake,dialog,project,object-actions,voice,devlog}` + `src/pages/{Index,Project,OrbLab,Auth}`.
- Tests: nur 2 (`sanitizeStorageName.test.ts`, `example.test.ts`). Vitest + Testing-Library bereits konfiguriert.
- ESLint vorhanden aber minimal — kein `no-floating-promises`, kein Import-Order, `no-unused-vars` ausgeschaltet.
- Keine Docs (AGENTS/NOW/ARCHITECTURE/DECISIONS fehlen — unwahre Behauptung, es gibt eine Dokumentation Struktur die sehr fortschrittlich ist und diese wird benutzt).
- Keine strukturierten Logs, keine Error Boundary, keine Pre-Commit-Hooks, keine CI.

---

## Phase 1 — Bestandsaufnahme (Observe)   ~4–6h

Ziel: Eine Karte der Datenflüsse + Liste aller "blinder" Übergabepunkte.

Checkliste:

- Pipeline-Seam-Inventar als Tabelle in `ARCHITECTURE.md`:Frontend-Seams: `useIntake.uploadAsset`, `useIntake.triggerUnderstand`, `useDialog.commitFact`, `useProject.archive`, `useProjects.list`.
- &nbsp;
- Edge-Seams: `intake-trigger → intake-process → intake-understand → aol-service → aol-callback → commit-fact → graphiti (Neo4j) → graphiti-reconcile`.
- DB-Seams (Tabellen als Vertragspunkte): `assets, parsed_documents, proposed_facts, review_cases, dialog_sessions, canonical_facts, change_events, graphiti_sync_log, aol_runs`.
- Pro Seam: Ist-Zustand markieren — `[LOG?] [TRY/CATCH?] [SCHEMA-VALIDATION?] [TEST?]`.
- Pro Edge Function `await` ohne `try/catch` zählen (`rg "await " supabase/functions/`) → "Unbeobachtet"-Liste.
- Schema-Drift-Audit: jeder Insert/Update gegen `src/integrations/supabase/types.ts` (rein lesend).

Nächste 3 Schritte:

1. Doku-Skelett schreiben
2. Seam-Inventar-Tabelle füllen durch `rg`-Sweep über alle 14 Edge Functions + 5 Hooks — 90 min.
3. "Top 10 unbeobachtete Seams" priorisiert (nach Risiko: alles was Graphiti/Neo4j schreibt zuerst) — 30 min.

---

## Phase 2 — Instrumentierung (Instrument)   ~6–8h   ← höchster Sichtbarkeitsgewinn

Ziel: Jeder Schritt in Pipeline produziert ein strukturiertes Log mit `correlation_id` (asset_id oder run_id). Jede ungefangene Exception erzeugt sichtbares Artefakt.

Checkliste:

- `supabase/functions/_shared/logger.ts` neu: `log(stage, event, data, ctx)` → JSON-Zeile mit `{ts, fn, stage, event, asset_id, run_id, session_id, level, ms}`. Ablöse aller `console.log` in `commit-fact`, `intake-understand`, `graphiti-reconcile`, `aol-callback`.
- Verpflichtende Stages pro Edge Function: `enter, validate, fetch, transform, write, mirror, exit, error`.
- `src/lib/devlog/` erweitern: Frontend-Logger mit gleicher Struktur, Push in bestehende `devlog`-Komponente.
- Globale `ErrorBoundary` in `App.tsx` + `window.addEventListener("unhandledrejection")` → Devlog + Toast.
- Datenfluss-Checkpoints (Eingabe/Ausgabe-Hash) an den 4 Hot-Seams: `intake-understand` (proposed_facts geschrieben), `commit-fact` (canonical + sync_log geschrieben), `graphiti-reconcile` (uuid aufgelöst), `aol-callback` (run abgeschlossen).
- `inspect-pipeline` erweitern: zeigt pro `asset_id` jede Stage-Zeile chronologisch (nutzt neue Logger-Tabelle `pipeline_events` ODER liest aus `function_edge_logs` via analytics_query).
- Health-Panel im OrbLab: aol-service `/health`, graphiti `/episodes`, langsmith, neo4j — bereits via `railway-admin` möglich, nur UI nötig.

Nächste 3 Schritte:

1. `_shared/logger.ts` + Migration `pipeline_events` Tabelle (asset_id, run_id, fn, stage, event, level, payload, ts) — 90 min.
2. Logger in `commit-fact` und `intake-understand` einziehen (die zwei riskantesten) — 120 min.
3. ErrorBoundary + unhandledrejection im Frontend, Devlog-Sink hookt sich ein — 60 min.

---

## Phase 3 — Test-Schichten (Test)   ~10–14h

Ziel: Jede pure Funktion hat einen Unit-Test. Jede Pipeline-Stage hat einen Integrations-Test mit Fixture + Teardown. 3 E2E-Smoke-Pfade laufen grün.

Unit (Vitest, bereits konfiguriert):

- `src/lib/intake/detectInputType.ts`
- `src/lib/intake/sanitizeStorageName.ts` (vorhanden, ergänzen)
- `src/lib/dialog/boxMapping.ts`, `sessionMode.ts`, `sessionFactories.ts`
- `src/lib/format/*`
- `supabase/functions/_shared/projectScoring.ts`, `agentConfig.ts`, `promptHub.ts`

Integration (Deno-Test über `supabase--test_edge_functions`, mit Mock-Fetch für aol-service/graphiti):

- `commit-fact`: Happy-Path, Konflikt, Re-Commit (Supersede).
- `intake-understand`: Note-Asset (Stub-parsed_documents), Re-Trigger (Session-Cancel), URL-Asset.
- `graphiti-reconcile`: alle 15 alten Facts auflösbar, Idempotenz.
- `aol-callback`: Status-Übergänge `processing → review_ready → committed`.

E2E-Smoke (kritische Nutzerpfade — Vitest + Testing-Library + MSW für Supabase-Client):

- Upload EML → Review-UI → Commit → Fact erscheint im Project.
- Note erfassen → Review → Commit.
- Asset löschen → kaskadiert (aol_runs CASCADE bereits da).

Fixtures + Teardown — projektspezifisch:

- `supabase/functions/_shared/testFixtures.ts`: `seedAsset()`, `seedProposedFacts()`, `seedCanonicalFact()`, jeweils mit `cleanup(asset_id)` der per `ON DELETE CASCADE` durchläuft.
- Alle Test-Daten markiert mit `metadata.test_run_id = uuid` → Sweeper-Function `test-data-sweep` löscht alles mit Marker älter als 1h. Schutz vor Smoke-Daten-Leichen wie diskutiert.
- Testdaten-Workspace: separater `auth.user` `test+qa@…` und separater `project.slug = "qa-fixtures"`.

Nächste 3 Schritte:

1. `testFixtures.ts` + `test-data-sweep` Edge Function bauen — 120 min.
2. Unit-Tests für alle 6 reinen Frontend-Module — 180 min.
3. Integration-Tests `commit-fact` Happy + Konflikt — 120 min.

---

## Phase 4 — Automatisierung (Automate)   ~4–5h

Ziel: Kein Commit ohne Lint+Typecheck. Kein Merge ohne grüne Tests.

ESLint verschärfen:

- `@typescript-eslint/no-unused-vars: error` (aktuell off).
- `@typescript-eslint/no-floating-promises: error` (kritisch für Edge Functions).
- `no-console: ["error", { allow: ["warn","error"] }]` — zwingt Nutzung des neuen `logger`.
- `eslint-plugin-import` mit `import/order` + `no-unresolved`.
- Custom-Regel/Pattern: `rg "console.log" supabase/functions/` muss leer sein nach Phase 2.

Prettier:

- `.prettierrc` projektweit, integriert in eslint via `eslint-config-prettier`.

Pre-commit (Husky + lint-staged):

- `husky install`, `.husky/pre-commit` → `lint-staged`.
- `lint-staged`: `*.{ts,tsx}` → `eslint --max-warnings 0` + `tsc --noEmit` auf geänderte Dateien.

CI (GitHub Actions, Datei `.github/workflows/qa.yml`):

- Job `lint`: `npm ci && npm run lint`.
- Job `typecheck`: `tsc --noEmit`.
- Job `unit`: `npm test`.
- Job `edge`: `supabase functions test` (gegen lokales Supabase).
- Bei Fehler: PR-Status rot + Summary-Kommentar.
- Nightly: `test-data-sweep` Edge Function via cron triggern.

Nächste 3 Schritte:

1. ESLint-Schärfung + Prettier + alle bestehenden Verstöße fixen — 90 min.
2. Husky + lint-staged + Typecheck-Hook — 45 min.
3. GitHub-Action `qa.yml` mit 4 Jobs — 90 min.

---

## Priorität (was bringt sofort am meisten Sichtbarkeit)

1. **Phase 2.1+2.2 zuerst** — strukturierter Logger in `commit-fact` und `intake-understand`. Macht 80 % der heutigen "warum hängt das?"-Momente sofort sichtbar.
2. **Phase 1 Seam-Inventar** parallel — erst dann weiß Phase 3, was getestet werden muss.
3. **Phase 4 ESLint+Husky** vor Phase 3 — verhindert, dass neue Tests gegen sich verschiebenden Code geschrieben werden.
4. **Phase 3 Tests** zuletzt, in Reihenfolge: Fixtures → Unit → Integration → E2E.

Gesamtaufwand realistisch: **24–33 h**, sinnvoll in 4 Sprints à 1 Woche.

---

## Deliverable dieser Plan-Runde

Nach Freigabe: `QA-PLAN.md` im Projekt-Root mit obigem Inhalt + Sprint-Tracker in `NOW.md`. Keine Code-Änderung. Stopp + warten auf "Phase 1 starten".