# Produktintelligenz — Geplante Umsetzungen & Roadmap

## Phase 2: Supabase-Datenmodell

- Kerntabellen: assets, sources, parsed_documents, proposed_facts, canonical_facts
- Review-Objekte: review_sessions, review_cases, change_events, commit_results
- Projektobjekte: projects, topics, decisions, deadlines, tasks, open_points
- Querobjekte: contradictions, feedback, corrections, references, version_links
- project_state_snapshots für verdichteten Zustand
- Stakeholder: persons, organizations, project_stakeholder_links
- Vollständige Provenance + RLS-Policies

## Phase 3: Projekt-Screen

- Project State Header mit Lagebeschreibung
- 10 aufklappbare Facetten (Aktueller Stand → Feedback & Korrekturen)
- Progressive Offenlegung

## Phase 4: Dialog-Overlay

- Vollbild-Overlay über beide Screens
- 7 Gesprächsbox-Typen mit 6 Zuständen
- Dynamische Komposition aus Review Cases
- Commit-Flow → kanonischer Zustand

## Phase 5: Upload-Pipeline

- Dateityp-Erkennung + Supabase Storage
- Unstructured API Integration
- Strukturierte Extraktion → Proposed Facts → Review Cases

## Phase 6: Graphiti-Integration

- Temporaler Knowledge Graph
- Delta-Logik: bestätigen, ergänzen, ersetzen, widersprechen, zusammenführen, verwerfen
- Widerspruchserkennung → reviewbare Vorschläge

## Nicht in V1

- Live-Mail-Sync
- Team-Kollaboration
- Autonome Hintergrundimporte
- Überkomplexe Ontologie
- Auto-Commit ohne Review
