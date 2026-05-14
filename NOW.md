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
| 3 Tests | Fixtures, Sweeper, Unit-Tests, Edge-Tests, E2E-Smokes | 40 Vitest (inkl. 3 E2E-Smokes) + 18 Deno (commitFact + handleCallback + helpers) grün | ✅ |
| 4 Automatisierung | ESLint scharf, Prettier, Husky, CI, withErrorBoundary, console.log-Smoke | ESLint 0 Errors, Prettier+Husky+lint-staged, Nightly-Cron, alle 16 Edge Functions in `withErrorBoundary` gewrappt, CI-Smoke `console.log`-Verbot aktiv | ✅ |

---

## Backlog (geordnet nach Priorität)

> Alle Items des QA-Audit-Reports vom 2026-05-14 sind abgearbeitet (Stages 1–7).
> Nächster offener Punkt aus dem QA-Plan ist die echte Browser-E2E-Lane (Playwright/Cypress)
> — derzeit noch zurückgestellt, da die hookbasierten Smokes die kritischen Pfade
> abdecken und die Server-Seite per Deno-Tests grün ist.

1. **Echte Browser-E2E-Lane** *(neu, optional)*
   - Playwright-Setup, ein Smoke pro Persona-Pfad (Upload, Notiz, Asset-Delete).
   - Erst sinnvoll, sobald wir Persona-/Auth-Fixtures als Browser-Cookie spiegeln.
   - Geschätzt: ~4 h.

2. **Logger in restliche Inspector-/Admin-Funktionen einziehen** *(low priority)*
   - `inspect-graphiti`, `inspect-langsmith`, `inspect-railway`, `inspect-pipeline`, `railway-admin`.
   - Diese laufen read-only & sind durch `withErrorBoundary` abgesichert; ein Logger-Eintrag bringt nur Diagnose-Schärfe.

---

## Recently completed

- **2026-05-14 (Stage 6)** `pollAolRun` getestet (4 Pfade: completed/failed/timeout/abort, MSW-frei via `vi.mock` + Fake-Timers) → Vitest 37/37 grün. `_shared/withErrorBoundary.ts` als Pflicht-Wrapper für jede Edge Function eingeführt (Last-Resort-Catch → strukturierter Logger + 500-Hülle mit `correlation_id` + automatischer CORS-Preflight). Alle 16 Edge Functions gewrappt und deployed.

- **2026-05-14 (Stage 4)** `commit-fact` testbar: pure `commitFact({admin,user,payload,log})` aus `Deno.serve`-Closure extrahiert (HTTP-Wrapper bleibt dünn). `mockAdmin()` in `_shared/testFixtures.ts` (chainable thenable mit Stub-Queue + Call-Recorder). 3 Deno-Tests (`commitFact_test.ts`): Happy / NEEDS_ASSIGNMENT / Reject. Suite jetzt 13/13 grün.
- **2026-05-14 (Stage 5)** Phase-4-Gate scharf gestellt: ESLint-Regeln `no-unused-vars`, `prefer-const`, `eqeqeq`, `no-console` (Browser) → **error**. Alle echten Verstöße bereinigt (unused imports/vars, hook-deps, stale eslint-disable). Verbleibende 52 Warnings (`no-explicit-any` + `react-refresh` HMR-Hint) bewusst belassen, dokumentiert in `eslint.config.js`. Prettier (3.8) + `eslint-config-prettier` als letztes Extends. Husky 9 + lint-staged 17 mit `.husky/pre-commit`. Nightly-Cron `qa-nightly.yml` triggert `test-data-sweep` täglich 03:17 UTC.
- **2026-05-14 (Stage 3)** `console.*` aus Edge-Function-Hauptpfaden entfernt: `intake-process` voll instrumentiert (`enter | exit | intake_trigger.chain[.ok] | intake-process.error`), `intake-understand` Skip-/Assignment-Pfade auf `log.stage`/`log.warn`, `commit-fact` Snapshot/Provenance/Notify/Top-Catch auf Logger umgestellt. Vitest 33/33 grün, ESLint weiterhin 0 Errors.
- **2026-05-14 (Sprint Sofort)** Graphiti-422-Fix: `addMessage()` setzt `role` als Pflichtfeld-Default. `graphiti-backfill` Edge Function gebaut → 20 ungemirrorte canonical_facts nachgezogen, 0 Fehler. Knowledge-Graph wieder aktiv.
- **2026-05-14 (Sprint Sofort)** `intake-trigger` voll instrumentiert (Stages `enter | asset_loaded | run_created | aol_call | aol_failed | invoke_understand_bg | bg_completed | bg_failed | exit | error`), `@ts-ignore` → typsicheres `declare const EdgeRuntime`. ESLint-Error gefixt (0 Errors auf der Datei).
- **2026-05-14** QA-Audit-Report: `QA-AUDIT-REPORT.md` mit Soll-Ist-Abgleich, drei Datenfluss-Befunde, Top-5-Fixes.
- **2026-05-14** Phase 3 (Test-Schichten): `testFixtures.ts` + `test-data-sweep` Edge Function, 6 Unit-Test-Files (33 Tests grün), Deno-Tests für `scoreProjects` / `mapToBoxType` / `segmentsToText` (10 Tests grün).
- **2026-05-14** Phase 4 (Teil 1): ESLint verschärft (als Warnings), `.github/workflows/qa.yml` mit 4 Jobs (lint/typecheck/test/build).
- **2026-05-14** Phase 2: `pipeline_events`-Tabelle, `_shared/logger.ts`, ErrorBoundary, Frontend-DevLog-Sink, instrumentierte Edge Functions, `inspect-pipeline` erweitert, `/pipeline-health` Live-Panel.
- **2026-05-14** Phase 1: `docs/qa-seam-inventar.md` mit Seam-Tabelle und Top-10-Risiko-Liste.

