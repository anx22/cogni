# QA-Masterplan — Produktintelligenz

Ziel: Reaktiven Brandlösch-Modus beenden. Sichtbarkeit über die gesamte Pipeline herstellen, dann absichern.

Pipeline (kanonisch):
`asset → parsed_document → proposed_facts → review_cases → canonical_facts → change_events → graphiti_sync_log → Neo4j-Episode/Entities → RAG`

## Bestand (Ist-Stand)

- **Edge Functions (14, ~3000 LOC)** in `supabase/functions/`. Schwergewichte:
  - `commit-fact` (643), `intake-understand` (543), `railway-admin` (600), `graphiti-reconcile` (212).
- **Frontend-Hot-Module**: `src/lib/intake/useIntake.ts`, `src/lib/dialog/useDialog.ts`, `src/lib/project/useProject{,s}.ts`, `src/lib/object-actions/useObjectActions.ts`, `src/lib/devlog/`.
- **Doku vorhanden**: `docs/produkt-gesamt.md`, `docs/geplant.md`, `docs/implementierung-aktuell.md`, `.workspace/AGENTS.md`. — Diese werden weitergeführt; QA-PLAN.md ergänzt sie.
- **Tests**: nur 2 Files (`src/lib/intake/sanitizeStorageName.test.ts`, `src/test/example.test.ts`). Vitest + Testing-Library + jsdom konfiguriert.
- **Lint minimal**: `no-unused-vars` aus, kein `no-floating-promises`, kein `no-console`, kein Import-Order.
- **Fehlend**: strukturierte Logs, ErrorBoundary, unhandledrejection-Handler, Pre-commit-Hooks, CI.

---

## Phase 1 — Bestandsaufnahme (Observe) — ~4–6 h

Ziel: Karte aller Datenflüsse + Liste blinder Übergabepunkte.

Checkliste:
- [ ] `docs/qa-seam-inventar.md` anlegen mit Tabelle pro Seam: Spalten `[Seam] [Modul] [Eingabe] [Ausgabe] [LOG?] [TRY/CATCH?] [SCHEMA-VALIDATION?] [TEST?] [Risiko 1–5]`.
- [ ] Frontend-Seams erfassen: `useIntake.uploadAsset`, `useIntake.triggerUnderstand`, `useDialog.commitFact`, `useDialog.loadSession`, `useObjectActions.archive/delete`, `useProjects.list`, `useProject.load`.
- [ ] Edge-Seams erfassen: `intake-trigger → intake-process → intake-understand → aol-service → aol-callback → commit-fact → graphiti(/messages) → graphiti-reconcile`.
- [ ] DB-Seams (Vertragspunkte): `assets, parsed_documents, proposed_facts, review_cases, dialog_sessions, canonical_facts, change_events, graphiti_sync_log, aol_runs`.
- [ ] `rg "await " supabase/functions/ -n` → Liste aller `await` ohne umschließendes `try` → "Unbeobachtet"-Liste.
- [ ] Schema-Drift-Audit: jeder `.insert/.update/.upsert` gegen `src/integrations/supabase/types.ts` (rein lesend, nichts ändern).
- [ ] Status-Update in `docs/implementierung-aktuell.md` — nur Querverweis auf `qa-seam-inventar.md`.

Nächste 3 Schritte:
1. Seam-Tabelle leer anlegen mit allen Zeilen — 30 min.
2. `rg`-Sweep + Spalten füllen — 90 min.
3. Top-10-Risiko-Seams ranken (Graphiti/Neo4j-Schreibpfade zuerst) — 30 min.

✅ am Ende: `docs/qa-seam-inventar.md` vollständig + Top-10-Liste.

---

## Phase 2 — Instrumentierung (Instrument) — ~6–8 h ← **höchster Sichtbarkeitsgewinn**

Ziel: Jede Stage in der Pipeline produziert ein strukturiertes Log mit `correlation_id` (`asset_id` oder `run_id`). Jede ungefangene Exception erzeugt ein sichtbares Artefakt im Devlog.

Checkliste:
- [ ] `supabase/functions/_shared/logger.ts` neu: `log({fn, stage, event, level, asset_id?, run_id?, session_id?, ms?, payload?})` → JSON-Zeile + optional `INSERT INTO pipeline_events`.
- [ ] Migration: Tabelle `pipeline_events (id, ts, fn, stage, event, level, asset_id, run_id, session_id, payload jsonb)` + Indexe auf `asset_id`, `run_id`, `(fn, ts desc)`. RLS: read für eingeloggte User auf eigene Assets via Join.
- [ ] Verpflichtende Stages je Edge Function: `enter | validate | fetch | transform | write | mirror | exit | error`.
- [ ] Logger einziehen — Reihenfolge nach Risiko:
  1. `commit-fact` (Schreibt canonical + sync_log + Graphiti)
  2. `intake-understand` (Schreibt proposed_facts, Session-Lifecycle)
  3. `aol-callback` (Status-Übergänge)
  4. `graphiti-reconcile` (UUID-Auflösung)
- [ ] Frontend-Logger `src/lib/devlog/logger.ts`: gleiche Shape, push in bestehende `devlog`-Komponente.
- [ ] Globale `ErrorBoundary` in `src/App.tsx` + `window.addEventListener("unhandledrejection", …)` + `window.addEventListener("error", …)` → Devlog + Toast.
- [ ] Datenfluss-Checkpoints (Eingabe-Hash + Ausgabe-Hash) an den 4 Hot-Seams (commit-fact, intake-understand, graphiti-reconcile, aol-callback).
- [ ] `inspect-pipeline` erweitern: `?asset_id=…` → chronologische Stage-Liste aus `pipeline_events`.
- [ ] OrbLab Health-Panel: Live-Status `aol-service /health`, `graphiti /episodes`, `langsmith`, `neo4j` via `railway-admin` und `inspect-*`.

Nächste 3 Schritte:
1. Migration `pipeline_events` + `_shared/logger.ts` + Doku-Snippet — 90 min.
2. Logger in `commit-fact` und `intake-understand` einziehen, alle `console.log` ersetzen — 120 min.
3. ErrorBoundary + unhandledrejection + Devlog-Sink im Frontend — 60 min.

✅ am Ende: jede Pipeline-Aktion ist in `pipeline_events` rückverfolgbar; OrbLab zeigt Live-Health.

---

## Phase 3 — Test-Schichten (Test) — ~10–14 h

Ziel: jede pure Funktion hat Unit-Test. Jede Stage hat Integrations-Test mit Fixture+Teardown. 3 E2E-Smoke-Pfade laufen grün.

### Unit (Vitest, läuft schon)
- [ ] `src/lib/intake/detectInputType.ts`
- [ ] `src/lib/intake/sanitizeStorageName.ts` (Edge-Cases ergänzen)
- [ ] `src/lib/dialog/boxMapping.ts`, `sessionMode.ts`, `sessionFactories.ts`
- [ ] `src/lib/format/*`
- [ ] `supabase/functions/_shared/projectScoring.ts`, `agentConfig.ts`, `promptHub.ts`

### Integration (Deno-Test über `supabase--test_edge_functions`, Mock-Fetch für aol-service/graphiti)
- [ ] `commit-fact`: Happy / Konflikt / Re-Commit (Supersede) / fehlende Quelle.
- [ ] `intake-understand`: Note-Stub / URL-Stub / Re-Trigger cancelt offene Session.
- [ ] `graphiti-reconcile`: Auflösung über `source_description`, Idempotenz, kein Match.
- [ ] `aol-callback`: Status-Übergänge `processing → review_ready → committed`.

### E2E-Smoke (Vitest + Testing-Library + MSW für Supabase-Client)
- [ ] Upload EML → Review-UI → Commit → Fact erscheint im Project.
- [ ] Note erfassen → Review → Commit.
- [ ] Asset löschen → Cascade `aol_runs` (bereits per FK).

### Fixtures + Teardown — projektspezifisch
- [ ] `supabase/functions/_shared/testFixtures.ts`: `seedAsset()`, `seedProposedFacts()`, `seedCanonicalFact()` — alle markieren `metadata.test_run_id = <uuid>`.
- [ ] Edge Function `test-data-sweep`: löscht alles mit `metadata.test_run_id` älter als 1 h. Verhindert Smoke-Daten-Leichen.
- [ ] Separater `auth.user` `test+qa@…` und Projekt `slug = "qa-fixtures"` als Sandkasten.

Nächste 3 Schritte:
1. `testFixtures.ts` + Edge Function `test-data-sweep` + Marker-Konvention — 120 min.
2. Unit-Tests für die 6 reinen Frontend-Module — 180 min.
3. Integrations-Tests `commit-fact` Happy + Konflikt + Supersede — 120 min.

✅ am Ende: `npm test` grün + `supabase functions test` grün + Sweeper läuft sauber.

---

## Phase 4 — Automatisierung (Automate) — ~4–5 h

Ziel: kein Commit ohne Lint+Typecheck. Kein Merge ohne grüne Tests.

### ESLint verschärfen (Datei `eslint.config.js`)
- [ ] `@typescript-eslint/no-unused-vars: "error"` (aktuell off).
- [ ] `@typescript-eslint/no-floating-promises: "error"` (kritisch in Edge Functions).
- [ ] `no-console: ["error", { allow: ["warn", "error"] }]` — erzwingt Nutzung des neuen `logger`.
- [ ] `eslint-plugin-import` mit `import/order` + `no-unresolved`.
- [ ] Smoke-Regel via CI-Check: `rg "console.log" supabase/functions/` muss leer sein nach Phase 2.

### Prettier
- [ ] `.prettierrc` projektweit, `eslint-config-prettier` als Letztes im Extends.

### Pre-commit (Husky + lint-staged)
- [ ] `husky install` + `.husky/pre-commit` → `lint-staged`.
- [ ] `lint-staged` für `*.{ts,tsx}`: `eslint --max-warnings 0` + `tsc --noEmit` (geänderte Files).

### CI (GitHub Actions, `.github/workflows/qa.yml`)
- [ ] Job `lint`: `npm ci && npm run lint`.
- [ ] Job `typecheck`: `tsc --noEmit`.
- [ ] Job `unit`: `npm test`.
- [ ] Job `edge`: `supabase functions test` (lokales Supabase via `supabase start`).
- [ ] PR-Status rot bei Fehler + Summary-Kommentar.
- [ ] Nightly-Cron: ruft `test-data-sweep` Edge Function.

Nächste 3 Schritte:
1. ESLint-Schärfung + Prettier + bestehende Verstöße fixen — 90 min.
2. Husky + lint-staged + Typecheck-Hook — 45 min.
3. `qa.yml` mit 4 Jobs — 90 min.

✅ am Ende: jeder Push triggert Lint/Type/Unit/Edge; rot blockt.

---

## Reihenfolge & Sichtbarkeitsgewinn

1. **Phase 2.1 + 2.2 zuerst** — strukturierter Logger in `commit-fact` und `intake-understand` macht ~80 % aller heutigen "warum hängt das?"-Momente sofort sichtbar.
2. **Phase 1 Seam-Inventar** parallel — definiert, was Phase 3 testen muss.
3. **Phase 4 ESLint + Husky** vor Phase 3 — verhindert Tests gegen wandernden Code.
4. **Phase 3 Tests** zuletzt: Fixtures → Unit → Integration → E2E.

Gesamtaufwand realistisch: **24–33 h**, sinnvoll in 4 Sprints à 1 Woche.

---

## Status

Plan erstellt. **Keine Code-Änderung.** Stopp und warten auf Freigabe für Phase 1.
