# Produktintelligenz v4 — Produktkern

## 0. Kernthese

Produktintelligenz ist eine zentrale Entität, die rohe Projektobjekte aufnimmt, sie projektübergreifend versteht, Veränderungen gegen bestehendes Wissen abgleicht, Widersprüche sichtbar macht und daraus im Dialog mit dem Nutzer einen belastbaren Projektzustand formt.

Das Produkt ist weder klassische Projektmanagement-Software noch Dateiablage noch Graph-Viewer.

Außen gibt es nur drei sichtbare Modi:
- **Entität-Screen**
- **Projekt-Screen**
- **Dialog-Overlay**

Innen arbeitet eine agentische Intelligenz mit Parsing-, Matching-, Kontext-, Konflikt- und State-Building-Logik.

---

## 1. Produktform

### 1.1 Sichtbare Außenform

Die App hat zwei Hauptscreens und einen systemweiten Vollbildmodus:

1. **Entität-Screen**  
   globaler Eingang, Upload, Intake, Verarbeitung, Review-Einstieg

2. **Projekt-Screen**  
   verdichtete Projektsicht, progressive Offenlegung, keine modulare B2B-Navigation

3. **Dialog-Overlay**  
   Vollbildmodus für Review, Feedback, Korrektur, Konfliktklärung, Umzuordnung und Präzisierung

### 1.2 Produktgefühl

Der Nutzer soll nicht das Gefühl haben, Daten zu verwalten.  
Er füttert die Entität.  
Die Entität verarbeitet, ordnet, vergleicht, markiert und fragt dort nach, wo menschliche Bestätigung nötig ist.

### 1.3 Harte Produktprinzipien

- außen extrem reduziert
- innen hochstrukturiert
- Review immer vorhanden
- kein Auto-Commit in den Projektzustand
- jede relevante Erkenntnis hat Quelle und Delta
- Feedback und Korrektur sind allgegenwärtig
- Projektzustand ist wichtiger als Rohdatenlisten
- Konflikte sind Kernfunktion, keine Nebenfunktion

---

## 2. Experience-Architektur

### 2.1 Entität-Screen

Der Entität-Screen ist kein Dashboard. Er ist der globale operative Eingang in die Projektintelligenz.

Die Entität ist gleichzeitig:
- Dropzone
- Aktivitätszentrum
- Identität des Produkts
- Review-Trigger
- globaler Zustandsanzeiger

Der Nutzer kann hier hineinwerfen:
- Copy/Paste-Mail
- `.eml`
- PDF
- PPTX
- DOCX
- Bild
- Notiz
- Link / Web-Snapshot
- gemischte Asset-Bundles mit optionalen Metadaten

### 2.2 Projekt-Screen

Der Projekt-Screen zeigt nicht Rohmaterial, sondern das Ergebnis der Entitätsarbeit.

Er beginnt immer mit dem **aktuellen Stand** und entfaltet sich dann in aufklappbare Projektfacetten.

Diese Facetten sind keine Primärnavigation, sondern verdichtete Sichten des Projektzustands:
- aktueller Stand
- wichtigste Änderungen
- Konflikte
- Themen
- Timeline
- Entscheidungen
- offene Punkte und Aufgaben
- Dokumente und Versionen
- Stakeholder
- Feedback und Korrekturen

### 2.3 Dialog-Overlay

Das Overlay ist der eigentliche Gesprächsraum zwischen Nutzer und Entität.

Es läuft über beide Hauptscreens und übernimmt:
- Review
- Zuordnungsprüfung
- Konfliktauflösung
- Korrektur
- Feedback
- manuelle Präzisierung
- Versionsklärung
- Commit oder Verwerfung

Der Modus ist nicht chatartig. Er ist ein dynamisch komponierter Interaktionsraum aus Gesprächsobjekten.

---

## 3. Dialogsystem

### 3.1 Grundsatz

Der Dialogmodus ist kein Textchat.  
Er ist ein semantisch komponierter Gesprächsraum aus einfachen, gerundeten, umrandeten Boxen.

Die Entität baut je nach Fall die passende Kombination aus Informations-, Auswahl-, Kontext- und Aktionsobjekten.

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

### 3.3 Archetypische Gesprächsboxen

#### Wissensbox
Zeigt erkannte Erkenntnisse.

Beispiele:
- neue Entscheidung erkannt
- Termin erkannt
- Thema ergänzt
- offener Punkt erkannt
- Widerspruch erkannt

#### Zuordnungsbox
Zeigt, wohin die Entität etwas eingeordnet hat.

Beispiele:
- diesem Projekt zugeordnet
- diesem Thema zugeordnet
- als Version dieses Dokuments erkannt

Ausklappbar und änderbar.

#### Konfliktbox
Zeigt Kollisionen, Mehrdeutigkeiten oder Unsicherheiten.

Beispiele:
- neuer Termin widerspricht bestehendem Termin
- neue Aussage kollidiert mit freigegebener Entscheidung
- Dokument passt zu mehreren Projekten

#### Auswahlbox
Erzwingt eine explizite Entscheidung.

Beispiele:
- Projekt A / Projekt B / neues Projekt
- bestätigen / verwerfen
- Dokumentversion / eigenständiges Dokument

#### Eingabebox
Nimmt kurze manuelle Präzisierungen auf.

Beispiele:
- Projekt suchen
- Thema umbenennen
- Freitext-Korrektur
- Stakeholder ergänzen

#### Kontextbox
Zeigt Begründung und Quellenbasis.

Beispiele:
- erkannt aus Mail vom …
- Zuordnung basiert auf …
- Konflikt entsteht durch …

#### Aktionsbox
Schließt den Fall.

Beispiele:
- bestätigen
- abbrechen
- als neues Thema anlegen
- mit bestehendem Thema mergen

### 3.4 Systemobjekte des Dialogs

- **Dialog Session**  
  komplette Gesprächssitzung zwischen Nutzer und Entität
- **Review Case**  
  einzelner Klärungsfall innerhalb einer Session
- **Gesprächsbox**  
  kleinste sichtbare Interaktionseinheit
- **Confidence Signal**  
  interne Sicherheitseinschätzung für Priorisierung, nie für Auto-Commit
- **Commit Result**  
  bestätigt, geändert, verworfen, eskaliert

### 3.5 Zustände einer Box

- vorgeschlagen
- aufgeklappt
- geändert
- bestätigt
- verworfen
- eskaliert

### 3.6 Harte Dialogregel

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

### 4.3 Querobjekte

- Feedback
- Korrektur
- Referenz
- Widerspruch
- Versionsbezug
- Änderungsereignis

### 4.4 Aggregat

- aktueller Projektstand

### 4.5 Besondere Modellentscheidungen

- Feedback und Korrektur sind keine Randnotizen, sondern durchgehende Querobjekte und Dialogtreiber.
- Ein Dokument kann mehreren Projekten zugeordnet sein.
- Themen entstehen automatisch, bleiben aber mergebar und umbenennbar.
- Offener Punkt und Aufgabe bleiben getrennt.
- Jede relevante Erkenntnis braucht Quelle und Review.
- Jede Änderung muss als Delta nachvollziehbar sein.

---

## 5. Organisationslogik im Projekt

### 5.1 Der Projektzustand ist die Hauptsache

Der Projekt-Screen zeigt zuerst den **aktuellen Stand**. Erst danach entfaltet er die Tiefe.

Der Nutzer soll sofort verstehen:
- Was ist gerade die Lage?
- Was hat sich verändert?
- Was ist kritisch?
- Was ist entschieden?
- Was ist offen?
- Wo gibt es Widersprüche?

### 5.2 Projektfacetten

#### Aktueller Stand
Verdichtetes Lagebild.

#### Änderungen
Was wurde neu erkannt, bestätigt, verschoben, ersetzt, verworfen?

#### Konflikte
Welche Spannungen, Kollisionen oder Unklarheiten bestehen?

#### Themen
Inhaltliche Cluster mit Quellen, Entscheidungen, Feedback, Korrekturen, offenen Punkten und Dokumenten.

#### Timeline
Veränderungsverlauf statt bloßer Chronologie.

#### Entscheidungen
Mit Geltungsstatus, Quelle, Angriffspunkt und Verlauf.

#### Offene Punkte und Aufgaben
Getrennt, aber nah beieinander.

#### Dokumente und Versionen
Mit Herkunft, Projektbezug, Themenbezug und Versionslogik.

#### Stakeholder
Personen, Organisationen, Rollen, Beziehungen.

#### Feedback und Korrekturen
Querliegender Layer über das gesamte Projekt.

### 5.3 Zeit- und Gültigkeitslogik

Bei konkurrierenden Informationen gilt:
1. formal bindend
2. explizit freigegeben
3. neueste
4. wahrscheinlichste

---

## 6. Entitätslogik

Die Entität soll sich nicht wie starre App-Logik anfühlen. Sie wirkt wie ein eigenständiges intelligentes Wesen.

### 6.1 Was die Entität intern tut

1. nimmt Material auf
2. erkennt Typ, Struktur und Kontext
3. wählt passende Parsing- und Extraktionspfade
4. bildet strukturierte Signale
5. schlägt Projekt- und Themenzuordnungen vor
6. gleicht neue Signale mit bestehendem Wissen ab
7. erkennt Konflikte, Überschreibungen, Versionen und Deltas
8. baut daraus Review Cases
9. komponiert passende Gesprächsboxen
10. übernimmt Änderungen erst nach Review-Commit
11. baut daraus den aktualisierten Projektzustand

### 6.2 Wichtige Entitätsfähigkeiten

- Projektzuordnung
- Themenbildung und Themenmerge
- Entscheidungsabgleich
- Terminabgleich
- Konflikterkennung
- Versionserkennung
- Stakeholder-Erweiterung
- Feedback- und Korrekturverarbeitung
- Delta-Erzeugung
- Projektzustands-Building

### 6.3 Was sie nicht sein darf

- ein blindes OCR-/Parsing-Frontend
- ein Chatbot ohne belastbare Objektstruktur
- ein autonomes Blackbox-System ohne Review
- eine klassische CRUD-App mit etwas KI darüber

---

## 7. Intelligenz-Pipeline

### 7.1 Intake

Mögliche Eingänge:
- Copy/Paste-Mail
- `.eml`
- PDF
- PPTX
- DOCX
- Bild
- Notiz
- Link / Web-Snapshot
- heterogene Asset-Bundles mit optionalen Metadaten

### 7.2 Preparation

Das Rohmaterial wird lesbar und vergleichbar gemacht.

- Dateityp erkennen
- Text extrahieren
- Mail-Thread bereinigen
- Signaturen und Zitatblöcke reduzieren
- Hauptinhalt bilden
- Dokumentmetadaten erfassen
- Anhänge separieren
- OCR nur bei Bedarf

### 7.3 Extraction

Aus Inhalt werden strukturierte Signale.

- Personen
- Organisationen
- mögliche Projektzuordnung
- Themen
- Entscheidungen
- Termine
- Aufgaben
- offene Punkte
- Feedback
- Korrekturen
- Referenzen

### 7.4 Linking

Neue Signale werden gegen bestehendes Wissen geprüft.

- Projektkandidaten prüfen
- Themenbezug prüfen
- Dokumentversionen erkennen
- Entscheidungen und Termine abgleichen
- Konflikte berechnen
- Stakeholder abgleichen

### 7.5 Review Assembly

Aus den Signalen und Konflikten werden Review Cases und Gesprächsboxen gebaut.

### 7.6 Commit

Nach Nutzerentscheidung werden Änderungen in den kanonischen Zustand übernommen.

### 7.7 Project State Build

Danach wird der aktuelle Projektzustand neu erzeugt.

- Lagebild aktualisieren
- Timeline ergänzen
- Themen gewichten
- Konflikte aktualisieren
- Relevanz und Priorität neu bestimmen

---

## 8. V1-Fokus

### Rein in V1

- manueller Intake
- Upload heterogener Assets
- Preparation und Parsing
- strukturierte Extraktion
- Projektzuordnungsvorschläge
- immer Review
- Dialog-Overlay
- Projektzustands-Building
- Themen
- Entscheidungen
- Timeline
- Dokumente und Versionen
- Stakeholder
- Konflikte
- Feedback und Korrekturen

### Draußen in V1

- Live-Mail-Sync
- komplexe Team-Kollaboration
- autonome Hintergrundimporte ohne Nutzerkontakt
- überkomplexe Ontologie
- unkontrollierte Vollautonomie ohne Review
