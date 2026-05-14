# Tier B3 — Größere Restrukturierungen

Reihenfolge: **B3.2 zuerst** (klar gewinnbringend, isoliert), **B3.1\* danach** (bewusst zurückgeschnitten — siehe Realitätscheck unten).

---

## Realitätscheck zu B3.1 (Box-Builder)

Plan-Annahme: „70 % identisches Scaffolding, ~380 Zeilen Ersparnis".
Befund nach Codelesen:

- 8 Box-Dateien = **558 LOC gesamt** (nicht 700+).
- Scaffolding ist **bereits in `BoxFrame` extrahiert** (Title, States, Gate, Actions, Readonly).
- Was bleibt, ist **echter Box-spezifischer Inhalt** (Auswahllisten, Textareas, Konfliktvarianten, Zuordnungs-UI mit 205 LOC).
- Ein generischer `BoxBuilder({ renderContent, validate, getSubmitPayload })` würde pro Box-Typ eine `renderContent`-Funktion verlangen — also faktisch denselben Code, nur in eine `BoxConfig` umgehängt. **Kein Lines-Win, +1 Indirektionsebene, +Risiko**.

→ Stattdessen: **B3.1\*** = drei kleine, ehrliche Hook-Extraktionen, die echte Wiederholung beseitigen (Textinput-State, Commit+ManualOverride, Auswahl-State). Box-Komponenten bleiben bestehen, werden schlanker.

Wenn du den vollen `BoxBuilder` willst: ausdrücklich sagen, dann mache ich es. Aber meine Empfehlung als Architekt: **nicht ohne Bedarf**.

---

## B3.2 — `railway-admin` modularisieren

### Ist-Zustand
`supabase/functions/railway-admin/index.ts` = **599 LOC**, **18 Action-Branches**, vermischt Railway-GraphQL, LangSmith-Debug (8 Actions), Graphiti-Probes, AOL, PromptHub, Diagnose, Mirror-Test, Sync.

### Ziel-Struktur
```text
supabase/functions/railway-admin/
├── index.ts              ~70 LOC  (Router + CORS + Logger)
├── _helpers.ts           ~50 LOC  (gql shim, prefix, NEO4J_VARS, autoDiscover)
├── handlers/
│   ├── railway.ts        list, project, set-vars, redeploy, tune-neo4j, raw,
│   │                     sync-supabase-to-railway
│   ├── langsmith.ts      langsmith-raw, -key-info, -auth-matrix,
│   │                     -create-test-repo, -tenant-resolve,
│   │                     -list-workspaces, -write-probe, -probe
│   ├── graphiti.ts       graphiti-probe, test-mirror
│   ├── aol.ts            test-aol
│   ├── promptHub.ts      prompt-cache-bust, prompt-state
│   └── diagnose.ts       diagnose
```

### Vorgehen (strikt)
1. `_helpers.ts` extrahieren — bestehende Funktionen 1:1 übernehmen, **keine Signaturänderung**.
2. Pro Domäne `handlers/<domain>.ts`: jede Datei exportiert `export const handlers: Record<string, (body, ctx) => Promise<Response>>`.
3. `ctx` enthält `{ log, cors }` — kein neuer State, nur Pass-Through.
4. `index.ts`: Router baut Action-Map zusammen:
   ```ts
   const all = { ...railway.handlers, ...langsmith.handlers, ... };
   const fn = all[action];
   if (!fn) return ok400("unknown action");
   return await fn(body, { log, cors });
   ```
5. `withErrorBoundary` + `createLogger` bleiben im `index.ts`.
6. **Verhalten unverändert** — kein Action-Rename, kein Response-Schape ändern, kein Header anders.

### Verify
- `bunx vitest run` (Frontend bleibt unbetroffen — Smoke).
- `supabase--deploy_edge_functions ["railway-admin"]`.
- Per `supabase--curl_edge_functions` jede gruppe stichprobenartig:
  - `{action:"list"}` → Workspaces zurück
  - `{action:"langsmith-key-info"}` → present:true
  - `{action:"diagnose", projectId, environmentId, aolServiceId}` → wenn Health-Panel nutzt
  - `{action:"prompt-state"}` → cache state
  - `{action:"graphiti-probe", project_id:"<bekannte>"}` → status 200
- 1× Logs prüfen (`supabase--edge_function_logs railway-admin`) → keine neuen Errors.
- `unknown action` weiter HTTP 400.

### Risiken & Mitigation
- **Import-Zyklus**: handlers importieren `_helpers`, nicht umgekehrt.
- **Dynamic imports** (`promptHub.ts` lädt `../_shared/promptHub.ts` lazy) — beibehalten, nicht statisch ziehen, sonst Cold-Start-Kosten.
- **Keine Action umbenennen** — Health-Panel + Frontend rufen by name.

**Lines saved (real):** ~250 → 70 + 50 + 6×40 ≈ 360 verteilt, aber jede Datei < 80 LOC und einzeln testbar.

---

## B3.1\* — Box-Hooks (zurückgeschnittene Variante)

Statt eines BoxBuilders drei kleine Hooks in `src/lib/dialog/`:

### Hook 1: `useBoxTextField(box, key, opts)`
Kapselt das Pattern aus `EingabeBox`/`GapBox`/`KonfliktBox` (reason):
```ts
const { value, setValue, submit, canSubmit } = useBoxTextField(box, "antwort", {
  minLength: 1,
  onConfirm: (v) => ({ antwort: v }),
});
```
Intern: `useState`, `updateBoxPayload`, `commitBox`, optional `markManual`.

### Hook 2: `useBoxChoice<T>(box, key, opts)`
Kapselt `AuswahlBox`/`KonfliktBox`-Auswahl-Logik (Selection + Confirm + manual mark).

### Hook 3: `useBoxCommit(box)`
Wrappt `commitBox` + `markManual` + Session-Context für die Boxes, die nur „confirm/reject" senden.

### Migration
- `EingabeBox`, `GapBox`: nutzen `useBoxTextField`.
- `AuswahlBox`: nutzt `useBoxChoice`.
- `KonfliktBox`: kombiniert beide.
- `AktionsBox`, `WissensBox`, `KontextBox`: bleiben unverändert (zu klein).
- `ZuordnungsBox`: bleibt eigenständig (genuin komplex, kein Win durch Hooks).

### Verify
- `bunx vitest run` (60/60).
- Manueller Smoke: pro Box-Typ 1× im Dialog-Overlay durchklicken (Preview).
- Visueller Diff: vorher/nachher Screenshot pro Box-Typ.
- A2.2-E2E (Dialog-Overlay) bleibt grün.

### Lines saved (real)
~80–120 (pro betroffene Box 15–25 Zeilen weniger). Ehrlich, nicht 380.

---

## Reihenfolge & Stop-Bedingungen

1. **B3.2 implementieren** → vollständig deployen → curl-Verify → erst dann weiter.
2. Falls bei Schritt 1 *irgendein* Action-Call abweicht: Stop, Diff erklären, kein zweiter Schritt.
3. **B3.1\* implementieren** → Vitest grün → Preview-Smoke → fertig.
4. `docs/NOW.md` + `docs/DECISIONS.md` aktualisieren (B3.1 bewusst reduziert, Begründung notiert).

## Out of Scope
- Voller `BoxBuilder` mit `BoxConfig`-Map (begründet abgelehnt — siehe Realitätscheck).
- Tier B4.
- Neue Features.

## Entscheidung, die ich brauche
Nur eine: **OK für B3.1\*** (Hooks statt Builder)? Falls nein und du den vollen Builder willst → kurz „voller Builder" antworten, dann baue ich den.
