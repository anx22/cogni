# Produktintelligenz v4 — Design und UI-Screen-Specs

## 1. Designhaltung

Die App darf sich nicht wie Verwaltungssoftware anfühlen.  
Sie muss wie eine ruhige, konzentrierte, souveräne technische Intelligenz wirken.

Die richtige Richtung ist:
- reduziert
- präzise
- ruhig
- konzentriert
- technisch
- lebendig ohne Spielerei

Keine dichte Dashboard-Wand.  
Keine klassische Sidebar als Hauptgeste.  
Keine überladene Modulnavigation.

Der Nutzer soll fühlen:
- hier arbeitet ein zentrales Wesen
- ich füttere es
- es versteht Projektkontext
- es fragt nur dort nach, wo mein Urteil nötig ist
- ich sehe verdichtete Erkenntnis statt Datenmüll

---

## 2. Globale UI-Prinzipien

- viel Ruhefläche
- starke Zentrierung
- wenige dominante Elemente
- progressive Offenlegung
- jede wichtige Erkenntnis hat Herkunft und Delta
- Review fühlt sich wie Gespräch an, nicht wie Formulararbeit
- Projektansichten priorisieren Lage und Veränderung vor Vollständigkeit
- jede Interaktion wirkt bewusst, nie hektisch

---

## 3. Sichtbare Systemlogik

Außen sichtbar sind nur drei Modi:
- **Entität**
- **Projekt**
- **Overlay**

Die UI darf keine technischen Schichten verraten.  
Parsing, Graph, Canonical State, Agentik und Orchestrierung bleiben unsichtbar.

Die Entität ist die sichtbare Verdichtung all dieser inneren Schichten.

---

## 4. Screen 1 — Entität-Screen

## 4.1 Zweck

Globaler Eingang in die Projektintelligenz.

## 4.2 Grundaufbau

Fast leerer Screen.  
Im Zentrum sitzt die Entität als großer kreisförmiger, lebendiger Kern.

Um sie herum nur wenige sekundäre Zonen:
- Upload-Hinweis oder Drop-Zustand
- orbitale oder zufließende Asset-Fragmente
- knappe Statussignale
- letzter Impact
- Review-Hinweis

Keine Listenwand. Kein Dateimanager. Kein Toolpanel.

## 4.3 Signatur-Element

### Die Entität
Ein großer runder Kern zwischen neuronaler Struktur, Resonanzfeld und technischer Maschine.

Funktional ist sie gleichzeitig:
- Dropzone
- Aktivitätsanzeige
- Identität des Produkts
- Review-Trigger
- globaler Zustandsanker

## 4.4 Zustände der Entität

### Idle
Ruhig, leicht lebendig, minimale Bewegung.

### Hover / Drag-Over
Magnetische Reaktion. Der Kreis reagiert mit Sog, Fokus oder Aufweitung.

### Processing
Innere Aktivität steigt. Keine banale Spinner-Logik. Eher Spannungsaufbau, Signalfluss, Verdichtung.

### Review Ready
Die Entität sammelt sich, ein klarer Übergang in den Dialogmodus entsteht.

### Failed / Unclear
Kein dramatischer Fehlerzustand. Ruhige Störung mit präziser nächster Aktion.

## 4.5 Minimale ergänzende Elemente

### Input-Hinweis
Kurzer Mikrohinweis nahe der Entität.

Beispiel:
- Mail, PDF, PPTX, DOCX, Bilder oder Notizen hier ablegen

### Asset-Orbit
Neu eingebrachte Objekte erscheinen kurz als orbitale Fragmente oder Zuflüsse.

### Letzter Impact
Kleine verdichtete Info am Rand.

Beispiele:
- 1 Konflikt erkannt
- 2 Themen ergänzt
- Review für Projekt X bereit

### Review-Trigger
Ruhiger, klarer CTA in Richtung Overlay.

### Projektzugang
Sehr zurückhaltende, sekundäre Möglichkeit, in bestehende Projekte zu springen.
Nicht als dominante Navigation.

---

## 5. Screen 2 — Projekt-Screen

## 5.1 Zweck

Sichtbar machen, was die Entität über ein Projekt weiß.

Nicht als Rohdatenliste, sondern als verdichteter Projektzustand.

## 5.2 Grundaufbau

Der Screen beginnt immer mit dem **aktuellen Stand**.  
Darunter folgen vertikale, aufklappbare Projektfacetten.

Empfohlene Reihenfolge:
1. aktueller Stand
2. wichtigste Änderungen
3. Konflikte
4. Themen
5. Timeline
6. Entscheidungen
7. offene Punkte und Aufgaben
8. Dokumente und Versionen
9. Stakeholder
10. Feedback und Korrekturen

## 5.3 Layoutlogik

- starke vertikale Dramaturgie
- zuerst Lagebild, dann Tiefe
- jede Facette als eigenständiger Block
- Blöcke starten verdichtet und können groß aufgehen
- Querverweise springen direkt zu relevanten Facetten oder öffnen das Overlay

## 5.4 Signatur-Element

### Project State Header
Ein konzentrierter Kopfbereich mit:
- Projektname
- kurzer Lagebeschreibung
- kritischen Änderungen
- Konfliktindikatoren
- letzter Verarbeitungshinweis

Nicht wie Dashboard-Header.  
Eher wie eine redaktionell verdichtete Lagekarte.

## 5.5 Wichtige Facetten

### Aktueller Stand
Kurze, belastbare Projektsicht.

### Änderungen
Was wurde neu erkannt, bestätigt, verschoben, ersetzt oder verworfen?

### Konflikte
Gut sichtbar, nie versteckt.

### Themen
Inhaltliche Cluster mit Quellen, Entscheidungen, Feedback, Korrekturen, offenen Punkten und Dokumenten.

### Timeline
Veränderungsverlauf mit Deltas statt bloßer Chronologie.

### Entscheidungen
Mit Geltungsstatus, Quellenbasis, möglicher Angriffsfläche und Änderungsverlauf.

### Dokumente und Versionen
Nicht Dateiliste, sondern Wissensquellen mit Herkunft und Versionsbezug.

### Stakeholder
Personen, Organisationen, Beziehungen.

### Feedback und Korrekturen
Kein Nachgang. Dauerhaft sichtbarer Querlayer.

---

## 6. Systemweiter Modus — Dialog-Overlay

## 6.1 Zweck

Das Dialog-Overlay ist der eigentliche Interaktionsraum zwischen Nutzer und Entität.

Es dient für:
- Review
- Korrektur
- Feedback
- Konfliktklärung
- Umzuordnung
- Präzisierung
- Commit oder Verwerfung

## 6.2 Charakter

Vollbild. Hohe Fokussierung. Alles außerhalb tritt zurück.

Der Nutzer soll hier das Gefühl haben, dass die Entität einen konkreten Fall mit ihm bearbeitet.

## 6.3 Grundaufbau

Kein Chatstream.

Stattdessen ein **dynamisch komponierter Gesprächsraum** aus Boxen, die je nach Fall nebeneinander, untereinander oder sequenziell erscheinen.

Typische räumliche Logik:
- links oder oben: erkannte Information
- daneben: Zuordnung oder Kontext
- darunter: Alternativen, Konflikt oder Auswahl
- am Abschluss: Bestätigen / Verwerfen / Präzisieren

## 6.4 Gesprächsboxen

### Wissensbox
Zeigt den erkannten Sachverhalt.

### Zuordnungsbox
Zeigt, wohin die Entität ihn eingeordnet hat.

### Konfliktbox
Zeigt Spannungen, Kollisionen oder Unsicherheiten.

### Auswahlbox
Bietet Alternativen an.

### Eingabebox
Erlaubt kurze manuelle Präzisierung.

### Kontextbox
Zeigt Quelle, Begründung, Ursache.

### Aktionsbox
Schließt den Review-Fall.

## 6.5 Visuelle Eigenschaften der Boxen

- umrandet
- gerundet
- klar typisiert
- ruhig, aber deutlich interaktiv
- konsistente Innenabstände
- keine laute Formularästhetik
- Zustandswechsel über Fokus, Dichte und feine Betonung

## 6.6 Ablaufgefühl

Nicht hektisch. Nicht verspielt.

Eher so:
- Fall wird aufgezogen
- relevante Elemente erscheinen
- Nutzer versteht den Sachverhalt schnell
- Optionen sind klar
- Commit fühlt sich eindeutig an

---

## 7. Interaktionsregeln

## 7.1 Review ist immer explizit
Jeder Fall endet mit einer klaren Nutzeraktion.

## 7.2 Boxen entstehen aus dem Fall
Die UI komponiert aus maschinenlesbaren Box Specs, nicht aus starren Formularseiten.

## 7.3 Quellenzugang ist direkt
Wo immer möglich, springt der Nutzer von einer Erkenntnis in ihren Quellkontext.

## 7.4 Konflikte werden räumlich gegenübergestellt
Widerspruch braucht Sichtbarkeit. Kein verstecktes Metadatenlabel.

## 7.5 Feedback und Korrektur sind überall
Sie sind kein Sonderbereich, sondern ein Layer über die gesamte App.

## 7.6 Delta ist sichtbar
Änderungen werden nicht nur erwähnt, sondern spürbar gegen Vorzustand gezeigt.

---

## 8. Beispielhafte UI-Flows

## 8.1 Upload → Review
1. Nutzer droppt eine Datei in die Entität.
2. Die Entität verarbeitet und verdichtet.
3. Das Overlay öffnet sich.
4. Wissensbox zeigt das erkannte Wissen.
5. Zuordnungsbox zeigt das vorgeschlagene Projekt.
6. Auswahlbox erlaubt Projektwechsel.
7. Kontextbox erklärt die Begründung.
8. Aktionsbox bietet Bestätigen oder Abbrechen.
9. Nach Commit springt der Nutzer in das aktualisierte Projekt oder zurück zur Entität.

## 8.2 Konflikt im Projekt → Overlay
1. Nutzer sieht im Projekt einen Konfliktmarker.
2. Klick öffnet das Overlay.
3. Zwei konkurrierende Aussagen, Entscheidungen oder Termine stehen gegenüber.
4. Kontextbox zeigt Quellenbasis.
5. Auswahlbox fragt nach Auflösung.
6. Commit schreibt neue Gültigkeit.

## 8.3 Korrektur aus Projekt heraus
1. Nutzer öffnet ein Thema oder Dokument.
2. Er startet Korrektur.
3. Overlay zeigt aktuellen Stand und betroffenen Zusammenhang.
4. Eingabebox und Auswahlbox ermöglichen Präzisierung oder Umzuordnung.
5. Commit aktualisiert Projektzustand und Delta.

## 8.4 Feedback auf eine erkannte Erkenntnis
1. Nutzer sieht eine Entscheidung, einen Themenblock oder ein Dokument.
2. Er gibt Feedback.
3. Overlay öffnet den betroffenen Kontext.
4. Entität zeigt erkannte Interpretation und Quelle.
5. Nutzer präzisiert oder korrigiert.
6. Commit erzeugt Change Event und aktualisiert den Zustand.

---

## 9. Navigation und Orientierung

Die Hauptorientierung der App läuft nicht über klassische Module, sondern über Zustandswechsel:
- Entität
- Projekt
- Overlay

Weitere Orientierung entsteht durch:
- Projektkontext
- aktive Facette
- Konfliktmarker
- Änderungsmarker
- Quellbezug
- Review-Status

Eine klassische Sidebar kann es höchstens als schwache Sekundärstruktur geben.  
Sie darf nie die Hauptidee des Produkts übernehmen.

---

## 10. Designkonsequenz aus der Technik

Weil die eigentliche Intelligenz im unsichtbaren Orchestrierungs- und Kernzustands-Layer sitzt, darf die UI nie wie Tool-Verkabelung aussehen.

Der Nutzer sieht:
- eine Entität, die versteht
- Projekte, die klar werden
- einen Dialog, der präzise klärt

Nicht sichtbar sind:
- Parserwahl
- Graphlogik
- Canonical State
- Agentenrouting
- Toolaufrufe

Genau das macht die Produktform stark.
