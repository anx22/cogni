

## Block D — Graphiti + LangGraph als AOL

### Korrektur

Du hast recht: AOL selbst zu bauen wäre Reinvention. Es gibt zwei seriöse Optionen.

**Recherchestand:**
- **Neo4j Agent Memory** (neo4j-labs, Jan 2026): Memory-Layer für Agents, Integrationen für 7 Frameworks (LangGraph, LlamaIndex, CrewAI, OpenAI Agents SDK, Microsoft Agent Framework etc.). Das ist **Memory**, nicht Orchestrierung — ergänzt einen Agenten, ersetzt ihn nicht.
- **LangGraph** (LangChain, ~25K Stars, von LinkedIn/Uber/Klarna in Produktion): Graph-basierte Agent-Orchestrierung, persistenter State, Human-in-the-Loop, durable execution, LangSmith für Observability.

**Entscheidung:** **LangGraph** ist die richtige Schicht für unser AOL. Graphiti bleibt der Wissensmotor. Postgres bleibt die Wahrheit. LangGraph orchestriert die 10 Pflichtschritte aus Briefing 7.2 als Knoten in einem State-Graph — mit Persistence, Human-in-the-Loop (passt exakt zur Review-First-Logik) und Observability out of the box.

Microsoft Agent Framework + Neo4j-Native-Agent-Variante verworfen, weil tief im .NET/Azure-Ökosystem verankert und für unseren Python+Edge-Functions-Stack mehr Reibung als Nutzen.

---

### Architektur

```text
UI → Supabase (Inputs)
         │
         ▼
   intake-process (Unstructured)
         │
         ▼
   ┌────────────────────────────────────────────┐
   │  AOL = LangGraph-App (Python, eigener Svc) │
   │                                            │
   │  StateGraph mit Knoten = Briefing-Pflichten│
   │   router → context_loader → interpreter →  │
   │   linker → delta_classifier → gap_detector │
   │   → dependency_detector → conflict_detector│
   │   → case_builder → condenser               │
   │                                            │
   │  Persistence: Postgres-Checkpointer        │
   │  HITL: interrupt() vor Commit              │
   │  Observability: LangSmith                  │
   │                                            │
   │  Tools (vom Graph-Knoten aufrufbar):       │
   │   - graphiti.add_episode                   │
   │   - graphiti.search                        │
   │   - graphiti.get_project_context           │
   │   - graphiti.invalidate                    │
   │   - llm.call (Gemini via Lovable AI GW)    │
   │   - postgres.read/write (Service-Role)     │
   └────────────────────────────────────────────┘
         │ Tools
         ▼
   Graphiti-Service ─► Neo4j AuraDB
   Postgres (Wahrheit) ◄── Edge Functions (UI-API)

   Edge Functions = dünne API-Schicht:
     - intake-trigger    → POST /aol/run an LangGraph-Service
     - commit-fact       → schreibt Postgres + POST /aol/confirm
     - aol-status        → GET /aol/runs/:id (für Realtime UI)

   Dev: Neo4j MCP-Connector (mein Direkt-Zugriff zur AuraDB)
```

---

### Komponenten

**1. `aol-service/` (Python, FastAPI + LangGraph)**
- `graph.py` — StateGraph-Definition, 10 Knoten aus Briefing 7.2
- `state.py` — TypedDict für AOL-State (asset_id, project_id, graph_context, candidates, deltas, gaps, conflicts, cases, facts)
- `nodes/` — ein Modul pro Pflichtschritt
- `tools/graphiti_tools.py` — Wrapper um Graphiti-Service
- `tools/llm_tools.py` — Wrapper um Lovable AI Gateway
- `tools/postgres_tools.py` — Wrapper um Supabase REST (Service-Role)
- `checkpointer.py` — `PostgresSaver` von LangGraph (nutzt vorhandene Supabase-DB für Run-State)
- `app.py` — FastAPI mit Endpoints `POST /aol/run`, `POST /aol/confirm`, `GET /aol/runs/:id`, `GET /health`
- Bearer-Auth via `AOL_SERVICE_TOKEN`
- `Dockerfile` + `README.md` mit Railway-Deploy

**2. `graphiti-service/` (Python, FastAPI)** — wie zuvor, passiver Wissensmotor
- `addEpisode`, `search`, `getProjectContext`, `invalidate`, `health`
- Neo4j AuraDB-Anbindung
- Bearer-Auth

**3. Edge Functions (Supabase, dünn)**
- `intake-trigger` (ersetzt `intake-understand`): nimmt Realtime-Trigger, ruft `POST /aol/run` am AOL-Service, persistiert `run_id` in `aol_runs`
- `commit-fact`: bestehender Postgres-Commit + zusätzlich `POST /aol/confirm` (löst Graphiti-Konfirmation/Invalidation via LangGraph-Knoten aus)
- `aol-status`: optional Polling-Fallback, sonst Realtime auf `aol_runs`

**4. Postgres-Schema**
- `canonical_facts.graphiti_uuid TEXT INDEXED`
- `proposed_facts.graphiti_episode_uuid TEXT`
- `aol_runs (id, asset_id, project_id, status, langgraph_thread_id, current_node, started_at, ended_at, error JSONB)`
- LangGraph-Checkpoint-Tabellen werden vom `PostgresSaver` selbst angelegt (eigenes Schema `langgraph`)
- `graphiti_sync_log` für Retry-Tracking
- Truncate aller Testdaten + Storage-Bucket `intake-files`

**5. Mein Dev-Pfad**
- Neo4j MCP-Connector mit AuraDB-Credentials → Cypher-Inspektion während D2/D3
- LangSmith-Account für AOL-Trace-Inspektion (kostenfreier Tier reicht)

**6. Kein Graph-View** (Briefing-Negativregel bleibt)

---

### Wer macht was

| Schicht | Rolle | Tech |
|---|---|---|
| UI | zeigt, schickt | React |
| Supabase | Wahrheit, Realtime, Auth | Postgres |
| Edge Functions | dünne API zwischen UI und AOL | Deno |
| **AOL** | **Verhalten der Entität, 10 Pflichtschritte** | **LangGraph (Python)** |
| Graphiti | passiver Wissensmotor | graphiti-core (Python) |
| Neo4j AuraDB | Graph-Speicher | Managed |
| Lovable AI Gateway | LLM-Calls vom AOL aus | Gemini |
| LangSmith | AOL-Observability | LangChain Cloud |
| Neo4j MCP | mein Dev-Werkzeug | — |

---

### Phasen

**D1 — Fundament**
- `graphiti-service/` (Code + Dockerfile + README)
- `aol-service/` Skelett (FastAPI, Health, leerer StateGraph)
- AuraDB anlegen, Indices, Secrets
- Migration: Spalten + `aol_runs` + `graphiti_sync_log` + Truncate
- Deploy beider Services (Railway), MCP-Connector verbinden

**D2 — AOL Minimal-Pfad**
- LangGraph-Knoten: `router → context_loader → interpreter → condenser`
- PostgresSaver + LangSmith verkabelt
- `intake-trigger` Edge Function ruft AOL
- End-to-End-Smoketest mit einem Text-Input

**D3 — AOL Vollausbau**
- Restliche 6 Knoten: linker, delta_classifier, gap_detector, dependency_detector, conflict_detector, case_builder
- Briefing 7.5–7.8 vollständig abgebildet
- HITL-Interrupt vor `commit-fact`

**D4 — Commit-Pfad**
- `commit-fact` schreibt Postgres + ruft `POST /aol/confirm`
- LangGraph-Knoten `confirm_to_graph` macht Episode/Invalidation
- Dependency-Resolution per Graphiti-Search

**D5 — Validierung**
- 3 Test-Inputs (Mail mit Personen+Termin, korrigierender Fakt, offener Punkt der später geschlossen wird)
- Prüfung: Postgres-Projektion + Graph-Struktur (MCP) + LangSmith-Trace

---

### Sweep mitnehmen
- `useProject.ts` `reloadKey.current` → `reloadKey` in deps
- Themen-Doc-Counts aus `assets.metadata.thema`

---

### Betroffene Dateien

| Datei | Aktion |
|---|---|
| `aol-service/{app.py, graph.py, state.py, checkpointer.py, nodes/*, tools/*}` + `Dockerfile` + `README.md` | neu |
| `graphiti-service/{main.py, ...}` + `Dockerfile` + `README.md` | neu |
| `supabase/functions/intake-trigger/index.ts` | neu (ersetzt `intake-understand`) |
| `supabase/functions/intake-understand/` | entfernt |
| `supabase/functions/commit-fact/index.ts` | + `POST /aol/confirm` |
| `supabase/functions/_shared/{agentConfig.ts, agentClient.ts}` | entfernt (Logik wandert in AOL) |
| Migration: Spalten + `aol_runs` + `graphiti_sync_log` + Truncate | neu |
| `src/lib/project/useProject.ts` | reloadKey-Fix, Doc-Counts |
| `docs/implementierung-aktuell.md` + `docs/geplant.md` | LangGraph+Graphiti-Architektur |
| `.lovable/memory/features/{verstehens-loop.md, agentic-orchestration.md}` | Update/Neu |

---

### Was ich vom User brauche

1. **Neo4j AuraDB Free** anlegen → URI + Passwort
2. **Hosting** für beide Services: Railway empfohlen (zwei Docker-Deploys, ~10min) — ein Projekt, zwei Services
3. **Embeddings für Graphiti**: OpenAI API Key (Standard) oder Bestätigung Gemini-Embeddings
4. **LangSmith Account** (kostenfreier Tier) → API Key für AOL-Observability
5. **Bestätigung Datenreset** der oben genannten Tabellen + Storage-Bucket
6. **Neo4j MCP-Connector** verbinden (mein Dev-Zugriff)

