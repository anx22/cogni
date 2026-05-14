# NOW — Aktueller Sprint & Backlog

> Co-Doku zu `AGENTS.md`, `PRODUCT.md`, `ARCHITECTURE.md`, `DECISIONS.md`.
> Seam-Inventar (lebende QA-Karte) in `./qa-seam-inventar.md`.

---

## Aktueller Sprint — Tier B1 abgeschlossen

Stand 2026-05-14 (Tier B1 — Quick Wins):

- **B1.1 Date-Formatter konsolidiert** → neues Modul `src/lib/format/dateFormatters.ts`
  (`fmtLong`, `fmtShort`, `fmtTime`, `fmtDateTimeShort`, `fmtDateTimeLong`,
  `ageInDays`, `toTimestamp`). Migriert: `projectViewModel`, `DialogOverlay`,
  `InspectorPanel`. Re-Export von `formatRelative` für Abwärtskompat.
- **B1.2 Map-Utilities** → `mapById`, `countBy` in `src/lib/utils.ts`. Genutzt
  in `useProjects` (entfernt manuelles `inc`-Pattern) und `projectViewModel`.
- **B1.3 HTTP-Wrapper** → `supabase/functions/_shared/http.ts`
  (`corsHeaders`, `ok`, `fail`, `handleOptions`). 6 Functions migriert,
  `withErrorBoundary` + `inspect-auth` re-exportieren von dort (kein Drift).
- **B1.4 Project-Shared-Components** → `SectionLabel`, `CardSurface`.
  `HandlungsbedarfList` und `VerlaufFeed` migriert (visuell identisch).
- **B1.5 Auth-Helper** → `supabase/functions/_shared/auth.ts`
  (`getAuthenticatedUser` → `{ok, userId, user, client, token}`). Migriert:
  `commit-fact`, `asset-delete`, `project-delete`. (`intake-trigger`,
  `voice-transcribe`, `aol-callback` nutzen jetzt zumindest geteilte
  CORS/OPTIONS — eigene Auth-Spezialfälle bewusst belassen.)

Verify: Vitest 60/60 grün. Edge-Functions deployed. Smoketests:
OPTIONS-Preflights + ungültige/leere Auth-Token → korrekte 401-Antworten.

### Vorher/jetzt-Endmetriken
Vitest 10 Files / 60 Tests · Deno 19 Tests · ESLint 0 Errors ·
Logger-Abdeckung 16/16 · Graphiti-Mirror ~100 %.

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

- **2026-05-14 (Tier A3)** Architektur-Härtung abgeschlossen. **A3.3:** DB-Trigger `validate_fact_content` auf `canonical_facts` + `proposed_facts` — pro `fact_type` Pflichtfelder, `RAISE EXCEPTION` mit Prefix `fact_content_invalid:`. Garbage-Insert nachweislich blockiert. **A3.2:** `useProject.ts` (514 LOC) in 3 Dateien zerlegt — `useProjectData.ts` (Queries + Realtime), `projectViewModel.ts` (pure Mapper, 9 Funktionen), `useProject.ts` (40 LOC Composition). 20 neue Vitest-Tests in `projectViewModel.test.ts`, ProjectScreen-Interface 1:1 erhalten. **A3.1:** `strictNullChecks: true` in `tsconfig.app.json` + `tsconfig.json` aktiviert — `tsc --noEmit` grün ohne weitere Fixes (Code war robuster als erwartet). Endmetriken: Vitest 10 Files / **60 Tests** · ESLint 0 Errors auf neuem Code.
- **2026-05-14 (Sandbox-Seed)** Drei fiktionale QA-Sandbox-Projekte angelegt unter User `account@animatex.de`: **Hase & Söhne Couture** (Fashion, Frau Hase ändert ständig Farben), **Tübingen Tower** (Archviz, 72m vs 87m Konflikt), **Spätzbohrer 4.0** (Industrie, Maggus + ISO-Audit). Pro Projekt: Org + Persons + Stakeholder-Links + Note-Asset + Source + ParsedDocument + 3 ProposedFacts + 3 ReviewBoxes. 3 Boxes via `commit-fact` bestätigt → 3 canonical_facts + 3 change_events + 3 graphiti_sync_log (queued, async). Ab jetzt laufende QA-Begleitung — siehe DECISIONS-Eintrag.
- **2026-05-14 (A1+A2 Plan)** Tier A1 verifiziert (Graphiti-Mirror live ohne 422, `intake-trigger` instrumentiert, `console.log`-frei). A2.1 Kernel-Tests um `replace`-Pfad ergänzt (4 Deno-Tests). A2.3 Logger-Abdeckung **100 %** — `inspect-pipeline`/`-graphiti`/`-langsmith`/`-railway` + `railway-admin` instrumentiert (try/finally-Flush). A2.4 `lint-staged` auf `--max-warnings 0`, `qa-nightly.yml` um Lint+Typecheck+Vitest+Prettier+Build+Deno-Tests erweitert.
- **2026-05-14 (Stage 7)** Audit-Restschuld geschlossen: Logger in `voice-transcribe`/`asset-delete`/`project-delete`, CI-Smoke-Job `smoke` in `qa.yml` blockt jeden neuen `console.log` außer `_shared/logger.ts`. `aol-callback` refaktoriert zu pure `handleCallback({admin,payload,log})` mit 5 Deno-Tests. Drei E2E-Smokes in `src/test/e2e-smokes.test.ts` (Note→intake-trigger / Asset-Delete / Fakt-Retract).
- **2026-05-14 (Stage 5–6)** Phase-4-Gate scharf: ESLint-Regeln `no-unused-vars`/`prefer-const`/`eqeqeq`/`no-console` (Browser) → **error**. Prettier 3 + Husky 9 + lint-staged 17, Nightly-Cron `qa-nightly.yml` (03:17 UTC). `_shared/withErrorBoundary.ts` als Pflicht-Wrapper auf alle 16 Edge Functions. `pollAolRun` getestet (4 Pfade, Fake-Timers).
- **2026-05-14 (Stage 3–4)** `commit-fact` testbar: pure `commitFact()` aus `Deno.serve` extrahiert, `mockAdmin()` mit Stub-Queue + Call-Recorder, 3 Deno-Tests (Happy / NEEDS_ASSIGNMENT / Reject). Console-Sweep in `intake-process`/`intake-understand`/`commit-fact`.
- **2026-05-14 (Sprint Sofort)** Graphiti-422-Fix: `addMessage()` setzt `role="user"`-Default, `graphiti-backfill` Edge Function zieht 20 ungemirrorte canonical_facts nach. `intake-trigger` voll instrumentiert.
- **2026-05-14** Doku-Konsolidierung Schritt 2: alle Detail-Docs (`PRODUCT`/`ARCHITECTURE`/`NOW`/`DECISIONS`) nach `docs/` verschoben, in der Wurzel bleiben nur `AGENTS.md` + `README.md`. `docs/qa-historie.md` aufgelöst (Methodik + Stages → `DECISIONS.md`, Endmetriken → hier oben). `docs/qa-seam-inventar.md` bleibt als lebende Referenztabelle.
- **2026-05-14** Doku-Konsolidierung Schritt 1: Workspace-5-Datei-System eingeführt. Alte `docs/produkt-gesamt.md`/`implementierung-aktuell.md`/`geplant.md` entfernt.
