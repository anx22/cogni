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
- Graph-/Memory-Layer sind spezialisierte Wissensmotoren, nicht der alleinige Master.
- Jede relevante Änderung braucht Quelle, Zeitbezug und Commit-Historie.
- Die UI darf nie direkt aus Rohdaten oder Toolantworten gebaut werden.

---

## 3. Aufgabenverteilung pro Plattform

### Lovable

Verantwortlich für:

- Entität-Screen
- Projektdetailansicht
- Dialog-Overlay
- Visualisierung von Review, Deltas und Projektzustand

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
- Review Sessions und Review Cases
- Proposed Facts und Change Events
- Commit Results
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

1. Nutzer lädt Material in der Entität hoch.
2. Originaldatei und Intake-Metadaten werden in Supabase gespeichert.
3. Unstructured verarbeitet das Material und liefert strukturierte Dokumentelemente zurück.
4. Diese Dokumentrepräsentationen werden an Graphiti oder Cognee übergeben.
5. Der Wissensmotor erzeugt oder aktualisiert Themenbezüge, Stakeholder-Beziehungen, Versionhinweise, Widersprüche und weitere kontextuelle Vorschläge.
6. Diese Ergebnisse werden als reviewbare Vorschläge und Deltas nach Supabase zurückgeschrieben.
7. Der Nutzer prüft die Fälle im Overlay.
8. Erst nach Commit wird der kanonische Projektzustand aktualisiert.
9. Lovable rendert den neuen Zustand aus Supabase.

### Harte Regel

Nicht Parser ↔ Graph ↔ App ↔ Datenbank.

Sondern:
**App → Supabase → Unstructured → Graphiti/Cognee → Supabase → App**

Damit bleibt die Kopplung klar und die Zuständigkeit prüfbar.

---

## 5. Kanonische Kernobjekte

Diese Objekte müssen sauber in Supabase modelliert sein:

- Asset
- Source
- Parsed Document Output
- Proposed Fact
- Review Session
- Review Case
- Change Event
- Commit Result
- Canonical Fact
- Project State Snapshot

Optionaler Unterbau je nach Wissensmotor:

- Graph Node / Edge Projection
- Memory Artifact
- Retrieval Context Object

Wichtig:
Das Overlay braucht echte Backend-Objekte. Es darf keine reine UI-Fassade sein.

---

## 6. Offene Unterbau-Entscheidung

### Option A — Graphiti

Einsatz, wenn:

- temporale Beziehungen zentral sind
- Faktveränderungen und Invalidation wichtig sind
- der Graph klar als spezialisierter Kontextmotor gedacht ist

Stärken:

- saubere zeitliche Wissenslogik
- stark für Widersprüche, Historie, Versionsbeziehungen

Risiken:

- mehr eigene Integrations- und Orchestrierungsarbeit
- Produktlogik muss stärker außerhalb des Graphen gebaut werden

### Option B — Cognee

Einsatz, wenn:

- Graph, Memory, Retrieval und Pipelines enger zusammenliegen sollen
- weniger Einzelverkabelung gewünscht ist
- der Wissensmotor stärker als integrierte Engine gedacht ist

Stärken:

- integrierter Ansatz
- näher an einer Knowledge Engine als nur an einer Graph-Schicht

Risiken:

- Commit- und Review-Modell dürfen nicht in die Engine abrutschen
- Produktlogik muss trotz Integration klar im Projektmodell verankert bleiben

---

## 7. Kritische technische Stellen

### 7.1 Wahrheit und Projektion nicht vermischen

Der größte Architekturfehler wäre, Graphiti oder Cognee als eigentliche Wahrheit zu behandeln.

Pflicht:

- Supabase hält den offiziellen Zustand.
- Graph/Memory hält abgeleiteten Kontext.

### 7.2 Dokumentstruktur nicht mit Projektwahrheit verwechseln

Unstructured liefert Struktur, aber keine belastbaren Projektentscheidungen.

Pflicht:

- Zwischen Parsing und Projektfakt liegt immer ein eigener Interpretations- und Review-Schritt.

### 7.3 Review nicht weich machen

Die Vision verlangt bewusst Kontrolle.

Pflicht:

- Nur bestätigte Vorschläge werden committed.
- Confidence darf Priorisierung steuern, aber keinen finalen Auto-Commit.

### 7.4 Delta-Logik sauber modellieren

Der Wissensmotor muss nicht nur erkennen, was neu ist, sondern was sich verändert.

Pflicht:

- bestätigen
- ergänzen
- ersetzen
- widersprechen
- zusammenführen
- verwerfen

Ohne diese Delta-Logik bleibt das System eine Ablage mit semantischen Tags.

### 7.5 Widersprüche als eigene Klasse behandeln

Widersprüche sind kein Nebeneffekt.

Pflicht:

- Terminwidersprüche
- Entscheidungswidersprüche
- Versionskonflikte
- Projektzuordnungs-Konflikte

Diese Fälle müssen explizit erzeugt, gespeichert und reviewbar gemacht werden.

### 7.6 Themen-Drift verhindern

Themen dürfen nicht unkontrolliert wachsen und sich duplizieren.

Pflicht:

- Merge-Mechanik
- Umbenennen
- kontrollierte Zusammenführung
- klare Quellbezüge je Thema

### 7.7 Provenance nie verlieren

Jeder relevante Fakt braucht:

- Quelle
- Zeitpunkt
- Extraktionslauf
- Review-Entscheidung
- Commit-Historie

Ohne Provenance ist das System fachlich nicht belastbar.

### 7.8 Overlay und Backend streng koppeln

Das Dialog-Overlay ist Kernfunktion.

Pflicht:

- Review Session
- Review Case
- Proposed Fact
- Change Event
- Commit Result

Wenn diese Objekte fehlen, zerfällt die Gesprächslogik bei realen Änderungen.

### 7.9 Integrationstiefe begrenzen

Graphiti oder Cognee dürfen nicht das gesamte Produktmodell übernehmen.

Pflicht:

- Wissensmotor nur für Kontext, Relationen, Retrieval und Historisierung einsetzen
- Produktzustand, Review und Commit im eigenen Kern halten

---

## 8. Roadmap

### V1

- Lovable als Produktschale
- Supabase als kanonischer Kern
- Unstructured als fixer Dokumentservice
- Graphiti oder Cognee als Knowledge-Unterbau
- Upload → Parsing → Wissensvorschläge → Review → Commit
- Projektzustand mit Themen, Entscheidungen, Timeline, Stakeholdern, Dokumenten, Konflikten
- vollständige Provenance und Commit-Historie

### Nicht in V1

- automatische Mail-Synchronisation
- autonome Hintergrundverarbeitung ohne Review
- überkomplexe Agentenkaskaden
- zusätzliche Memory-SaaS-Schichten ohne klaren Nutzen
- mehrere konkurrierende Graph-/Memory-Systeme parallel

---

## 9. Referenz für die Umsetzung

Beim Coden und Reviewen gilt:

- zuerst Kernzustand und Objektmodell sauber bauen
- dann Parsing-Flow und Rückschreibelogik
- dann Wissensmotor ankoppeln
- dann Overlay mit echten Review-Objekten verbinden
- UI immer aus committedem oder reviewbarem Zustand rendern, nie aus losem Tooloutput

Die Kernvision wird technisch nur erfüllt, wenn Review, Provenance, Delta-Logik und Widerspruchsbehandlung von Anfang an korrekt modelliert sind.
