# Wave-A-Verifikation + Wave-B-Rollout

## 1. Was die Daten wirklich sagen

Ich habe Live-Stand aus DB + Railway gezogen, statt der Doku zu glauben:

**aol_runs:** 3× `completed` + 1× `failed`. Aber: alle drei „completed" tragen im `error`-Feld
`AOL 403: {"detail":"Ungültiger Token"}`. Der `intake-trigger` markiert den Run als
completed, weil der Legacy-Fallback (ohne `graph_hint`) durchläuft — der AOL-Call selbst
schlägt aber fehl. **graph_context erreicht `intake-understand` nie.**

**canonical_facts:** 7 Zeilen, **0** mit `graphiti_uuid`. Der Graphiti-Mirror in
`commit-fact` schreibt nichts zurück (oder erreicht den Service nicht).

**Console:** zusätzlich `langsmith error 403 Forbidden` aus einer Edge Function — gleiches
Symptom-Cluster: Token rottet/divergiert.

**Fazit:** Wave A ist deployt, aber **funktional inaktiv**. Reuse-Check unmöglich ohne
gefüllten Graph. Wave B würde auf einem leeren Graphen aufsetzen → kein Effekt.

## 2. Reihenfolge: Erst A-Fix, dann B

### Block A-Fix — Wave A scharf stellen

**A.1 — AOL-Token-Sync**

- Railway `aol-service` hat `AOL_SERVICE_TOKEN = ea945af7…`
- Supabase-Edge-Secret `AOL_SERVICE_TOKEN` muss exakt gleich sein
- Per Vergleich/Update angleichen (railway-admin + Supabase-Secrets), keine User-Aktion

**A.2 — Graphiti-Mirror reparieren**

- `commit-fact` direkt aufrufen mit Test-Fakt → `_shared/graphiti.ts`-Logs lesen
- Wahrscheinliche Ursachen prüfen: `GRAPHITI_SERVICE_URL` (Public-Domain
`graphiti-production-24c0.up.railway.app` — korrekt), `GRAPHITI_SERVICE_TOKEN`
Sync zwischen Cloud und Railway, Health-Check `GET /healthcheck`
- Falls Graphiti selbst 403/500 wirft: `graphiti`-Service-Logs via railway-admin ziehen
- Nach Fix: ein Commit erzeugt `graphiti_uuid` in `canonical_facts` ✓

**A.3 — LangSmith-Token**

- `LANGSMITH_API_KEY` in Supabase und Railway abgleichen, sonst Tracing tot
- Optional: in `aol-service/app/main.py` Tracing-Call hart machen oder bei 403 silent skip

**A.4 — Reuse-Check fahren**

- Test-Asset 1 in Test-Projekt → AOL läuft, Mirror schreibt UUID
- Test-Asset 2 ins selbe Projekt → `context_loader` liefert nicht-leeren Context
- `proposed_facts.delta_type` enthält `confirm` für überlappende Fakten

**Abnahmekriterien Wave A (hart):**

- `aol_runs.error IS NULL` für letzten Run
- `canonical_facts.graphiti_uuid IS NOT NULL` für jeden frischen Commit
- AOL liefert beim 2. Asset im selben Projekt `graph_context.length > 0`

### Block B — Wave B implementieren

Erst nach grünem Reuse-Check. Pipeline wird von

```text
router → context_loader → condenser → END
```

zu

```text
router → context_loader → interpreter → linker → conflict_detector
                                      → gap_detector → dependency_detector
                                      → condenser → END
```

**B.1 — `interpreter`-Knoten**

- Nimmt rohen Text + `graph_context`, ruft Lovable AI Gateway (gleiche Tool-Calls wie
`intake-understand` heute, aber Python-seitig) → strukturierte Fakt-Kandidaten als
internes Format (kein Schreiben).

**B.2 — `linker**`

- Pro Kandidat: Graphiti `POST /search` mit `group_id=project_id`, Top-K=5.
- Match-Score über Embedding-Distance + Typ-Filter.
- Treffer → `linked_uuid` am Kandidat. Kein Match → `linked_uuid=null`.

**B.3 — `conflict_detector**`

- Für gelinkte Kandidaten: Vergleich Content vs. existierenden Knoten.
- Konflikt-Output: `{candidate, existing_uuid, kind: 'value'|'time'|'scope'}`.
- Wird als Annotation im `graph_context`-Output mitgegeben → in `intake-understand`
fließt es als 3. System-Message ein → erzeugt `delta_type='conflict'` direkt im
ersten `proposed_fact`.

**B.4 — `gap_detector**`

- Heuristik: erwartete Kanten pro `fact_type` definieren (z. B. `decision` braucht
`made_by`, `applies_to`).
- Fehlende Kante am gelinkten Knoten → Gap-Annotation für Dialog-Overlay
(`gap_box` ist im Enum schon vorhanden).

**B.5 — `dependency_detector**`

- Traversiere Graphkanten ab `linked_uuid` Tiefe 2. Liefert verwandte UUIDs +
Beziehungstyp. Annotation für UI/Substanz.

**B.6 — Vertrag `/aol/run` erweitert**

- Output zusätzlich: `links[]`, `conflicts[]`, `gaps[]`, `dependencies[]`.
- `intake-trigger` reicht alles als strukturierte Annotation an `intake-understand`.
- Backward-kompatibel: Felder leer = wie heute.

**B.7 — Wiring & Telemetrie**

- `aol_runs` bekommt Spalten/JSON für Knoten-Latenzen (oder weiter im `error`/`trace`
JSON ablegen — minimal-invasiv).
- LangSmith-Traces pro Knoten aktiv (sobald A.3 sitzt).

**Abnahmekriterien Wave B:**

- `linker` matcht reproduzierbar bei zwei semantisch gleichen Eingaben
- `conflict_detector` erkennt Werteänderung → erzeugt `delta_type='conflict'`
- `gap_detector` markiert mind. eine bekannte Lücke pro Test-Szenario
- Keine Regressionen: Legacy-Fallback (ohne AOL-Secrets) funktioniert weiter

## 3. Bewusst NICHT in dieser Welle

- Kein Schreibzugriff aus Python → `proposed_facts`/`canonical_facts` bleiben Cloud-only
- Kein Auto-Commit
- Kein Ersatz des lexikalischen Scorings — `linker` ergänzt, nicht ersetzt (vorerst)
- Kein neues UI; bestehende Box-Typen reichen (`gap_box`, Konflikt-Marker existieren)

## 4. Doku-Update danach

- `docs/implementierung-aktuell.md`: Welle A grün + Welle B live
- `docs/geplant.md`: Phase 10b Häkchen, Phase 10c (z. B. Graph-Pruning, Re-Embedding)
als nächste Backlog-Position
- `.lovable/plan.md`: Sprint-Stand neu schreiben

---

**Start mit A-Fix?** Sag „los" — ich gehe Token-Sync → Mirror-Test → Reuse-Check der Reihe
nach durch und zeige dir nach jedem Schritt das Ergebnis aus der echten DB/Railway, bevor
ich Wave B anfasse.  
  
  
Bitte Langgraph check anschliessen. erkläre mir simpelll den AOL... ich habe den Verdacht.. das wir diesen noch nich vollstaendig aufgebaut und angebunden haben