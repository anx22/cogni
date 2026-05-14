# NOW — Aktueller Sprint & Backlog

> Co-Doku zu `AGENTS.md`, `PRODUCT.md`, `ARCHITECTURE.md`, `DECISIONS.md`.
> Seam-Inventar (lebende QA-Karte) in `./qa-seam-inventar.md`.

---

## Aktueller Sprint — QA-Härtung abgeschlossen

Stand 2026-05-14:

| Phase | Soll | Ist | Status |
|---|---|---|---|
| 1 Bestand | Seam-Inventar + Top-10-Risiko | `docs/qa-seam-inventar.md` | ✅ |
| 2 Instrumentierung | Logger, `pipeline_events`, ErrorBoundary, Health-Panel | deployed | ✅ |
| 3 Tests | Fixtures, Sweeper, Unit + Edge + E2E-Smokes | 40 Vitest + 18 Deno grün | ✅ |
| 4 Automatisierung | ESLint scharf, Prettier, Husky, CI, withErrorBoundary, console.log-Smoke | alle 16 Edge Functions gewrappt, CI blockt | ✅ |

Endmetriken: Vitest 9 Files / 40 Tests · Deno 19 Tests · ESLint 0 Errors ·
Logger-Abdeckung **16/16** (inkl. Inspector + railway-admin) · Graphiti-Mirror wieder ~100 %.

---

## Backlog (nach Priorität)

1. **Welle B — Knowledge-Graph-Linking** *(Produkt-Roadmap)*
   - `linker` (Graph-Match statt Title-Match), `conflict_detector`, `gap_detector`, `dependency_detector` zwischen `interpreter` und `condenser` im AOL-Service.
   - Erst sinnvoll, sobald Welle A produktiv Daten in den Graph legt und der Reuse-Check (zweites Asset im selben Projekt → Kontext nicht leer) stabil läuft.

2. **Echte Browser-E2E-Lane** *(QA, optional)*
   - Playwright-Setup, ein Smoke pro Persona-Pfad (Upload, Notiz, Asset-Delete).
   - Erst sinnvoll, sobald Persona-/Auth-Fixtures als Browser-Cookie gespiegelt sind.

3. **Tier B — Vereinfachung / Duplikationsabbau** *(siehe `agent-execution-plan.md`)*
   - B1 Quick Wins (Date-Formatter, mapById, http-Wrapper, Auth-Helper, SectionHeader).
   - B2 mittlere Refactors (`useRealtimeTable`, View-Model-Mapper, Inspector-Merge).

---

## Recently completed

- **2026-05-14 (A1+A2 Plan)** Tier A1 verifiziert (Graphiti-Mirror live ohne 422, `intake-trigger` instrumentiert, `console.log`-frei). A2.1 Kernel-Tests um `replace`-Pfad ergänzt (4 Deno-Tests). A2.3 Logger-Abdeckung **100 %** — `inspect-pipeline`/`-graphiti`/`-langsmith`/`-railway` + `railway-admin` instrumentiert (try/finally-Flush). A2.4 `lint-staged` auf `--max-warnings 0`, `qa-nightly.yml` um Lint+Typecheck+Vitest+Prettier+Build+Deno-Tests erweitert.
- **2026-05-14 (Stage 7)** Audit-Restschuld geschlossen: Logger in `voice-transcribe`/`asset-delete`/`project-delete`, CI-Smoke-Job `smoke` in `qa.yml` blockt jeden neuen `console.log` außer `_shared/logger.ts`. `aol-callback` refaktoriert zu pure `handleCallback({admin,payload,log})` mit 5 Deno-Tests. Drei E2E-Smokes in `src/test/e2e-smokes.test.ts` (Note→intake-trigger / Asset-Delete / Fakt-Retract).
- **2026-05-14 (Stage 5–6)** Phase-4-Gate scharf: ESLint-Regeln `no-unused-vars`/`prefer-const`/`eqeqeq`/`no-console` (Browser) → **error**. Prettier 3 + Husky 9 + lint-staged 17, Nightly-Cron `qa-nightly.yml` (03:17 UTC). `_shared/withErrorBoundary.ts` als Pflicht-Wrapper auf alle 16 Edge Functions. `pollAolRun` getestet (4 Pfade, Fake-Timers).
- **2026-05-14 (Stage 3–4)** `commit-fact` testbar: pure `commitFact()` aus `Deno.serve` extrahiert, `mockAdmin()` mit Stub-Queue + Call-Recorder, 3 Deno-Tests (Happy / NEEDS_ASSIGNMENT / Reject). Console-Sweep in `intake-process`/`intake-understand`/`commit-fact`.
- **2026-05-14 (Sprint Sofort)** Graphiti-422-Fix: `addMessage()` setzt `role="user"`-Default, `graphiti-backfill` Edge Function zieht 20 ungemirrorte canonical_facts nach. `intake-trigger` voll instrumentiert.
- **2026-05-14** Doku-Konsolidierung Schritt 2: alle Detail-Docs (`PRODUCT`/`ARCHITECTURE`/`NOW`/`DECISIONS`) nach `docs/` verschoben, in der Wurzel bleiben nur `AGENTS.md` + `README.md`. `docs/qa-historie.md` aufgelöst (Methodik + Stages → `DECISIONS.md`, Endmetriken → hier oben). `docs/qa-seam-inventar.md` bleibt als lebende Referenztabelle.
- **2026-05-14** Doku-Konsolidierung Schritt 1: Workspace-5-Datei-System eingeführt. Alte `docs/produkt-gesamt.md`/`implementierung-aktuell.md`/`geplant.md` entfernt.
