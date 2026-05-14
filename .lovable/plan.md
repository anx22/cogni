## Tier B1 — Quick Wins (5 Refactors, alle Verhalten-neutral)

Reihenfolge nach Risiko (klein → groß), jede Aufgabe einzeln verifiziert.

### B1.1 Date-Formatter konsolidieren
- **Neu:** `src/lib/format/dateFormatters.ts` mit `fmtLong`, `fmtShort`, `fmtTime`, `ageInDays`, `toTimestamp`. `relativeTime.ts` re-exportieren oder integrieren.
- **Ersetzen in:** `useProject.ts`, `DialogOverlay.tsx`, `IntakeSessionsPanel.tsx`, `SideGrid.tsx`, `SubstanzSection.tsx`, `InspectorPanel.tsx`.
- **Verify:** `rg "toLocaleDateString" src/` außerhalb `dateFormatters.ts` = 0. Vitest grün.

### B1.2 Map-Utilities extrahieren
- **In:** `src/lib/utils.ts` ergänzen: `mapById<T extends {id:string}>(items)`, `countBy<T>(items, key)`.
- **Ersetzen in:** `useProjectData.ts` / `useProject.ts`, `useProjects.ts`.
- **Verify:** Vitest grün, projectViewModel-Tests unverändert.

### B1.3 HTTP-Response-Wrapper
- **Neu:** `supabase/functions/_shared/http.ts` mit `corsHeaders`, `ok(payload, init?)`, `fail(message, status?)`, `handleOptions(req)`.
- **Ersetzen in:** allen Edge Functions mit lokaler `ok`/`fail`/`corsHeaders`-Definition (~10 Functions).
- **Verify:** OPTIONS-Preflight + ein erfolgreicher Call pro Function via `supabase--curl_edge_functions` (Sample: commit-fact, inspect-pipeline, railway-admin).

### B1.4 SectionHeader + CardList
- **Neu:** `src/components/project/shared/SectionHeader.tsx`, `CardList.tsx`.
- **Ersetzen in:** `HandlungsbedarfList`, `VerlaufFeed`, `SubstanzSection`, `LageZone`.
- **Verify:** Build grün, visuell unverändert (Markup vergleichen, Klassen identisch übernehmen).

### B1.5 Unified Auth Helper
- **Neu:** `supabase/functions/_shared/auth.ts` mit `getAuthenticatedUser(req)` → `{ok, userId, user, client}` | `{ok:false, error, status}`.
- **Ersetzen in:** `commit-fact`, `asset-delete`, `project-delete`, `intake-trigger`, `voice-transcribe`, `aol-callback`.
- **Verify:** Curl ohne Token → 401, mit Token (Preview-Session) → 200 für GET-/Status-Pfade. `commit-fact` Happy-Path mit Sandbox-review_case erneut grün.

### Doku
- `docs/NOW.md`: Tier B1 abgeschlossen, gespeicherte Zeilen (~405 LOC).
- `docs/DECISIONS.md`: kurzer Eintrag "Shared HTTP/Auth-Helpers in `_shared/`" als Pattern für künftige Functions.

### Out of scope (Tier B2+)
Realtime-Hook, Mapper-Auslagerung, Inspector-Merge, Service-Clients — explizit nicht in dieser Runde.
