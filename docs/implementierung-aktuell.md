# Produktintelligenz — Aktuelle Implementierungen & Entscheidungen (v2-synchronisiert)

## Status: Phase 0–3 abgeschlossen, Phase 3 muss zurückgesetzt werden

### Bruchstellen durch v2-Inputs

| Bereich | v1 (alt) | v2 (neu) | Auswirkung |
|---|---|---|---|
| Projektscreen-Architektur | 10 Facetten / 3 Tabs | **4 feste Rollen** (Lage, Handlungsbedarf, Verlauf, Substanz) | Tab-Modell obsolet, kompletter Rebuild |
| Handlungsbedarf | nicht existent | operatives Zentrum | Neue Hauptkomponente |
| Konflikte | eigenes Panel | Banner in Lage + Marker in Handlungsbedarf + Ereignis in Verlauf | Konfliktpanel weg |
| Änderungen | eigenes Panel | vollständig im Verlauf | bereits entfernt |
| Stakeholder | eigener Tab | nur Header-Material | Hauptpanel weg |
| Themen | gleichrangige Karten | Drilldown-Einstiege | Karten-Logik neu |
| Entscheidungen | eigenes Panel mit allen Status | nur offen/kritisch separat, bestätigte in Verlauf | Aufteilung |
| Universeller Input | nur Dropzone | Datei + Text + Paste + Link + Sprache | Entity-Input erweitern |
| Gap Signals | nicht modelliert | eigene Objektklasse | Datenmodell-Lücke |
| Dependency Signals | nicht modelliert | eigene Relationsklasse | Datenmodell-Lücke |
| Outcome Signal | nicht modelliert | minimales Zielbild | Datenmodell-Lücke |
| Dialogboxen | 7 Typen | 8 Typen (+Gap-Box) | Phase 4 anpassen |
| Inhaltliche Regel | gleichlaute Bento-Kacheln | "Zustand, Arbeit, Verlauf, Substanz nie gleichrangig" | aktuelle UI verstößt |

### Korrekturen gegenüber v1
- **Knowledge-Graph-Entscheidung wieder offen** (Graphiti vs. Cognee). v1 hatte Graphiti vorzeitig als entschieden markiert.

### Aktuell implementiert
- [x] Projektstruktur und Dokumentation (`docs/`, v2-synchronisiert)
- [x] Design-System: Dunkles Theme mit HSL-Tokens
- [x] Entität-Screen mit animiertem Kern, Dropzone (noch kein universeller Input)
- [x] Lovable Cloud aktiviert
- [x] Supabase-Datenmodell (24 Tabellen) — **lückenhaft**: gap_signals, dependencies, outcome_signals fehlen
- [~] Projekt-Screen mit Tab-Architektur — **muss zurückgesetzt werden**
- [ ] Vier-Rollen-Projektscreen (Lage / Handlungsbedarf / Verlauf / Substanz)
- [ ] Datenmodell-Erweiterung (Phase 2.5)
- [ ] Dialog-Overlay
- [ ] Universeller Input
- [ ] Upload-Pipeline
- [ ] Knowledge-Graph-Entscheidung + Integration

### Was bleibt unverändert
- Drei Außenmodi (Entität / Projekt / Overlay)
- Stack: Lovable + Supabase + Unstructured + Knowledge Graph
- Review-vor-Commit, Provenance, Delta-Logik
- Designhaltung: dunkel, glasartig, ruhig, technisch
- Entity-Screen-Animation und Zustandswechsel

### Datenmodell (Phase 2 Stand)

**Enums:** asset_type, processing_status, delta_type, review_status, box_type (7 Werte, +gap_box ausstehend), fact_type, decision_status, contradiction_type

**Vorhanden:** projects, assets, sources, parsed_documents, proposed_facts, canonical_facts, review_sessions, review_cases, change_events, commit_results, topics, decisions, deadlines, tasks, open_points, persons, organizations, project_stakeholder_links, contradictions, feedback, corrections, fact_references, version_links, project_state_snapshots

**Fehlend (Phase 2.5):** gap_signals, dependencies, outcome_signals, ggf. dialog_sessions, Enum-Erweiterung box_type um gap_box

### Nächster Schritt
Phase 3.5 — Projekt-Screen Reset auf Vier-Rollen-Modell. Bestehende Tab-Architektur, Bento-Facetten und Lagebild-Panel werden entfernt. Sweeping rebuild.
