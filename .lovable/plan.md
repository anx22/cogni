## Diagnose

Die Kritik ist berechtigt. Der aktuelle Stand ist an mehreren Stellen konzeptuntreu:

- **Sprache driftet in interne Pipeline-Begriffe**: „Verstehens-Loop“, „Intake“, „rekonstruiert“, „Verstanden“, `Gap #…`, `Konflikt #…`, `Dependency #…` stehen sichtbar im UI. Das ist Maschinenprotokoll, keine Projektsprache.
- **Projekt-Detail ist zu listenhaft**: Handlungsbedarf/Verlauf/Substanz zeigen teils Datenbank-Spuren statt nutzbarer Projektlage. Besonders Substanz/Dokumente sind noch zu roh.
- **Interaktion ist falsch generalisiert**: Viele Klicks öffnen denselben Review-/Kontext-Overlay-Typ. Das erzeugt Arbeit statt Klarheit.
- **Drilldown-Logik existiert teilweise, wird aber nicht konsequent genutzt**: Konflikt-Drill ist in `FaktDrillOverlay` vorhanden, aber Listenklicks bauen oft generische Sessions statt spezifische Konflikt-/Lücken-/Dokument-Flows.
- **Popup/Overlay-Theme ist inkonsistent**: shadcn Dropdown/Dialog/AlertDialog nutzen teils HSL-Token, teils Cogni-Hex-Token-Brücken. Dadurch entstehen transparente/halb lesbare Flächen wie im Screenshot.
- **Lage ist inhaltlich falsch befüllt**: Snapshot-Summary wie „Termin übernommen …“ wird als Lagetext gerendert. Das gehört in Verlauf, nicht in Lage.

## Zielbild dieses Sprints

Ein gehaltvoller UX-Schnitt, der den Prototyp als hilfreiches Projektwerkzeug spürbar nach vorn bringt:

1. Projekt-Screen zeigt **Projektzustand**, nicht Pipeline-Log.
2. Klicks öffnen **passende Arbeitsräume**, nicht immer denselben Review-Screen.
3. Sichtbare Sprache ist **menschlich, fachlich, knapp**.
4. Substanz/Dokumente wirken wie **gestaltete Wissensfläche**, nicht wie nackte Tabellen.
5. Popups/Overlays sind **kontrastreich und lesbar**.

## Umsetzung in einem Rutsch

### 1. Sichtbare Sprach-Sanierung

Ich baue eine kleine UI-Semantik-Schicht statt überall Einzelstrings zu verstreuen:

- Interne Labels ersetzen:
  - „Intake“ → „Eingang“ / „Material“
  - „Verstehen“/„Verstehens-Loop“ → „Auswertung“ / „Analyse“ / „wird ausgewertet“
  - „Verstanden“ im Lage-Meta → „Letztes Material“ oder „Aktualisiert“
  - „Review“ wo user-facing → „Prüfen“ / „Offene Klärung“
  - „Erkenntnis“ in Dialog-Buttons nur dort, wo fachlich sinnvoll; sonst „Punkt“, „Information“, „Änderung“
- Technische Quellenlabels entfernen:
  - `Gap #abc123`, `Konflikt #abc123`, `Dependency #abc123`, `Thema #…`, `Dokument #…`
  - stattdessen fachliche Quelle: „Offene Frage“, „Widerspruch“, „Abhängigkeit“, „Thema“, „Dokument“
- Command-Menü und Home-Panels ebenfalls säubern (`Pipeline Health`, `IntakeSessionsPanel`, `ImpactPipelinePanel`).

### 2. Lage reparieren: kein Verlaufssatz mehr als Lageplan

In `buildProjectViewModel`/`humanizeSnapshotSummary` wird die Lage nicht mehr aus Commit-Log-Sätzen übernommen.

Neue Priorität:

```text
Outcome/Status + Konflikte + offene Punkte + nächster Termin
→ prägnanter Lage-Satz
→ Snapshot-Summary nur, wenn sie wirklich ein Zustands-Summary ist
→ Commit-Summary bleibt Verlauf
```

Beispiel statt „Termin übernommen — Projekt enthält jetzt 11 bestätigte Erkenntnisse.“:

```text
Final Lookbook ist blockiert: Termin widerspricht sich, Verantwortlichkeit fehlt, Stoffauswahl hängt daran.
```

Falls die Daten nur dünn sind:

```text
Projekt ist angelegt. Material ergänzen, damit Lage, offene Punkte und Abhängigkeiten sichtbar werden.
```

### 3. Projekt-Detail nach Redesign-Referenz schärfen

**Handlungsbedarf** bleibt die operative Hauptspalte, wird aber weniger Datenbankliste:

- rechte technische Quellen-ID weg
- Typen menschlich als leise Fachlabels
- Konflikte bekommen direkte Gegenüberstellung im Row-Preview, wenn `faktA/faktB` vorhanden
- Lücken zeigen „was fehlt / warum wichtig“ statt Gap-Sprache
- Abhängigkeiten zeigen Quelle/Ziel als Lesetext, nicht `Dependency #…`

**Verlauf** wird bewusst read-only und enttechnisiert:

- Quelle „Verstehens-Loop“ weg
- Delta-Tags fachlich: „neu“, „aktualisiert“, „bestätigt“, „widerspricht“
- Klick auf Verlauf öffnet höchstens eine kompakte Detailansicht oder wird nicht als primäre Aktion inszeniert; kein Review-Arbeitsraum für reine Historie.

### 4. Substanz & Dokumente als gestaltete Wissensfläche

`SubstanzSection` wird am Redesign-Prototyp ausgerichtet:

- Themen als größere, ruhige Karten mit:
  - Titel
  - Kurzbeschreibung
  - lesbare Zähler: „3 Entscheidungen“, „2 offen“, „1 Dokument“
  - sichtbare letzte/erste verknüpfte Items als Mini-Zeilen
- Dokumente als gestaltete Dokumentkarten/-rows mit:
  - Dateityp-Chip
  - Name
  - Datum/Version leise
  - Thema, wenn vorhanden
  - kein Vollscreen-Review bei normalem Klick; stattdessen kompakter Dokument-Drill/Preview-Stub mit klarer Phase-Markierung, bis echte Preview-Backendlogik existiert.

### 5. Drilldown-Routing nach Objekttyp

Ich ändere die Click-Logik so, dass nicht alles generisch `buildHandlungsbedarfSession` öffnet:

- `konflikt` → großer `FaktDrillOverlay`-Konflikt mit A/B-Gegenüberstellung.
- `gap` / fehlende Angaben → Gap-Drill mit konkretem Antwortfeld.
- `dependency` → Abhängigkeits-Drill: „blockiert / wartet auf / hängt ab von“, mit Antwort/Korrektur.
- `entscheidung` / `aufgabe` / `offener_punkt` → kompakter Arbeitsraum mit „kommentieren“, „ändern“, „als erledigt/weiter offen“ soweit Backend vorhanden; nicht vorhandene Persistenz wird im UI als „kommt im Antwort-Loop“ markiert, nicht als Fake-Funktion.
- `dokument` / `thema` → Inspect-Drill, nicht Review-Drill.

Technisch: zusätzliche Factory-Builder in `sessionFactories.ts`, aber keine neue Backend-Tabelle in diesem Sprint.

### 6. Interaktive Möglichkeiten ohne Fake-Backend

Wo Persistenz bereits existiert (`submitNote` → volle Auswertung), werden Antworten/Korrekturen darüber geleitet.

Wo Persistenz noch fehlt, wird es klar als geplanter Antwort-Loop gekennzeichnet:

- „Kommentar speichern“ nur, wenn es wirklich durch `submitNote` läuft.
- „Status ändern“/„Dokumentversion wählen“ nur anzeigen, wenn Backendpfad existiert.
- Sonst: ruhiger Hinweis „Antwort-Loop M3“ innerhalb des Drills, nicht als kaputter Button.

### 7. Popups/Overlays lesbar machen

Ich ziehe die shadcn Overlay-Primitiven auf Cogni-Token-Niveau:

- `DialogContent`, `AlertDialogContent`, `DropdownMenuContent`, `CommandDialog`
- solide `surface-1/surface-2` Hintergründe
- klare Hairline-Borders
- kein transparentes Weiß/Glas über hellem Projekt-Screen
- Dropdown-Menu im Header/Projektkarten explizit mit Popover-Surface und genug Kontrast

Das behebt den Screenshot-Fehler und extrapoliert ihn auf alle Radix-Popups.

### 8. Dokumentation aktualisieren, knapp

Nach Umsetzung:

- `docs/NOW.md`: aktueller Sprint wird zu „UX-Konzepttreue: Sprache, Drilldowns, Projekt-Detail“ aktualisiert.
- `docs/DECISIONS.md`: kurzer Eintrag, warum UI-Sprache keine Pipeline-/ID-Begriffe mehr zeigen darf und warum objektbezogene Drills die generischen Review-Screens ersetzen.
- Kein riesiges Redesign-Protokoll.

## Technische Dateien voraussichtlich betroffen

- `src/lib/project/types.ts`
- `src/lib/project/projectViewModel.ts`
- `src/lib/project/mappers/humanize.ts`
- `src/lib/project/mappers/handlungsbedarf.ts`
- `src/lib/project/mappers/verlauf.ts`
- `src/lib/project/mappers/konflikte.ts`
- `src/lib/dialog/sessionFactories.ts`
- `src/components/project/LageZone.tsx`
- `src/components/project/HandlungsbedarfList.tsx`
- `src/components/project/VerlaufFeed.tsx`
- `src/components/project/SubstanzSection.tsx`
- `src/components/dialog/FaktDrillOverlay.tsx`
- `src/components/dialog/parts/ReviewRow.tsx`
- `src/components/ui/dialog.tsx`
- `src/components/ui/alert-dialog.tsx`
- `src/components/ui/dropdown-menu.tsx`
- `src/components/ui/command.tsx`
- `src/components/home/ImpactPipelinePanel.tsx`
- `src/components/entity/IntakeSessionsPanel.tsx`
- `src/components/shared/GlobalCommandMenu.tsx`
- `docs/NOW.md`
- `docs/DECISIONS.md`

## Nicht in diesem Rutsch

- Keine neue Datenbankarchitektur.
- Keine echte Dokument-Preview, wenn Backend/Storage-Previewpfad fehlt.
- Keine komplette Universal-Overlay-Implementierung aus M2.
- Keine neue M3-Backendlogik für `note-create`/`feedback-create`, außer vorhandene `submitNote`-Pfade sauberer zu nutzen.

Diese offenen Teile werden im UI klar markiert und in NOW.md als Prototyp-Milestone belassen.