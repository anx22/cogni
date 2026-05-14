# Tier B2 — Mittlere Refactors

Verhalten-neutral. Nach jedem Schritt: vitest + Health-Panel-Smoketest grün.

## Status-Check vorab
- **B2.2 (Mapper auslagern)** ist faktisch bereits in **A3.2** erledigt: `projectViewModel.ts` (467 LOC) enthält `toKonflikte`, `toHandlungsbedarf` etc., `useProject.ts` ist nur noch 42 LOC. Daher entfällt B2.2 bis auf eine kleine Aufräum-/Aufteilungs-Aktion (siehe B2.2*).
- **B2.1, B2.3, B2.4** stehen voll an.

---

## B2.1 — `useRealtimeTables` Hook
**Ziel:** Channel-Boilerplate (subscribe + unsubscribe + Debounce) zentralisieren.

**Neu:** `src/lib/realtime/useRealtimeTables.ts`
```ts
useRealtimeTables(
  channelName: string,
  tables: { table: string; event?: '*'|'INSERT'|'UPDATE'|'DELETE'; filter?: string }[],
  onTrigger: () => void,
  options?: { debounceMs?: number; enabled?: boolean }
): void
```

**Migrieren (10 Stellen):**
- `src/lib/project/useProjectData.ts` (project-${id} Channel)
- `src/lib/project/useProjects.ts` (projects-list Channel)
- `src/pages/Index.tsx` (3 listener)
- `src/pages/PipelineHealth.tsx`
- `src/components/entity/IntakeSessionsPanel.tsx`
- `src/components/entity/RecentAssets.tsx`
- `src/lib/voice/useEntityVoice.ts` (5 listener — selber Channel)
- `src/lib/settings/useNamespace.ts`

**Verify:** Vitest grün, manuell: Asset-Upload triggert Liste, Dialog-Session-Updates kommen live an, Project-View aktualisiert.

---

## B2.2* — Mapper-Datei aufteilen (Mini)
`projectViewModel.ts` (467 LOC) in Mapper-Module zerlegen:
- `mappers/konfliktMapper.ts`, `gapMapper.ts`, `dependencyMapper.ts`, `handlungsbedarfMapper.ts`, `verlaufMapper.ts`
- `projectViewModel.ts` wird Composition (`buildProjectViewModel`) ~50 LOC.
- Tests aus `projectViewModel.test.ts` analog splitten.

**Verify:** 60 Tests bleiben grün, Verhalten identisch.

---

## B2.3 — Inspector-Functions zusammenführen
**Option B (gewählt, weniger Bruch):** Functions bleiben, aber Skelett über `_shared/inspector.ts` standardisieren.

**Neu:** `supabase/functions/_shared/inspector.ts`
```ts
export function runInspector(
  fn: string,
  req: Request,
  probes: Record<string, () => Promise<ProbeResult>>
): Promise<Response>
```
Übernimmt: CORS, Auth, withErrorBoundary, Logger, einheitliches Response-Format `{ ok, probes: {...}, took_ms }`.

**Migrieren:** `inspect-pipeline`, `inspect-graphiti`, `inspect-langsmith`, `inspect-railway`. Pro Function bleibt nur die Probe-Map.

**Verify:** Health-Panel zeigt alle 4 Inspektoren weiter korrekt (curl + UI-Smoke).

---

## B2.4 — External-Service-Clients zentralisieren
**Neu:** `supabase/functions/_shared/clients/`
- `langsmith.ts` — EU-Region, `x-tenant-id` Header, `query()`, `listPrompts()`, `getRun()`.
- `railway.ts` — GraphQL-Wrapper um `RAILWAY_API_TOKEN` (`gql(query, vars)`).
- `graphiti.ts` — bereits teilweise vorhanden in `_shared/graphiti.ts`; konsolidieren mit `post('/messages', …)`, `query()`, einheitlicher Token-/URL-Handling.

**Migrieren:** `inspect-langsmith`, `inspect-railway`, `inspect-graphiti`, `railway-admin` (alle GraphQL-Calls), `commit-fact` (Graphiti-Sync).

**Verify:** Inspektoren grün, `railway-admin` Aktionen `list`/`diagnose`/`graphiti-probe` erfolgreich (curl), `commit-fact` Happy-Path grün.

---

## Reihenfolge & Out-of-Scope
1. B2.1 (Realtime-Hook) — niedrigstes Risiko, größter LOC-Win.
2. B2.4 (Clients) — Voraussetzung für sauberes B2.3.
3. B2.3 (Inspector-Skelett) — baut auf B2.4 auf.
4. B2.2* (Mapper-Split) — abschließend.

**Nicht enthalten:** B3 (Dialog-Box-Builder, railway-admin-Modularisierung), neue Features.

## Doku
- `docs/NOW.md`: Tier B2 Abschluss + LOC-Bilanz.
- `docs/DECISIONS.md`: Eintrag „Inspector-Skelett über `_shared/inspector.ts` statt Single-Function" und „Service-Clients in `_shared/clients/`".
