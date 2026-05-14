# Agent Execution Plan — cogni Stabilität & Vereinfachung

> **Adressat:** Implementierender Agent
> **Stand:** 2026-05-14 (post Welle B + Re-Audit)
> **Quelle:** Strategische Review + Duplikationsanalyse (Frontend + Backend)
> **Format:** Jede Aufgabe hat **WAS / WO / WARUM / WIE / VERIFY**. Reihenfolge ist verbindlich.

---

## Statusübersicht (post Re-Audit 2026-05-14)

| Tier | Status | Notiz |
|---|---|---|
| A1 Sofort | ✅ done | Graphiti 422 fix, intake-trigger Logger, console.log raus |
| A2 Testbarkeit | ✅ done | commit-fact Kernel, E2E-Smokes, Logger 16/16, Phase-4-Gate |
| A3 Architektur | ✅ done | strictNullChecks, useProject 3-Schichten, JSONB-Trigger |
| B1 Quick Wins | ✅ done | alle 5 erledigt |
| B2 Mittlere Refactors | ✅ done | B2.2 bewusst skipped (kein Mehrwert) |
| B3 Größere Restruks | ⚠ partial | B3.1 auf `useBoxSubmit`-Hook reduziert (siehe DECISIONS); B3.2 modular |
| B4 Optional | ⚠ partial | B4.1+B4.3 done; B4.2 nur 2/6 (catch-Pfade nicht 1:1) |
| **Welle B (Detektoren)** | ✅ done | B-W1 Linker · B-W2 Conflict · B-W3 Gap · B-W4 Dependency |

**Echte Restschuld** = 4 dokumentierte Loops (siehe `docs/NOW.md` Backlog #1).
**Wave-3-Backlog** (LLM-Heuristiken, React Query, Browser-E2E, LOC-Reduktion) bewusst out of scope.

Detail-Audit: `docs/audit-2026-05-14.md`.

---


## Leitprinzipien für die Umsetzung

1. **Eine Aufgabe pro Commit.** Keine Sammel-PRs.
2. **Nach jedem Schritt: lint + vitest grün.** Wenn rot → revert, nicht weiterbauen.
3. **Keine Feature-Arbeit auf wackligem Fundament.** Tier 1 vor Tier 2 vor Tier 3.
4. **Refactor ≠ Verhaltensänderung.** Verhalten muss vor/nach identisch sein, außer explizit anders angegeben.
5. **Wenn ein Schritt > 4h dauert: stopp, melden, splitten.**

---

# TEIL A — STABILITÄT (geht vor Vereinfachung)

## Tier A1 — Sofort (diese Woche) — Kritisch

### A1.1 Graphiti-422 fixen

- **WAS:** Fehlendes `role`-Feld im POST-Body von `/messages`-Calls. Aktuell: 0% Erfolgsrate. RAG-Pipeline tot.
- **WO:** `supabase/functions/_shared/graphiti.ts` (POST-Body-Builder für `/messages`)
- **WARUM:** Solange Graphiti 422 wirft, landen alle Canonical Facts nur in Supabase. Wave-B-Detektoren (linker, gap_detector, conflict_detector) sind ohne lebenden Graph nicht baubar.
- **WIE:**
  1. `supabase/functions/_shared/graphiti.ts` öffnen.
  2. Im POST-Body für `/messages`: `role: "user"` ergänzen (default, falls nicht explizit gesetzt).
  3. Typdefinition `MessagePayload` entsprechend erweitern.
  4. `commit-fact/index.ts` und alle anderen Aufrufer prüfen — `role` darf nicht überschrieben werden, wenn nicht gesetzt.
- **VERIFY:**
  - 3 Test-Commits manuell durchführen (Note → Review → Commit).
  - `graphiti_sync_log` abfragen: `select status, count(*) from graphiti_sync_log where created_at > now() - interval '10 minutes' group by status`
  - Erfolg: `success` ≥ 95%, keine `422`.

---

### A1.2 `intake-trigger` instrumentieren

- **WAS:** Logger fehlt. Async-Pipeline hängt unsichtbar im Health-Panel.
- **WO:** `supabase/functions/intake-trigger/index.ts`
- **WARUM:** Bei jedem stillen Hang (z.B. 08:41-Incident) ist die Pipeline blind. Logger ist Voraussetzung für jede weitere Debug-Session.
- **WIE:**
  1. `_shared/logger.ts` analog zu instrumentierten Functions importieren.
  2. `createLogger({ fn: "intake-trigger", userId, client: admin })` direkt nach Auth.
  3. Stages: `input`, `aol_call`, `understand_call`, `done` / `error`.
  4. `log.flush()` vor jedem return.
  5. ESLint-Error `@ts-ignore` → `@ts-expect-error` ersetzen.
- **VERIFY:**
  - Asset hochladen → in `pipeline_events` mindestens 3 Events mit `fn='intake-trigger'` und gemeinsamer `correlation_id`.
  - Health-Panel zeigt vollständigen Trace.

---

### A1.3 `console.log` aus Edge Functions entfernen

- **WAS:** 4 verbleibende `console.log`-Hits in Edge Functions (statt strukturiertem Logger).
- **WO:** Grep `console.log` in `supabase/functions/**/*.ts` (außer `_shared/logger.ts`).
- **WARUM:** Inkonsistente Telemetrie. Health-Panel sieht diese Events nicht.
- **WIE:** Jeden `console.log` durch passenden `log.info/warn/error` ersetzen.
- **VERIFY:** `grep -r "console\.log" supabase/functions/` ergibt 0 Treffer außerhalb `_shared/logger.ts`.

---

## Tier A2 — Kurzfristig (1–2 Wochen) — Testbarkeit

### A2.1 `commit-fact` in pure-function-Kernel refaktorieren

- **WAS:** Aktuell ist die gesamte Logik in `Deno.serve(async (req) => {...})` eingeschlossen. Damit nicht testbar.
- **WO:** `supabase/functions/commit-fact/index.ts` (643 LOC)
- **WARUM:** `commit-fact` ist Risk-5 (höchstes Risiko im Seam-Inventar). Ohne Tests jeder Commit ein Blindflug.
- **WIE:**
  1. Neue Datei `commit-fact/kernel.ts` anlegen.
  2. Pure Function exportieren:
     ```ts
     export async function commitFact(
       input: CommitInput,
       deps: {
         supabase: SupabaseClient;
         graphiti: GraphitiClient;
         log: Logger;
         now?: () => Date;
       },
     ): Promise<CommitResult>;
     ```
  3. `index.ts` reduziert sich auf: HTTP-Parsing → Auth → `commitFact(input, deps)` → Response.
  4. Mock-Supabase via `_shared/test/mockSupabase.ts` (neu anlegen, in-memory).
  5. Drei Deno-Tests in `commit-fact/kernel.test.ts`:
     - **Happy:** Confirm eines proposed_fact → canonical_fact entsteht, change_event geschrieben.
     - **Conflict:** Replace eines bestehenden facts → alter Fact superseded, neuer wird canonical.
     - **Re-commit:** Gleicher review_case zweimal → idempotent, kein Duplikat.
- **VERIFY:**
  - `deno test supabase/functions/commit-fact/` grün, ohne Live-Supabase-Verbindung.
  - Verhalten der HTTP-Route identisch (manueller Smoketest in App).

---

### A2.2 E2E-Smoke-Tests (3 Pfade)

- **WAS:** Drei automatisierte End-to-End-Tests, die den Vollpfad abdecken.
- **WO:** Neuer Ordner `tests/e2e/` (Playwright oder vitest-mit-supabase-local — bestehende Test-Infrastruktur prüfen).
- **WARUM:** Aktuell wird jeder Vollpfad-Bug erst vom User entdeckt.
- **WIE:**
  1. **Pfad 1 — Note:** Note erstellen → Review-Session öffnet → Confirm → canonical_fact in DB → in ProjectScreen sichtbar.
  2. **Pfad 2 — File-Upload:** EML-Fixture hochladen → intake-process läuft → proposed_facts ≥ 1 → Review → Commit.
  3. **Pfad 3 — Asset-Delete:** Asset löschen → cascading delete prüfen (parsed_documents, sources, proposed_facts).
  4. Tests in CI hängen, nicht in pre-commit (zu langsam).
- **VERIFY:** Alle 3 Pfade grün in CI. Dauer < 3 min total.

---

### A2.3 Logger-Coverage auf 100%

- **WAS:** 10 von 15 Edge Functions ohne Logger.
- **WO:** `intake-understand`, `intake-process`, `voice-transcribe`, `asset-delete`, `project-delete`, `aol-callback`, `inspect-graphiti`, `inspect-langsmith`, `inspect-railway`, `railway-admin`.
- **WARUM:** Health-Panel = Single-Source-of-Truth für Pipeline-Status. Lücken = blinde Flecken.
- **WIE:**
  1. Pro Function: Logger instanziieren, Stages markieren, flush vor return.
  2. Reihenfolge nach Priorität (intake-understand zuerst, inspect-\* zuletzt).
- **VERIFY:** Health-Panel zeigt für jeden End-to-End-Flow durchgängige Traces ohne Lücken.

---

### A2.4 Phase-4-Gate schließen

- **WAS:** Prettier-Config final, Husky/lint-staged aktiv, Nightly CI-Cron.
- **WO:** `.prettierrc`, `.husky/`, `.github/workflows/nightly.yml`
- **WARUM:** Ohne Gate driftet die Codequalität.
- **WIE:**
  1. Prettier-Run einmal auf gesamtem Codebase, dann Commit.
  2. `lint-staged` mit `--max-warnings 0` (aktuell `100`).
  3. Nightly: `npm run test && npm run lint && deno test supabase/functions/`.
- **VERIFY:** `git commit` mit ESLint-Warning schlägt fehl. Nightly läuft 3 Tage stabil grün.

---

## Tier A3 — Mittelfristig (1 Monat) — Architektur

### A3.1 `strictNullChecks: true` schrittweise

- **WAS:** TypeScript-Strictness erhöhen.
- **WO:** `tsconfig.json` + Datei-für-Datei-Migration.
- **WARUM:** Bei JSONB + optionalen DB-Feldern ist `null` allgegenwärtig. Compiler muss helfen.
- **WIE:**
  1. `strictNullChecks: true` setzen.
  2. Erwarten: ~200–400 Errors.
  3. Per Ordner aufräumen: `lib/` → `data/` → `hooks/` → `components/`.
  4. Pro Ordner: Branch, Fixes, PR. Keine `as any` oder `!`-Suppressions ohne Kommentar.
- **VERIFY:** `tsc --noEmit` grün, keine neuen `!`-Suppressions in PR-Diffs.

---

### A3.2 `useProject.ts` aufteilen

- **WAS:** 515-Zeilen-Hook in 3 Schichten zerlegen.
- **WO:** `src/lib/project/useProject.ts` → `useProjectData.ts` + `useProjectViewModel.ts` + `useProjectSignals.ts`.
- **WARUM:** God-Hook ist nicht testbar, nicht erweiterbar. Wave-B-Detektoren brauchen saubere Schichten.
- **WIE:**
  1. **`useProjectData.ts`:** Nur 16 Queries + Realtime-Subscription. Liefert rohe DB-Rows.
  2. **`useProjectViewModel.ts`:** Pure Mapping-Funktionen (KonfliktVM, GapVM, etc.) — nimmt Rohdaten, gibt ViewModel.
  3. **`useProjectSignals.ts`:** Aggregation (Handlungsbedarf, Konfliktcount, Gap-Severity).
  4. `useProject.ts` wird Composition: ruft alle drei auf, gibt einheitliches Interface.
  5. Mapper-Tests in `useProjectViewModel.test.ts` (pure functions, easy).
- **VERIFY:** Verhalten der UI identisch. Unit-Tests für Mapper grün. ProjectScreen rendert wie vorher.

---

### A3.3 JSONB-Validierung auf DB-Ebene

- **WAS:** CHECK-Constraints oder Trigger pro `fact_type` für `canonical_facts.content`.
- **WO:** Neue Migration in `supabase/migrations/`.
- **WARUM:** Aktuell schützt nur das Frontend vor Garbage-Data. Edge Functions oder direkter SQL-Zugriff können beliebigen JSON schreiben.
- **WIE:**
  1. Pro `fact_type` Schema-Erwartung dokumentieren (z.B. `decision` MUSS `{title, rationale}` haben).
  2. PL/pgSQL-Trigger `validate_canonical_fact_content()` auf INSERT/UPDATE.
  3. Bei Verstoß: RAISE EXCEPTION mit klarer Message.
- **VERIFY:** Migration läuft idempotent. Insert mit Garbage-Content schlägt fehl. Insert mit korrektem Content funktioniert.

---

# TEIL B — VEREINFACHUNG (Duplikationen entfernen)

> **Regel:** Nur Refactor durchführen, wenn am Ende die App **besser, effizienter, pflegbarer oder qualitativer** ist. Nicht der Reduktion willen.

## Tier B1 — Quick Wins (heute machbar)

### B1.1 Date-Formatter konsolidieren

- **WAS:** 4 verschiedene Datumsformatierungen in 6 Dateien zusammenführen.
- **WO:** Existierend: `src/lib/format/relativeTime.ts`. Verstreut: `useProject.ts:20-26`, `DialogOverlay.tsx`, `IntakeSessionsPanel.tsx`, `SideGrid.tsx`, `SubstanzSection.tsx`, `InspectorPanel.tsx`.
- **WARUM:** Inkonsistente Datumsdarstellung → schlechte UX. Eine Quelle der Wahrheit.
- **WIE:**
  1. `src/lib/format/dateFormatters.ts` neu anlegen.
  2. Exportieren: `fmtLong(iso)`, `fmtShort(iso)`, `fmtTime(iso)`, `ageInDays(iso)`, `toTimestamp(iso)`.
  3. Alle 6 Dateien per Grep + Edit umschreiben.
  4. Inline-Definitionen löschen.
- **VERIFY:** Grep `toLocaleDateString` ergibt 0 Treffer außerhalb `dateFormatters.ts`. UI identisch.
- **Lines saved:** ~25

---

### B1.2 Map-Utilities extrahieren

- **WAS:** `mapById()` + `countBy()` als Utility statt 3× wiederholt.
- **WO:** `src/lib/utils.ts` erweitern. Verstreut: `useProject.ts:192-195, 346-357`, `useProjects.ts:106-127`.
- **WARUM:** Lesbarkeit, leichter ausdrucksstark.
- **WIE:**
  ```ts
  export const mapById = <T extends { id: string }>(items: T[]) =>
    new Map(items.map((i) => [i.id, i]));
  export const countBy = <T>(items: T[], key: (t: T) => string | undefined) => {
    /* impl */
  };
  ```
- **VERIFY:** Verhalten identisch. ESLint grün.
- **Lines saved:** ~20

---

### B1.3 HTTP-Response-Wrapper in Edge Functions

- **WAS:** CORS-Headers + `ok()` / `fail()` aus ~10 Edge Functions in ein Shared-Module.
- **WO:** Neu: `supabase/functions/_shared/http.ts`. Anwender: alle Functions mit eigener `ok()`/`fail()`-Definition.
- **WARUM:** Inkonsistenz beim Response-Format. CORS-Bugs durch Drift möglich.
- **WIE:**
  1. `_shared/http.ts` exportiert: `corsHeaders`, `ok(payload, init?)`, `fail(message, status?)`, `handleOptions(req)`.
  2. Jede Edge Function: lokale Definitionen löschen, aus `_shared/http.ts` importieren.
- **VERIFY:** Manueller Smoketest: jede Function antwortet wie vorher. Preflight (OPTIONS) korrekt.
- **Lines saved:** ~250

---

### B1.4 Section-Header + CardList in Project-Components

- **WAS:** Identische Header- und Card-List-Patterns in 3 Komponenten in Shared-Components extrahieren.
- **WO:** Neu: `src/components/project/shared/SectionHeader.tsx`, `CardList.tsx`. Anwender: `HandlungsbedarfList.tsx`, `VerlaufFeed.tsx`, `SubstanzSection.tsx`, `LageZone.tsx`.
- **WARUM:** Visuelle Konsistenz garantiert. Spätere Design-Anpassungen an einer Stelle.
- **WIE:**
  1. `SectionHeader({ label, title })` — drei-zeilig identische Markup-Struktur.
  2. `CardList({ items, renderRow, divideRows? })` — wrapper mit `rounded-xl border ...`.
  3. Inline-Versionen in den 4 Files ersetzen.
- **VERIFY:** Visueller Vergleich vor/nach (Screenshot oder OrbLab). Pixel-identisch erwartet.
- **Lines saved:** ~60

---

### B1.5 Unified Auth Helper in Edge Functions

- **WAS:** Auth-Logik aus 2 Mustern (inspect-auth vs. inline) in `_shared/auth.ts` zusammenführen.
- **WO:** Neu: `supabase/functions/_shared/auth.ts`. Anwender: `commit-fact`, `asset-delete`, `project-delete`, `intake-trigger`, `voice-transcribe`, `aol-callback`.
- **WARUM:** Inkonsistente Null-Checks. Fehler-Response-Format driftet. Sicherheitsrelevant.
- **WIE:**
  ```ts
  export async function getAuthenticatedUser(req: Request): Promise<
    | {
        ok: true;
        userId: string;
        user: SupabaseUser;
        client: SupabaseClient;
      }
    | { ok: false; error: string; status: number }
  >;
  ```
- **VERIFY:** Auth-Fehler-Pfade jeder Function manuell testen (kein Token, falscher Token, abgelaufenes Token).
- **Lines saved:** ~50

---

## Tier B2 — Mittlere Refactors (1–2 Tage)

### B2.1 `useRealtimeTable`-Hook

- **WAS:** Supabase-Channel-Boilerplate in einen wiederverwendbaren Hook auslagern.
- **WO:** Neu: `src/lib/realtime/useRealtimeTable.ts`. Anwender: `useProject.ts:465-511`, `useProjects.ts:160-189`, `IntakeSessionsPanel.tsx:142-152`, `useNamespace.ts`, `useEntityVoice.ts`, `Index.tsx`.
- **WARUM:** 5+ Stellen mit identischem Pattern. Debounce-Logik kann driften.
- **WIE:**
  ```ts
  export function useRealtimeTables(
    channelName: string,
    tables: { table: string; filter?: string }[],
    onTrigger: () => void,
    options?: { debounceMs?: number; enabled?: boolean },
  ): void;
  ```
- **VERIFY:** Alle Realtime-Flows weiter funktional (Asset-Upload reaktiv, Projekt-Liste live, Dialog-Session updaten).
- **Lines saved:** ~120

---

### B2.2 View-Model-Mapper auslagern

- **WAS:** 368 Zeilen mechanisches Mapping aus `useProject.ts` in pure functions.
- **WO:** Neu: `src/lib/project/mappers/` mit `conflictMapper.ts`, `gapMapper.ts`, `dependencyMapper.ts`, `handlungsbedarfMapper.ts`.
- **WARUM:** Pure functions = trivial testbar. Bereitet A3.2 vor.
- **WIE:**
  1. Pro Mapper: Input-Typ (DB-Row + factById-Map), Output-Typ (VM), pure function.
  2. Tests pro Mapper: 2–3 Fixtures, Snapshot-Vergleich.
- **VERIFY:** ProjectScreen identisch. `vitest src/lib/project/mappers/` grün.
- **Lines saved:** ~200, **Tests gained:** ~10

---

### B2.3 Inspector-Functions zusammenführen

- **WAS:** 4 inspect-\* Functions (insgesamt 469 LOC) auf einen parametrischen Service reduzieren.
- **WO:** `supabase/functions/inspect-pipeline/`, `inspect-graphiti/`, `inspect-langsmith/`, `inspect-railway/`.
- **WARUM:** 95% identisches Skelett. Wartungslast geht durch 4 statt 1.
- **WIE:**
  1. **Option A (empfohlen):** Eine Function `inspect/` mit `?target=pipeline|graphiti|langsmith|railway`, Handler-Map.
  2. **Option B:** Functions behalten, aber `_shared/inspectRouter.ts` mit Action-Handler-Pattern.
  3. Bevor refactored: prüfen, wer die alten Endpoints aufruft (Frontend, Health-Panel). URLs umstellen.
- **VERIFY:** Health-Panel funktioniert unverändert. Alle 4 Inspector-Aufrufe in der App weiter erfolgreich.
- **Lines saved:** ~140

---

### B2.4 External-Service-Clients zentralisieren

- **WAS:** HTTP-Clients für LangSmith, Railway, Graphiti als Klassen in `_shared/clients/`.
- **WO:** Neu: `_shared/clients/langsmith.ts`, `railway.ts`, `graphiti.ts` (Graphiti existiert, aber wird in `railway-admin` umgangen).
- **WARUM:** Aktuell wird Fetch-Logik 3–7× pro Service neu geschrieben. Token-/URL-Handling driftet.
- **WIE:**
  1. Pro Service: Class oder Factory-Function mit `query()`, `post()`, etc.
  2. Token + Base-URL aus `Deno.env` zentral.
  3. Alle Aufrufer (insb. `railway-admin`) umstellen.
- **VERIFY:** Inspector-Funktionen weiter grün. Smoketest: Health-Panel zeigt Graphiti-Status, LangSmith-Status, Railway-Status korrekt.
- **Lines saved:** ~150

---

## Tier B3 — Größere Restrukturierungen (2–4 Tage)

### B3.1 Dialog-Box-Builder (8 Boxes → 1 Pattern)

- **WAS:** 8 Box-Komponenten (AktionsBox, AuswahlBox, EingabeBox, GapBox, KonfliktBox, KontextBox, WissensBox, ZuordnungsBox) auf eine config-getriebene Architektur reduzieren.
- **WO:** `src/components/dialog/boxes/`. Neu: `BoxBuilder.tsx` + `boxConfigs/`.
- **WARUM:** 70% identische Scaffolding (Frame, State, Actions, Readonly). Bei UI-Refresh in 8 Files gleichzeitig ändern.
- **VORSICHT:** Dies ist der größte Refactor in der Liste. Erst nach B2.1 und B2.2 angehen, weil mehr Risiko.
- **WIE:**
  1. `BoxBuilder` rendert Frame + Actions + State-Machine generisch.
  2. Pro Box-Typ ein `BoxConfig`:
     ```ts
     type BoxConfig = {
       type: BoxType;
       renderContent: (box, state, handlers) => ReactNode;
       getSubmitPayload?: (state) => Record<string, unknown>;
       validate?: (state) => string | null;
     };
     ```
  3. `BoxRenderer` ersetzt: `switch(type) → BoxBuilder({ config: configs[type] })`.
  4. Schrittweise: zuerst 2 einfache Boxes (z.B. WissensBox, GapBox) migrieren, validieren, dann Rest.
- **VERIFY:**
  - Jeder Box-Typ rendert identisch (visueller Vergleich + Behavioral-Test).
  - Dialog-Overlay E2E (A2.2) bleibt grün.
- **Lines saved:** ~380

---

### B3.2 `railway-admin` modularisieren

- **WAS:** 600-LOC-Monolith mit 15+ Action-Branches in Sub-Module aufteilen.
- **WO:** `supabase/functions/railway-admin/` (aktuell Single-File) → Verzeichnis mit `projects.ts`, `langsmith.ts`, `promptHub.ts`, `graphiti.ts`, `aol.ts`, `diagnose.ts`, `sync.ts`, `_helpers.ts`, `index.ts` (router).
- **WARUM:** Aktuell vermischt Railway-Admin + LangSmith-Debug + Graphiti-Test + PromptHub. Nicht testbar, schwer auffindbar.
- **WIE:**
  1. Pro Domäne: Sub-Datei mit Action-Handlern.
  2. `index.ts`: schlanker Router (~50 LOC) der via Action-Map dispatched.
  3. Geteilte Helper (`gql`, `autoDiscover`) in `_helpers.ts`.
- **VERIFY:** Alle bisherigen Action-Calls aus Health-Panel weiter funktional.
- **Lines saved:** ~250

---

## Tier B4 — Optional / Niedrige Priorität

### B4.1 Session-Factory generalisieren

- **WAS:** 7 Factory-Functions (`buildKonfliktSession`, `buildGapSession`, etc.) auf eine generische `buildSession(config)` reduzieren.
- **WARUM:** Spart ~40 Zeilen, aber jeder Caller muss verifiziert werden.
- **EMPFEHLUNG:** Erst angehen, wenn Wave-B-Detektoren neue Session-Typen brauchen. Sonst nicht Bang-for-Buck.

### B4.2 Logger-Middleware-Wrapper

- **WAS:** `withLogging(fn, handler)` als Wrapper für Edge Functions.
- **WARUM:** Eliminiert ~30 Zeilen Boilerplate pro Function.
- **EMPFEHLUNG:** Nach Tier A (Logger-Coverage 100%) als optionale Verbesserung.

### B4.3 Fact-Linking-Config extrahieren

- **WAS:** Hardcoded Linking-Regeln in `intake-understand` in Config-Objekt.
- **WARUM:** Wenn neue fact_types kommen, einfacher zu erweitern.
- **EMPFEHLUNG:** Erst wenn Wave B konkret wird.

---

# Ausführungsreihenfolge (verbindlich)

| #   | Aufgabe                      | Tier | Geschätzt           | Risiko       |
| --- | ---------------------------- | ---- | ------------------- | ------------ |
| 1   | A1.1 Graphiti-422 fix        | A1   | 2–3h                | Niedrig      |
| 2   | A1.2 intake-trigger Logger   | A1   | 1–2h                | Niedrig      |
| 3   | A1.3 console.log raus        | A1   | 1h                  | Niedrig      |
| 4   | B1.1 Date-Formatter          | B1   | 30min               | Sehr niedrig |
| 5   | B1.2 Map-Utilities           | B1   | 15min               | Sehr niedrig |
| 6   | B1.3 HTTP-Response-Wrapper   | B1   | 1h                  | Niedrig      |
| 7   | B1.5 Unified Auth            | B1   | 1.5h                | Niedrig      |
| 8   | A2.1 commit-fact Kernel      | A2   | 3–4h                | Mittel       |
| 9   | B1.4 Section-Header/CardList | B1   | 30min               | Sehr niedrig |
| 10  | A2.3 Logger-Coverage 100%    | A2   | 4h                  | Niedrig      |
| 11  | B2.1 useRealtimeTable        | B2   | 1h                  | Niedrig      |
| 12  | A2.2 E2E-Smokes              | A2   | 4–6h                | Mittel       |
| 13  | A2.4 Phase-4-Gate            | A2   | 3h                  | Niedrig      |
| 14  | B2.2 VM-Mapper               | B2   | 2h                  | Mittel       |
| 15  | B2.3 Inspector-Functions     | B2   | 2h                  | Mittel       |
| 16  | B2.4 External-Clients        | B2   | 3h                  | Mittel       |
| 17  | A3.2 useProject aufteilen    | A3   | 1 Tag               | Mittel       |
| 18  | A3.1 strictNullChecks        | A3   | 1–2 Wochen verteilt | Mittel       |
| 19  | B3.1 Box-Builder             | B3   | 1–2 Tage            | Hoch         |
| 20  | A3.3 JSONB-Validierung       | A3   | 1 Tag               | Mittel       |
| 21  | B3.2 railway-admin modular   | B3   | 1 Tag               | Mittel       |

**Total Lines Saved (B-Tier):** ~1.395 LOC
**Total Stability Gain (A-Tier):** kritische Pfade testbar, Observability 100%, Graph lebt
**Geschätzte Gesamtdauer:** 4–6 Wochen bei einem Agenten in Vollzeit

---

# Stopp-Bedingungen

Brich ab und melde, wenn:

- Ein Refactor verändert beobachtbares Verhalten (UI, API, DB).
- ESLint oder Vitest nach einer Aufgabe rot ist und der Fix nicht in 30min möglich ist.
- Eine Aufgabe > 1.5× der Schätzung dauert.
- Eine Migration nicht idempotent rückwärts läuft.
- Ein Test passt sich an "kaputten" Code an, statt den Code zu fixen.

---

# Verification Master-Checklist

Nach Abschluss:

- [ ] Graphiti-Sync-Success-Rate ≥ 95% in 24h
- [ ] `deno test supabase/functions/` — vollständig grün
- [ ] `vitest` — vollständig grün, ≥ 50 Tests
- [ ] 3 E2E-Smokes grün in CI
- [ ] Logger-Coverage: 15/15 Edge Functions
- [ ] `tsc --noEmit` mit `strictNullChecks: true` grün
- [ ] Codebase < 14.000 LOC frontend (von aktuell ~17k)
- [ ] Edge Functions < 2.300 LOC backend (von aktuell ~3k)
- [ ] Vier-Rollen-Screen + Dialog-Overlay verhaltensidentisch zur Pre-Refactor-Baseline
- [ ] Wave-B-Detektoren können auf `useProjectData`/`useProjectViewModel` aufsetzen ohne God-Hook anzufassen
