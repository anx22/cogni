# Plan — Tier A1 verifizieren, Tier A2 vollständig umsetzen

## Status-Check (was bereits steht)


| Item                         | Stand                                                                                                                                                            |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1.1 Graphiti `role`-Feld    | ✅ in `_shared/graphiti.ts` Z.116–120 gesetzt                                                                                                                     |
| A1.2 `intake-trigger` Logger | ✅ `createLogger({ fn: "intake-trigger" })` aktiv                                                                                                                 |
| A1.3 `console.log` weg       | ✅ nur noch in `_shared/logger.ts` selbst                                                                                                                         |
| A2.1 commit-fact Kernel      | ⚠️ Tests existieren, aber Kernlogik weiterhin in `Deno.serve`. Kernel-Trennung fehlt.                                                                            |
| A2.2 E2E-Smokes              | ⚠️ `src/test/e2e-smokes.test.ts` deckt 3 Hook-Pfade per Mock ab. Reicht als Frontend-Smoke; ergänzt wird Pfad „Note → Confirm → canonical" als reine Hook-Kette. |
| A2.3 Logger 100%             | ⚠️ fehlen: `inspect-pipeline`, `inspect-graphiti`, `inspect-langsmith`, `inspect-railway`, `railway-admin`                                                       |
| A2.4 Phase-4-Gate            | ⚠️ `--max-warnings 100`, kein verifiziertes Nightly-Grün                                                                                                         |


A1 ist faktisch erledigt — wird im Plan nur durch eine Kontroll-Session bestätigt, nicht erneut implementiert.

---

## A1 — Verifikation (kein Code-Change)

**A1-Verify.** Drei Smoke-Schritte:

1. `supabase--read_query`: `select status, count(*) from graphiti_sync_log where created_at > now() - interval '1 day' group by status` — Erfolg ≥ 95%, keine 422.
2. `supabase--read_query`: `select fn, count(*) from pipeline_events where fn='intake-trigger' and created_at > now()-interval '1 day' group by fn` — > 0.
3. `rg "console\.log" supabase/functions --glob '!_shared/logger.ts'` — 0 Treffer.

Ergebnis als Eintrag in `docs/NOW.md` (Recently completed) festhalten.

---

## A2.1 — `commit-fact` in Pure Kernel refaktorieren

**Ziel.** HTTP-Schale dünn, Kernel testbar ohne Live-DB.

**Schritte.**

1. Neue Datei `supabase/functions/commit-fact/kernel.ts`:
  - Exportiert `commitFact(input, deps): Promise<CommitResult>`.
  - `deps`: `{ supabase, log, graphitiAddMessage, graphitiConfigured, now? }`.
  - Bewegt Kernlogik (Session-Lookup, Assignment-Spezialfall, Fact-Insert, change_event, gap_signal/dependency, Graphiti-Mirror) 1:1 aus `index.ts`.
2. `index.ts` schrumpft auf: CORS, Auth, Body-Parse, `commitFact(...)`, Response, `log.flush()`.
3. Bestehender `commitFact_test.ts` wird auf neuen Kernel umgehängt; falls Datei noch HTTP-Form testet, Adapter ergänzen.
4. Drei Deno-Tests in `commit-fact/kernel_test.ts` (oder existierende erweitern):
  - happy_confirm, conflict_replace, recommit_idempotent.
  - In-Memory-Mock-Supabase als kleine Hilfsklasse in `_shared/testFixtures.ts` (existiert bereits) erweitern.

**Verify.** `supabase--test_edge_functions { functions: ["commit-fact"] }` grün; manueller HTTP-Smoke via `supabase--curl_edge_functions` (confirm eines proposed_fact) liefert dieselbe Response wie vorher.

---

## A2.2 — E2E-Smokes komplettieren

**Ziel.** Drei Vollpfad-Hook-Tests grün, Dauer < 30 s.

**Schritte.**

1. `src/test/e2e-smokes.test.ts` prüfen — falls Pfad 3 (Asset-Delete cascading) nur die Invoke prüft, ergänzen: nach `asset-delete` werden `parsed_documents`, `sources`, `proposed_facts` mit derselben asset_id gelöscht (mock-seitig: Recorder zählt cascade-Tabellen).
2. Vierter Test: „Confirm flow end-to-end" — `useDialog.commitBox('confirm')` ruft `supabase.functions.invoke('commit-fact', …)` mit korrekter Payload-Form.
3. CI-Lauf nicht in pre-commit, bleibt in `.github/workflows/qa.yml`.

**Verify.** `bunx vitest run src/test/e2e-smokes.test.ts` grün lokal und in CI.

---

## A2.3 — Logger-Coverage auf 100%

**Ziel.** Alle 15 Edge Functions mit `createLogger` + `withErrorBoundary` + Stage-Logs.

**Reihenfolge** (nach Risiko):

1. `inspect-pipeline` — Stages: `query`, `aggregate`, `done`.
2. `railway-admin` — Stages pro Action: `auth`, `dispatch:<action>`, `result`, `done`. Strukturierte Felder statt `console.warn`.
3. `inspect-graphiti` / `inspect-langsmith` / `inspect-railway` — Stages: `probe`, `result`.

**Pro Function.**

- `withErrorBoundary("<name>", async (req) => …)` umhüllen.
- `const log = createLogger({ fn: "<name>", client: admin })` direkt nach Auth.
- `log.stage(...)` an natürlichen Übergängen, `log.error(...)` in catch.
- `await log.flush()` vor jedem `return`.
- ESLint-Reste (`@ts-ignore`, lose `console.*`) ersetzen.

**Verify.**

- `rg "createLogger" supabase/functions/*/index.ts | wc -l` = Anzahl Functions.
- `supabase--read_query`: `select fn, count(*) from pipeline_events where created_at > now()-interval '1 hour' group by fn` zeigt jede Function nach manuellem Trigger.

---

## A2.4 — Phase-4-Gate schließen

**Ziel.** Lint-Strenge auf 0, Husky aktiv, Nightly grün.

**Schritte.**

1. `package.json` `lint-staged.*.tsx` → `eslint --max-warnings 0`. Vorher einmal `bunx eslint --fix .` laufen lassen (in CI-Step prüfen, im Plan separat ausgeführt).
2. `.prettierrc` ist da; `bunx prettier --write .` einmal anwenden — in dedicated commit.
3. `.husky/pre-commit` enthält `bunx lint-staged` ✅ — kein Change.
4. `.github/workflows/qa-nightly.yml` prüfen: muss `vitest run`, `eslint .`, `deno test supabase/functions/` enthalten. Fehlende Steps ergänzen.

**Verify.**

- `git commit` mit künstlichem Warning schlägt fehl (lokaler Trockenlauf).
- Nightly-Run in GitHub Actions grün (manuell triggern via `workflow_dispatch`).

---

## Verbindliche Reihenfolge / Commits

1. A1-Verify → NOW.md-Update (1 Commit).
2. A2.1 Kernel-Extraktion (1 Commit) + Tests (1 Commit).
3. A2.3 Logger-Welle in 5 Sub-Commits (eine Function pro Commit).
4. A2.2 E2E-Lückenschluss (1 Commit).
5. A2.4 Prettier-Run (1 Commit) → max-warnings 0 (1 Commit) → Nightly-Workflow (1 Commit).

Nach jedem Commit: `vitest run` + `eslint .` grün. Bei Rot: revert, kein Weiterbauen.

## Doku-Pflicht am Ende

- `docs/NOW.md`: Sprint „A1+A2 abgeschlossen" + Recently completed.
- `docs/DECISIONS.md`: Eintrag „Pure-Kernel-Pattern für Edge Functions" (commit-fact als Referenz).
- `docs/qa-seam-inventar.md`: Risk-Reduktion für `commit-fact`, `inspect-*`, `railway-admin` aktualisieren.