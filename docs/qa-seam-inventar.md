# QA Seam-Inventar — Phase 1 Bestandsaufnahme

Stand: 2026-05-14. Lebt mit der Codebase. Quelle: statische Analyse über `rg`.

Legende:

- **LOG**: ✅ devlog/console mit Kontext · ⚠ nur ad-hoc · ❌ keiner
- **TRY**: ✅ try/catch um Schreib-Pfad · ⚠ teilweise · ❌ ungeschützter await
- **SCHEMA**: ✅ Validierung · ⚠ implizit über TS-Typ · ❌ keine Boundary-Validierung
- **TEST**: ✅ vorhanden · ❌ keiner
- **R**: Risiko 1–5 (5 = höchstes)

---

## 1. Frontend-Seams (`src/lib/**`)

| #   | Seam                          | Datei                                       | Eingabe → Ausgabe                                                         | LOG       | TRY          | SCHEMA    | TEST | R     |
| --- | ----------------------------- | ------------------------------------------- | ------------------------------------------------------------------------- | --------- | ------------ | --------- | ---- | ----- |
| F1  | `useIntake.intake`            | `lib/intake/useIntake.ts`                   | `IntakePayload` → `assets` row + storage upload + invoke `intake-process` | ✅ devlog | ✅ try/catch | ⚠ TS-only | ❌   | 4     |
| F2  | `useIntake.intake` (URL/Note) | dito                                        | text/url → invoke `intake-process`                                        | ✅ devlog | ✅           | ⚠         | ❌   | 3     |
| F3  | `useDialog.commitFact`        | `components/dialog/dialogContext`           | review_case decision → invoke `commit-fact`                               | ⚠ ad-hoc  | teilweise    | ❌        | ❌   | **5** |
| F4  | `useDialog.loadSession`       | `lib/dialog/loadSession.ts`                 | `session_id` → vollständiger Box-State                                    | ⚠         | ⚠            | ❌        | ❌   | 3     |
| F5  | `useProject`                  | `lib/project/useProject.ts`                 | `projectId` → `ProjectViewModel` (8 Joins)                                | ⚠         | ⚠            | ❌        | ❌   | 3     |
| F6  | `useProjects`                 | `lib/project/useProjects.ts`                | `userId` → `DemoProject[]` mit Counts                                     | ⚠         | ⚠            | ❌        | ❌   | 2     |
| F7  | `useProjectActions`           | `lib/object-actions/useObjectActions.ts`    | id → `project-delete` / rename / archive                                  | ⚠         | ⚠            | ❌        | ❌   | 4     |
| F8  | `useObjectActions` (asset)    | dito                                        | id → `asset-delete`                                                       | ⚠         | ⚠            | ❌        | ❌   | 4     |
| F9  | `useVoiceRecorder`            | `lib/voice/useVoiceRecorder.ts`             | blob → `voice-transcribe`                                                 | ⚠         | ⚠            | ❌        | ❌   | 2     |
| F10 | `IntakeSessionsPanel`         | `components/entity/IntakeSessionsPanel.tsx` | userId → realtime sub auf `dialog_sessions`                               | ❌        | ❌           | ❌        | ❌   | 3     |

Beobachtungen:

- `devlog` ist konsequent in `useIntake`, sonst nur sporadisch.
- Kein globaler `ErrorBoundary` (nur devlog hat einen unhandledrejection-Hook intern).
- Keine Boundary-Validation (zod o.ä.) — Typen kommen rein aus generierten `Database`-Types.

---

## 2. Edge-Seams (`supabase/functions/**`)

| #   | Function             | LOC | awaits | try/catch | console.\* | LOG | TRY | SCHEMA | TEST | R     |
| --- | -------------------- | --- | ------ | --------- | ---------- | --- | --- | ------ | ---- | ----- |
| E1  | `intake-trigger`     | 169 | 4      | 3/3       | 2          | ⚠   | ✅  | ❌     | ❌   | 3     |
| E2  | `intake-process`     | 118 | 4      | 1/2       | 4          | ⚠   | ⚠   | ❌     | ❌   | 4     |
| E3  | `intake-understand`  | 543 | 11     | 4/4       | 3          | ⚠   | ✅  | ❌     | ❌   | **5** |
| E4  | `aol-callback`       | 107 | 0      | 1/1       | 1          | ❌  | ✅  | ❌     | ❌   | 4     |
| E5  | `commit-fact`        | 643 | 25     | 3/4       | 6          | ⚠   | ⚠   | ❌     | ❌   | **5** |
| E6  | `graphiti-reconcile` | 212 | 6      | 2/3       | 1          | ⚠   | ✅  | ❌     | ❌   | 4     |
| E7  | `asset-delete`       | 76  | 6      | 2/2       | 0          | ❌  | ✅  | ❌     | ❌   | 3     |
| E8  | `project-delete`     | 99  | 4      | 2/2       | 0          | ❌  | ✅  | ❌     | ❌   | 3     |
| E9  | `voice-transcribe`   | 111 | 0      | 1/1       | 2          | ⚠   | ✅  | ❌     | ❌   | 2     |
| E10 | `railway-admin`      | 600 | 1      | 6/8       | 0          | ❌  | ✅  | ❌     | ❌   | 2     |
| E11 | `inspect-pipeline`   | 99  | 0      | 2/2       | 0          | ❌  | ✅  | –      | ❌   | 1     |
| E12 | `inspect-graphiti`   | 81  | 0      | 2/2       | 0          | ❌  | ✅  | –      | ❌   | 1     |
| E13 | `inspect-langsmith`  | 77  | 0      | 2/2       | 0          | ❌  | ✅  | –      | ❌   | 1     |
| E14 | `inspect-railway`    | 97  | 0      | 2/2       | 0          | ❌  | ✅  | –      | ❌   | 1     |

Hinweis: `try/catch`-Spalte zeigt `try-Blöcke / catch-Blöcke`. `commit-fact` hat 3/4 → ein Catch ohne sichtbares Try (vermutlich verschachtelt). `intake-process` hat 1/2.

---

## 3. DB-Schreibseams (Verträge zur Persistenz)

22 Inserts/Updates/Deletes über alle Edge Functions. Hot-Spots nach Risiko:

| #   | Tabelle                   | Geschrieben in                      | Operation                     | R     |
| --- | ------------------------- | ----------------------------------- | ----------------------------- | ----- |
| D1  | `canonical_facts`         | `commit-fact`                       | INSERT (~621)                 | **5** |
| D2  | `change_events`           | `commit-fact`                       | INSERT (229)                  | 4     |
| D3  | `graphiti_sync_log`       | `commit-fact`, `graphiti-reconcile` | INSERT (191/558/621)          | **5** |
| D4  | `proposed_facts`          | `commit-fact`, `intake-understand`  | UPDATE/DELETE (239/252/57/60) | 4     |
| D5  | `review_cases`            | `intake-understand`                 | INSERT (427)                  | 4     |
| D6  | `project_state_snapshots` | `commit-fact`                       | INSERT (420)                  | 3     |
| D7  | `parsed_documents`        | `intake-understand`, `asset-delete` | INSERT/DELETE (68/59/62)      | 3     |
| D8  | `dependencies`            | `commit-fact`                       | INSERT (213)                  | 3     |
| D9  | `gap_signals`             | `commit-fact`                       | INSERT (201)                  | 3     |
| D10 | `corrections`             | `commit-fact`                       | INSERT (189)                  | 3     |
| D11 | `sources`                 | `intake-understand`, `asset-delete` | INSERT/DELETE (77/60/63)      | 2     |
| D12 | `aol_runs`                | `intake-trigger`, `asset-delete`    | INSERT/DELETE (64)            | 3     |
| D13 | `assets`                  | `asset-delete`                      | DELETE (66)                   | 3     |
| D14 | `projects`                | `project-delete`                    | DELETE (88)                   | 3     |

Kein einziger Insert läuft durch eine zentrale Validierungs-Funktion. Schema-Drift wird nur durch `Database`-TS-Types abgefangen — Runtime-Drift bleibt unsichtbar.

---

## 4. Externe-Service-Seams (ausgehende `fetch`)

| Ziel                           | aufgerufen aus                                                              | Auth                          | LOG | TRY | R     |
| ------------------------------ | --------------------------------------------------------------------------- | ----------------------------- | --- | --- | ----- |
| aol-service                    | `intake-trigger`, `intake-process`, `commit-fact`, `_shared/agentClient`    | `AOL_SERVICE_TOKEN`           | ⚠   | ✅  | 4     |
| Graphiti `/messages` `/search` | `commit-fact`, `graphiti-reconcile`, `_shared/graphiti`, `inspect-graphiti` | `GRAPHITI_SERVICE_TOKEN`      | ⚠   | ✅  | **5** |
| Railway GraphQL                | `railway-admin`, `inspect-railway`                                          | `RAILWAY_API_TOKEN`           | ❌  | ✅  | 2     |
| LangSmith                      | `inspect-langsmith`, `_shared/promptHub`                                    | `LANGSMITH_API_KEY`+workspace | ❌  | ✅  | 3     |
| OpenAI                         | `voice-transcribe`                                                          | `OPENAI_API_KEY`              | ⚠   | ✅  | 2     |
| Unstructured                   | `intake-process` (vermutet)                                                 | `UNSTRUCTURED_API_KEY`        | ⚠   | ⚠   | 3     |

---

## 5. Top-10 unbeobachtete Seams (Priorität für Phase 2)

Sortiert nach Schaden×Häufigkeit:

1. **E5 commit-fact → D1/D2/D3 (canonical_facts/change_events/graphiti_sync_log)** — 25 awaits, 6 console-Ausgaben ohne Struktur, keine zentrale Validierung. Bricht hier etwas, korrumpiert es die kanonische Wahrheit. **R5**
2. **E5 commit-fact → Graphiti `/messages`** — Mirror-Vertrag hängt an String-Matching auf `source_description`. Kein strukturiertes Log mit `correlation_id`. **R5**
3. **E3 intake-understand → D5 review_cases / D7 parsed_documents** — 11 awaits, Stub-Pfad für Notes/URLs nur teilweise validiert. **R5**
4. **F3 useDialog.commitFact** — Frontend-Seite des Commit-Pfads. Keine eigene Logging-Spur. **R5**
5. **E6 graphiti-reconcile** — schreibt `canonical_facts.graphiti_uuid`. Idempotenz nicht getestet. **R4**
6. **E4 aol-callback** — kein Log, nur 1 try/catch über die ganze Status-Transition `processing → review_ready → committed`. **R4**
7. **E2 intake-process → Unstructured** — 4 awaits, 1 try, externe Latenz/Fehler nicht differenziert sichtbar. **R4**
8. **F1 useIntake.intake (Storage+Insert+Invoke)** — devlog ist da, aber die drei Schritte sind nicht als Stages markiert; kein Korrelations-ID-Sammelpunkt. **R4**
9. **F7/F8 useProjectActions/asset-delete** — destruktiv, ohne strukturiertes Log. **R4**
10. **E1 intake-trigger** — entscheidet `mode='explicit' vs assignment`. Falscher Branch = unsichtbares Asset. **R3**

---

## 6. Was Phase 2 als Erstes liefern muss

Aus dieser Tabelle leiten sich die ersten drei Schritte aus QA-PLAN.md Phase 2 direkt ab:

1. `_shared/logger.ts` + Migration `pipeline_events` mit Indexen auf `(asset_id)`, `(run_id)`, `(fn, ts desc)`.
2. Logger einziehen in der Reihenfolge: **commit-fact → intake-understand → aol-callback → graphiti-reconcile**.
3. ErrorBoundary + `unhandledrejection` im Frontend; Devlog-Sink schreibt zusätzlich ein `pipeline_events`-Row mit `level=error`.

✅ Phase 1 abgeschlossen — Karte liegt vor, Top-10-Liste priorisiert. Bereit für Phase 2 nach Freigabe.
