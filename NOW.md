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
   - Logger einziehen in: `intake-process`, `intake-trigger`, `inspect-graphiti`, `inspect-langsmith`, `inspect-railway`, `railway-admin`, `voice-transcribe`, `asset-delete`, `project-delete`.
   - Bisher instrumentiert: `commit-fact`, `intake-understand`, `aol-callback`, `graphiti-reconcile`, `inspect-pipeline`, `test-data-sweep`.

4. **E2E-Smokes (aus Phase 3 noch offen)**
   - Upload EML → Review → Commit → Fact im Project sichtbar.
   - Note erfassen → Review → Commit.
   - Asset löschen → Cascade `aol_runs`.

5. **Health-Panel gegen echten Traffic verifizieren**
   - Einen vollständigen Commit fahren, Trace im `/pipeline-health` rückwärts lesen.

---

## Recently completed

- **2026-05-14** Phase 3 (Test-Schichten): `testFixtures.ts` + `test-data-sweep` Edge Function, 6 Unit-Test-Files (33 Tests grün), Deno-Tests für `scoreProjects` / `mapToBoxType` / `segmentsToText` (10 Tests grün).
- **2026-05-14** Phase 4 (Teil 1): ESLint verschärft (als Warnings), `.github/workflows/qa.yml` mit 4 Jobs (lint/typecheck/test/build).
- **2026-05-14** Phase 2: `pipeline_events`-Tabelle, `_shared/logger.ts`, ErrorBoundary, Frontend-DevLog-Sink, instrumentierte Edge Functions, `inspect-pipeline` erweitert, `/pipeline-health` Live-Panel.
- **2026-05-14** Phase 1: `docs/qa-seam-inventar.md` mit Seam-Tabelle und Top-10-Risiko-Liste.
