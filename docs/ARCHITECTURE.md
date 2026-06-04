# ARCHITECTURE — Produktintelligenz

## Stack

- **Frontend** React 18 + Vite 5 + TypeScript 5, Tailwind v3, shadcn/ui, semantische Tokens (HSL).
- **Backend** Lovable Cloud (Supabase): Postgres (kanonisch), Auth, Storage (`intake-files`, `assets`), Realtime, Edge Functions (Deno).
- **Knowledge Graph** Graphiti + Neo4j (Spiegel, asynchron via `/messages`).
- **Document Intelligence** Unstructured (Parsing in `intake-process`).
- **Pipeline-Orchestrator** AOL-Service (FastAPI + LangGraph, Railway). Knoten: `router → context_loader → condenser`. Liest Graphiti, schreibt nicht in Supabase.
- **Modelle** Lovable AI Gateway (Tool-Calling, Gemini Flash für Voice/Extraktion).
- **Prompts/Traces** LangSmith (EU, `x-tenant-id = LANGSMITH_WORKSPACE_ID`, Owner `-`).
- **Deployment** Edge Functions deployen automatisch beim Schreiben in `supabase/functions/`. Secrets in Cloud konfiguriert, niemals in Code/Doku.

## Datenfluss

```
asset
  └─ intake-process (Unstructured) → parsed_documents + sources
       └─ intake-trigger
            ├─ AOL /aol/run → context_loader → Graphiti /get-memory(group_id=project_id)
            │     → graph_context (≤4 KB Bullets)
            └─ intake-understand (AI-Gateway, Tool-Calling, graph_hint)
                  → proposed_facts + dialog_sessions + review_cases
User-Review (Dialog-Overlay)
  └─ commit-fact
       ├─ canonical_facts + change_events + project_state_snapshot
       │   (Spezialpfade: open_point→gap_signals, reference→dependencies)
       └─ Graphiti /messages (async, Client-UUID, Idempotenz) → graphiti_uuid
```

**Besitzschnitt:** Railway hat keinen Service-Role-Key. Alle Schreibpfade laufen über Cloud-Edge-Functions.

## Layer-Regeln

- **Frontend** spricht Supabase ausschließlich über `@/integrations/supabase/client`. Keine direkten REST-Calls.
- **Hooks** in `src/lib/<domain>/`. Komponenten importieren Hooks, nie Supabase direkt aus dem View.
- **Edge Functions** in `supabase/functions/<name>/index.ts` (kein Sub-Folder). Shared-Code in `supabase/functions/_shared/`.
- **Pipeline-Trace** ausschließlich in `pipeline_events` (per `createLogger`), kein paralleles Log-System.
- **Entity-Core** (`src/lib/entity/` + `src/components/entity/`) ist ein geschlossenes Modul: öffentliche API
  nur via Barrel `@/lib/entity`, keine Tiefimporte; andere Module reden über Signale (Input) + `vm`/`controller`
  (Output), nie via `setEntityState`/Hardcoding. Spec: `docs/entity-core.md`. Nur Entity-Kern im `entity/`-Ordner.

## Branch-Flow

```
dev  →  main  (via PR)
```

Direkt-Push auf `dev` erlaubt. `main` nur über PR von `dev`.

## Golden Principles

- **[HARD]** `console.log` in Edge Functions verboten (außer in `_shared/logger.ts`). CI-Smoke `qa.yml::smoke` blockt Pushes.
- **[HARD]** Jede Edge Function in `withErrorBoundary("<fn>", handler)` wrappen → einheitliche 500-Hülle + `correlation_id`.
- **[HARD]** Jede Stage in der Pipeline schreibt strukturiertes Log via `createLogger({fn, ...})` mit `correlation_id` (`asset_id` / `run_id`).
- **[HARD]** Roles in separater Tabelle (`user_roles`), Check via `has_role()` SECURITY DEFINER. Niemals Rolle auf `profiles`.
- **[HARD]** RLS auf jeder neuen Tabelle. User-bezogene Daten via `auth.uid()`-Filter, nicht via FK auf `auth.users`.
- **[HARD]** Semantische Tailwind-Tokens. Keine Roh-Farben in Komponenten, keine `text-white`-Direktklassen. `data-theme="day"|"night"` ist Theme-Quelle.
- **[HARD]** `ProjectViewModel`-Vertrag (`src/lib/project/types.ts`) ist Schnittstelle UI↔Logik. Erweitern OK, umbenennen/entfernen nur mit Mapper-Migration.
- **[HARD]** Keine `src/lib/**`-Eingriffe für reine Designwünsche.
- **[PREFER]** Strukturelle Entscheidung → `docs/DECISIONS.md` (thematisch, das Warum). Sprintwechsel → `docs/NOW.md` aktualisieren — Deckel **~60 Zeilen**; ältere Erledigungen fallen raus (Historie = Git, **nicht** DECISIONS). Pflege-Regel steht in `NOW.md §Pflege`.
- **[PREFER]** Kernlogik aus `Deno.serve`-Closure in pure Funktionen ziehen (Vorbild: `commitFact()`, `handleCallback()`).
- **[PREFER]** Mocked Supabase-Tests via `mockAdmin()` aus `_shared/testFixtures.ts`.
- **[PREFER]** Frontend-Polling nutzt `pollAolRun` / `pollAolRunByAsset` aus `src/lib/pipeline/`.
- **[PREFER]** Globale Errors fangen `ErrorBoundary` + `attachGlobalErrorHandlers` (Devlog + Toast).

## Test-Lanes

- **Vitest** (`bunx vitest run`) — Unit + Hook-Smokes, jsdom.
- **Deno-Tests** (`supabase functions test`) — Edge-Funktion-Logik gegen `mockAdmin()`.
- **CI** `.github/workflows/qa.yml` — Lint, Typecheck, Test, Build, Smoke (`console.log`-Verbot).
- **Nightly** `.github/workflows/qa-nightly.yml` — `test-data-sweep` 03:17 UTC.
- **Pre-commit** Husky + lint-staged → ESLint (`--max-warnings 0`-Regeln scharf, `no-explicit-any` warn).

| Zweck            | Command                |
| :--------------- | :--------------------- |
| Typecheck        | `bunx tsc --noEmit`    |
| Unit-Tests       | `bunx vitest run`      |
| Lint             | `npm run lint`         |
| Format prüfen    | `npm run format:check` |
| E2E (Playwright) | `npm run test:e2e`     |
