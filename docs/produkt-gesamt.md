# Produktintelligenz — Gesamtprodukt-Dokumentation

## Vision

Produktintelligenz ist eine zentrale Entität, die rohe Projektobjekte aufnimmt, sie projektübergreifend versteht, Veränderungen gegen bestehendes Wissen abgleicht, Widersprüche sichtbar macht und daraus im Dialog mit dem Nutzer einen belastbaren Projektzustand formt.

**Kein** klassisches Projektmanagement-Tool. **Kein** Dateimanager. **Kein** Graph-Viewer.

## Drei sichtbare Modi

1. **Entität-Screen** — Globaler Eingang, Upload, Intake, Verarbeitung, Review-Einstieg
2. **Projekt-Screen** — Verdichteter Projektzustand mit 10 aufklappbaren Facetten
3. **Dialog-Overlay** — Vollbild-Review aus komponierten Gesprächsboxen

## Produktgefühl

Der Nutzer verwaltet keine Daten. Er füttert eine Entität. Die Entität verarbeitet, ordnet, vergleicht, markiert und fragt dort nach, wo menschliche Bestätigung nötig ist.

## Harte Prinzipien

- Außen extrem reduziert, innen hochstrukturiert
- Review immer vorhanden — kein Auto-Commit
- Jede relevante Erkenntnis hat Quelle und Delta
- Feedback und Korrektur sind allgegenwärtig
- Projektzustand > Rohdatenlisten
- Konflikte sind Kernfunktion, keine Nebenfunktion

## Fachmodell

### Primärobjekte
Projekt, Nachricht, Dokument, Person, Organisation

### Erkenntnisobjekte
Thema, Entscheidung, Termin, Aufgabe, Offener Punkt

### Querobjekte
Feedback, Korrektur, Referenz, Widerspruch, Versionsbezug, Änderungsereignis

### Aggregat
Aktueller Projektstand (verdichtetes Lagebild)

## Intelligenz-Pipeline

1. **Intake** — Upload heterogener Assets (Mail, PDF, PPTX, DOCX, Bilder, Notizen, .eml)
2. **Preparation** — Dateityp erkennen, Text extrahieren, bereinigen, Metadaten erfassen
3. **Extraction** — Personen, Orgs, Themen, Entscheidungen, Termine, Aufgaben, offene Punkte
4. **Linking** — Gegen bestehendes Wissen prüfen, Konflikte berechnen
5. **Review Assembly** — Review Cases und Gesprächsboxen bauen
6. **Commit** — Nach Nutzerentscheidung in kanonischen Zustand übernehmen
7. **Project State Build** — Lagebild, Timeline, Themen, Konflikte aktualisieren

## Dialogsystem

7 Gesprächsbox-Typen: Wissensbox, Zuordnungsbox, Konfliktbox, Auswahlbox, Eingabebox, Kontextbox, Aktionsbox

6 Box-Zustände: vorgeschlagen, aufgeklappt, geändert, bestätigt, verworfen, eskaliert

## Techstack

- **Lovable** — Experience Layer / UI
- **Supabase** — Kanonischer Kernzustand, Auth, Storage, Realtime
- **Unstructured** — Document Intelligence / Parsing
- **Graphiti** — Temporaler Knowledge Graph (gewählt über Cognee)

## Designhaltung

Extrem reduziert, ruhig, technisch, konzentriert. Große Typografie, glasartig mit dynamischen dezenten Verläufen. Viel Ruhefläche, starke Zentrierung. Dunkler/neutral. Keine Dashboard-Ästhetik. Keine klassische Sidebar.
