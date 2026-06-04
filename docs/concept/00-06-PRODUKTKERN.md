# Produktintelligenz — Produktkern

## 0. Kernthese

Produktintelligenz ist eine zentrale Entität, die rohe Projektobjekte und direkte Nutzereingaben aufnimmt, sie projektübergreifend versteht, gegen bestehendes Wissen abgleicht, Widersprüche und Lücken sichtbar macht und daraus im Dialog mit dem Nutzer einen belastbaren Projektzustand formt.

Das Produkt ist weder klassische Projektmanagement-Software noch Dateiablage noch Graph-Viewer.

Außen sichtbar sind nur drei Modi:

- Entität-Screen
- Projekt-Screen
- Dialog-Overlay

Innen arbeitet eine agentische Intelligenz mit Parsing-, Matching-, Kontext-, Konflikt-, Gap- und State-Building-Logik.

---

## 1. Produktform

### 1.1 Sichtbare Außenform

1. **Entität-Screen**  
   globaler Eingang, Upload, direkter Input, Verarbeitung, Review-Einstieg

2. **Projekt-Screen**  
   verdichtete Projektsicht, progressive Offenlegung, keine modulare B2B-Navigation

3. **Dialog-Overlay**  
   Vollbildmodus für Review, Feedback, Korrektur, Konfliktklärung, Umzuordnung, Rückfragen und Präzisierung

### 1.2 Harte Produktprinzipien

- außen reduziert, innen strukturiert
- Review immer vorhanden
- kein Auto-Commit in den Projektzustand
- jede relevante Erkenntnis hat Quelle, Zeitbezug und Delta
- Konflikte sind Kernfunktion
- Lücken und Unsicherheit werden explizit geführt
- Feedback und Korrektur sind durchgehende Signale
- Projektzustand ist wichtiger als Rohdatenlisten
- das System zeigt rekonstruierte Lage, nicht absolute Wahrheit

---

## 2. Experience-Architektur

### 2.1 Entität-Screen

Der Entität-Screen ist globaler Eingang in die Projektintelligenz.

Die Entität ist gleichzeitig:

- Dropzone
- universeller Projekt-Input
- Aktivitätszentrum
- Identität des Produkts
- Review-Trigger
- globaler Zustandsanzeiger

Eingaben:

- Copy/Paste-Mail
- `.eml`
- PDF
- PPTX
- DOCX
- Bild
- Notiz
- Link / Web-Snapshot
- gemischte Asset-Bundles mit optionalen Metadaten
- freier Texteingang
- kurze Statusupdates
- Antworten auf Rückfragen
- Sprachmemo / Spracheingabe

### 2.2 Projekt-Screen

Der Projekt-Screen zeigt nicht Rohmaterial, sondern den aktuell rekonstruierten Projektzustand.

Er folgt vier festen Rollen:

- **Lage**
- **Handlungsbedarf**
- **Verlauf**
- **Substanz**

Diese Rollen ersetzen die frühere Gleichrangigkeit vieler Fach-Panels.

### 2.3 Dialog-Overlay

Das Overlay ist der Gesprächsraum zwischen Nutzer und Entität.

Es übernimmt:

- Review
- Zuordnungsprüfung
- Konfliktauflösung
- Korrektur
- Feedback
- manuelle Präzisierung
- Versionsklärung
- Commit oder Verwerfung
- gezielte Rückfragen bei relevanten Lücken

Der Modus ist nicht chatartig. Er ist ein dynamisch komponierter Interaktionsraum aus Gesprächsobjekten.

---

## 3. Dialogsystem

### 3.1 Grundsatz

Der Dialogmodus ist kein Textchat.  
Er ist ein semantisch komponierter Gesprächsraum aus einfachen, gerundeten, umrandeten Boxen.

Die Entität baut je nach Fall die passende Kombination aus Informations-, Auswahl-, Kontext-, Eingabe- und Aktionsobjekten.

### 3.2 Typische Dialoganlässe

- neues Material wurde verarbeitet
- Projektzuordnung wurde vorgeschlagen
- Wissen wurde extrahiert und muss bestätigt werden
- Widerspruch wurde erkannt
- Korrektur ist nötig
- Feedback soll gegeben oder verarbeitet werden
- Dokumentversion ist unklar
- Thema soll gemerged oder umbenannt werden
- bestehende Entscheidung wird durch neue Information angegriffen
- wesentliche Informationslücke blockiert den Projektzustand
- eine Rückfrage muss direkt beantwortet werden

### 3.3 Gesprächsboxen

- **Wissensbox** — erkannter Sachverhalt
- **Zuordnungsbox** — Projekt-, Themen- oder Versionszuordnung
- **Konfliktbox** — Kollision, Mehrdeutigkeit, Unsicherheit
- **Gap-Box** — fehlende Information mit Auswirkung
- **Auswahlbox** — explizite Alternativen
- **Eingabebox** — kurze manuelle Präzisierung oder Antwort
- **Kontextbox** — Quelle und Begründung
- **Aktionsbox** — bestätigen, verwerfen, mergen, abbrechen

### 3.4 Systemobjekte des Dialogs

- Dialog Session
- Review Case
- Gesprächsbox
- Confidence Signal
- Gap Signal
- Commit Result

### 3.5 Harte Dialogregel

Nichts wird endgültig in den Projektzustand übernommen, bevor es durch einen Review-Commit gegangen ist.

---

## 4. Fachmodell

### 4.1 Primärobjekte

- Projekt
- Nachricht
- Dokument
- Person
- Organisation

### 4.2 Erkenntnisobjekte

- Thema
- Entscheidung
- Termin
- Aufgabe
- offener Punkt
- Abhängigkeit

### 4.3 Querobjekte

- Feedback
- Korrektur
- Referenz
- Widerspruch
- Versionsbezug
- Gap Signal
- Outcome Signal

### 4.4 Aggregat

- aktueller Projektzustand

### 4.5 Systemobjekte

- Review Session
- Review Case
- Proposed Fact
- Change Event
- Commit Result
- Project State Snapshot

---

## 5. Projektzustand

Der Projektzustand ist keine Rohsammlung, sondern eine verdichtete, laufend aktualisierte Sicht auf ein Projekt.

Er enthält:

- Lagebild
- Handlungsbedarf
- Verlauf
- Substanz
- Quellenbezug
- offene Konflikte
- Unsicherheiten und Lücken
- Abhängigkeiten
- minimales Zielbild

### 5.1 Die vier Rollen des Projektscreens

#### Lage

Der obere, immer sichtbare Zustand des Projekts.

Enthält:

- kurzer Lagetext
- kritische Chips
- nächster harter Termin
- letzte relevante Änderung
- Review-Bedarf
- minimale Metadaten
- falls vorhanden: Zielbild oder Erfolgskriterium

Stakeholder und Projektdaten sitzen hier reduziert im Header.

#### Handlungsbedarf

Das operative Zentrum.

Fasst zusammen:

- offene Punkte
- Aufgaben
- unbestätigte Entscheidungen
- Feedback und Korrekturen mit Arbeitscharakter
- Konflikte
- Informationslücken mit Folgen
- Abhängigkeiten mit Blocker-Wirkung

Arbeitsmodi:

- entscheiden
- klären
- umsetzen
- prüfen

#### Verlauf

Die Veränderungs- und Ereignislogik des Projekts.

Enthält:

- Timeline
- Änderungen
- bestätigte Entscheidungen
- wichtige Uploads
- Konfliktereignisse
- Workshops, Milestones, Freigaben

Änderungen existieren nicht als eigenes Panel neben dem Verlauf.

#### Substanz

Die inhaltliche Tiefe des Projekts.

Enthält:

- Themen
- Dokumente und Versionen
- Feedback und Korrekturen als Quellenmaterial, falls relevant

---

## 6. Inhaltliche Regeln

- Konflikte sind kein normales Panel. Sie sind kritischer Zustand, Banner, Marker oder Alarm.
- Änderungen existieren nicht separat neben dem Verlauf.
- Stakeholder und Projektdaten sind nie Hauptfläche.
- Feedback und Korrekturen sind nur dann eigenständig sichtbar, wenn sie im Projekt dominant sind.
- Themen sind keine dekorativen Karten. Sie sind echte inhaltliche Einstiege.
- Entscheidungen stehen nur separat, wenn sie offen, kritisch oder richtungsprägend sind. Bestätigte Entscheidungen gehören in den Verlauf.
- Abhängigkeiten werden als blockiert durch, wartet auf oder hängt ab von geführt.
- Handlungsbedarf darf auch Unsicherheit, fehlende Quellen und unbestätigte Punkte enthalten.
- Die Entität stellt Rückfragen nur dann, wenn Lücken operative Folgen haben.
- Der Screen wird nach Arbeitsmodus gebaut, nicht nach Ontologie.
- Constraint-basierte adaptive UI bleibt ein späterer Plan und ist nicht Teil von V1.
