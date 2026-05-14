# Fix-Plan zum QA-Audit-Report

Reihenfolge nach Impact. Jede Stufe ist eigenständig commit-fähig — bei Abbruch bleibt der Stand grün.

## 1. Graphiti-422 fixen — Knowledge-Graph wieder aktiv (höchste Priorität)

**Problem:** 0 / 4 erfolgreiche Mirrors in 24 h. Canonical-Facts landen nur in Supabase, nie in Neo4j. RAG ist faktisch tot.

**Diagnose zuerst** (5 min, real, nicht raten):
- `inspect-graphiti` aufrufen mit letzter `commit-fact`-Payload aus `pipeline_events`.
- 422-Body live reproduzieren via `railway-admin` → `graphiti-probe`.
- Vergleich gegen Graphiti-OpenAPI: welches Feld fehlt wirklich? (`role`, `name`, `group_id`, `source_description`?)

**Fix:**
- In `supabase/functions/_shared/graphiti.ts` betroffenes Feld ergänzen oder Default setzen.
- Logger-Stage `mirror_request` + `mirror_response` mit Body-Hash, damit künftige Drifts sofort sichtbar.
- Backfill: einen `graphiti-reconcile`-Lauf für die 25 ungemirrorten canonical_facts der letzten 24 h.

**Akzeptanz:** ein frischer commit-fact-Lauf produziert `pipeline_events` mit `mirror_response.status=200` und `graphiti_uuid` ist in `canonical_facts` gesetzt.

## 2. `intake-trigger` instrumentieren + ESLint-Error fixen

**Problem:** Async-Pipeline-Hänger (siehe 08:41-Vorfall) sind im Health-Panel unsichtbar. Zusätzlich blockt `@ts-ignore` in Zeile 163 jedes spätere ESLint-Error-Gate.

**Fix:**
- `createLogger({ fn: "intake-trigger" })` einziehen.
- Stages: `enter | aol_call | invoke_understand_bg | exit | error` plus `bg_completed` / `bg_failed` aus den `.then`/`.catch`-Handlern → schreiben in `pipeline_events` mit `run_id`.
- Alle `console.error` ersetzen.
- Zeile 163: `@ts-ignore` → `@ts-expect-error EdgeRuntime ist global im Supabase Edge Runtime`.

**Akzeptanz:** `bunx eslint .` 0 Errors. Ein Asset-Upload zeigt im `/pipeline-health` lückenlose Stage-Kette `intake-trigger.enter → … → intake-understand.exit`.

## 3. Restliche `console.log` raus + Logger in 4 weitere Hot-Funktionen

**Problem:** 4 Treffer in `_shared/agentClient.ts`, `intake-understand`, `intake-process`. CI-Smoke `rg console.log supabase/functions/` wäre rot. `intake-process` ist Teil des Hot-Paths.

**Fix:**
- `intake-process` und `intake-understand`: alle `console.log` → `log.info/warn/error` mit passender Stage.
- `_shared/agentClient.ts`: auf `log.debug` mit injiziertem Logger umstellen (Caller übergibt).
- `_shared/logger.ts` darf weiter auf stdout spiegeln — als einziger erlaubter Treffer markieren.

**Akzeptanz:** `rg "console\.log" supabase/functions/ | rg -v "_shared/logger.ts"` ist leer.

## 4. `commit-fact` testbar machen

**Problem:** Kernlogik in `Deno.serve`-Closure → keine Unit-Tests möglich. Schwerstes 643-LOC-Modul ist ungetestet.

**Fix:**
- Pure Funktion `commitFact({ admin, user, payload, log }): Promise<CommitResult>` extrahieren. `Deno.serve`-Wrapper nur noch HTTP-Adapter.
- `_shared/testFixtures.ts` um `mockAdmin()` erweitern (in-memory Supabase-Stub mit `from().select/insert/update`).
- Drei Deno-Tests in `commit-fact/index_test.ts`:
  - Happy: Proposed → Canonical, `change_events` geschrieben.
  - Konflikt: zweiter widersprüchlicher Fact erzeugt `contradictions`-Eintrag.
  - Supersede: Re-Commit setzt `superseded_by` + neuen `valid_from`.
- Über `supabase--test_edge_functions` ausführen.

**Akzeptanz:** `commit-fact` Deno-Tests grün, plus 3 weitere Tests im Suite-Output.

## 5. Phase-4-Gate vollenden — Prettier + Husky + lint-staged + Nightly

**Problem:** Kein Pre-commit-Schutz, keine konsistente Formatierung, Sweeper läuft nur manuell.

**Fix:**
- `.prettierrc` (2 spaces, single quote, semi true) + `eslint-config-prettier` als letztes `extends`.
- `husky` + `lint-staged` als devDeps. `prepare`-Skript in `package.json`. `.husky/pre-commit` ruft `lint-staged`.
- `lint-staged` für `*.{ts,tsx}`: `eslint --max-warnings 0` + `tsc --noEmit -p tsconfig.app.json`.
- Sobald Schritte 2 + 3 grün: ESLint-Regeln von `warn` → `error` (`no-unused-vars`, `no-floating-promises`, `no-console` mit `allow:["warn","error"]`).
- `.github/workflows/qa-nightly.yml`: täglich `supabase--curl_edge_functions` auf `test-data-sweep`.

**Akzeptanz:** Ein absichtlicher Lint-Fehler in einem Test-Commit wird vom Hook geblockt. Nightly-Run im Actions-Tab sichtbar.

## 6. Frontend-Polling absichern + ErrorBoundary für Backend-Pendant

**Problem:** Neu gebauter `pollAolRun` ohne Test. Backend hat kein Worker-weites Error-Catch.

**Fix:**
- `src/lib/pipeline/pollAolRun.test.ts` mit MSW-freier Stub-Strategie: Supabase-Client mocken über `vi.mock`. Pfade: completed / failed / timeout / abort.
- In jedem Edge-Function-Entry `try { … } catch (err) { log.error("uncaught", err); throw err; }` als Pflicht — neuer Helper `withErrorBoundary(fn, log)` in `_shared/`.

**Akzeptanz:** Vitest 37+/37 grün; jede Edge Function nutzt `withErrorBoundary`.

## 7. E2E-Smokes (3 Pfade) — letzter Block

Nach Stufe 5 sinnvoll, weil Lint stabil sein muss. MSW installieren, drei Pfade:
- Upload EML → Review → Commit → Fact im Project sichtbar.
- Note erfassen → Review → Commit.
- Asset löschen → `aol_runs`-Cascade.

**Akzeptanz:** `bun run test` enthält 3 E2E-Specs grün.

---

## Reihenfolge & Sprint-Schnitt

| Sprint | Stufen | Aufwand |
|---|---|---|
| Sofort | 1, 2 | 2–3 h — beendet die zwei akuten Blutungen |
| Diese Woche | 3, 4 | 4–6 h — schließt Test-Lücken im schwersten Modul |
| Nächste Woche | 5, 6 | 4 h — macht Phase-4-Gate scharf |
| Danach | 7 | 4 h — Smoke-Netz |

## Was nicht im Plan ist (bewusst)

- ESLint `no-explicit-any`-Warnings (66) — kosmetisch, später als eigener Sprint.
- Logger in `inspect-*`-Funktionen — sind read-only, niedriges Risiko.
- `voice-transcribe`, `asset-delete`, `project-delete` — geringe Frequenz, nach Stufe 5.

NOW.md wird nach jeder Stufe aktualisiert (Status + Recently completed). DECISIONS.md erhält Eintrag bei Graphiti-Body-Vertragsänderung (Stufe 1).
