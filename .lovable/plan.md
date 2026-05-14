## Ziel

Einmal lückenlos validieren, dass die Kern-Innovation **end-to-end** funktioniert: Eingehender Inhalt wird verstanden, in atomare Fakten zerlegt, vom User reviewt, kanonisch geschrieben, in den Knowledge Graph gespiegelt und ist über RAG semantisch auffindbar. Jeder Bruch wird sofort gefixt.

## Vorgehen — drei Phasen

### Phase A — Bestandsaufnahme & Pre-Flight (read-only)

Auf Basis echter Daten den IST-Zustand jeder Schicht messen. Keine Spekulation.

1. **Service-Health** (Railway API): `aol-service`, `graphiti`, `neo4j` — Deploy-Status, letzte Logs, Restart-Counts.
2. **Token-Matrix** (`railway-admin diagnose`): Supabase ↔ Railway Sync von `AOL_SERVICE_TOKEN`, `GRAPHITI_SERVICE_TOKEN`, `LANGSMITH_API_KEY`, `OPENAI_API_KEY`, `GRAPHITI_SERVICE_URL`.
3. **DB-Inventur**: Wie viele assets, parsed_documents, sources, proposed_facts, review_cases, canonical_facts, aol_runs, graphiti_sync_log. Fehlanzeige in `graphiti_sync_log` (0 Zeilen) klären.
4. **Graph-Inventur** (Neo4j Cypher direkt): Episodic-/Entity-Counts, Edge-Typen, Per-Project-Breakdown.
5. **Mirror-Konsistenz**: Anzahl `canonical_facts.graphiti_uuid IS NOT NULL` vs. Episodic-Nodes in Neo4j → Drift erkennen.

### Phase B — Synthetischer End-to-End-Smoke

Ein eigenes, kontrolliertes Asset durch jede Stufe schicken und nach jeder Stufe verifizieren. So weiß ich, **wo** etwas bricht — nicht nur **dass**.

1. **Test-Projekt** anlegen oder existierendes „smoke" wiederverwenden.
2. **Test-Asset** als Text/E-Mail injizieren (kontrolliert: bekannte Personen, eine Frist, ein Widerspruch zu einem bestehenden Fakt) → in `assets`-Tabelle und Storage.
3. **`intake-trigger`** aufrufen → erwarten: `parsed_document` + `source` + AOL-Run gestartet.
4. **AOL-Lauf abwarten** → erwarten: 5–8 `proposed_facts`, mind. ein `delta_type=contradiction`. LangSmith-Trace prüfen (Prompt-Version sichtbar).
5. **Review-Cases** → erwarten: korrespondierende Boxen mit `priority` und Kontext.
6. **`commit-fact`** für ausgewählte Cases → erwarten: `canonical_facts` neu, `change_events` befüllt, alter Fakt `valid_until` gesetzt bei Widerspruch.
7. **Mirror**: nach Commit erwartet `graphiti_uuid` befüllt, `graphiti_sync_log` Eintrag mit `status=success`. Falls 0 Sync-Log-Einträge: Mirror-Pfad debuggen.
8. **Graphiti** `/episodes/{project}` → Episode mit `source_description=canonical_fact:<id>` sichtbar.
9. **Neo4j** Cypher: Entity-Extraction durch (Personen + Organisation als Entity-Knoten, MENTIONS-Edges).
10. **RAG**: `inspect-graphiti search` mit semantischer Query → Treffer enthalten unsere Test-Entities, Score plausibel.
11. **Reverse-Lookup**: Aus Graphiti-Treffer zurück zur `canonical_facts.id` (über `source_description`) → Provenance-Kette schließt sich.

### Phase C — Real-Asset-Lauf (User triggert)

Sobald neue User-Assets eintreffen (an Uhrzeit erkennbar), **gleiches Verifikations-Skript** auf die echten Runs anwenden. Findings:

- Wenn AOL Mist extrahiert → Prompt im LangSmith Hub editieren, Cache busten, gleicher Asset re-prozessieren ohne Deploy.
- Wenn Mirror nicht greift → `test-mirror` mit `wait_ms` zur Isolation.
- Wenn Entity-Extraction in Neo4j fehlt → Graphiti-LLM-Config & OpenAI-Key prüfen.
- Inkonsistenzen werden als gap_signals/contradictions in der App sichtbar — auch das wird durchgespielt.

## Findings-Loop

Jeder Bruch wird sofort als Mini-Iteration behandelt: identifizieren → fixen (Code/Prompt/Config) → re-testen → grün abhaken. Liste wird transparent geführt.

## Erwartetes Ergebnis nach Phase C

Eine **belegte** Aussage pro Schicht: „funktioniert / funktioniert teilweise / kaputt — und was getan wurde". Plus eine kurze Bewertung, wo die App produktreif ist und wo noch Lücken sind.

## Technische Details (für später)

- Tools: `railway-admin` (logs, raw, test-mirror, diagnose, graphiti-probe), `inspect-pipeline`, `inspect-graphiti`, direkter Cypher gegen `neo4j-production-f0d9.up.railway.app`, `supabase--read_query`, `supabase--analytics_query` für Edge-Function-Logs.
- Kein neues Schema, keine neuen Secrets nötig.
- Test-Asset wird nach Verifizierung markiert (`metadata.smoke_test=true`), bleibt als Referenz erhalten.
- LangSmith-Traces werden pro Stufe per `prompt_version`-Tag korreliert.
