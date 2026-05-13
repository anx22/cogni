

## Block D — Folgeschritte nach Secret-Check

### Befund
- ✅ Graphiti-Service läuft (offizieller `graphiti-server` auf Railway, `/healthcheck` healthy)
- ✅ Neo4j, OpenAI, LangSmith, Lovable AI Secrets vorhanden
- ❌ `AOL_SERVICE_URL` zeigt auf fremde App → muss geleert werden
- ❌ `AOL_SERVICE_TOKEN` fehlt → wird generiert
- 🔄 Eigener `graphiti-service/`-Wrapper entfällt → wir sprechen direkt mit dem offiziellen Server

### Plan-Anpassungen

**1. Secrets bereinigen (sofort, vor Code)**
- `AOL_SERVICE_URL` leeren (UI: Cloud → Secrets)
- `AOL_SERVICE_TOKEN` neu anlegen mit kryptografisch sicherem Wert (32 Byte hex, ich generiere und du fügst ihn in Cloud → Secrets ein; denselben Wert später auch in der AOL-Service-Konfig auf Railway)

**2. Architektur-Korrektur — Graphiti**

Eigene `graphiti-service/`-Komponente wird **gestrichen**. Stattdessen:

- `supabase/functions/_shared/graphiti.ts` als dünner TS-Client direkt gegen die offiziellen Endpoints des deployten `graphiti-server`:
  - `POST /messages` → Episoden hinzufügen (Text/JSON-Inhalte)
  - `POST /search` → Fakten/Entities/Relations finden
  - `GET /episodes/{group_id}` → Projekt-Kontext laden
  - `POST /get-memory` → kompakter Memory-Dump für LLM-Prompts
  - `POST /entity-node` → explizite Entity-Anlage (Personen, Organisationen, Themen)
  - `DELETE /episode/{uuid}` → Invalidation alter Fakten
  - `DELETE /group/{group_id}` → Projekt-Reset (Dev/Test)
  - `GET /healthcheck` → Health-Probe

- Mapping unserer Konzepte:
  - `group_id` = unsere `project_id` (Postgres-UUID) → saubere Mandantentrennung im Graph
  - Unsere `canonical_facts.graphiti_uuid` = die UUID, die der Server zurückgibt
  - Unsere `proposed_facts.graphiti_episode_uuid` = Episode-UUID aus `POST /messages`

**3. AOL-Service neu bauen (Phase D2)**

Da die hinterlegte URL falsch war: AOL existiert real noch nicht. Wir bauen jetzt den `aol-service/` von Grund auf wie geplant (Python/FastAPI + LangGraph), du deployst ihn auf Railway, trägst die echte URL nach.

Reihenfolge:
1. Code für `aol-service/` schreiben (Skelett mit Health, leerer StateGraph, FastAPI-Endpoints, Bearer-Auth über `AOL_SERVICE_TOKEN`)
2. Dockerfile + README mit klarer Railway-Anleitung (welche ENV-Vars: `NEO4J_*`, `GRAPHITI_SERVICE_URL`, `OPENAI_API_KEY`, `LANGSMITH_API_KEY`, `AOL_SERVICE_TOKEN`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `LOVABLE_API_KEY`)
3. Du deployst, kopierst die Railway-URL in `AOL_SERVICE_URL`
4. Edge-Function-Smoketest

**4. Edge Functions aktualisieren**
- `_shared/graphiti.ts` neu (siehe oben)
- `intake-trigger` (ersetzt `intake-understand`): leitet POST an `${AOL_SERVICE_URL}/aol/run` mit Bearer
- `commit-fact`: zusätzlich `POST ${AOL_SERVICE_URL}/aol/confirm`
- `intake-understand` und `_shared/agentClient.ts`/`agentConfig.ts` werden entfernt (Logik wandert in AOL-Knoten)

**5. Validierung**
- Edge-Function ruft Graphiti direkt → `/healthcheck` + Test-Search → ok
- Edge-Function ruft AOL `/health` mit Bearer → 200
- Realer Intake-Test (Notiz) durchläuft AOL-Minimalpfad: router → context_loader (ruft Graphiti) → interpreter (Lovable AI) → condenser (schreibt `proposed_facts` + `dialog_session`)

### Reihenfolge der nächsten Coding-Schritte
1. `AOL_SERVICE_URL` leeren + `AOL_SERVICE_TOKEN` setzen (du, in Cloud-UI)
2. `aol-service/` Skelett erstellen + `_shared/graphiti.ts` schreiben + alte `intake-understand` durch `intake-trigger` ersetzen
3. Du deployst AOL auf Railway, trägst URL in `AOL_SERVICE_URL` nach
4. AOL-Knoten ausbauen (D3), Commit-Pfad anbinden (D4), End-to-End-Validierung (D5)

### Was ich gleich von dir brauche
- Bestätigung, dass du nach Secret-Anpassung das AOL-Skelett gebaut sehen möchtest, **bevor** du auf Railway deployst (Empfehlung: ja — sonst hast du nichts zu deployen)
- Den `AOL_SERVICE_TOKEN`-Wert generiere ich dir direkt im nächsten Schritt nach Approve

