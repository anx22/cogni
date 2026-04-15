## Produktintelligenz – Implementierungsplan

### Phase 0: Dokumentation & Projektsetup

- Verzeichnis `docs/` anlegen mit:
  - `docs/produkt-gesamt.md` – Gesamtprodukt-Dokumentation (Vision, Modell, Prinzipien)
  - `docs/implementierung-aktuell.md` – Aktuelle Implementierungen & getroffene Entscheidungen
  - `docs/geplant.md` – Geplante Umsetzungen & Roadmap
  - `docs/input/00-06-PRODUKTKERN.md` – Originalinput
  - `docs/input/08-DESIGN-UND-UI-SPECS.md` – Originalinput
  - `docs/input/07-09-TECH-UND-ROADMAP.md` – Originalinput
- Memory-System mit Kernregeln befüllen

### Phase 1: Entität-Screen (Hauptscreen)

- Fast leerer Screen mit zentralem, animiertem Entitäts-Kern (Canvas/animated css gradients with blur, inspirated by 21st.dev)
- 5 Zustände: Idle (subtile Bewegung), Hover/Drag-Over (magnetischer Sog), Processing (Spannungsaufbau), Review Ready (Fokussierung), Failed (ruhige Störung)
- Dropzone-Funktionalität über den gesamten Kern (PDF, DOCX, PPTX, Bilder, Notizen, .eml)
- Minimale Begleitelemente: Input-Hinweis, letzter Impact, Review-Trigger, zurückhaltender Projektzugang
- Asset-Orbit: Neu eingebrachte Objekte als kurze orbitale Fragmente

### Phase 2: Supabase-Datenmodell (Kanonischer Kern)

- Kerntabellen: assets, sources, parsed_documents, proposed_facts, canonical_facts
- Review-Objekte: review_sessions, review_cases, change_events, commit_results
- Projektobjekte: projects, topics, decisions, deadlines, tasks, open_points
- Querobjekte: contradictions, feedback, corrections, references, version_links
- project_state_snapshots für verdichteten Zustand
- Stakeholder: persons, organizations, project_stakeholder_links
- Vollständige Provenance: Quelle, Zeitpunkt, Extraktionslauf, Review-Entscheidung
- RLS-Policies und Auth

### Phase 3: Projekt-Screen

- Project State Header: Projektname, Lagebeschreibung, kritische Änderungen, Konfliktindikatoren
- 10 aufklappbare Facetten in vertikaler Dramaturgie:
  1. Aktueller Stand (verdichtetes Lagebild)
  2. Wichtigste Änderungen (Deltas sichtbar gegen Vorzustand)
  3. Konflikte (prominent, nie versteckt)
  4. Themen (inhaltliche Cluster)
  5. Timeline (Veränderungsverlauf, nicht bloße Chronologie)
  6. Entscheidungen (mit Geltungsstatus)
  7. Offene Punkte & Aufgaben
  8. Dokumente & Versionen
  9. Stakeholder
  10. Feedback & Korrekturen
- Progressive Offenlegung: Blöcke starten verdichtet, können aufklappen

### Phase 4: Dialog-Overlay

- Vollbild-Overlay über beide Screens
- 7 Gesprächsbox-Typen: Wissensbox, Zuordnungsbox, Konfliktbox, Auswahlbox, Eingabebox, Kontextbox, Aktionsbox
- Boxen: umrandet, gerundet, ruhig-interaktiv, mit 6 Zuständen (vorgeschlagen, aufgeklappt, geändert, bestätigt, verworfen, eskaliert)
- Dynamische Komposition aus Review Cases – kein Chat, kein Formular
- Commit-Flow: Bestätigen / Verwerfen / Präzisieren → Schreibt in kanonischen Zustand

### Phase 5: Upload-Pipeline (Intake → Review)

- Upload-Handler mit Dateityp-Erkennung
- Supabase Storage für Originaldateien
- Integration mit Unstructured API für Parsing/Partitioning
- Strukturierte Extraktion: Personen, Orgs, Themen, Entscheidungen, Termine, Aufgaben
- Proposed Facts in Supabase schreiben
- Review Cases automatisch generieren
- Overlay mit komponierten Gesprächsboxen öffnen

### Phase 6: Graphiti-Integration (Knowledge Graph)

- Graphiti als temporalen Wissensmotor anbinden
- Parsed Documents → Graph Nodes/Edges
- Themenbezüge, Stakeholder-Beziehungen, Versionshinweise erzeugen
- Widerspruchserkennung gegen bestehende Fakten
- Delta-Logik: bestätigen, ergänzen, ersetzen, widersprechen, zusammenführen, verwerfen
- Ergebnisse als reviewbare Vorschläge nach Supabase zurückschreiben

### Designprinzipien (durchgängig)

- Extrem reduziert, ruhig, technisch, konzentriert, große typo, frei glassartig mit dynamischen dezenten verläufen
- Viel Ruhefläche, starke Zentrierung
- Dunkler/neutral, keine Dashboard-Ästhetik
- Keine klassische Sidebar als Hauptnavigation
- Kein Auto-Commit – alles über Review
- Jede Erkenntnis hat Quelle und Delta

### Entscheidung Knowledge Graph

- **Graphiti** wird empfohlen (temporale Beziehungen, Fact Invalidation, Widerspruchslogik als Kern)
- Cognee verworfen (Risiko der Vermischung von Produktlogik und Engine)