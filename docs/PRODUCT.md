# PRODUCT — Produktintelligenz

## Vision

Eine zentrale Entität, die rohe Projektobjekte aufnimmt, projektübergreifend versteht,
Veränderungen gegen bestehendes Wissen abgleicht, Widersprüche und Lücken sichtbar macht
und im Dialog mit dem Nutzer einen belastbaren Projektzustand formt.

## Zielnutzer

Verantwortliche, die mehrere Projekte parallel führen und Wissen aus heterogenen
Quellen (E-Mails, Dokumente, Notizen, Sprache) gebündelt brauchen — ohne klassisches
Dateimanagement-Gefühl.

## Drei Außenmodi

1. **Entität-Screen** — universeller Eingang, Intake, Status, Review-Einstieg.
2. **Projekt-Screen** — verdichteter Zustand in vier festen Rollen (Lage, Handlungsbedarf, Verlauf, Substanz).
3. **Dialog-Overlay** — Vollbild-Review aus 18 Box-Typen × 6 Zuständen, Minimalprinzip 1–2 Boxen pro Anlass.

## Kanonischer Datenfluss

```
asset → parsed_document → proposed_facts → review_cases → (User-Commit)
      → canonical_facts + change_events
      → graphiti_sync_log → Episode/Entities in Neo4j
      → RAG / projektübergreifender Kontext
```

## Vier Rollen des Projekt-Screens

- **Lage** — aktueller Zustand (Lagetext, Konfliktbanner, nächster Termin, Outcome).
- **Handlungsbedarf** — entscheiden / klären / umsetzen / prüfen.
- **Verlauf** — chronologischer Feed mit Delta-Tags.
- **Substanz** — Themen-Drilldown, Dokumente mit Versionen.

## Universeller Input

Eine Eingangsfläche für: Datei (PDF/DOCX/PPTX/Bild/.eml/Notiz), Freitext/Paste, URL,
Sprachaufnahme, Antworten aus dem Overlay.

## Intelligenz-Pipeline

1. **Intake** — universeller Input.
2. **Preparation** — Typ erkennen, Text extrahieren, Metadaten.
3. **Extraction** (Welle A live) — Personen/Orgs/Themen/Entscheidungen/Termine/Aufgaben/Gaps/Dependencies.
   AOL-Service lädt projekt­spezifischen Graph-Kontext aus Graphiti und gibt ihn als `graph_hint` mit.
4. **Linking** (Welle B live) — Match gegen Graph statt reinem Title-Match.
5. **Review Assembly** — Cases + Boxen bauen.
6. **Commit** — nach Review in kanonischen Zustand; jeder Commit spiegelt asynchron nach Graphiti.
7. **Project State Build** — Lage/Handlungsbedarf/Verlauf/Substanz aktualisieren.

## Projekt-Zuordnung

Drei Signale, ein Commit-Pfad:

1. **Explizit** — `assets.project_id` bereits gesetzt (User hat im Projekt-Screen abgelegt). Keine Zuordnungsbox.
2. **Lexikalisch** (`projectScoring.ts`) — Projektname +3 · Stakeholder-Name +2 · Themenname +2 · Org-Domain +1.
3. **Agentisch** (`callSuggestAssignment`) — Tie-Breaker; bekommt Rohtext + kompakte Projektliste + lexikalische Hints.

Schwellen (`agentConfig.ts`): `ASSIGNMENT_CONFIDENT_THRESHOLD = 3` (auto, Agent Confidence ≥ 0.6) · `ASSIGNMENT_UNCERTAIN_THRESHOLD = 1` (Auswahlbox) · 0 + Agent leer → „Neues Projekt anlegen". Zuordnungsbox hat `priority: 1000` — erscheint immer vor Wissens-Boxen.

## Harte Prinzipien

- Außen extrem reduziert, innen hochstrukturiert.
- Review immer vorhanden — **kein Auto-Commit**.
- Jede Erkenntnis hat Quelle und Delta.
- Konflikte und Lücken sind Kern, nicht Nebenfunktion.
- Manuelle Eingaben werden nur an der Quelle markiert (`SourceMarker.manuell`), kein eigenes Datenmodell.

## Was es nicht ist

- Kein klassisches PM-Tool, kein Dateimanager, kein Graph-Viewer, kein Dashboard.
- Keine gleichrangigen Bento-Kacheln über Rollen hinweg, kein Dashboard.
- Keine Live-Mail-Sync, keine Team-Kollaboration, keine autonomen Hintergrundimporte (nicht in V1).

## Designhaltung

Dunkel, glasartig, ruhig, technisch. Große Typografie, dezente Verläufe, viel Ruhefläche,
starke Zentrierung. Orientierung über die persistente Projekt-Sidebar (`AppSidebar`) + Zustandswechsel zwischen den drei Außenmodi.
