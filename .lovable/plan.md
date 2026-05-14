# Tier B4 + Abschluss-Audit

> **B3.2 ist bereits abgeschlossen** (railway-admin: Router 72 LOC + `_helpers.ts`
> + 6 Domänen-Handler, deployt, 4 curl-Stichproben grün, in DECISIONS.md doku-
> mentiert). Daher in dieser Loop: **B4 (3 kleine Tasks) + Audit aller Tiers**.

---

## Teil 1 — B4 (schnell und effizient)

### B4.1 Session-Factory generalisieren
- 8 Factories in `src/lib/dialog/sessionFactories.ts` (193 LOC) bauen alle
  `{ id: sessionId(), anlass, context, boxes: [...] }`.
- Interner Helper `mkSession(anlass, context, boxes)` — 3 Zeilen.
- **Öffentliche Signaturen aller 8 `buildXxxSession` bleiben unverändert.**
- Caller (`ConflictBanner.tsx`, Tests) nicht angefasst.
- Saved: ~25 LOC.
- **Verify:** `bunx vitest run` — `sessionFactories.test.ts` muss grün bleiben.

### B4.2 `withLogging`-Wrapper für Edge Functions
- Neuer Wrapper `supabase/functions/_shared/withLogging.ts`:
  ```ts
  withLogging("fn-name", async (req, log, ctx) => Response)
  ```
  Intern: `withErrorBoundary` + `handleOptions` + `createLogger` + `try/finally`
  mit `log.flush()`. Re-throw bleibt zuständig für 500-Hülle.
- **Migration (6 Functions, alle einfach):** `aol-callback`, `asset-delete`,
  `project-delete`, `voice-transcribe`, `intake-trigger`, `commit-fact`.
- **Bewusst NICHT migriert** (eigene Sonderpfade — Verhalten wäre nicht 1:1):
  `intake-understand` (payment_required/timeout), `intake-process`,
  `graphiti-reconcile`, `graphiti-backfill`, `test-data-sweep`,
  `inspect-pipeline`, `railway-admin` (gerade refaktoriert), `inspect-*`.
- Saved: ~50–80 LOC verteilt.
- **Verify:** `supabase--deploy_edge_functions` für die 6, dann
  `supabase--curl_edge_functions` Stichproben:
  - `aol-callback` ohne Token → 401
  - `voice-transcribe` OPTIONS → 204 + CORS
  - `commit-fact` mit leerem Body → 400
  - `intake-trigger` mit ungültiger Auth → 401
  Status-Codes & Body-Shape müssen 1:1 zur Pre-Refactor-Baseline passen.
- `bunx vitest run` (`commitFact_test.ts`, `handleCallback_test.ts`,
  `e2e-smokes.test.ts`) muss grün bleiben.

### B4.3 Fact-Linking-Config extrahieren
- Neue Datei `supabase/functions/intake-understand/factRules.ts`:
  - `LINKABLE_FACT_TYPES = new Set(["stakeholder","topic"])`
  - `FACT_SUMMARIZERS: Record<string, (c) => string>` — bisheriger
    `factSummary`-Switch in Map.
- `linkAgainstExisting` und `factSummary` in `index.ts` ziehen aus der Map,
  Verhalten 1:1.
- **Verify:** `e2e-smokes.test.ts` grün, deploy + Logs prüfen, keine neuen
  Errors bei nächstem realen Asset-Run.

---

## Teil 2 — Abschluss-Audit (alle Tiers gegen `docs/agent-execution-plan.md`)

Ziel: **schwarz auf weiß** beweisen, dass jeder Punkt aus dem Execution-Plan
entweder erledigt oder bewusst zurückgestellt ist. Keine stichprobenhafte
Selbsteinschätzung — jede Behauptung mit Tool-Evidenz.

### Audit-Methodik (pro Tier-Punkt)
Drei Spalten ins Audit-Dokument: **Anspruch** (Plan-Zitat) · **Beleg**
(Datei/Zeile/Curl/Test) · **Status** (✅ done · ⚠ partial · ⏸ postponed mit
Begründung).

### A-Tier (Stabilität)
- **A1.1 Graphiti-422 fix** → grep nach `role: "user"` in `_shared/graphiti.ts`,
  Logs der letzten 24h auf 422 prüfen via `supabase--edge_function_logs`.
- **A1.2 intake-trigger Logger** → `grep createLogger supabase/functions/intake-trigger`.
- **A1.3 console.log raus** → Smoke-Job ausführen: `rg "console\.(log|warn|error)" supabase/functions --glob '!_shared/logger.ts'`.
  Erwartung: 0 Treffer. Falls nicht: als Audit-Finding markieren.
- **A2.1 commit-fact Kernel** → Existenz `commitFact_test.ts`, `vitest run` zählt Test-Cases (Happy/NEEDS_ASSIGNMENT/Reject).
- **A2.2 E2E-Smokes** → `src/test/e2e-smokes.test.ts` lesen, mind. 3 Szenarien zählen.
- **A2.3 Logger-Coverage 100%** → für jede der 13 Hot-Path-Functions `grep createLogger`.
- **A2.4 Phase-4-Gate** → `.github/workflows/qa.yml` + `.husky/pre-commit` lesen, ESLint-Schärfe in `eslint.config.js` prüfen.
- **A3.1 strictNullChecks** → `tsconfig.app.json` lesen. Falls noch nicht aktiv: als ⏸ mit Vermerk im Audit (Plan sagt selbst „1–2 Wochen verteilt").
- **A3.2 useProject aufteilen** → 3-Schichten-Vorhandensein: `useProjectData.ts` + `projectViewModel.ts` + `useProject.ts`.
- **A3.3 JSONB-Validierung** → `supabase--read_query` auf `pg_proc` für `validate_fact_content` und `pg_trigger` für `trg_validate_fact_content`.

### B-Tier (Effizienz)
- **B1.1 Date-Formatter** → `src/lib/format/dateFormatters.ts` existiert + Caller-Sweep.
- **B1.2 Map-Utilities** → `grep` in `src/lib/utils.ts`.
- **B1.3 HTTP-Response-Wrapper** → `_shared/http.ts` existiert + Re-Export-Sweep.
- **B1.4 Section-Header / CardList** → `CardSurface.tsx` + `SectionLabel.tsx` existieren + 2+ Caller.
- **B1.5 Unified Auth** → `_shared/auth.ts` + `getAuthenticatedUser`-Caller-Sweep.
- **B2.1 useRealtimeTable** → `src/lib/realtime/useRealtimeTables.ts` + 8 Caller (grep).
- **B2.2 VM-Mapper** → Plan-Note aus letzter Loop: bewusst postponed (`projectViewModel.ts` schon strukturiert) → ⏸ mit Begründung.
- **B2.3 Inspector-Functions** → `_shared/inspector.ts` + 3 Caller (`inspect-langsmith/-railway/-graphiti`); `inspect-pipeline` ⏸.
- **B2.4 External-Clients** → `_shared/clients/{langsmith,railway}.ts` + Caller-Sweep.
- **B3.1 Box-Builder** → bewusst auf `useBoxSubmit`-Hook reduziert → ⏸ mit DECISIONS.md-Verweis.
- **B3.2 railway-admin modular** → `ls supabase/functions/railway-admin/handlers/` + Smoke-Curl auf `list`, `prompt-state`, `langsmith-key-info`, `diagnose`.
- **B4.1/4.2/4.3** → was eben gerade gebaut.

### Master-Checklist (`docs/agent-execution-plan.md` Z. 446–455)
Jeder Punkt einzeln ausgewertet:
- Graphiti-Sync-Success-Rate ≥ 95%/24h → `supabase--read_query` auf
  `graphiti_sync_log` GROUP BY ok.
- `deno test supabase/functions/` → `supabase--test_edge_functions`.
- `vitest` ≥ 50 Tests → `bunx vitest run` (Erwartung 60+).
- 3 E2E-Smokes grün in CI → `qa.yml` lesen + letzter Run.
- Logger-Coverage 15/15 → grep-Sweep.
- `tsc --noEmit` mit `strictNullChecks: true` → tsconfig prüfen, ggf. ⏸.
- LOC-Ziel Frontend < 14k / Backend < 2.3k → `find src -name '*.ts*' | xargs wc -l`.
- Vier-Rollen-Screen + Dialog-Overlay verhaltensidentisch → manuelle
  Preview-Smoke-Notiz (kann Agent nicht zwingend belegen — als ⚠ mit Hinweis).
- Wave-B-Detektoren Aufsetzbarkeit → `useProjectData`/`projectViewModel`-API
  prüfen (öffentliche Exports listen).

### Audit-Output
- Neue Datei `docs/audit-2026-05-14.md` mit der vollständigen Tabelle.
- Zusammenfassung in `docs/NOW.md` „Recently completed".
- Falls Findings (⚠/⏸) → `docs/DECISIONS.md`-Eintrag pro bewusster Verschiebung.
- **Kein** Code-Fix während des Audits — Findings werden gesammelt und am Ende
  als kurze Liste präsentiert. User entscheidet, welche danach noch laufen.

---

## Reihenfolge & Stop-Bedingungen

1. B4.1 → Vitest grün?
2. B4.2 → 6 Functions deploy + 4 curl-Stichproben grün?
3. B4.3 → Vitest + deploy grün?
4. **Audit** durchziehen, Tabelle schreiben, Findings sammeln.
5. Docs-Update (NOW.md + DECISIONS.md).

Stop bei: Vitest rot · curl-Verhaltensabweichung · Audit-Finding mit
Verhalten-Risiko (z. B. fehlender Logger in Hot-Path) → sofort melden, nicht
weitermachen.

## Out of Scope
- Neue Features.
- Migration der 7 nicht-trivialen Edge Functions in B4.2.
- Fixes für Audit-Findings (separate Loop).
