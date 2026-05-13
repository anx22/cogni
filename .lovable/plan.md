# F2 — Stand + ehrliche Architekturfrage vor AOL-Welle A

## Was bisher gebaut (heute)

**1. Graphiti-URL-Härtung** (`supabase/functions/_shared/graphiti.ts`)
- `normalizeBase()` ergänzt fehlendes `https://` automatisch + Warn-Log.
- `addMessage()` neu typisiert: gibt `{ uuid, queued: true }` zurück, weil der
  Server nur HTTP 202 + Worker-Queue liefert (keine Server-UUID im Response).
  Doku-Block dokumentiert die Async-Semantik direkt im Code.

**2. Graphiti-Schreibpfad scharf** (`supabase/functions/commit-fact/index.ts`)
- Nach erfolgreichem `canonical_facts`-Insert: `mirrorToGraphiti()` ruft
  `addMessage` mit client-generierter UUID, schreibt diese in
  `canonical_facts.graphiti_uuid`.
- Fehler werden in `canonical_facts.provenance.graphiti_error` festgehalten
  (Read-Modify-Write), niemals geworfen — Supabase bleibt Master.
- Episode-Body als lesbare Zeile (`title — key: val · key: val`) damit Graphiti
  Entitäten/Edges sauber extrahieren kann.

**3. UI-Statusrückmeldung** (`src/components/entity/RecentAssets.tsx`)
- Klick auf ein Asset lädt jetzt zusätzlich den letzten `aol_runs`-Eintrag und
  zeigt `status · current_node` und ggf. `error.message` in der Toast-Beschreibung.

**4. Memory:** `mem://features/graphiti-semantik` dokumentiert den Vertrag.

---

## Offene ehrliche Architekturfrage (vor AOL-Welle A)

Als ich `intake-understand` (482 Zeilen) und `aol-service/app/graph.py` genau
gelesen habe, ist klar geworden: **eine 1:1-Portierung der bestehenden Logik
nach Python wäre Code-Duplikation ohne Mehrwert** — und genau das, wovor du mich
gewarnt hast.

`intake-understand` enthält sorgfältig getunte Logik, die nirgends besser
aufgehoben ist:
- deterministische `extraction_run_id` (SHA-256-Hash für Idempotenz)
- Projekt-Scoring (lexikalisch + Agent-Tie-Breaker, zwei Schwellen)
- Assignment-Box als Sonderfall mit Fallback-Kaskade für Projektnamen
- Stakeholder/Topic-Linking gegen `canonical_facts`

**Drei mögliche Architekturen für AOL — du musst entscheiden:**

### Option A — AOL als Enrichment-Schicht ÜBER intake-understand (mein Favorit)
LangGraph macht das, wofür es gebaut wurde: Orchestrierung, Tracing, Retries.
Knoten:
1. `context_loader` → Graphiti.search holt vorhandenes Wissen aus dem Projekt-Graph
2. `interpreter` → ruft die bestehende Extraction-Logik aus `agentClient.ts`,
   reicht aber den Graph-Kontext mit (besseres Linking gegen bekannte Entitäten)
3. `condenser` → ruft `intake-understand` mit den Kandidaten auf statt erneut
   zu extrahieren — minimaler Refactor in `intake-understand`, der die Extraction
   überspringt wenn Kandidaten mitgegeben werden.

**Vorteil:** ein Pfad, eine Logik, LangGraph nur als Wrapper für Beobachtbarkeit.
**Aufwand:** klein. Risiko: niedrig.

### Option B — AOL übernimmt vollständig, intake-understand wird abgeschaltet
Komplette Portierung der 482 Zeilen nach Python. Zwei Pipelines werden zu einer.

**Vorteil:** sauberer, eine Codebasis.
**Aufwand:** hoch (1-2 Sessions). Risiko: getestete Logik wandert in neuen
Code, Drift gegen aktuelle App-Verträge wahrscheinlich.

### Option C — AOL bleibt parallel als Schatten-Pipeline
Beide Pfade laufen gleichzeitig, Ergebnisse werden verglichen, später wird
abgeschaltet. **Aufwand:** mittel. Risiko: doppelte Kosten, doppelte Wartung,
Inkonsistenz-Bugs.

---

## Empfehlung

**Option A.** Sie respektiert das Prinzip „nicht doppelt bauen", nutzt LangGraph
für seinen eigentlichen Zweck (Orchestrierung + Observability), und erlaubt es
uns, den Knowledge-Graph-Kontext genau dort einzuspeisen, wo er Wirkung hat
(im Extraktions-Prompt). Die Welle B (linker, conflict, gap, dependency) wird
später deutlich kleiner, weil viel davon schon im AOL-Kontext entsteht.

Sag mir A, B oder C, dann baue ich. Bis dahin Stop — ohne deine Entscheidung
würde ich raten, und das war ja ausdrücklich nicht erwünscht.

---

## Verifikation der heutigen Änderungen

Sobald du das nächste Faktum bestätigst (irgendeinen Confirm-Button drückst):
- `inspect-pipeline` → das committed `canonical_facts` sollte `graphiti_uuid` haben
- `inspect-graphiti` → search mit Projekt-ID liefert die Episode (kann ein paar
  Sekunden dauern wegen Worker-Queue)
- Bei Fehlern: `canonical_facts.provenance.graphiti_error` zeigt Klartext

Falls `GRAPHITI_SERVICE_URL` ohne `https://` gespeichert ist, fängt die Härtung
das ab — du musst nichts tun.
