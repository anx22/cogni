

## Status-Verifikation: Was ist fertig, was muss vor Graphiti validiert werden?

### Was tatsächlich live im Code steht (verifiziert)

| Block | Status | Beleg im Code |
|---|---|---|
| **A1–A3** Verstehens-Loop | ✓ | `intake-understand` läuft, `proposed_facts` mit `delta_type`, Scoring + Assignment-Agent |
| **A4** Commit-Pfad | ✓ | `commit-fact/index.ts`: schreibt `canonical_facts` + `change_events` + `corrections` (bei Abweichung) + `project_state_snapshots` (Counts pro Tabelle), Spezialpfade `open_point`→`gap_signals`, `reference`→`dependencies` |
| **B1** ProjectScreen live | ✓ | `useProject.ts` lädt 16 Tabellen parallel + Realtime auf 15 Tabellen |
| **B2** Routing `/projekt/:id` | ✓ | `pages/Project.tsx` + Route in `App.tsx` |
| **B3** Projekt anlegen | ✓ | `Index.tsx → handleCreateProject`, `+ Neues Projekt`-Tile + Textlink in `SideGrid.tsx`, Inline-Name-Edit in `LageZone` (empty-state) |
| **C1** Voice echt | ✓ | `useVoiceRecorder.ts` + Edge Function `voice-transcribe` (Gemini 2.5 Flash, audio/webm) |
| **C2** Retry-Knopf | ✓ | `IntakeSessionsPanel.tsx`: Failed-Tiles mit `RefreshCw`-Icon und Retry-Invoke |
| **C3** HoverCard | ✓ | `IntakeSessionsPanel.tsx`: shadcn HoverCard mit Name, Typ, Größe, Datum |

**Fazit:** Block A, B und C sind **funktional vollständig** im Code. Doku (`geplant.md`, `implementierung-aktuell.md`) ist konsistent.

---

### Bekannte Schwachstellen, die ich beim Review gefunden habe

Diese sind **nicht blockierend für Graphiti**, aber es lohnt sich, sie vorher zu kennen:

1. **`useProject.ts` Z. 426–428**: `useEffect(() => load(), [load, reloadKey.current])` — `reloadKey.current` in Deps eines `useEffect` triggert nicht. Hat heute keine Auswirkung (Realtime macht den Reload), aber konzeptionell tot.
2. **`Index.tsx` Z. 331**: Header-Button "Projekte" navigiert immer zum **ersten** Projekt — kein dedizierter Projekte-Index. Akzeptabel, aber unklare Affordance.
3. **Themen-Doc-Counts (`useProject.ts` Z. 333)**: `dokumente: 0` ist hartkodiert. Themen zeigen nie Dokument-Anzahl.
4. **Dependencies V1-Self-Ref (`commit-fact.ts` Z. 201)**: `target_id: cf!.id` — Dependencies referenzieren sich selbst, weil echtes Linking fehlt. Genau das, was Graphiti lösen soll.
5. **Snapshot-Summary**: `summary` ist nur `"Snapshot nach commit:..."` — kein semantischer Lagetext. `useProject.ts` zeigt diesen Text als Hauptlage an.

---

### Was du vor Graphiti **manuell validieren** musst

Bevor wir den Knowledge-Graph aufsetzen, brauchst du Vertrauen, dass die darunterliegenden Daten stimmen. Sonst replizieren wir kaputten Zustand in den Graphen.

**Test-Lauf (10 min, ein leeres Projekt, ein Dokument):**

1. **Asset → Verstehen**
   - Klick "+ Neues Projekt" im Side-Grid → Inline-Name umbenennen
   - Datei (PDF/DOCX/EML) ablegen → erscheint im rechten Intake-Panel mit `läuft`
   - Status wechselt zu `offen` → Dialog öffnet sich automatisch
   
2. **Im Dialog**
   - **ZuordnungsBox** kommt zuerst → bestehendes Projekt wählen → bestätigen
   - Beantworte 1–2 Fakten **unverändert** → bestätigen
   - Beantworte 1 Fakt **korrigiert** (Wert ändern) → bestätigen
   
3. **DB-Check** (Lovable Cloud → SQL Editor):
   ```sql
   -- Pro frischer Commit: 1 Zeile in jedem
   select count(*) from canonical_facts where project_id = '<id>';
   select event_type, previous_value, new_value from change_events 
     where project_id = '<id>' order by created_at desc limit 5;
   select * from corrections where canonical_fact_id in (
     select id from canonical_facts where project_id = '<id>');
   select trigger_event, snapshot->'counts' from project_state_snapshots 
     where project_id = '<id>' order by created_at desc limit 3;
   ```
   - **Erwartung:** `change_events.event_type='replace'` + `corrections`-Zeile **nur** beim korrigierten Fakt
   - **Erwartung:** `project_state_snapshots` hat 3 Zeilen mit jeweils inkrementierten Counts

4. **ProjectScreen live**
   - Wechsel auf `/projekt/<id>` → Lagebild zeigt aktuelle Counts
   - Verlauf zeigt 3 Einträge mit korrekten Delta-Tags (neu, neu, ersetzt)
   - Handlungsbedarf wächst pro `open_point`/Konflikt

5. **Realtime**
   - In zweitem Tab Projekt offen lassen → in erstem Tab Datei ablegen → zweiter Tab muss **ohne Reload** updaten

6. **Edge-Cases**
   - Voice: Aufnahme starten/stoppen → Transkript erscheint → Übernehmen → Asset im Intake mit `note`-Icon
   - Asset mit `failed` Status: Retry-Klick → Status wechselt zurück auf `pending`
   - Dokument mit Umlauten im Namen → kein "Invalid key"-Fehler mehr

**Wenn alle 6 Checks grün:** Datenbasis ist sauber, Graphiti kann losgehen.

**Wenn ein Check rot:** Erst fixen, dann Graphiti — sonst speichern wir Müll im Graphen.

---

### Optionale Aufräumarbeiten vor Graphiti (1–2 Stunden)

Diese **nicht** Pflicht, aber Graphiti profitiert davon:

- **Dependencies-Linking** (commit-fact Z. 201): statt Self-Ref echtes Target auflösen — sonst landen Self-Loops im Graphen
- **Themen-Dokument-Counts** (useProject Z. 333): aus `assets.metadata.thema` aggregieren
- **Snapshot-Summary semantisch**: `intake-understand` schreibt eine 1-Satz-Zusammenfassung statt "Snapshot nach commit:..."

---

### Empfehlung

```text
1. Validierung ausführen (10 min)        ← jetzt
2. Wenn rot: Bugs fixen
3. Wenn grün: Block D = Graphiti starten
   ├─ Dependency-Linking sauber machen   (parallel, optional)
   └─ Snapshot-Summary semantisch        (parallel, optional)
```

Sag mir, welche der 6 Checks du machen willst (oder „alle"), dann gehe ich nach deinem Bericht direkt in Block D.

