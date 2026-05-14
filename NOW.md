# NOW — Aktueller Sprint & Backlog

> Co-Doku zu `QA-PLAN.md` und `docs/implementierung-aktuell.md`.
> Sprintstand oben, Backlog darunter, "Recently completed" am Ende.

---

## Aktueller Sprint — QA-Härtung

Status der vier QA-Phasen (Stand 2026-05-14):

| Phase | Soll | Ist | Status |
|---|---|---|---|
| 1 Bestand | Seam-Inventar | `docs/qa-seam-inventar.md` vorhanden | ✅ |
| 2 Instrumentierung | Logger, `pipeline_events`, ErrorBoundary, Health-Panel | alles deployed | ✅ |
| 3 Tests | Fixtures, Sweeper, Unit-Tests, Edge-Tests | 33 Vitest + 10 Deno grün; commit-fact-Integration offen | ⚠ teilweise |
| 4 Automatisierung | ESLint scharf, Prettier, Husky, CI | nur ESLint (warn) + CI; Prettier/Husky/lint-staged fehlen | ⚠ teilweise |

---

## Backlog (geordnet nach Priorität)

1. **commit-fact Integrationstests** *(aus Phase 3 vertagt)*
   - Refactor: Kernlogik aus `Deno.serve` in pure `commitFact({ admin, user, payload, log })` ziehen.
   - Mock-Helfer für Supabase-Client.
   - 3 Pfade: Happy / Konflikt / Re-Commit (Supersede).
   - Geschätzt: ~2 h.

2. **Phase 4 vollenden**
   - `.prettierrc` + `eslint-config-prettier` als Letztes im Extends.
   - Husky installieren, `.husky/pre-commit` → `lint-staged` für `*.{ts,tsx}` (ESLint + `tsc --noEmit`).
   - ESLint-Regeln von `warn` auf `error` hochziehen, sobald die Bestandsverstöße beseitigt sind:
     - `@typescript-eslint/no-unused-vars`
     - `@typescript-eslint/no-floating-promises`
     - `no-console` (mit `allow: ["warn","error"]`)
     - `eslint-plugin-import` (`import/order`, `no-unresolved`)
   - CI-Smoke: `rg "console.log" supabase/functions/` muss leer sein (aktuell 6 Treffer).
   - Nightly-Cron-Workflow, der `test-data-sweep` triggert.

3. **Restliche Edge Functions instrumentieren**
   - Logger einziehen in: `intake-process`, `inspect-graphiti`, `inspect-langsmith`, `inspect-railway`, `railway-admin`, `voice-transcribe`, `asset-delete`, `project-delete`.
   - Bisher instrumentiert: `commit-fact`, `intake-understand`, `intake-trigger`, `aol-callback`, `graphiti-reconcile`, `graphiti-backfill`, `inspect-pipeline`, `test-data-sweep`.

4. **E2E-Smokes (aus Phase 3 noch offen)**
   - Upload EML → Review → Commit → Fact im Project sichtbar.
   - Note erfassen → Review → Commit.
   - Asset löschen → Cascade `aol_runs`.

5. **`commit-fact` testbar machen**
   - Pure `commitFact()`-Funktion aus `Deno.serve`-Closure ziehen, Mock-Admin-Helper, drei Deno-Tests (Happy/Konflikt/Supersede). Siehe `QA-AUDIT-REPORT.md` Fix 4.

6. **Phase-4-Gate scharf stellen**
   - `.prettierrc`, Husky, lint-staged, ESLint-Regeln von `warn` → `error`, Nightly-Cron für `test-data-sweep`. Siehe `QA-AUDIT-REPORT.md` Fix 5.

7. **`pollAolRun` testen**
   - `src/lib/pipeline/pollAolRun.test.ts` mit `vi.mock`-Strategie für Supabase-Client.

---

## Recently completed

- **2026-05-14 (Sprint Sofort)** Graphiti-422-Fix: `addMessage()` setzt `role` als Pflichtfeld-Default. `graphiti-backfill` Edge Function gebaut → 20 ungemirrorte canonical_facts nachgezogen, 0 Fehler. Knowledge-Graph wieder aktiv.
- **2026-05-14 (Sprint Sofort)** `intake-trigger` voll instrumentiert (Stages `enter | asset_loaded | run_created | aol_call | aol_failed | invoke_understand_bg | bg_completed | bg_failed | exit | error`), `@ts-ignore` → typsicheres `declare const EdgeRuntime`. ESLint-Error gefixt (0 Errors auf der Datei).
- **2026-05-14** QA-Audit-Report: `QA-AUDIT-REPORT.md` mit Soll-Ist-Abgleich, drei Datenfluss-Befunde, Top-5-Fixes.
- **2026-05-14** Phase 3 (Test-Schichten): `testFixtures.ts` + `test-data-sweep` Edge Function, 6 Unit-Test-Files (33 Tests grün), Deno-Tests für `scoreProjects` / `mapToBoxType` / `segmentsToText` (10 Tests grün).
- **2026-05-14** Phase 4 (Teil 1): ESLint verschärft (als Warnings), `.github/workflows/qa.yml` mit 4 Jobs (lint/typecheck/test/build).
- **2026-05-14** Phase 2: `pipeline_events`-Tabelle, `_shared/logger.ts`, ErrorBoundary, Frontend-DevLog-Sink, instrumentierte Edge Functions, `inspect-pipeline` erweitert, `/pipeline-health` Live-Panel.
- **2026-05-14** Phase 1: `docs/qa-seam-inventar.md` mit Seam-Tabelle und Top-10-Risiko-Liste.

