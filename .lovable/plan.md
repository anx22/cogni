## Was noch offen ist — Roadmap zur Vervollständigung

Nach Abschluss von Phase 0–7.7 (Grundgerüst, Vier-Rollen-Projektscreen, Dialog-Overlay, Universeller Input, Upload-Pipeline, Verstehens-Loop) und der jüngsten UX-Korrekturen (Inline-Composer, Session-Panel-Badges, Sanitize-Storage-Keys) ist das Produkt funktional auf Demo-Niveau. Was zur „echten" Produktreife fehlt, sortiert nach Dringlichkeit:

---

### Block A — Kern-Lücken in der Intelligenz-Pipeline (Pflicht für V1)

**A1. Proposed-Facts-Generierung**  
Aktuell wird geparst und auf den Kern gespiegelt, aber es entstehen keine reviewbaren Vorschläge. `intake-understand` muss aus `parsed_documents` strukturierte `proposed_facts` mit `delta_type` (neu / ergänzt / widerspricht / bestätigt) gegen bestehende `canonical_facts` erzeugen. Ohne diesen Schritt bleiben Dialog-Boxen leer bzw. werden nur aus Dummy-Triggern befüllt.

**A2. Linking gegen bestehendes Wissen**  
Vor dem Vorschlag: bestehende Personen, Organisationen, Themen, Termine, Aufgaben matchen (Name/Email/Domain-Heuristik + Embedding-Ähnlichkeit). Erst dadurch entsteht echte Konflikt- und Lückenerkennung statt isolierter Einzel-Extraktionen.

**A3. Projekt-Zuordnung beim Intake**  
Heute landen Assets ohne `project_id`. Eine `ZuordnungsBox` muss im Auto-Dialog erscheinen, wenn der Score nicht eindeutig ist; sonst Auto-Zuweisung mit sichtbarem Quellen-Marker. Scoring-Funktion existiert in `_shared/projectScoring.ts` und wird noch nicht in den Dialog-Flow eingebunden.

**A4. Commit-Pfad vollständig**  
`commit-fact` schreibt heute nur einzelne Fakten. Es fehlt: `change_events` befüllen, `corrections` erfassen wenn Werte im Dialog editiert wurden, `project_state_snapshots` nach jedem Commit aktualisieren, damit Lage/Verlauf des Projektscreens echte Bewegung zeigen.

---

### Block B — Echte Projekt-Anbindung (Pflicht)

**B1. ProjectScreen liest echte Daten**  
Heute zieht der Projektscreen aus `demoProject.ts`. Er muss live aus Supabase laden: `projects`, `canonical_facts`, `decisions`, `tasks`, `deadlines`, `open_points`, `gap_signals`, `dependencies`, `outcome_signals`, `contradictions`, `change_events`, `topics`, `assets`. Inklusive Realtime-Updates.

**B2. Projekt-Routing per ID**  
URL `/projekt/:id`, ProjectTile-Klick auf Side-Grid führt zum spezifischen Projekt statt immer zum Demoprojekt.

**B3. Projekt anlegen / archivieren**  
Mindestminimum: ein Projekt entsteht entweder durch erste Asset-Zuordnung mit „neues Projekt" in der ZuordnungsBox oder durch leeres Anlegen vom Side-Grid aus.

---

### Block C — Sichtbare Lücken am Entitäts-Screen

**C1. Voice-Aufnahme echt machen**  
Pill „Sprache" ist Platzhalter. MediaRecorder + Whisper-Transkription (über Lovable AI) → Notiz-Asset.

**C2. Fehler- und Wiederholungspfade**  
Asset im Status `failed` / `rate_limited` / `payment_required` braucht im Session-Panel einen klaren Wiederholungs-Knopf statt nur Stimme.

**C3. Asset-Detail / Quellansicht**  
Klick auf einen Eintrag im rechten Panel zeigt momentan nichts. Mindestens: Inline-Card mit Originalname, Typ, Parser-Auszug, Verlinkung zum entstandenen Dialog.

---

### Block D — Knowledge-Graph (Phase 7, separat)

Graphiti-Anbindung ist als Entscheidung gesetzt, aber noch nicht implementiert. Realistisch erst nach Block A sinnvoll, weil ohne Proposed-Facts der Graph nichts zu speichern hätte. Vorschlag: **bewusst auf V1.1 verschieben**, V1 läuft auf direkter Supabase-Logik mit Embedding-Matching. Graphiti folgt, sobald A1–A4 stabil sind.

---

### Block E — Politur (nach den Pflichtblöcken)

- Dokument-Preview (PDF/Bild/Email-Body) im Substanz-Bereich
- Versions-Verlinkung sichtbar machen (`version_links` wird geschrieben, aber nicht angezeigt)
- Feedback-Button echt verdrahten (heute nur Toast-Brücke)
- Suche über Projekte und Substanz
- Mobile Layout (heute nur ab `lg` sinnvoll)

---

### Bewusst draußen für V1

- Live-Mail-Sync, Team-Kollaboration, autonome Hintergrundimporte
- Auto-Commit ohne Review
- Dashboards, Diagramme
- Mehrsprachige UI

---

### Empfohlene Reihenfolge

1. **Block A** komplett — ohne echte Vorschläge ist alles andere Fassade
2. **Block B** parallel zum Ende von A — sobald Fakten committet werden, muss der Projektscreen sie zeigen
3. **Block C** als kurzer UX-Sweep
4. **Block D (Graphiti)** als V1.1
5. **Block E** kontinuierlich

### Nächster konkreter Schritt

Ich schlage vor, mit **A1 + A4 zusammen** zu starten: `intake-understand` erzeugt echte `proposed_facts`, daraus baut die bestehende Dialog-Logik echte Boxen, und `commit-fact` schreibt nicht nur Fakten, sondern auch `change_events` und triggert einen `project_state_snapshot`. Damit hat zum ersten Mal ein einziger Upload eine sichtbare Wirkung von Intake bis Projektscreen.

&nbsp;

Wir starten wie vorgeschlagen, aktualisieren den plan in den docs und fahren danach fort.