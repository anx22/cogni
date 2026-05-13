# Welle A — gebaut, bereit zum Test

## Geliefert (heute)

**S1 — `intake-understand` mit `graph_hint`** (deployt)
- Optionaler Body-Param `graph_hint: string | null`. Ohne ihn läuft alles wie
  zuvor (Idempotenz-Hash, Scoring, Assignment, Stakeholder-Linking unangetastet).
- `_shared/agentClient.ts → callExtractFacts(text, graphHint?)` hängt den
  Hint als zweite System-Message vor den User-Text. Reines Prompt-Enrichment,
  kein Schemawechsel, kein Tool-Eingriff. Hint-Limit: 4 KB.

**S2 — `aol-service/app/graph.py → context_loader`**
- Ruft Graphiti `POST /get-memory` mit `group_id = project_id`, `max_facts: 20`.
- Macht aus Antwort eine kompakte `- bullet`-Liste (max 240 Zeichen je Eintrag).
- Bei Fehler / fehlendem Secret → leerer Kontext + `state.error`, niemals werfen.

**S3 — `interpreter`-Knoten**
- Calls `${SUPABASE_URL}/functions/v1/intake-understand` mit Service-Role-Auth,
  übergibt `asset_id`, `retry`, `graph_hint`. Antwort (`facts`, `session_id`)
  fließt in `state["facts_written"] / state["session_id"]`.
- Timeout 120 s (LLM + DB).

**S4 — `condenser` no-op**
- Reicht nur `last_node` + `facts_written` + `session_id` weiter.
- Schreiben passiert komplett in der Edge Function — eine Codebasis, kein Drift.
- Kommentar im Code zeigt, wo Welle B (conflict/gap/dependency) später ansetzt.

**S5 — `aol-callback`**
- Bereits vorhanden, unverändert. `/aol/run` in `main.py` ruft ihn am Ende mit
  `status: completed`, `current_node`, `facts_written`, `session_id`.

**S6 — Switch in `intake-trigger`**
- Bereits vorhanden: AOL bei gesetzten Secrets, sonst Legacy-Fallback. Kein
  Parallel-Run, kein Schatten-Modus.

## Was du JETZT tun musst (Railway-Seite)

Der AOL-Container in Railway braucht zwei Env-Vars zusätzlich, damit
`interpreter` die Edge Function callen kann:

```
SUPABASE_URL=https://zeazrfidtpdtgcrbnhbo.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<Service-Role-Key aus Lovable Cloud>
```

(`GRAPHITI_SERVICE_URL`, `GRAPHITI_SERVICE_TOKEN`, `AOL_CALLBACK_URL`,
`AOL_CALLBACK_TOKEN`, `LANGSMITH_API_KEY`, `AOL_SERVICE_TOKEN` sind schon da.)

Nach dem Setzen: Railway-Service neu deployen (push reicht).

## Verifikation (nachdem Railway redeployed hat)

1. Asset hochladen → DevLog: `aol_runs` mit `status: completed`,
   `current_node: condenser`.
2. F1-Inspector „Pipeline-Trace" zeigt die Edge-Function-Calls + LangSmith
   verlinkt den Run.
3. Confirm drücken → `canonical_facts.graphiti_uuid` gesetzt
   (inspect-pipeline).
4. Zweites Asset im selben Projekt → in den AOL-Logs taucht in
   `context_loader` ein nicht-leerer Kontext auf, Extraction sollte das
   bestehende Faktum als `confirm` statt `add` einsortieren.

## Was bewusst NICHT gemacht wurde

- Keine Portierung von Scoring/Assignment/Hashing nach Python.
- Kein Schreibzugriff aus Python auf `proposed_facts` / `review_cases`.
- Kein Auto-Commit, Review-First bleibt.
- Kein Parallel-Run.
- `commit-fact` (Graphiti-Mirror) unverändert — läuft seit gestern.

## Welle B (später)

`linker` (Graph-basiertes Matching), `conflict_detector`, `gap_detector`,
`dependency_detector` zwischen `interpreter` und `condenser` einfügen,
sobald Welle A produktiv Daten in den Graph legt. Dann macht Welle B
Aussagen, die heute noch keine Datenbasis hätten.
