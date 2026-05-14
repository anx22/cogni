# QA-Audit-Report — Stand 2026-05-14

Auditor: Senior-QA. Methode: Soll-Ist gegen QA-PLAN.md, ausgeführte Tests,
Lint, Datenbank-Stichproben aus den letzten 24 h.

## Audit-Methode

1. **Struktur**: QA-PLAN.md + NOW.md gelesen, Existenz aller Deliverables per `ls` geprüft.
2. **Funktion**: `bunx vitest run` — 7 Files / 33 Tests grün in 4,9 s. Deno-Edge-Tests separat (nicht via vitest).
3. **Lint/Toolchain**: `bunx eslint .`, `rg console.log supabase/functions`, `package.json`-Scripts gelesen.
4. **Datenfluss**: `pipeline_events` und Pipeline-Tabellen der letzten 24 h per SQL gezählt; Logger-Abdeckung per `rg createLogger` ermittelt.

## ✅ Korrekt implementiert

| Deliverable | Beweis |
|---|---|
| Phase 1 Seam-Inventar | `docs/qa-seam-inventar.md` |
| Phase 2 Logger-Modul | `supabase/functions/_shared/logger.ts` |
| Phase 2 `pipeline_events`-Tabelle | 47 Events in 24 h, RLS aktiv |
| Phase 2 ErrorBoundary + global handlers | `src/components/ErrorBoundary.tsx`, `src/lib/devlog/devlog.ts` (`attachGlobalErrorHandlers`) |
| Phase 2 Health-Panel | `src/pages/PipelineHealth.tsx`, `inspect-pipeline` Edge Function |
| Phase 2 Logger eingezogen in 5 Funktionen | `commit-fact`, `intake-understand`, `aol-callback`, `graphiti-reconcile`, `test-data-sweep` |
| Phase 3 Fixtures + Sweeper | `supabase/functions/_shared/testFixtures.ts`, `supabase/functions/test-data-sweep/index.ts` |
| Phase 3 Unit-Tests | 33/33 grün: `boxMapping`, `sessionMode`, `sessionFactories`, `detectInputType`, `relativeTime`, `sanitizeStorageName`, `example` |
| Phase 4 CI-Workflow | `.github/workflows/qa.yml` mit 4 Jobs (lint/typecheck/test/build) |
| Datenfluss live | 25 canonical_facts, 51 review_cases, 7 aol_runs in 24 h — Pipeline schreibt, Logger feuert |

## ⚠️ Teilweise implementiert

| Deliverable | Was fehlt |
|---|---|
| Logger-Abdeckung Edge Functions | 10 von 15 Funktionen ohne `createLogger` — namentlich: `intake-trigger`, `intake-process`, `inspect-graphiti`, `inspect-langsmith`, `inspect-railway`, `railway-admin`, `voice-transcribe`, `asset-delete`, `project-delete`, `inspect-pipeline`. Hot-Path-Lücke: `intake-trigger` (kürzlich um async-Polling erweitert) loggt nur via `console.error`. |
| ESLint-Schärfung | Regeln laufen als `warn`, nicht `error` (`no-unused-vars`, `no-floating-promises`, `no-console`). 66 Warnings noch im Code. |
| `console.log`-Smoke-Regel | Noch 4 Treffer in `supabase/functions/`: `_shared/logger.ts` (legitim — Spiegel auf stdout), `_shared/agentClient.ts`, `intake-understand`, `intake-process`. CI-Smoke `rg "console.log"` würde aktuell rot. |
| Edge-Integrationstests | Plan listet `commit-fact` Happy/Konflikt/Supersede + `intake-understand` + `graphiti-reconcile` + `aol-callback`. Vorhanden: nur `commit-fact/projectScoring_test.ts` (reiner Helfer-Test). Service-Logik nicht abgedeckt. |
| Frontend-Polling | `pollAolRun` + `pollAolRunByAsset` neu gebaut, aber kein Test (`pollAolRun.test.ts` fehlt). |

## ❌ Nicht implementiert oder fehlerhaft

| Punkt | Befund |
|---|---|
| **ESLint-Error in `intake-trigger/index.ts:163`** | `@ts-ignore` statt `@ts-expect-error` → CI-Job `lint` fällt mit `--max-warnings 0`. Aktuell tolerieren CI/lint kein Error-Gate, deshalb unbemerkt. |
| **Pre-commit Hook (Husky + lint-staged)** | Komplett fehlend. `.husky/` existiert nicht, kein `prepare`-Skript in `package.json`. Pre-commit-Test daher nicht durchführbar. |
| **Prettier** | `.prettierrc` fehlt, `eslint-config-prettier` nicht installiert. |
| **Nightly-Cron für `test-data-sweep`** | Kein Workflow-File — Sweeper läuft nur manuell. Test-Daten-Leichen-Risiko bei intensiver QA-Nutzung. |
| **E2E-Smokes (3 Pfade aus Phase 3)** | Keine Datei. MSW nicht installiert. |
| **`commit-fact`-Refactor (pure `commitFact()`-Funktion)** | Kernlogik weiterhin in `Deno.serve`-Closure → testbar nur per HTTP-Curl, nicht per Unit. |
| **Globaler `unhandledrejection` im Backend** | Edge Functions fangen Top-Level-Errors per try/catch, aber kein Worker-weites `addEventListener("error")`-Pendant zum Frontend. |

## Datenfluss-Check — drei kritischste Übergabepunkte

| Seam | Logging? | Befund aus 24 h |
|---|---|---|
| 1. `intake-trigger → intake-understand` (async via `EdgeRuntime.waitUntil`) | ❌ `intake-trigger` ohne `createLogger`. Letzter Fehler von 08:41 (`intake-understand: Edge Function returned a non-2xx`) nur in Edge-Logs, kein `pipeline_events`-Eintrag → unauffindbar via Health-Panel. | Pipeline lief aber 7× durch in 24 h. |
| 2. `commit-fact → graphiti /messages` | ✅ Logger feuert, **aber Graphiti-Mirror schlägt durchgängig 422 fehl**: `body.messages[0].role missing`. 4 Treffer in Edge-Logs für `task` / `decision` / `stakeholder`. Canonical-Fact wird trotzdem geschrieben, also stiller Drift Supabase ↔ Neo4j. | Datenfluss "halb" — Wahrheit landet in Supabase, nie im Graph. |
| 3. `aol-callback` Status-Übergänge | ✅ Logger sauber, alle Übergänge `pending → running → completed` in `pipeline_events`. | Funktioniert. |

## 🔧 Top-5 priorisierte Fixes

1. **Graphiti-422 fixen (höchster Impact, blockt RAG komplett)**
   In `supabase/functions/_shared/graphiti.ts` der `/messages`-Body fügt `role`-Feld nicht hinzu. Graphiti erwartet `role: "user"` neben `role_type`. Aktuell laufen alle commit-facts Supabase-only — der gesamte Knowledge-Graph wächst nicht.

2. **`intake-trigger` instrumentieren**
   `createLogger` einziehen, mindestens Stages `start | aol_call | invoke_understand | exit | error`. Sonst bleiben async-Pipeline-Hänger unsichtbar (siehe 08:41-Vorfall).

3. **ESLint-Error in `intake-trigger:163` ersetzen**
   `@ts-ignore` → `@ts-expect-error` mit Begründung. Trivialer Einzeiler, blockiert aber Phase-4-Schärfung.

4. **`commit-fact` refaktorieren in pure `commitFact()`**
   Kernlogik aus `Deno.serve` ziehen, Mock-Supabase-Helfer schreiben, drei Integrationstests (Happy/Konflikt/Supersede). Deno-Tests landen in `commit-fact/index_test.ts`. Macht den schwierigsten Pfad endlich testbar.

5. **Pre-commit-Gate aktivieren (Husky + lint-staged + Prettier)**
   `husky install` + `.husky/pre-commit` → `lint-staged`. Gleichzeitig 4 verbleibende `console.log` in Edge Functions auf Logger umstellen, dann ESLint-Regeln von `warn` auf `error` hochziehen. Phase 4 ist sonst nur Kosmetik.

## Metriken

- Vitest: **7 Files / 33 Tests grün, 4,9 s**.
- ESLint: **1 Error, 66 Warnings**.
- `console.log` in Edge Functions: **4 Treffer**.
- Logger-Abdeckung: **5 / 15 Funktionen (33 %)**.
- Pipeline-Aktivität 24 h: **47 events, 25 canonical_facts, 7 aol_runs**.
- Graphiti-Mirror Erfolgsquote 24 h: **0 / 4 (alle 422)**.
