# Phase F2 — Phase 10 echt einschalten

F1 (Inspectors) steht. Jetzt der eigentliche Kern: die LangGraph-Knoten produktiv machen und endlich in Graphiti schreiben.

## 0. Vorab-Fix (5 Min, kommt zuerst)

Die runtime errors zeigen: `GRAPHITI_SERVICE_URL` ist ohne `https://` gespeichert → jeder Graphiti-Aufruf bricht mit *„Invalid URL"*. Ich härte `_shared/graphiti.ts` so, dass fehlendes Schema automatisch ergänzt wird, und logge eine klare Warnung. Zusätzlich frage ich dich (per `update_secret`-Tool), das Secret korrekt zu setzen — das siehst du als kleinen Klick.

## 1. AOL-Knoten füllen (`aol-service/app/graph.py`)

Aktuell sind alle 10 Knoten Stubs. Ich aktiviere sie in zwei Wellen:

**Welle A — Minimal-Pfad (router → context_loader → interpreter → condenser):**

- `context_loader` ruft Graphiti `/search` mit `group_id=project_id`, lädt letzten Snapshot über Supabase-RPC.
- `interpreter` ruft Lovable AI Gateway (`google/gemini-2.5-flash`), portiert den Prompt aus `src/lib/agentConfig.ts`, gibt `candidates[]` zurück.
- `condenser` ruft `aol-callback` → schreibt `proposed_facts` + `aol_runs.completed`.

**Welle B — Volle Logik (linker, delta, gap, dependency, conflict, case_builder):**

- Portiert die bestehende Logik aus `intake-understand` 1:1 als LangGraph-Nodes (kein Re-Design, nur Strukturwechsel).
- Jeder Knoten loggt nach LangSmith via `LANGCHAIN_TRACING_V2=true` — sichtbar im F1-Inspector.

## 2. Graphiti-Schreibpfad (Commit-Schritt)

Heute bleibt `canonical_facts.graphiti_uuid` immer NULL. Ich erweitere `commit-fact`:

- Nach erfolgreichem Insert in `canonical_facts` → `Graphiti.addMessage({ project_id, content: fact_summary, role_type: "system", source_description: "canonical_fact:<id>" })`.
- Rückgabe-UUID landet in `canonical_facts.graphiti_uuid`.
- Fehler werden in `change_events.metadata.graphiti_error` festgehalten — Commit selbst bleibt erfolgreich (Supabase = Master, Graphiti = Spiegel).

## 3. Sauberer Umschalter

In `intake-trigger`:

```ts
if (Deno.env.get("AOL_SERVICE_URL")) → Railway-Pfad (POST /aol/run)
else → bestehender intake-understand-Pfad
```

So bleibt nichts kaputt, falls Railway down ist. Heute ist der Schalter nominal da, aber der Railway-Pfad liefert nur den Stub — nach F2 liefert er echte Ergebnisse.

## 4. UI-Sichtbarkeit (minimal)

- `RecentAssetsHoverCard` zeigt zusätzlich `aol_runs.current_node` + `last_error`. Kein neues Panel, nur 2 Zeilen Status.
- Im F1-Inspector funktioniert „Pipeline-Trace" jetzt End-to-End (heute zeigt er nur Supabase-Daten, nach F2 sieht man die echten Knoten-Übergänge in `aol_runs.events`).

## 5. Verifikation (mache ich automatisch)

Nach Deploy ziehe ich für ein Test-Asset folgenden Trace und zeige ihn dir:

1. `inspect-pipeline` → asset hat `proposed_facts > 0`
2. `inspect-langsmith` → alle 10 Knoten haben Trace-Einträge
3. `inspect-graphiti` → `/search` findet die Episode mit `group_id=projekt-id`
4. `canonical_facts.graphiti_uuid IS NOT NULL` per `read_query`

Wenn einer der vier Schritte rot ist, fixe ich gezielt — kein Halluzinieren, nur das, was die Inspectors sagen.

## Was bewusst NICHT drin ist

- Kein Polish an Entity, FacePill, Side-Grids, Voice. Wenn dir konkret etwas auffällt → punktuell.
- Kein neues UI-Panel. Status fließt in bestehende Komponenten.
- Kein Schema-Change (Tabellen + Spalten existieren alle, nur die Felder werden endlich befüllt).

## Was du tun musst

1. Klick „Implement plan".
2. Wenn ich `update_secret` für `GRAPHITI_SERVICE_URL` aufrufe → den richtigen Wert mit `https://` einfügen (Railway-URL aus deinem Graphiti-Service, oben in der Railway-Übersicht).
3. Sonst nichts. Ich liefere am Ende einen End-to-End-Trace eines Test-Assets als Beweis, dass es echt läuft.

## Spec-Abgleich

- `docs/produkt-gesamt.md` §4: Datenfluss App→Supabase→Graphiti — F2 schließt den Graphiti-Teil.
- `docs/input/07-09…` §7.1: „Graph nie als Wahrheit" — Graphiti wird **nach** Commit beschrieben, Supabase bleibt Master.
- `mem://features/produkt-prinzipien`: Provenance + Delta — `delta_type` bleibt unverändert, nur die Knoten produzieren ihn jetzt selbst.
- `mem://features/entscheidungen`: „Graphiti gesetzt" — F2 löst das ein.  
  
  
überprüfe anschliessend nochmal ob du auf alle relevanten vorgägne zugriff hast und transparent für dich ist.  
Prüfe double checked unsere Core LOGICs... wir sind nun am MAGIC CORE unserer app idee. Knowledge Graph, temporales Gedächtnis, advanced RAG und vector retrievals... stelle sicher das wir hier präzise arbeiten keine fehler machen, best practices nutzen, Docs validieren, nicht halluzinieren.