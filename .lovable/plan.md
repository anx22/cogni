# Docs-Refresh: AOL Welle A + Graphiti-Mirror einarbeiten

## Ausgangslage

Die letzten Stunden brachten substanzielle Backend-Änderungen, die in `docs/` nirgends auftauchen:

- **commit-fact** spiegelt Fakten nach Graphiti (URL-Härtung, async `/messages`, Client-UUID, `graphiti_uuid` zurück nach `canonical_facts`)
- **AOL-Service auf Railway** als Kontext-Provider (LangGraph, Knoten: `router → context_loader → condenser → END`)
- **Welle A**: `intake-trigger` holt `graph_context` aus AOL und reicht ihn als `graph_hint` an `intake-understand`; `_shared/agentClient.ts` hängt den Hint als zweite System-Message vor den User-Text (4 KB Limit)
- **Besitzschnitt**: Railway hat KEINEN Service-Role-Key, KEINEN DB-Zugriff. Alle Schreibpfade bleiben in Lovable Cloud.

Gleichzeitig sind Teile der Docs überholt:
- `implementierung-aktuell.md` endet bei „Phase 6 als nächster Schritt", obwohl Phasen 6–9 längst durch sind
- `geplant.md` führt Phase 10 (Knowledge-Graph) als offen, obwohl Welle A live ist
- `produkt-gesamt.md` schreibt „Graphiti vs. Cognee — Entscheidung offen", obwohl die Entscheidung längst auf Graphiti gefallen ist (siehe `mem://features/entscheidungen`)
- `.lovable/plan.md` ist ein Sprint-Snapshot von heute Mittag, der bereits überholt ist (referenziert Knoten, die so nicht mehr existieren)

## Zielbild

Drei kanonische Doku-Files mit klaren Rollen, plus ein gepflegter Sprint-Notizblock:

```text
docs/produkt-gesamt.md       Vision + Modell + Stack (langlebig, selten geändert)
docs/implementierung-aktuell.md    Was steht heute, mit Datenfluss-Schaubild
docs/geplant.md              Roadmap nach vorn, abgeschlossene Phasen knapp
.lovable/plan.md             aktueller Sprint, immer aktuell
```

## Änderungen im Detail

### 1. `docs/produkt-gesamt.md`
- **Techstack-Abschnitt** aktualisieren: Graphiti ist gesetzt, Cognee gestrichen. AOL-Service (Railway, LangGraph) als vierter Baustein einführen mit Ein-Satz-Beschreibung des Besitzschnitts (Railway = Kontext, Cloud = Schreiben).
- **Intelligenz-Pipeline** (Schritte 1–7): Schritt 3 „Extraction" um den Hinweis ergänzen, dass vorab ein Graph-Kontext geladen wird (Welle A). Schritt 6 „Commit" um den Graphiti-Spiegel ergänzen.
- Rest unverändert (Vision, Rollen, Designhaltung sind stabil).

### 2. `docs/implementierung-aktuell.md`
- **Status-Header** auf „Phase 0–9 abgeschlossen + Welle A (Graph-Enrichment) live" ziehen.
- **Neuer Abschnitt „Backend-Architektur"** mit ASCII-Datenflussbild:
  ```text
  Asset ─► intake-trigger ─► AOL /aol/run (Railway)
                              └─ context_loader → Graphiti /get-memory
                              └─ liefert graph_context
                          ─► intake-understand (graph_hint)
                              └─ Lovable AI Gateway, Tool-Calling
                              └─ proposed_facts + review_cases
                          ─► User-Review ─► commit-fact
                              └─ canonical_facts + change_events
                              └─ Graphiti /messages (async, Client-UUID)
                              └─ graphiti_uuid zurückgeschrieben
  ```
- **Komponenten-Inventar** um Edge-Functions/Services ergänzen: `intake-trigger`, `intake-understand`, `commit-fact`, `_shared/agentClient.ts`, `_shared/graphiti.ts`, `aol-service/`.
- **Bekannte Phase-4-Aufhängungen** bleiben (sind noch gültig).
- **Nächster Schritt** auf „Welle B (linker, conflict, gap, dependency)" umformulieren.

### 3. `docs/geplant.md`
- Phase 10 in zwei Stufen splitten:
  - **Phase 10a — Welle A (Graph-Enrichment) ✓** mit Stichpunkten zu `context_loader`, `graph_hint`, Graphiti-Mirror in commit-fact
  - **Phase 10b — Welle B (offen)**: linker gegen Graph statt Title-Match, conflict_detector, gap_detector, dependency_detector zwischen interpreter und condenser
- „Erledigte Phasen" am Fuß um Phase 7.6, 8, 9, 10a ergänzen.
- „Nicht in V1"-Liste unverändert.

### 4. `.lovable/plan.md`
- Komplett ersetzen durch knappen aktuellen Sprint-Stand: Welle A deployt, Graphiti-Mirror läuft, offene Aufgabe = Verifikation am zweiten Asset im selben Projekt (Reuse-Check) und Vorbereitung Welle B.
- Verifikationsschritte und „Was bewusst NICHT gemacht wurde" beibehalten — die sind noch gültig und schützen vor Wieder-Diskussionen.

### 5. `docs/input/veraltet/`
- Falls dort noch lebende Inhalte stehen, die in keinem der drei kanonischen Files referenziert sind: nicht anfassen. Verzeichnis ist als Archiv markiert. Nur prüfen, nichts verschieben.

## Was bewusst NICHT geändert wird

- Memory unter `mem://` (separater Lebenszyklus, ist aktuell)
- `README.md` (3 Zeilen, irrelevant)
- `aol-service/README.md` (wurde heute schon mit angepasst)
- Source-Code (das ist eine reine Doku-Aufgabe)

## Reihenfolge der Edits

1. `produkt-gesamt.md` — Techstack + Pipeline
2. `implementierung-aktuell.md` — Statusblock + Architektur-Diagramm + Komponenten
3. `geplant.md` — Phase 10 splitten + Erledigt-Liste verlängern
4. `.lovable/plan.md` — Sprint-Reset

Vier sequentielle, kleine Edits. Keine parallelen Schreibvorgänge auf dieselben Files.
