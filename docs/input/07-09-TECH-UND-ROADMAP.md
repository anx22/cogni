# Produktintelligenz — Technik und Roadmap

## 1. Technischer Zielstack

### Fix gesetzt

- **Lovable** = Experience Layer / UI / Produktschale
- **Supabase** = kanonischer Kernzustand, Auth, Storage, Realtime, strukturierte Daten, Jobs
- **Unstructured** = Document Intelligence / Parsing / Partitioning / strukturierte Dokumentausgabe

### Offen

- **Graphiti** oder **Cognee** = Knowledge-Graph-/Memory-/Context-Unterbau

---

## 2. Architekturprinzipien

- Die App ist Oberfläche, nicht Entitätslogik.
- Supabase ist die Quelle der Wahrheit.
- Unstructured liefert strukturierte Dokumentrepräsentationen, aber keine Projektwahrheit.
- Graphiti oder Cognee bauen Kontext, Relationen, Historie und Retrieval-fähiges Wissen auf.
- Finaler Projektzustand entsteht erst nach Review und Commit.
- Graph-/Memory-Layer sind spezialisierte Wissensmotoren, nicht der Master.
- Jede relevante Änderung braucht Quelle, Zeitbezug und Commit-Historie.
- Die UI wird nie direkt aus Rohdaten oder Toolantworten gebaut.
- Das System modelliert rekonstruierte Lage, Unsicherheit und Lücken explizit.
- Direkte Nutzereingaben sind gleichwertige Inputs neben Dateien.

---

## 3. Aufgabenverteilung pro Plattform

### Lovable

Verantwortlich für:

- Entität-Screen
- Projektscreen
- Dialog-Overlay
- universellen Projekt-Input
- Visualisierung von Review, Deltas, Lücken und Projektzustand

Nicht verantwortlich für:

- Dokumentverarbeitung
- Projektlogik
- Konfliktlogik
- Commit-Logik
- Knowledge-Graph-Aufbau

### Supabase

Verantwortlich für:

- Storage der Originaldateien
- strukturierte Kernpersistenz in Postgres
- Intake Records für Dateien, Text und Sprache
- Review Sessions und Review Cases
- Proposed Facts und Change Events
- Commit Results
- Gap Signals
- Dependency Signals
- Outcome Signals
- Project-State-Snapshots
- Realtime-Updates an die App

Supabase ist der kanonische Kernzustand.

### Unstructured

Verantwortlich für:

- Parsing unstrukturierter Dateien
- Partitioning und Normalisierung
- Ausgabe strukturierter Segmente und Metadaten
- Vorstrukturierung für Wissensaufbau und Review

Unstructured ist Dokumentservice, nicht Projektintelligenz.

### Graphiti

Verantwortlich für:

- temporalen Knowledge Graph
- evolving relationships
- Fact Invalidation
- zeitbewussten Kontext
- graphbasiertes Retrieval

Graphiti ist sinnvoll, wenn zeitliche Veränderung, Widerspruchspflege und Historisierung im Vordergrund stehen.

### Cognee

Verantwortlich für:

- integrierte Memory-/Knowledge-Engine
- Graph + Vector + relationalen Kontext
- Pipelines, Tasks und DataPoints
- Verarbeitung strukturierter Inputs zu suchbarem, verbundenem Wissen

Cognee ist sinnvoll, wenn ein enger verzahnter Wissensmotor mit weniger Einzelverkabelung gewünscht ist.

---

## 4. Zusammenspiel der Systeme

### Datenfluss

1. Nutzer liefert Material oder direkten Input in der Entität oder im Projekt.
2. Originaldatei und Intake-Metadaten werden in Supabase gespeichert.
3. Dateibasierte Inputs werden durch Unstructured verarbeitet und in strukturierte Dokumentelemente überführt.
4. Strukturierte Dokumentelemente und direkte Nutzereingaben werden an Graphiti oder Cognee übergeben.
5. Der Wissensmotor erzeugt oder aktualisiert Themenbezüge, Stakeholder-Beziehungen, Versionhinweise, Widersprüche, Gap Signals, Dependency Signals und weitere kontextuelle Vorschläge.
6. Diese Vorschläge werden als Proposed Facts, Change Events und Review Cases nach Supabase zurückgeschrieben.
7. Erst nach Review-Commit wird der kanonische Projektzustand aktualisiert.
8. Lovable liest den Projektzustand, aktive Reviews und Delta-Informationen aus Supabase und rendert Entität, Projektscreen und Overlay.

### Harte Kopplungsregel

Nicht:
Parser ↔ Graph ↔ DB ↔ App

Sondern:
App → Supabase als Wahrheit → Unstructured als Dokumentservice → Graphiti/Cognee als Wissensmotor → zurück in Supabase → App

---

## 5. Kanonischer Datenkern

Supabase muss mindestens folgende Objektklassen halten:

- Project
- Message
- Document
- Person
- Organisation
- Topic
- Decision
- Milestone / Event
- Task
- Open Point
- Dependency
- Feedback
- Correction
- Reference
- Contradiction
- Version Link
- Gap Signal
- Outcome Signal
- Proposed Fact
- Change Event
- Review Session
- Review Case
- Commit Result
- Project State Snapshot

---

## 6. Zwingende Kernlogiken

### 6.1 Review vor Commit

Kein vorgeschlagener Fakt wird ohne Review-Commit kanonisch.

### 6.2 Projektzustand statt Rohlisten

Das System baut immer zuerst einen verdichteten Projektzustand und leitet daraus die UI ab.

### 6.3 Delta-Logik

Jede neue Information muss gegen Bestehendes geprüft werden:

- bestätigt
- ergänzt
- ersetzt
- widerspricht
- bleibt unklar

### 6.4 Provenance

Jeder relevante Fakt braucht:

- Quelle
- Zeitpunkt
- Extraktions- oder Intake-Lauf
- Review-Entscheidung
- Commit-Historie

### 6.5 Gap- und Ambiguity-Logik

Lücken und Unsicherheit sind eigene Systemzustände:

- unklar
- nicht bestätigt
- Quelle fehlt
- widersprüchlich
- wahrscheinlich, aber nicht gesichert

### 6.6 Dependency-Logik

Abhängigkeiten müssen als explizite Relationen geführt werden:

- blockiert durch
- wartet auf
- hängt ab von

### 6.7 Outcome-Placeholder

Das System hält ein minimales Zielbild:

- Erfolgskriterium
- gewünschter Outcome
- No-Go-Zustand

### 6.8 Universeller Projekt-Input

Nicht nur Datei-Intake:

- Freitext
- kurze Statusupdates
- Antworten auf Rückfragen
- Korrekturen
- Spracheingabe / Sprachmemo

---

## 7. Kritische technische Stellen

### 7.1 Graph nie als Wahrheit behandeln

Graphiti oder Cognee dürfen niemals der offizielle Projektzustand werden.

Pflicht:

- offizieller Zustand nur in Supabase
- Graph/Memories nur als spezialisierte Kontextprojektion

### 7.2 Unstructured nicht mit Fachlogik verwechseln

Unstructured liefert Dokumentstruktur, nicht Projektbedeutung.

Pflicht:

- klare Trennung zwischen Dokumentelement und Projektfakt
- nachgelagerte Interpretation immer reviewfähig halten

### 7.3 Direkte Inputs und Dokumente gleich behandeln

Kurze Texte, Antworten und Sprachmemos dürfen kein Nebensystem werden.

Pflicht:

- gleicher Intake- und Provenance-Standard wie bei Dateien
- gleiche Delta-, Gap- und Reviewlogik

### 7.4 Delta-Logik sauber modellieren

Neue Information darf nie nur angehängt werden.

Pflicht:

- jede Änderung gegen bestehende Fakten prüfen
- Statusübergänge explizit modellieren
- widersprechende Fakten nicht still überschreiben

### 7.5 Gap Signals nicht dekorativ behandeln

Lücken sind kein UX-Badge, sondern steuernde Information.

Pflicht:

- Gap Signals als eigene Objekte
- nur operative Lücken lösen Rückfragen aus
- Gap Signals in Handlungsbedarf überführbar halten

### 7.6 Dependency-Logik ernst nehmen

Abhängigkeiten sind kein Zusatzfeld.

Pflicht:

- Dependencies als eigene Relationsklasse
- Blocker-Wirkung in Handlungsbedarf sichtbar machen
- Verlauf und Lage mit Dependencies anreichern

### 7.7 Themen-Drift verhindern

Themen dürfen nicht unkontrolliert wachsen und sich duplizieren.

Pflicht:

- Merge-Mechanik
- Umbenennen
- kontrollierte Zusammenführung
- klare Quellbezüge je Thema

### 7.8 Overlay und Backend streng koppeln

Das Dialog-Overlay ist Kernfunktion.

Pflichtobjekte:

- Review Session
- Review Case
- Proposed Fact
- Gap Signal
- Change Event
- Commit Result

### 7.9 Unvollständigkeit im UI korrekt abbilden

Die App darf keine falsche Vollständigkeit suggerieren.

Pflicht:

- rekonstruierte Lage statt absolute Wahrheit anzeigen
- Unsicherheit und Lücken intern führen
- operative Rückfragen gezielt auslösen
- Prioritäten relativ aus verfügbaren Signalen ableiten

### 7.10 Integrationstiefe begrenzen

Graphiti oder Cognee dürfen nicht das gesamte Produktmodell übernehmen.

Pflicht:

- Wissensmotor nur für Kontext, Relationen, Retrieval und Historisierung einsetzen
- Produktzustand, Review und Commit im eigenen Kern halten

---

## 8. Offene Unterbau-Entscheidung

### Option A — Graphiti

Nutzen, wenn zeitliche Veränderung, Fakt-Invaliderung, Widerspruchspflege und historischer Kontext im Vordergrund stehen.

Stärke:

- graphisch strenger
- temporal sauberer
- passend für Verlauf, Widerspruch und Versionsbeziehungen

Risiko:

- mehr eigene Integrations- und Orchestrierungsarbeit

### Option B — Cognee

Nutzen, wenn ein integrierterer Wissensmotor mit Graph, Vector, relationalem Zustand und Pipelines gewünscht ist.

Stärke:

- enger verzahnt
- pipeline-näher
- weniger Einzelverkabelung

Risiko:

- Produktmodell und Commit-Logik dürfen nicht in Cognee verschwinden

---

## 9. Roadmap

### V1

- Lovable als Produktschale
- Supabase als kanonischer Kern
- Unstructured als fixer Dokumentservice
- Graphiti oder Cognee als Knowledge-Unterbau
- universeller Projekt-Input
- Upload/Text/Sprache → Parsing falls nötig → Wissensvorschläge → Review → Commit
- Projektzustand in vier Rollen: Lage, Handlungsbedarf, Verlauf, Substanz
- vollständige Provenance und Commit-Historie
- Gap Signals, Dependency Signals und gezielte Rückfragen
- minimales Outcome-Signal

### Später

- constraint-basierte adaptive Projektscreen-Modi
- automatische Vorauswahl von Screen-Rezepten je Projektkomplexität
- breitere Automatisierung für Folgefragen und Lückenschließung
