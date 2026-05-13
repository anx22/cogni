# Reality-Check + 2-Phasen-Finalisierung

## 1. Wo ich halluziniert habe (sorry)

Aus dem letzten Plan war zu viel Karton-Polish. Ehrlich gegengeprüft:

| Vorschlag | Realität |
|---|---|
| Voice-Recorder Cancel, Limits | Funktioniert. Nicht beobachtet, dass etwas fehlt. |
| EntityVoice Stille-Übergänge / Flicker | Erfunden, nie als Bug aufgetreten. |
| Diff in Konfliktbox | Erfunden, kein Trigger. |
| Realtime Re-Mount-Flicker im ProjectScreen | Erfunden. |
| Side-Grids Tastaturnavigation | Steht laut `implementierung-aktuell.md` bereits. |
| Dialog-Submit-Sprache | Phase 4 hat das vereinheitlicht. |
| Empty-State neues Projekt | Inline-Name-Edit existiert. |

**Echte offene Lücken** (mit Hebel, nicht Kosmetik):

1. **Phase 10 ist nur Skelett.** `aol-service/` läuft auf Railway, FastAPI + LangGraph stehen, aber `COMPILED.invoke()` ist Stub — Knoten bauen Wissen, Linking, Konflikt, Gap, Commit nicht echt. `intake-trigger` ruft Railway zwar, bekommt aber ein No-op.
2. **Graphiti wird nicht beschrieben.** `_shared/graphiti.ts` ist fertig, `canonical_facts.graphiti_uuid` bleibt aber NULL. Kein einziger produktiver Episode-Insert.
3. **Beobachtbarkeit der externen Tools fehlt mir komplett.** Ich kann Supabase-Logs lesen (`supabase--edge_function_logs`, `analytics_query`), aber Railway-Logs, LangSmith-Traces, Graphiti/Neo4j-Inhalte und Unstructured-Antworten sehe ich nicht. Ohne das ist Phase 10 Blindflug.

Punkt 3 ist Voraussetzung für 1+2. Daher die folgende Reihenfolge.

---

## 2. Zwei Phasen — straff, mit Phase-10-Vorbereitung verzahnt

### Phase F1 — Observability-Bridge (Voraussetzung für alles Weitere)

**Ziel:** Ich (Lovable Agent) sehe jeden Vorgang — Supabase, Railway, Graphiti, LangSmith, Unstructured — über einen einheitlichen Inspektor. Du selbst siehst dasselbe im erweiterten DevLog-Panel.

Vier neue Edge Functions als „Inspector-API". Sie sind das Brücken-Werkzeug zwischen externen Diensten und meinen Tools (`supabase--curl_edge_functions`, `edge_function_logs`):

| Function | Was sie tut | Externes Tool |
|---|---|---|
| `inspect-railway` | GraphQL gegen `backboard.railway.com/graphql/v2` mit `RAILWAY_API_TOKEN`. Liefert Deploy-Status, neueste Logs des AOL-Service. | Railway Public API (GraphQL, Account-Token) |
| `inspect-langsmith` | REST gegen `api.smith.langchain.com` mit `LANGSMITH_API_KEY` (existiert). Holt Run-Trace zu einer `aol_runs.id` oder `langgraph_thread_id`. | LangSmith API |
| `inspect-graphiti` | Ruft `${GRAPHITI_SERVICE_URL}/healthcheck` + `/search` (group_id=project_id) und optional Neo4j-Cypher-Stats über die Graphiti-REST. | Graphiti-Server + Neo4j (via Graphiti) |
| `inspect-pipeline` | End-to-End-Trace eines Assets: joined `assets → parsed_documents → proposed_facts → review_cases → canonical_facts → change_events → project_state_snapshots → aol_runs`. Zeigt wo ein Asset hängt. | nur Supabase-DB |

**Frontend:**
- DevLog-Panel um „Inspector"-Tab erweitert: Eingabefeld asset_id / run_id / project_id, Buttons rufen die vier Edge Functions, Ergebnis als JSON anzeigbar. Bleibt `import.meta.env.DEV`-only.

**Secrets:**
- `RAILWAY_API_TOKEN` (musst du anlegen lassen, Schritt-für-Schritt unten)
- `LANGSMITH_API_KEY` ist da
- `GRAPHITI_SERVICE_URL/TOKEN`, `NEO4J_*` sind da

**Was du danach hast:**
- Wenn ein Upload „nicht ankommt", sage ich dir in einer Antwort, in welchem Schritt er hängt — ohne zu raten.
- Du klickst im DevLog auf eine Asset-ID und siehst die ganze Kette.
- Phase 10 wird debugbar, sonst sind die LangGraph-Knoten eine Blackbox.

### Phase F2 — Phase 10 echt einschalten

Mit der Observability aus F1 baue ich endlich die Wertschöpfung:

1. **AOL-Knoten füllen** (`aol-service/app/graph.py`):
   - `extract` → Lovable AI Gateway (existierender Prompt aus `agentConfig.ts` portiert)
   - `link_against_canonical` → Cypher gegen Graphiti-Search
   - `detect_conflicts` / `detect_gaps` → bestehende Logik aus `intake-understand` als LangGraph-Node
   - `compose_review` → schreibt `proposed_facts` + `review_cases` via `aol-callback`
   - `commit_to_graph` (über `/aol/confirm` aus `commit-fact` getriggert) → `Graphiti.addMessage` mit `group_id=project_id`, schreibt UUID in `canonical_facts.graphiti_uuid`

2. **Umschalter sauber:** wenn `AOL_SERVICE_URL` gesetzt → Railway-Pfad, sonst Fallback zum bestehenden `intake-understand`. So bleibt nichts kaputt während des Schaltens.

3. **`aol_runs`-Trace im UI:** kleines Dropdown im RecentAssets-HoverCard zeigt `current_node` + Fehler. Kein neues Panel, nur Statusrückmeldung.

4. **Verifikation per F1-Inspectors**: jeder Schritt überprüfbar.

**Was bewusst NICHT mehr drin ist:** Face-Pill-Cleanup, Side-Grid-Polish, Re-Mount-Optimierungen, Dialog-Diffs. Wenn du etwas konkret als Bug erlebst, fixe ich es punktuell, aber kein Pauschal-Polish.

---

## 3. Step-by-Step — was du selbst tun musst

Da du nicht-technisch bist, hier glasklar:

**Vor Phase F1:**
1. **Railway API-Token erstellen** (3 Klicks): in Railway oben rechts dein Avatar → *Account Settings* → *Tokens* → *Create New Token* (Typ: „Account Token"). Token kopieren.
2. Im Lovable-Cloud-Connectors-Panel oder in der Secrets-UI das Secret `RAILWAY_API_TOKEN` hinzufügen — ich sag dir Bescheid, wenn das dran ist (über meinen `add_secret`-Tool-Aufruf), du klickst nur „speichern".
3. Mehr nicht. Alles andere baue ich.

**Vor Phase F2:**
4. Nichts. F2 nutzt nur Secrets, die schon da sind (`AOL_SERVICE_*`, `GRAPHITI_*`, `NEO4J_*`, `LOVABLE_API_KEY`).

**Während/nach jeder Phase:**
5. Du klickst „Implement plan", ich baue. Am Ende verifiziere ich mit den eigenen Inspectors und zeige dir konkret den End-to-End-Trace eines Test-Assets.

---

## 4. Spec-Abgleich (kurz)

- `docs/produkt-gesamt.md` Punkt 4: Datenfluss ⇒ App→Supabase→Unstructured→Graphiti/Cognee→Supabase→App. F2 schließt genau diesen letzten Schritt (Graphiti-Rückschreibung).
- `docs/input/07-09-…` Punkt 7.1: „Graph nie als Wahrheit". F2 schreibt nach Commit, nie davor — Supabase bleibt Master.
- `mem://features/produkt-prinzipien`: Provenance + Delta. AOL-Knoten erzeugen `delta_type` wie heute, nichts ändert sich am Vertrag.
- `mem://features/entscheidungen`: Graphiti gesetzt — F2 löst genau das ein.
- `aol-service/README.md`: Architektur „kein DB-Key auf Railway, Callback statt direkter Schreibzugriff" bleibt unverändert; F1 fügt nur Lese-Inspectors hinzu, keine Writes von außerhalb.

---

## 5. Frage an dich

Drei Stellschrauben, dann starte ich F1:

1. F1 + F2 in dieser Reihenfolge ok?
2. Machst du das Railway-Token, oder soll ich F1 ohne `inspect-railway` starten und du holst es nach?
3. Soll der Inspektor auch in Production sichtbar sein (hinter Auth), oder strikt dev-only?
