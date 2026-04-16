# Produktintelligenz — Design und UI-Screen-Specs

## 1. Designhaltung

Die App darf sich nicht wie Verwaltungssoftware anfühlen.  
Sie muss wie eine ruhige, konzentrierte, souveräne technische Intelligenz wirken.

Richtung:
- reduziert
- präzise
- ruhig
- konzentriert
- technisch
- lebendig ohne Spielerei

Keine dichte Dashboard-Wand.  
Keine klassische Sidebar als Hauptgeste.  
Keine überladene Modulnavigation.

---

## 2. Globale UI-Prinzipien

- viel Ruhefläche
- wenige dominante Elemente
- progressive Offenlegung
- jede wichtige Erkenntnis hat Herkunft und Delta
- Review fühlt sich wie Gespräch an, nicht wie Formulararbeit
- Projektansichten priorisieren Lage und Veränderung vor Vollständigkeit
- jede Interaktion wirkt bewusst, nie hektisch
- die UI zeigt rekonstruierte Lage, nicht behauptete Vollständigkeit

---

## 3. Sichtbare Systemlogik

Außen sichtbar sind nur drei Modi:
- Entität
- Projekt
- Overlay

Die UI verrät keine technischen Schichten.  
Parsing, Graph, Canonical State und Orchestrierung bleiben unsichtbar.

---

## 4. Screen 1 — Entität-Screen

### 4.1 Zweck
Globaler Eingang in die Projektintelligenz.

### 4.2 Grundaufbau
Fast leerer Screen.  
Im Zentrum sitzt die Entität als großer kreisförmiger, lebendiger Kern.

Um sie herum nur wenige sekundäre Zonen:
- Upload-Hinweis oder Drop-Zustand
- universeller Input
- orbitale oder zufließende Asset-Fragmente
- knappe Statussignale
- letzter Impact
- Review-Hinweis

### 4.3 Signatur-Element
Die Entität ist gleichzeitig:
- Dropzone
- universeller Projekt-Input
- Aktivitätsanzeige
- Identität des Produkts
- Review-Trigger
- globaler Zustandsanker

### 4.4 Zustände der Entität
- Idle
- Hover / Drag-Over
- Processing
- Review Ready
- Failed / Unclear

### 4.5 Minimale ergänzende Elemente
- Input-Hinweis
- Asset-Orbit
- Letzter Impact
- Review-Trigger
- zurückhaltender Projektzugang

### 4.6 Universeller Projekt-Input
Ein einziges Eingabemodul für:
- Datei
- freier Text
- Paste
- Link
- Spracheingabe / Sprachmemo
- kurze Antwort auf Rückfrage

Verhalten:
- erkennt grob den Eingabetyp
- schlägt Einordnung vor
- öffnet nur bei Bedarf den Reviewmodus

---

## 5. Screen 2 — Projektscreen

### 5.1 Zweck
Sichtbar machen, was die Entität aktuell über ein Projekt weiß.

Nicht als Rohdatenliste, sondern als verdichteter Projektzustand.

### 5.2 Informationsarchitektur
Der Screen folgt vier festen Rollen:
- **Lage**
- **Handlungsbedarf**
- **Verlauf**
- **Substanz**

Diese Rollen ersetzen die frühere Gleichrangigkeit vieler Fach-Panels.

### 5.3 Layoutlogik
- Header mit Lage und Meta
- operative Hauptfläche zuerst
- danach Verlauf
- Substanz als tiefere Ebene
- keine gleich lauten Bento-Kacheln für alles

Empfohlen:
- obere Lagezone mit Lagetext, kritischen Chips, Review-Hinweis, nächstem Termin und minimaler Meta
- darunter zwei Hauptblöcke: Handlungsbedarf und Verlauf
- darunter Substanz mit Themen und Dokumenten

### 5.4 Die vier Rollen

#### Lage
Immer sichtbar.

Enthält:
- kurzer Lagetext
- kritische Chips
- Konflikt-/Review-Banner
- nächster harter Termin
- letzte relevante Änderung
- minimale Meta wie Kunde, Status, Stakeholder-Zahl
- falls vorhanden: Zielbild oder Erfolgskriterium

Stakeholder und Projektdaten sind Header-Material, keine Hauptpanels.

#### Handlungsbedarf
Operatives Zentrum.

Fasst zusammen:
- offene Punkte
- Aufgaben
- unbestätigte Entscheidungen
- Feedback und Korrekturen mit Arbeitscharakter
- Konflikte
- Informationslücken mit Folgen
- Blocker und Dependencies

Arbeitsmodi:
- entscheiden
- klären
- umsetzen
- prüfen

#### Verlauf
Veränderungs- und Ereignislogik.

Enthält:
- Timeline
- Änderungen
- bestätigte Entscheidungen
- relevante Uploads
- Konfliktereignisse
- Workshops, Milestones, Freigaben

Änderungen existieren nicht als eigenes Panel neben dem Verlauf.

#### Substanz
Inhaltliche Tiefe.

Enthält:
- Themen
- Dokumente und Versionen
- Feedback/Korrekturen als Quellenmaterial, wenn relevant

### 5.5 Inhaltliche Regeln
- Konflikte sind kein normales Panel.
- Änderungen existieren nicht separat neben dem Verlauf.
- Stakeholder und Projektdaten sind nie Hauptfläche.
- Feedback und Korrekturen sind nur dann eigenständig sichtbar, wenn sie im Projekt dominant sind.
- Themen sind keine dekorativen Karten.
- Entscheidungen stehen nur separat, wenn sie offen, kritisch oder richtungsprägend sind.
- Bestätigte Entscheidungen gehören in den Verlauf.
- Handlungsbedarf darf auch unklare, unbestätigte oder quellenarme Punkte enthalten.
- Dependencies und Blocker sind Teil des Handlungsbedarfs.
- Der Screen wird nach Arbeitsmodus gebaut, nicht nach Ontologie.
- Zustand, Arbeit, Verlauf und Substanz dürfen nie gleichrangig und gleich laut dargestellt werden.

### 5.6 Smarte Komponenten und UI-Patterns

#### Lage-Komponenten
Ruhig, dicht, wenig Interaktion.

Patterns:
- Lagetext-Block
- Status-Chips
- Konflikt-/Review-Banner
- Gap-Hinweis, wenn eine Lücke operative Wirkung hat
- Meta-Zeile
- kleine Highlight-Karten für nächster Termin / letzte Änderung

#### Handlungsbedarf-Komponenten
Aktive Arbeitskomponenten.

Patterns:
- priorisierte Liste statt Kachelwand
- gruppierbar nach entscheiden / klären / umsetzen / prüfen
- Quick-Actions
- Verantwortliche, Frist, Quelle, Projektbezug
- Blocker-/Dependency-Marker
- expandierbare Detailzeile statt Vollpanel
- stärkere Statusmarker als in anderen Rollen
- Inline-Antworten für kurze Klärungen

#### Verlauf-Komponenten
Chronologisch, filterbar, ruhig.

Patterns:
- Ereignisfeed
- Typfilter
- Delta-Tags wie neu / ersetzt / bestätigt / widersprochen
- Datum + Quelle + Betroffenheit
- Gruppierung nach Woche, Phase oder Meilenstein

#### Substanz-Komponenten
Mehr Tiefgang, weniger Alarm.

Patterns:
- Themencluster als echte Drilldown-Einstiege
- Dokumentlisten mit Versionhinweisen
- thematische Gruppierung
- Quellbezug
- relationale Verweise in andere Rollen

### 5.7 Gemeinsame Trigger
Damit die Rollen zusammenhängend bleiben:
- einheitliche kleine Header-Zonen
- subtile Change-Indikatoren
- konsistente Source-/Provenance-Marker
- konsistente Review-Marker
- gleiche Expand-/Drilldown-Logik
- einheitliche Objekt-Tokens für Termin, Entscheidung, Konflikt, Dokument, Thema, Gap, Blocker

### 5.8 Unvollständigkeit sichtbar, aber ruhig
Die UI darf nie so tun, als wüsste die Entität alles.

Deshalb:
- Lage ist immer als aktueller Rekonstruktionsstand formuliert
- Lücken können als Gap-Signale auftauchen
- operativ relevante Rückfragen werden im Overlay gestellt
- Handlungsbedarf darf auch unklare oder unbestätigte Punkte enthalten

### 5.9 Später mögliche adaptive UI
Später möglich, jetzt nicht Teil von V1:
- feste Panelbibliothek
- feste Screen-Modi je Projektkomplexität
- automatische Vorauswahl der Modus-Variante
- keine freie generative UI

---

## 6. Systemweiter Modus — Dialog-Overlay

### 6.1 Zweck
Das Dialog-Overlay ist der Interaktionsraum zwischen Nutzer und Entität.

Es dient für:
- Review
- Korrektur
- Feedback
- Konfliktklärung
- Umzuordnung
- Präzisierung
- Commit oder Verwerfung
- gezielte Rückfragen bei relevanten Lücken

### 6.2 Charakter
Vollbild. Hohe Fokussierung. Alles außerhalb tritt zurück.

### 6.3 Grundaufbau
Kein Chatstream.

Stattdessen ein dynamisch komponierter Gesprächsraum aus Boxen, die je nach Fall nebeneinander, untereinander oder sequenziell erscheinen.

Typische räumliche Logik:
- links oder oben: erkannte Information
- daneben: Zuordnung oder Kontext
- darunter: Alternativen, Konflikt, Gap oder Auswahl
- am Abschluss: Bestätigen / Verwerfen / Präzisieren

### 6.4 Gesprächsboxen
- Wissensbox
- Zuordnungsbox
- Konfliktbox
- Gap-Box
- Auswahlbox
- Eingabebox
- Kontextbox
- Aktionsbox

### 6.5 Visuelle Eigenschaften der Boxen
- umrandet
- gerundet
- klar typisiert
- ruhig, aber deutlich interaktiv
- konsistente Innenabstände
- keine laute Formularästhetik

---

## 7. Interaktionsregeln

- Review ist immer explizit.
- Boxen entstehen aus maschinenlesbaren Box Specs.
- Quellenzugang ist direkt.
- Konflikte werden räumlich gegenübergestellt.
- Feedback und Korrektur sind ein durchgehender Layer.
- Delta ist sichtbar.
- Rückfragen werden gezielt und sparsam gestellt.
- Direkte Antworten können kurz und inline sein.
