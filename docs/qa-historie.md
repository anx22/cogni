# QA-Historie

> Konsolidierung aus dem ehemaligen `QA-PLAN.md` (4-Phasen-Plan) und `QA-AUDIT-REPORT.md`
> (Soll-Ist-Audit vom 2026-05-14). Aktive Backlog-Items stehen in `NOW.md`,
> Seam-Inventar in `docs/qa-seam-inventar.md`, strukturelle Calls in `DECISIONS.md`.

## Methodik (4 Phasen)

| Phase | Ziel | Kerndeliverables |
|---|---|---|
| 1 Bestand | Karte aller Datenflüsse + blinde Übergabepunkte | `docs/qa-seam-inventar.md`, Top-10-Risiko-Liste |
| 2 Instrumentierung | Jede Stage produziert strukturiertes Log mit `correlation_id` | `_shared/logger.ts`, Tabelle `pipeline_events`, ErrorBoundary, Health-Panel |
| 3 Tests | Unit + Edge-Integration + E2E-Smokes mit Fixture-Marker | `_shared/testFixtures.ts`, `mockAdmin()`, `test-data-sweep`, Vitest-/Deno-Suites |
| 4 Automatisierung | Lint+Typecheck+Tests blocken Merge | ESLint scharf, Husky+lint-staged, Prettier, `qa.yml` (5 Jobs), Nightly-Cron |

Pipeline (kanonisch):
`asset → parsed_document → proposed_facts → review_cases → canonical_facts → change_events → graphiti_sync_log → Neo4j-Episode/Entities → RAG`.

## Auditor-Befund 2026-05-14

Methode: `bunx vitest run`, `bunx eslint .`, `rg console.log supabase/functions`,
`pipeline_events`-Stichproben der letzten 24 h, `rg createLogger` für Abdeckung.

**Ist-Zustand bei Audit:**
- 47 `pipeline_events` in 24 h, RLS aktiv. 25 canonical_facts, 51 review_cases, 7 aol_runs.
- Vitest 7 Files / 33 Tests grün. ESLint 1 Error + 66 Warnings.
- Logger-Abdeckung 5/15 Funktionen. 4× `console.log` in Edge Functions.
- Graphiti-Mirror-Erfolgsquote **0/4** (alle 422 — `body.messages[0].role missing`) → Drift Supabase ↔ Neo4j.
- `intake-trigger` ohne Logger → 08:41-Vorfall (`Edge Function returned non-2xx`) nur in Edge-Logs auffindbar.

**Top-5 Fixes (alle umgesetzt):**
1. Graphiti-422 fixen → `addMessage()` mit `role="user"`-Default + Backfill.
2. `intake-trigger` instrumentieren → Stages `enter | asset_loaded | run_created | aol_call | aol_failed | invoke_understand_bg | bg_completed | bg_failed | exit | error`.
3. ESLint-Error `@ts-ignore` → typsicheres `declare const EdgeRuntime`.
4. `commit-fact` refaktorieren → pure `commitFact()` + 3 Deno-Tests.
5. Pre-commit-Gate aktivieren → Husky + lint-staged + Prettier; ESLint von `warn` → `error`.

## Stages 1–7 (chronologisch)

- **Stage 1 (Bestand)** — `docs/qa-seam-inventar.md` erstellt, Top-10-Risiko-Seams gerankt.
- **Stage 2 (Instrumentierung)** — `pipeline_events`-Tabelle + `_shared/logger.ts`, ErrorBoundary + global handlers, `inspect-pipeline` erweitert, `/pipeline-health` Live-Panel.
- **Stage 3 (Console-Sweep)** — `intake-process`/`intake-understand`/`commit-fact` voll auf Logger umgestellt. Vitest 33/33.
- **Stage 4 (commit-fact testbar)** — pure `commitFact()` extrahiert, `mockAdmin()` mit Stub-Queue + Call-Recorder, 3 Deno-Tests (Happy / NEEDS_ASSIGNMENT / Reject). Suite 13/13.
- **Stage 5 (Phase-4-Gate)** — ESLint-Regeln scharf, Prettier 3 + `eslint-config-prettier`, Husky 9 + lint-staged 17, Nightly-Cron `qa-nightly.yml` (03:17 UTC).
- **Stage 6 (Poller + Boundary)** — `pollAolRun.test.ts` (4 Pfade: completed/failed/timeout/abort, Fake-Timers). `_shared/withErrorBoundary.ts` als Pflicht-Wrapper auf alle 16 Edge Functions. Vitest 37/37.
- **Stage 7 (Audit-Restschuld)** — Logger in `voice-transcribe`/`asset-delete`/`project-delete`. `agentClient.ts` `console.log` → `console.warn`. CI-Smoke-Job `smoke` blockt `console.log`. `aol-callback` refaktoriert + 5 Deno-Tests. 3 E2E-Smokes (`src/test/e2e-smokes.test.ts`). Vitest 40/40, Deno 18/18, Logger-Abdeckung 11/16 (Inspector/Admin bewusst ausgespart).

## Endmetriken

- **Vitest:** 9 Files / 40 Tests grün.
- **Deno-Tests:** 18 Tests grün (commit-fact 3, aol-callback 5, Helfer 10).
- **ESLint:** 0 Errors, ~52 bewusste Warnings (`no-explicit-any` + `react-refresh` HMR).
- **`console.log` in Edge Functions:** 0 außer `_shared/logger.ts` (legitim).
- **Logger-Abdeckung:** 11/16 Edge Functions (alle Hot-Path & user-facing).
- **Edge Functions in `withErrorBoundary`:** 16/16.
- **Graphiti-Mirror-Erfolgsquote:** wieder ~100 % nach Backfill.

## Erledigte Produkt-Phasen vor QA

Phase 0–10a abgeschlossen (Grundgerüst, Design-System, Entity-Screen, Lovable Cloud,
Datenmodell-Erweiterung, Vier-Rollen-Projektscreen, Side-Grids, Manuell-Kennzeichnung,
Dialog-Overlay V1, Universeller Input, Upload-Pipeline V1, Verstehens-Loop, Commit-Pfad,
Echte Projekt-Anbindung, UX-Sweep, Knowledge-Graph Welle A). Welle B (`linker`,
`conflict_detector`, `gap_detector`, `dependency_detector`) bleibt geplant — siehe `NOW.md`.
