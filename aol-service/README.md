# AOL — Agentic Orchestration Layer

Python/FastAPI + LangGraph. Orchestriert die 10 Pflichtschritte aus Briefing 7.2
als Knoten in einem persistenten StateGraph. Spricht Graphiti (Wissensgraph) und
das Lovable AI Gateway als Tools an.

> **Status:** Skelett. Health + leerer StateGraph + Auth + FastAPI-Routen +
> Lovable-Cloud-Callback stehen. Knoten werden in Phase D2/D3 ausgebaut.

## Architektur (DB-Zugriff)

Railway bekommt **keinen** Datenbank-Key und ruft keine Cloud-Funktion mit
Admin-Rechten. Der AOL-Service lädt in Welle A nur Graphiti-Kontext und gibt ihn
an `intake-trigger` zurück. Danach ruft `intake-trigger` Cloud-intern
`intake-understand` mit `graph_hint` auf; alle Datenbank-Schreibzugriffe bleiben
in Lovable Cloud.

```
intake-trigger (Lovable Cloud)
   -> POST /aol/run (Bearer AOL_SERVICE_TOKEN) -> Railway
        -> LangGraph: context_loader liest Graphiti
        -> returns graph_context
   -> intake-understand(graph_hint) läuft Cloud-intern
   -> proposed_facts / dialog_sessions / review_cases werden Cloud-intern geschrieben
```

## Endpoints

| Method | Path                 | Zweck                                        |
| ------ | -------------------- | -------------------------------------------- |
| GET    | `/health`            | Liveness (kein Auth)                         |
| POST   | `/aol/run`           | Verstehens-Lauf starten (von intake-trigger) |
| POST   | `/aol/confirm`       | HITL-Bestätigung (von commit-fact)           |
| GET    | `/aol/runs/{run_id}` | Trace eines Laufs (für UI)                   |

Alle `/aol/*`-Routen erwarten `Authorization: Bearer ${AOL_SERVICE_TOKEN}`.

## ENV-Variablen (Railway)

| Name                                          | Beschreibung                                                                         |
| --------------------------------------------- | ------------------------------------------------------------------------------------ |
| `AOL_SERVICE_TOKEN`                           | Bearer-Secret. Muss exakt mit dem Lovable-Cloud-Secret übereinstimmen.               |
| `AOL_CALLBACK_URL`                            | Vollständige URL der `aol-callback` Edge Function in Lovable Cloud.                  |
| `AOL_CALLBACK_TOKEN`                          | Shared Secret. Muss exakt mit dem gleichnamigen Lovable-Cloud-Secret übereinstimmen. |
| `GRAPHITI_SERVICE_URL`                        | URL des deployten graphiti-server (ohne trailing /).                                 |
| `GRAPHITI_SERVICE_TOKEN`                      | Optional, falls dein Graphiti-Server Bearer erwartet.                                |
| `NEO4J_URI` / `NEO4J_USER` / `NEO4J_PASSWORD` | Nur falls AOL Neo4j auch direkt liest (sonst nicht nötig).                           |
| `OPENAI_API_KEY`                              | Embeddings via Graphiti (indirekt).                                                  |
| `LOVABLE_API_KEY`                             | Für Lovable AI Gateway (Gemini).                                                     |
| `LANGSMITH_API_KEY`                           | Optional. Aktiviert Tracing.                                                         |
| `LANGCHAIN_PROJECT`                           | Optional. z.B. `produktintelligenz-aol`                                              |

> **Nicht nötig und nicht setzen:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
> `DATABASE_URL`. Datenbank-Schreibzugriffe laufen ausschließlich in Lovable
> Cloud; Railway darf nur Graphiti und den Callback-Token kennen.

### `AOL_CALLBACK_URL` herausfinden

Format:

```
https://<project-ref>.functions.supabase.co/aol-callback
```

Für dieses Projekt:

```
https://zeazrfidtpdtgcrbnhbo.functions.supabase.co/aol-callback
```

## Lokal starten

```bash
cd aol-service
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## Railway-Deploy

1. Neues Service im Railway-Projekt anlegen
2. Source: dieses Verzeichnis (`aol-service/`)
3. Build: Dockerfile (Railway erkennt automatisch)
4. ENV-Vars siehe oben
5. Deploy → öffentliche URL kopieren → in Lovable Cloud als `AOL_SERVICE_URL`
   eintragen
