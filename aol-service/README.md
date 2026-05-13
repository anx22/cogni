# AOL — Agentic Orchestration Layer

Python/FastAPI + LangGraph. Orchestriert die 10 Pflichtschritte aus Briefing 7.2
als Knoten in einem persistenten StateGraph. Spricht Graphiti (Wissensgraph),
Postgres (Wahrheit) und das Lovable AI Gateway als Tools an.

> **Status:** Skelett. Health + leerer StateGraph + Auth + FastAPI-Routen
> stehen. Knoten werden in Phase D2/D3 ausgebaut.

## Endpoints

| Method | Path | Zweck |
|--------|------|-------|
| GET    | `/health`               | Liveness (kein Auth) |
| POST   | `/aol/run`              | Verstehens-Lauf starten (von intake-trigger) |
| POST   | `/aol/confirm`          | HITL-Bestätigung (von commit-fact) |
| GET    | `/aol/runs/{run_id}`    | Trace eines Laufs (für UI) |

Alle `/aol/*`-Routen erwarten `Authorization: Bearer ${AOL_SERVICE_TOKEN}`.

## ENV-Variablen (Railway)

| Name | Beschreibung |
|------|--------------|
| `AOL_SERVICE_TOKEN` | Bearer-Secret. Muss exakt mit dem Lovable-Cloud-Secret übereinstimmen. |
| `GRAPHITI_SERVICE_URL` | URL des deployten graphiti-server (ohne trailing /). |
| `GRAPHITI_SERVICE_TOKEN` | Optional, falls dein Graphiti-Server Bearer erwartet. |
| `NEO4J_URI` / `NEO4J_USER` / `NEO4J_PASSWORD` | Nur falls AOL Neo4j auch direkt liest (sonst nicht nötig). |
| `OPENAI_API_KEY` | Embeddings via Graphiti (indirekt). |
| `LANGSMITH_API_KEY` | Aktiviert Tracing. |
| `LANGCHAIN_TRACING_V2` | `true` |
| `LANGCHAIN_PROJECT` | z.B. `produktintelligenz-aol` |
| `SUPABASE_URL` | Postgres-REST-Basis. |
| `SUPABASE_SERVICE_ROLE_KEY` | Schreibrechte für proposed_facts/dialog_sessions/aol_runs. |
| `LOVABLE_API_KEY` | Für Lovable AI Gateway (Gemini). |
| `DATABASE_URL` | Optional. Direkter Postgres-DSN für LangGraph PostgresSaver. |

## Lokal starten

```bash
cd aol-service
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## Railway-Deploy

1. Neues Service im selben Railway-Projekt anlegen
2. Source: dieses Verzeichnis (`aol-service/`)
3. Build: Dockerfile (Railway erkennt automatisch)
4. ENV-Vars siehe oben
5. Deploy → öffentliche URL kopieren → in Lovable Cloud als `AOL_SERVICE_URL`
   eintragen
