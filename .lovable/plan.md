## Audit: Was sich durch v2 ändert

### Substanzielle Verschiebungen gegenüber v1


| Bereich                   | v1 (alt)                                                               | v2 (neu)                                                                                                                                        | Auswirkung                                                    |
| ------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Projektscreen-Architektur | 10 gleichrangige Facetten / 3 Tabs (Intelligence / Substanz / Kontext) | **4 feste Rollen**: Lage, Handlungsbedarf, **Verlauf**, Substanz                                                                                | Tab-Modell ist obsolet. Neuer Aufbau pro Rolle.               |
| Handlungsbedarf           | existiert nicht als Konzept                                            | **operatives Zentrum**, vereint offene Punkte, Aufgaben, unbestätigte Entscheidungen, Konflikte, Gaps, Dependencies, arbeitsrelevantes Feedback | Komplett neue Hauptkomponente, ersetzt mehrere Einzelfacetten |
| Konflikte                 | eigenes Panel / Banner                                                 | kein eigenes Panel, sondern **Banner in Lage + Marker in Handlungsbedarf + Ereignis im Verlauf**                                                | Konfliktbox/Facet-Logik wird neu eingebettet                  |
| Änderungen                | eigenes Panel                                                          | **existiert nicht separat**, vollständig im Verlauf                                                                                             | bereits in letzter Iteration entfernt — bestätigt             |
| Stakeholder               | eigener Tab "Kontext"                                                  | **nur Header-Material**, keine Hauptfläche                                                                                                      | FacetStakeholder als Hauptpanel weg                           |
| Themen                    | gleichrangige Karten                                                   | echte **Drilldown-Einstiege** in Substanz                                                                                                       | Karten-Logik überdenken                                       |
| Entscheidungen            | eigenes Panel mit allen Status                                         | **nur offen/kritisch/richtungsprägend** stehen separat; bestätigte gehören in Verlauf                                                           | Aufteilung nötig                                              |
| Universeller Input        | Dropzone für Dateien                                                   | **ein Modul für Datei + Text + Paste + Link + Sprache + Antworten**                                                                             | Entity-Screen-Input erweitern                                 |
| Gap Signals               | nicht modelliert                                                       | **eigene Objektklasse + Kernlogik**                                                                                                             | Datenmodell-Lücke                                             |
| Dependency Signals        | nicht modelliert                                                       | **eigene Relationsklasse** (blockiert durch / wartet auf / hängt ab von)                                                                        | Datenmodell-Lücke                                             |
| Outcome Signal            | nicht modelliert                                                       | **minimales Zielbild** pro Projekt (Erfolgskriterium / No-Go)                                                                                   | Datenmodell-Lücke                                             |
| Dialogboxen               | 7 Typen                                                                | **8 Typen** (Gap-Box neu)                                                                                                                       | Phase 4 anpassen                                              |
| Inhaltliche Regel         | gleichlaute Bento-Kacheln                                              | "Zustand, Arbeit, Verlauf, Substanz dürfen nie gleichrangig dargestellt werden"                                                                 | aktuelle UI verstößt direkt dagegen                           |


### Was bleibt unverändert

- Drei Außenmodi (Entität / Projekt / Overlay)
- Lovable + Supabase + Unstructured + Graphiti/Cognee Stack
- Review-vor-Commit, Provenance, Delta-Logik
- Designhaltung (ruhig, technisch, dunkel, glasartig)
- Knowledge-Graph-Entscheidung Graphiti vs. Cognee weiterhin offen (war in v1 als entschieden markiert — **Korrektur nötig**)

### Was das für unseren Entwicklungsstand bedeutet

**Phase 0 (Doku):** Inputs müssen versioniert werden, Doku neu geschrieben.

**Phase 1 (Entity-Screen):** Im Kern okay. Dropzone muss zum **universellen Input** ausgebaut werden (Text, Paste, Link, Sprache). Nicht jetzt — später.

**Phase 2 (Datenmodell):** **Lücken**. Es fehlen:

- `gap_signals` (eigene Tabelle)
- `dependencies` (eigene Relationsklasse)
- `outcome_signals` / Zielbild pro Projekt
- `dialog_sessions` (separat von review_sessions, falls gewünscht)
- Box-Typ-Enum braucht `gap_box`

**Phase 3 (Projekt-Screen):** **Größter Bruch**. Die aktuelle Tab-Struktur (Intelligence/Substanz/Kontext) widerspricht dem Vier-Rollen-Modell. Komplett neu aufzubauen: (alten code löschen, sweeping, komplett neuaufbauen, fresh take)

- Lage-Header (statt aktuellem Header + separates Lagebild)
- **Handlungsbedarf** als priorisierte, gruppierte Liste (entscheiden / klären / umsetzen / prüfen) — neue Komponente
- **Verlauf** als Ereignisfeed mit Filtern (übernimmt Timeline + bestätigte Entscheidungen + Konfliktereignisse + Uploads)
- **Substanz** als Themen-Drilldown + Dokumente
- Stakeholder verschwindet aus Hauptfläche, sitzt im Header
- Konflikt-Banner in Lage bleibt, Konflikte als Marker in Handlungsbedarf

**Phase 4 (Overlay):** Plan bleibt valide, +1 Box-Typ (Gap-Box).

**Phase 5/6 (Upload, Graphiti):** Unverändert in der Substanz, Graphiti-Entscheidung ist laut v2 wieder offen.

---

## Plan: Versionierung + Doku-Reset + Plan-Reset

### Schritt 1 — Inputs versionieren

- `docs/input/veraltet/` anlegen
- Alte Inputs verschieben: `00-06-PRODUKTKERN.md`, `07-09-TECH-UND-ROADMAP.md`, `08-DESIGN-UND-UI-SPECS.md` → `docs/input/veraltet/`
- Neue Inputs aus User-Uploads nach `docs/input/` kopieren als kanonisch (gleiche Dateinamen, ohne "2"-Suffix)

### Schritt 2 — Drei Doku-Files neu schreiben

- `docs/produkt-gesamt.md` — komplett neu auf Basis v2: Vier-Rollen-Modell, Gap/Dependency/Outcome, universeller Input, 8 Box-Typen
- `docs/implementierung-aktuell.md` — aktualisierter Audit-Stand: was steht, was bricht, was bleibt, Korrektur Graphiti-Status auf "offen"
- `docs/geplant.md` — neuer Plan reflektiert v2 (siehe Schritt 4)

### Schritt 3 — Memory aktualisieren

- `mem://index.md` Core anpassen: "Vier Rollen statt Bento-Facetten", Graphiti-Entscheidung als offen markieren
- `mem://features/produkt-prinzipien` ergänzen: Gap, Dependency, Outcome, universeller Input
- `mem://features/entscheidungen` korrigieren: Graphiti vs. Cognee wieder offen

### Schritt 4 — Neue Roadmap (`geplant.md`)

**Phase 3.5 — Projekt-Screen Reset (nächster Schritt):**

- bestehende Strukturen entfernen -> Neu Bauen, fresh take
- vier Rollen umsetzen: Lage / Handlungsbedarf / Verlauf / Substanz
- neue Komponenten:
  - `LageZone` (Header mit Lagetext, Chips, Konflikt-Banner, nächster Termin, letzte Änderung, Meta inkl. Stakeholder-Zahl)
  - `HandlungsbedarfList` (priorisierte Liste, gruppierbar entscheiden/klären/umsetzen/prüfen, Quick-Actions, Blocker-Marker, Inline-Antwort)
  - `VerlaufFeed` (chronologischer Ereignisfeed mit Typfiltern + Delta-Tags)
  - `SubstanzSection` (Themen-Drilldown + Dokumentliste mit Versionen)
- Demo-Daten erweitern um Gap/Dependency/Outcome-Beispiele
- alte Facetten-Komponenten entfernen oder neu zugeordnet einbetten

**Phase 2.5 — Datenmodell-Erweiterung (Migration):**

- Tabellen `gap_signals`, `dependencies`, `outcome_signals`
- Enum `box_type` um `gap_box` erweitern
- ggf. `dialog_sessions`

**Phase 4 — Overlay (unverändert, +Gap-Box):** wie geplant.

**Phase 5 — Universeller Input:** Entity-Dropzone ausbauen auf Text/Paste/Link/Sprache. (hier vorher genauer fragen nach präziser ausgestaltung)

**Phase 6 — Upload-Pipeline + Unstructured:** wie bisher.

**Phase 7 — Knowledge-Graph-Entscheidung + Integration:** Graphiti  ist entschieden!,  anbinden.

### Schritt 5 — Audit-Notiz im implementierung-aktuell.md

Dedizierter Abschnitt "Bruchstellen durch v2-Inputs" mit Tabelle aus diesem Audit, damit nachvollziehbar ist, warum die nächste UI-Iteration so radikal wird.



### Betroffene Dateien

- verschieben: 3× `docs/input/*.md` → `docs/input/veraltet/`
- neu erstellen: 3× `docs/input/*.md` (aus User-Uploads)
- überschreiben: `docs/produkt-gesamt.md`, `docs/implementierung-aktuell.md`, `docs/geplant.md`
- aktualisieren: `mem://index.md`, `mem://features/produkt-prinzipien`, `mem://features/entscheidungen`

Keine Code- oder DB-Änderungen in diesem Schritt — reine Doku-/Memory-Synchronisation und Audit. Code-Reset des Projekt-Screens kommt in der darauffolgenden Iteration nach deiner Freigabe.