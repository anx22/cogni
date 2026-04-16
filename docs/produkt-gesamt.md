# Produktintelligenz — Gesamtprodukt-Dokumentation (v2)

## Vision

Produktintelligenz ist eine zentrale Entität, die rohe Projektobjekte aufnimmt, projektübergreifend versteht, Veränderungen gegen bestehendes Wissen abgleicht, Widersprüche und Lücken sichtbar macht und daraus im Dialog mit dem Nutzer einen belastbaren Projektzustand formt.

**Kein** klassisches Projektmanagement-Tool. **Kein** Dateimanager. **Kein** Graph-Viewer. **Kein** Dashboard.

## Drei sichtbare Modi

1. **Entität-Screen** — Globaler Eingang, universeller Input, Intake, Verarbeitung, Review-Einstieg
2. **Projekt-Screen** — Verdichteter Projektzustand in **vier festen Rollen**
3. **Dialog-Overlay** — Vollbild-Review aus komponierten Gesprächsboxen

## Produktgefühl

Der Nutzer verwaltet keine Daten. Er füttert eine Entität. Die Entität verarbeitet, ordnet, vergleicht, markiert Lücken, erkennt Abhängigkeiten und fragt dort nach, wo menschliche Bestätigung nötig ist.

## Harte Prinzipien

- Außen extrem reduziert, innen hochstrukturiert
- Review immer vorhanden — kein Auto-Commit
- Jede relevante Erkenntnis hat Quelle und Delta
- Feedback und Korrektur sind allgegenwärtig
- Projektzustand > Rohdatenlisten
- Konflikte und Lücken sind Kernfunktionen, keine Nebenfunktionen
- **Zustand, Arbeit, Verlauf und Substanz dürfen nie gleichrangig dargestellt werden**

## Vier Rollen des Projekt-Screens

Jeder Inhalt im Projekt erfüllt genau eine von vier Rollen:

1. **Lage** — Was ist der aktuelle Zustand? (Lagetext, Kennzahlen, Konfliktbanner, nächster Termin, Stakeholder-Kontext, Outcome-Signal)
2. **Handlungsbedarf** — Was muss als Nächstes passieren? (offene Punkte, Aufgaben, unbestätigte Entscheidungen, Konflikte, Gaps, Dependencies, arbeitsrelevantes Feedback — gruppiert in entscheiden / klären / umsetzen / prüfen)
3. **Verlauf** — Was ist passiert? (chronologischer Ereignisfeed mit Delta-Tags: Uploads, bestätigte Entscheidungen, Konfliktereignisse, Änderungen)
4. **Substanz** — Woraus besteht das Projekt inhaltlich? (Themen-Drilldown, Dokumente mit Versionen)

## Fachmodell

### Primärobjekte
Projekt, Nachricht, Dokument, Person, Organisation

### Erkenntnisobjekte
Thema, Entscheidung, Termin, Aufgabe, Offener Punkt

### Querobjekte
Feedback, Korrektur, Referenz, Widerspruch, Versionsbezug, Änderungsereignis

### Neue Signalklassen (v2)
- **Gap Signal** — explizit modellierte Wissenslücke mit eigener Lebensdauer
- **Dependency Signal** — Relationsklasse: blockiert durch / wartet auf / hängt ab von
- **Outcome Signal** — minimales Zielbild pro Projekt (Erfolgskriterium, No-Go)

### Aggregat
Aktueller Projektstand (verdichtetes Lagebild)

## Universeller Input

Ein einziges Eingangs-Modul nimmt heterogene Inputs entgegen:
- Datei-Upload (PDF, DOCX, PPTX, Bilder, .eml, Notizen)
- Freitext / Paste
- Link / URL
- Sprachaufnahme
- Antworten aus dem Dialog-Overlay

## Intelligenz-Pipeline

1. **Intake** — Universeller Input
2. **Preparation** — Typ erkennen, Text extrahieren, bereinigen, Metadaten erfassen
3. **Extraction** — Personen, Orgs, Themen, Entscheidungen, Termine, Aufgaben, Gaps, Dependencies
4. **Linking** — Gegen bestehendes Wissen prüfen, Konflikte und Lücken berechnen
5. **Review Assembly** — Review Cases und Gesprächsboxen bauen
6. **Commit** — Nach Nutzerentscheidung in kanonischen Zustand übernehmen
7. **Project State Build** — Lage, Handlungsbedarf, Verlauf, Substanz aktualisieren

## Dialogsystem

**8 Gesprächsbox-Typen:** Wissensbox, Zuordnungsbox, Konfliktbox, Auswahlbox, Eingabebox, Kontextbox, Aktionsbox, **Gap-Box (neu)**

**6 Box-Zustände:** vorgeschlagen, aufgeklappt, geändert, bestätigt, verworfen, eskaliert

## Techstack

- **Lovable** — Experience Layer / UI
- **Supabase** — Kanonischer Kernzustand, Auth, Storage, Realtime
- **Unstructured** — Document Intelligence / Parsing
- **Knowledge Graph** — Graphiti vs. Cognee, Entscheidung in v2 wieder offen

## Designhaltung

Extrem reduziert, ruhig, technisch, konzentriert. Große Typografie, glasartig mit dynamischen dezenten Verläufen. Viel Ruhefläche, starke Zentrierung. Dunkler/neutral. Keine Dashboard-Ästhetik. Keine klassische Sidebar. Keine gleichrangigen Bento-Kacheln über Rollen hinweg.
