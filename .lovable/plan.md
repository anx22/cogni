
# Welle C — Godfile-Eliminierung & Konsolidierungen

> Ziel: die im Audit 2026-05-14 stehengebliebenen Godfiles ehrlich aufräumen.
> Verbindlich: **Refactor ≠ Verhaltensänderung.** Public APIs bleiben 1:1.
> Nach jedem Schritt `bunx vitest run` + ggf. `supabase--curl_edge_functions`-Smoke.

---

## Bestand (gemessen)

**Backend:**
- `commit-fact/index.ts` — **673 LOC** (kernel + handleAssignment + writeProjectSnapshot + notifyAol + mirrorToGraphiti + ok/fail)
- `intake-understand/index.ts` — **561 LOC** (Deno.serve-Handler 415 LOC + setStatus/handleAgentError/linkAgainstExisting + utils)

**Frontend:**
- `projectViewModel.ts` — **467 LOC** (8 Mapper + Helpers + buildProjectViewModel)
- `IntakeSessionsPanel.tsx` — **384 LOC**
- `InspectorPanel.tsx` — **505 LOC**
- `OrbLab.tsx` — **648 LOC** (Tooling-Page, niedrigere Prio)
- `pages/Index.tsx` — **331 LOC**

**Konsolidierung:**
- `commit-fact/index.ts` definiert lokal `ok`/`fail` (Z. 663–671), obwohl `_shared/http.ts` existiert. Gleiches in `intake-understand/index.ts` (Z. 551–559) und mind. `intake-trigger/index.ts`. Plan B1.3 unvollständig durchgezogen.

---

## Teil 1 — Backend-Godfiles (Risiko: mittel)

### C1 `commit-fact` ehrlich auf HTTP-Adapter reduzieren (A2.1 nachholen)

Ziel-LOC für `index.ts`: < **120**. Reine HTTP-Hülle.

Neue Dateien in `supabase/functions/commit-fact/`:
- `kernel.ts` — `commitFact()` + Typen `CommitFactDeps`, `CommitFactResult` (aktuell Z. 73–304, ~232 LOC)
- `assignment.ts` — `handleAssignment()` (Z. 308–395, ~88 LOC)
- `snapshot.ts` — `updateSessionProgress()`, `writeProjectSnapshot()`, `humanizeTriggerEvent()` (Z. 397–500, ~104 LOC)
- `notifications.ts` — `notifyAol()` (Z. 507–527, ~21 LOC)
- `mirror.ts` — `mirrorToGraphiti()` (Z. 537–660, ~124 LOC)

`index.ts` enthält danach nur noch: Imports, `Deno.serve(withErrorBoundary(...))` mit Auth → Body-Parse → `commitFact(deps)` → Response. **Lokales `ok`/`fail` löschen, aus `_shared/http.ts` importieren.**

`commitFact_test.ts` Imports anpassen. Keine Test-Logik ändern.

**Verify:**
- `bun x vitest run` (60/60 grün, davon `commitFact_test.ts` 4/4 + `projectScoring_test.ts`)
- `supabase--deploy_edge_functions ["commit-fact"]`
- Smoke-Curl: leerer Body → 400; ungültige Auth → 401; gültiger Replace-Commit gegen Sandbox-Projekt → 200 + `change_event` in DB.
- `graphiti_sync_log`: neue Zeilen `status='ok'` für den Test-Commit.

---

### C2 `intake-understand` aufteilen

`Deno.serve`-Handler hat **415 LOC** (Z. 56–470) und vermischt: Auth, Asset-Loading, Agent-Run-Orchestrierung, Fact-Linking, Status-Updates, Error-Handling.

Neue Dateien in `supabase/functions/intake-understand/`:
- `understandRun.ts` — pure Orchestrierungs-Funktion `runUnderstand({admin, payload, log}): Promise<UnderstandResult>` mit dem Inhalt des Deno.serve-Bodies (ohne CORS/Auth/Response-Mapping)
- `agentBridge.ts` — Agent-Aufruf + `handleAgentError` + `setStatus` + `deterministicRunId` (Z. 473–540)
- `linker.ts` — `linkAgainstExisting()` (Z. 503–528) — nutzt bereits existierendes `factRules.ts`
- `helpers.ts` — `initials()` (Z. 542–549)

`index.ts` reduziert sich auf: `Deno.serve(withErrorBoundary("intake-understand", async (req) => { auth → parseBody → runUnderstand(...) → ok/fail }))`. **Lokales `ok`/`fail` löschen, `_shared/http.ts` nutzen.**

Ziel-LOC für `index.ts`: < **80**.

**Verify:**
- `bunx vitest run` grün.
- Deploy + Curl: leerer Body → 400; OPTIONS → 204 + CORS.
- E2E: ein echtes Asset durch die Pipeline (`intake-trigger` → `intake-process` → `intake-understand`); `pipeline_events` zeigt unveränderten Stage-Verlauf, `proposed_facts` werden geschrieben.

---

## Teil 2 — Frontend-Godfile (Risiko: niedrig, pure Functions)

### C3 `projectViewModel.ts` in `mappers/`-Ordner zerlegen (B2.2 nachholen)

Neue Struktur unter `src/lib/project/mappers/`:
- `humanize.ts` — `SUBJECT_DE`, `VERB_DE`, `humanizeSnapshotSummary`, `titleFromJson`, `stringFromJson`, `numberFromJson` (Z. 71–129, ~60 LOC)
- `konflikte.ts` — `toKonflikte` (Z. 131–147)
- `gaps.ts` — `toGaps` (Z. 149–158)
- `dependencies.ts` — `toDependencies` (Z. 160–169)
- `handlungsbedarf.ts` — `toHandlungsbedarf` + zugehörige Helper (Z. 171–279, ~109 LOC)
- `verlauf.ts` — `eventTypeToErlaubnis`, `eventTypeToDelta`, `toVerlauf` (Z. 281–305)
- `themen.ts` — `toThemen` (Z. 307–332)
- `dokumente.ts` — `toDokumente` (Z. 334–344)
- `stakeholder.ts` — `toStakeholder` (Z. 346–360)

`projectViewModel.ts` bleibt als **Barrel + Composer**: re-exportiert alle Mapper (für bestehende Imports), behält `RawProjectData`, `ComposedProjectVM` und `buildProjectViewModel`. Ziel-LOC: < **80**.

`projectViewModel.test.ts` muss durch das Re-Export weiter ohne Änderung grün sein. Kein Caller-Sweep nötig.

**Verify:** `bunx vitest run src/lib/project/projectViewModel.test.ts` (10/10 Cases unverändert grün) + `tsc --noEmit`.

---

## Teil 3 — Konsolidierungen (Risiko: sehr niedrig)

### C4 `_shared/http.ts` konsequent nutzen

Sweep über alle Edge Functions: jede lokale `ok()`/`fail()`-Definition löschen und aus `_shared/http.ts` importieren. Erwartete Treffer: `commit-fact` (in C1 mitgemacht), `intake-understand` (in C2 mitgemacht), `intake-trigger`, ggf. `aol-callback`/`voice-transcribe` falls sie noch eigene Helper halten.

**Wichtig:** Functions, die eine eigene Body-Shape brauchen (z. B. `{ok: true, ...}` statt `{...}`), behalten ihre lokale Variante explizit — dann mit Kommentar `// custom shape, intentional`.

**Verify:** `rg "function (ok|fail)\(" supabase/functions --glob '!_shared/**'` — Erwartung: nur explizit dokumentierte Ausnahmen.

---

### C5 `IntakeSessionsPanel.tsx` (384 LOC) entzerren — **nur wenn Welle B-Detektoren das brauchen**

Falls Lesbarkeit jetzt schon hakt: Sub-Komponenten `SessionRow`, `SessionDetails`, `SessionFilters` extrahieren in `src/components/entity/intakeSessions/`. Sonst **postponed** und im Audit-Update als ⏸ vermerkt — kein erzwungener Refactor.

**Entscheidung:** Im Plan als optional markiert. Stoppen wenn C1–C4 grün sind und beim User Rückfrage, ob C5 mitgenommen wird.

---

## Bewusst NICHT in dieser Welle

- **`OrbLab.tsx` (648 LOC)** — Tooling-Page, nicht im Hot-Path. Kein Produktivrisiko.
- **`InspectorPanel.tsx` (505 LOC)** — DevLog-Werkzeug, nicht im Hot-Path.
- **`pages/Index.tsx` (331 LOC)** — bewegt sich an der Grenze, aber kohärente Page-Composition; Split würde Indirektion ohne Substanzgewinn bringen.
- **`_shared/types.ts` (1769 LOC)** — auto-generiert, nicht anfassen.
- **B3.1 Box-Builder** — bewusst zurückgestellt (in DECISIONS dokumentiert), bleibt bei `useBoxSubmit`.

---

## Reihenfolge & Stop-Bedingungen

1. **C3** zuerst (Frontend, pure functions, niedrigstes Risiko, baut Vertrauen) → Vitest grün?
2. **C1** commit-fact splitten → Vitest + Curl-Smoke grün?
3. **C2** intake-understand splitten → Vitest + Pipeline-E2E grün?
4. **C4** ok/fail-Sweep über Rest → Lint + Smoke grün?
5. Audit-Doku aktualisieren: `docs/audit-2026-05-14.md` erweitern um „Welle C — 2026-05-15 nachgezogen", `docs/DECISIONS.md` mit C1/C2/C3-Einträgen, `docs/NOW.md` Recently-Completed.

**Stop bei:**
- Vitest rot, Fix nicht in 30 min möglich → revert.
- Smoke-Curl liefert anderen Status-Code als Pre-Refactor → revert.
- `pipeline_events` zeigt nach C2 fehlende Stages oder andere `correlation_id`-Struktur → revert.

---

## Erwartete LOC-Reduktion

| File | vorher | nachher | Δ |
|---|---|---|---|
| `commit-fact/index.ts` | 673 | ~120 (Hülle) + 5 neue Dateien (Σ ~570) | strukturell, netto ~−15 LOC durch ok/fail-Dedup |
| `intake-understand/index.ts` | 561 | ~80 + 4 neue Dateien (Σ ~480) | netto ~−10 LOC |
| `projectViewModel.ts` | 467 | ~80 + 9 mapper-Dateien (Σ ~450) | netto ~−5 LOC |

Reine LOC-Einsparung **gering** — der Gewinn ist Lesbarkeit, Testbarkeit pro Modul und das ehrliche Erfüllen von A2.1 + B2.2 aus dem Original-Plan. Keine künstlichen LOC-Ziele mehr.

---

## Verify-Master

- `bunx vitest run` — Erwartung 60/60 grün, keine neuen Tests, keine geänderten Assertions
- `supabase--deploy_edge_functions ["commit-fact","intake-understand"]`
- `supabase--curl_edge_functions` Smokes wie unter C1/C2 beschrieben
- `supabase--read_query` auf `pipeline_events` und `graphiti_sync_log` für letzten Test-Commit → Stage-Verlauf identisch
- `find src supabase/functions -name '*.ts*' -not -path '*/types.ts' | xargs wc -l` für Vor/Nach-Vergleich im Audit-Update

