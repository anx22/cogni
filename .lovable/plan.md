## Diagnose

Das gemeldete Problem ist real und größer als nur ein fehlender Refresh:

1. **Projektpanel aktualisiert nicht live**
   - `useProjects.ts` hat zwar eine Realtime-Subscription auf `projects`.
   - Die Datenbank-Publication enthält `projects` aber nicht.
   - Ergebnis: Insert/Update/Delete/Archivierung feuern im Client nie an.

2. **Projektanlage ist kein sauberer UX-Flow**
   - `+ Neues Projekt` erzeugt sofort `Neues Projekt` und navigiert weg.
   - Es gibt keine Namensfrage, keine Intent-Klärung, keinen leeren Projektzustand mit klarer nächster Aktion.
   - Das führt zu falschen/identitätslosen Projekten und Karteileichen.

3. **Overlay verletzt Kontext-Constraints**
   - Boxen können bestätigt werden, obwohl projektabhängige Voraussetzungen noch fehlen.
   - Der Backend-Commit blockt zwar teilweise mit `NEEDS_ASSIGNMENT`, aber die UI lässt den Nutzer trotzdem in falsche Reihenfolgen laufen.
   - Das Overlay braucht eine explizite Ablaufsteuerung: erst Zuordnung, dann Fakten/Antworten/Commit.

4. **Projekt-/Asset-Zustände sind nicht konsequent sichtbar**
   - Projektliste zeigt nur aktive Projekte, aber kein klares Modell für Archiv/Leer/Fehler/Sync.
   - Vorhandene Projekte wirken „nicht abgerufen“, weil Fehlerzustände und leere Zustände zu wenig unterscheidbar sind.
   - Neue Projekt- und Rename-Flows sind optimistisch/fragmentiert statt zentral kontrolliert.

5. **Projekt-Screen lädt zwar viele Tabellen live, aber nur sofern diese Tabellen in Realtime publiziert sind**
   - `useProject.ts` subscribed auf viele Tabellen.
   - In der Publication sind aktuell nur `app_settings`, `assets`, `dialog_sessions`, `proposed_facts`.
   - Damit sind Verlauf, Handlungsbedarf, Substanz und Snapshot ebenfalls nicht zuverlässig live.

## Zielbild

Die UI bekommt einen konsistenten Produktfluss:

```text
Entität
  -> Projekt wählen oder Projekt sauber anlegen
  -> Input aufnehmen
  -> Overlay ordnet/prüft in fester Reihenfolge
  -> Commit aktualisiert Projektzustand live
  -> Projektpanel und Projektscreen ziehen sofort nach
```

Keine versteckten manuellen Reloads. Keine editierbaren Folgeboxen ohne gültigen Projektkontext. Keine anonymen „Neues Projekt“-Leichen.

## Umsetzungsplan

### 1. Realtime-Fundament reparieren

Migration:

```sql
ALTER TABLE public.projects REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;
```

Zusätzlich alle Tabellen live schalten, die bereits von `useProject.ts` oder `useProjects.ts` erwartet werden:

```sql
ALTER TABLE public.canonical_facts REPLICA IDENTITY FULL;
ALTER TABLE public.change_events REPLICA IDENTITY FULL;
ALTER TABLE public.tasks REPLICA IDENTITY FULL;
ALTER TABLE public.decisions REPLICA IDENTITY FULL;
ALTER TABLE public.deadlines REPLICA IDENTITY FULL;
ALTER TABLE public.gap_signals REPLICA IDENTITY FULL;
ALTER TABLE public.dependencies REPLICA IDENTITY FULL;
ALTER TABLE public.contradictions REPLICA IDENTITY FULL;
ALTER TABLE public.outcome_signals REPLICA IDENTITY FULL;
ALTER TABLE public.topics REPLICA IDENTITY FULL;
ALTER TABLE public.project_stakeholder_links REPLICA IDENTITY FULL;
ALTER TABLE public.open_points REPLICA IDENTITY FULL;
ALTER TABLE public.feedback REPLICA IDENTITY FULL;
ALTER TABLE public.project_state_snapshots REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE
  public.canonical_facts,
  public.change_events,
  public.tasks,
  public.decisions,
  public.deadlines,
  public.gap_signals,
  public.dependencies,
  public.contradictions,
  public.outcome_signals,
  public.topics,
  public.project_stakeholder_links,
  public.open_points,
  public.feedback,
  public.project_state_snapshots;
```

Falls eine Tabelle bereits enthalten ist, wird die Migration idempotent formuliert.

### 2. Projektpanel robust machen

`useProjects.ts`:
- Fehlerzustand sichtbar zurückgeben (`error`, `reload`).
- Nach Realtime-Events debounced reloaden.
- Zusätzlich auf signalgebende Tabellen hören: `tasks`, `decisions`, `deadlines`, `gap_signals`, `contradictions`.
- Bei leerer Liste echten Empty-State zeigen, nicht nur eine einzelne Kachel.

`SideGrid.tsx`:
- Lade-/Fehler-/Empty-State klar unterscheiden.
- Nach Delete/Archive/Rename nicht auf manuelles `onChanged` angewiesen sein, sondern Realtime + optional `reload()` verwenden.
- Pagination nach Änderungen korrigieren, damit die UI nicht auf einer leeren Seite stehen bleibt.

### 3. Projektanlage als geführten Flow bauen

Statt sofort `Neues Projekt` anzulegen:
- Klick auf `+ Neues Projekt` öffnet einen ruhigen Inline-/Dialog-Composer.
- Pflichtfeld: Projektname.
- Optional: kurzer Kontext/Outcome, damit die Entität einen Anfang hat.
- Erst nach Bestätigung wird das Projekt angelegt.
- Danach Navigation auf `/projekt/:id`.

Guardrails:
- Kein leeres Projekt ohne Namen.
- Kein mehrfacher Submit während Pending.
- Enter bestätigt, Escape bricht ab.
- Neu angelegtes Projekt erscheint durch Realtime sofort im Panel.

### 4. Overlay-Ablaufsteuerung erzwingen

`DialogProvider` / `BoxRenderer` / relevante Boxen:
- Session-weiten Kontextstatus berechnen: Gibt es eine bestätigte Projektzuordnung oder ein festes `project_id`?
- Boxen, die Commit/Antwort/Faktübernahme brauchen, bleiben gesperrt, solange Projektzuordnung fehlt.
- Die Zuordnungsbox bleibt als erste aktive Entscheidung sichtbar.
- Bei gesperrten Boxen keine Fake-Editierbarkeit, sondern ruhiger Disabled-State mit Hinweis „Erst Projekt wählen“.

`ZuordnungsBox.tsx`:
- Neue-Projekt-Pfad mit Pflichtnamen.
- Kandidaten müssen echte Projekt-IDs und Namen haben; sonst werden sie nicht als wählbar angezeigt.
- Wenn keine vorhandenen Projekte geladen wurden, klarer Zustand: „Neues Projekt benennen“ statt leerer Auswahl.

`EingabeBox.tsx` und andere Commit-Boxen:
- Schreib-/Bestätigungsaktionen deaktivieren, wenn die Box fachlich noch nicht dran ist.
- Kein lokales `setState -> closeDialog`, wenn der Zustand eigentlich persistiert werden muss.

### 5. Projekt-Screen live und logisch schließen

`useProject.ts`:
- Realtime-Publication passt nach Migration; Hook kann bleiben, bekommt aber robustere Fehler-/Empty-Transitions.
- Projekt-Update selbst (`projects`) ebenfalls abonnieren, damit Rename/Status sofort im Header landet.
- Bei gelöscht/archiviert: sauber zurück zur Entität mit Toast statt kaputter Projektseite.

`ProjectScreen.tsx`:
- Empty-State als echte Arbeitsfläche: Name editieren, Input ablegen, optional Projekt löschen/archivieren.
- Name-Edit auch im `ready`-State konsistent erlauben oder bewusst zentralisieren.
- Drag/drop-Feedback bleibt projektgebunden und darf keine globale Zuordnung suggerieren, wenn `projectId` sicher ist.

### 6. UI-Basics nachziehen

Größte Basics, die ergänzt/überprüft werden:
- Rename/Delete/Archive überall mit identischem Pattern.
- Projektname nie als leerer/falscher Fallback angezeigt.
- Pending-Zustände bei Create/Rename/Delete/Reprocess.
- Fehler nicht nur Toast, sondern lokaler Wiederholen-Pfad.
- Keine Interaktion, die der aktuelle Zustand nicht erfüllen kann.
- Keine Boxen/Buttons, die visuell aktiv sind, aber backendseitig 403/blocked erzeugen.

### 7. Smoke-Test nach Umsetzung

Direkt nach Umsetzung prüfen:

1. Projekt anlegen mit Namen → erscheint sofort im linken Panel.
2. Projekt umbenennen → Tile und Projektheader aktualisieren live.
3. Projekt archivieren/löschen → verschwindet ohne Reload.
4. Neues Asset in Projekt droppen → Projekt-Screen und Panel-Signale aktualisieren.
5. Globaler Input ohne Projekt → Overlay erzwingt zuerst Zuordnung.
6. Overlay-Fakten vor Zuordnung → sind nicht editier-/commitbar.
7. Vorhandene Projekte im Overlay → Kandidaten zeigen echte Namen.
8. Gelöschtes Projekt direkt geöffnet → sauberer Redirect.

## Dateien/Orte

- Migration für Realtime-Publication
- `src/lib/project/useProjects.ts`
- `src/components/entity/SideGrid.tsx`
- `src/components/entity/ProjectTile.tsx`
- `src/pages/Index.tsx`
- `src/components/project/ProjectScreen.tsx`
- `src/lib/project/useProject.ts`
- `src/components/dialog/DialogProvider.tsx`
- `src/components/dialog/BoxRenderer.tsx`
- `src/components/dialog/boxes/ZuordnungsBox.tsx`
- `src/components/dialog/boxes/EingabeBox.tsx`
- bei Bedarf weitere Boxen mit Commit-Aktionen

## Nicht im Scope dieses Schritts

- Keine neue Informationsarchitektur außerhalb der drei Modi.
- Kein Dashboard, keine Sidebar.
- Keine Änderung an `client.ts` oder generierten Typen.
- Kein Umbau der Graphiti/RAG-Pipeline in diesem UI-Sanierungsschritt.
