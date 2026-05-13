
# Plan — Welle A sauber, ohne Doppelpipeline

## Klarstellung vorab (wo wir wirklich stehen)

Du hast Schritt 1 deiner Liste schon — heute gebaut:
- `_shared/graphiti.ts`: URL-Härtung (`https://` auto-ergänzt), `addMessage` async-korrekt (Client-UUID, HTTP 202 → queued).
- `commit-fact/index.ts`: spiegelt nach erfolgreichem Insert nach Graphiti, schreibt `canonical_facts.graphiti_uuid`, Fehler landen in `provenance.graphiti_error`, niemals geworfen.

Also: **Schritt 1 ist live.** Wir starten direkt mit Welle A.

## Was du eigentlich willst — in einem Satz

Bevor `intake-understand` extrahiert, soll der AOL erst im **Projekt-Graphen nachsehen**, was zu diesem Asset schon bekannt ist (Stakeholder, Entitäten, frühere Fakten), und das als Kontext in den Extraktions-Prompt mitgeben. Resultat: weniger Duplikate, sauberere Verknüpfungen, weniger Konflikte downstream — ohne dass wir die getunte 482-Zeilen-Logik von `intake-understand` doppelt nachbauen.

## Architektur (gemäß Spec & Standards)

```text
intake-trigger
    │
    ├── AOL_SERVICE_URL gesetzt? ──► POST /aol/run (Railway)
    │                                    │
    │                                    ▼
    │                              router → context_loader (Graphiti.search/getMemory)
    │                                    │            │
    │                                    │            ▼
    │                                    │      graph_context
    │                                    ▼            │
    │                              interpreter ◄──────┘  (ruft intake-understand mit hint=graph_context)
    │                                    │
    │                                    ▼
    │                              condenser (no-op in Welle A — intake-understand schreibt selbst)
    │                                    │
    │                                    ▼
    │                              aol-callback (status: completed)
    │
    └── sonst Fallback: direkt intake-understand (heute)
```

**Warum das spec-konform ist:**
- Supabase bleibt Master, Graphiti bleibt Spiegel (mem://features/graphiti-semantik).
- Review-First bleibt unberührt — `intake-understand` schreibt weiter `proposed_facts` + `review_cases`.
- LangGraph macht nur das, wofür es da ist: Orchestrierung + Tracing (LangSmith).
- Kein Eigenbau-LLM-Pfad in Python — wir nutzen weiter Lovable AI Gateway via die existierende `agentClient.ts`.

## Konkrete Schritte (klein, prüfbar)

### S1 — `intake-understand` minimal-invasiv erweitern
Neuen optionalen Body-Parameter `graph_hint` (string, max ~4 KB) annehmen. Wenn gesetzt: in den System-Prompt der Extraction als „Bekanntes aus dem Projektgraph" einfügen. **Keine** Änderung an Scoring, Assignment, Stakeholder-Linking, dem Idempotenz-Hash. Reine Prompt-Erweiterung.
*Risiko: niedrig. Test: ohne `graph_hint` muss Output bit-identisch sein.*

### S2 — AOL-Knoten `context_loader` füllen
In `aol-service/app/graph.py`:
- `context_loader`: HTTP-Call gegen Graphiti (`/get-memory` oder `/search` mit `group_id = project_id`, `max_facts: 20`). Resultat als kompakter String in `state["graph_context"]`.
- Robust: bei Graphiti-Fehler → leerer Kontext + `state["error"]` setzen, **niemals werfen**. Run läuft weiter.

### S3 — AOL-Knoten `interpreter` füllen
Ruft via `httpx` die Edge Function `intake-understand` mit Service-Role-Auth, übergibt `asset_id`, `user_id`, `project_id`, `graph_hint=state["graph_context"]`. Antwort (proposed_facts-Anzahl, session_id) in State.

### S4 — `condenser` als No-op markieren (Welle A)
Nur `last_node` setzen. Schreiben übernimmt `intake-understand`. Kommentar `# Welle B: hier conflict/gap/dependency-Detection`.

### S5 — `aol-callback` schon vorhanden, nur prüfen
`status: completed` mit `current_node`, `facts_written`, `session_id` zurück nach Supabase (in `aol_runs`). Kein Neubau.

### S6 — Switch in `intake-trigger`
Wenn `AOL_SERVICE_URL` gesetzt → `POST {url}/aol/run` mit `AOL_SERVICE_TOKEN`. Sonst Fallback heute. **Ein** Pfad pro Asset, nie beide. Kein Schatten-Modus.

### S7 — Verifikation (manuell, du)
1. Asset hochladen → in DevLog `aol_runs` taucht auf, Status `completed`.
2. F1-Inspector „Pipeline-Trace" zeigt `graph_context` (kurzer Auszug) → `proposed_facts > 0`.
3. Confirm drücken → `canonical_facts.graphiti_uuid` gesetzt (inspect-pipeline).
4. Zweites Asset im selben Projekt → `graph_context` enthält jetzt das erste Faktum.

## Was wir bewusst NICHT tun (Schutz vor Eigenbau)

- Keine Portierung von Scoring/Assignment/Hashing nach Python.
- Keine Schreibzugriffe aus Python auf `proposed_facts` / `review_cases` (nur über Edge Functions).
- Kein Bypass von Review (kein Auto-Commit aus AOL).
- Kein Parallel-Run (keine doppelten Kosten, keine Drift).
- Keine Änderung an `commit-fact` (gerade fertig, läuft).

## Welle B (später, nicht jetzt)

`linker` (Graph-basiertes Matching statt Title), `conflict_detector`, `gap_detector`, `dependency_detector` — erst wenn Welle A produktiv stabil ist und wir echte Daten im Graph haben, gegen die Welle B arbeiten kann. Vorher hätten diese Knoten nichts, womit sie arbeiten könnten.

## Erwartete Datei-Änderungen

- `supabase/functions/intake-understand/index.ts` — `graph_hint` annehmen + in Prompt einbauen (~10 Zeilen).
- `supabase/functions/intake-trigger/index.ts` — Switch auf AOL bei vorhandenem Secret (~15 Zeilen).
- `aol-service/app/graph.py` — `context_loader` + `interpreter` mit echtem Code, `condenser` als No-op-Stub belassen.
- `aol-service/app/main.py` — keine Änderung erwartet, evtl. ENV `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` lesen für `interpreter`.
- `.lovable/plan.md` — auf Welle A aktualisieren.

## Sag „Go", dann S1 → S2 → S3 → S4 → S6, jeder Schritt einzeln verifizierbar.
