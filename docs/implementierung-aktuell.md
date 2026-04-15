# Produktintelligenz — Aktuelle Implementierungen & Entscheidungen

## Status: Phase 0–3 (Setup, Entity Screen, Datenmodell, Projekt-Screen)

### Getroffene Entscheidungen

| Entscheidung | Ergebnis | Begründung |
|---|---|---|
| Knowledge Graph | **Graphiti** gewählt | Temporale Beziehungen, Fact Invalidation, Widerspruchslogik als Kern. Cognee verworfen (Risiko Vermischung Produktlogik/Engine). |
| Design-System | Dunkles Theme, glasartig, dezente Verläufe | Gemäß Designhaltung: reduziert, ruhig, technisch |
| Entität-Animation | CSS Gradients mit Blur (21st.dev-inspiriert) | Kein Canvas nötig für V1, performant, wartbar |
| Hauptnavigation | Keine klassische Sidebar | Orientierung über Zustandswechsel: Entität ↔ Projekt ↔ Overlay |
| Navigation Entity↔Projekt | Zustandswechsel auf gleicher Seite | Kein Routing, Entity schrumpft / Projekt gleitet herein |
| Projekt-Screen Layout | Bento Grid, volle Breite, Apple-Keynote-Feeling | Schwebend, dynamische Kachelgrößen, großzügiges Padding |
| Lagebild | Fließtext + Kennzahlen kombiniert | Oben Lagetext, darunter verdichtete Stats als Facetten-Einstieg |
| Datenquelle Phase 3 | UI-First mit Demo-Daten | Schnelle Design-Validierung, echte Anbindung folgt |

### Aktuell implementiert

- [x] Projektstruktur und Dokumentation (`docs/`)
- [x] Design-System: Dunkles Theme mit HSL-Tokens
- [x] Entität-Screen mit animiertem Kern (5 Zustände)
- [x] Dropzone-Funktionalität
- [x] Lovable Cloud aktiviert (Supabase-Backend)
- [x] Supabase-Datenmodell (24 Tabellen, 9 Enums, RLS, Storage)
- [x] Projekt-Screen mit Bento Grid Layout
- [x] 10 Facetten-Komponenten mit Demo-Daten
- [x] Zustandswechsel Entity ↔ Projekt (gleiche Seite)
- [ ] Dialog-Overlay
- [ ] Upload-Pipeline
- [ ] Graphiti-Integration

### Datenmodell (Phase 2)

**Enums:** asset_type, processing_status, delta_type, review_status, box_type, box_state, fact_type, decision_status, contradiction_type

**Kerntabellen:** projects, assets, sources, parsed_documents, proposed_facts, canonical_facts

**Review-Pipeline:** review_sessions, review_cases, change_events, commit_results

**Projektobjekte:** topics, decisions, deadlines, tasks, open_points

**Stakeholder:** persons, organizations, project_stakeholder_links

**Querobjekte:** contradictions, feedback, corrections, fact_references, version_links

**Aggregat:** project_state_snapshots

**Storage:** `assets`-Bucket mit RLS (Upload/View/Delete nur eigene Dateien)

### Projekt-Screen Architektur (Phase 3)

**Komponenten:**
- `ProjectScreen` — Hauptcontainer mit Bento Grid
- `ProjectHeader` — Projektname, Lagetext, Stat-Chips
- `BentoCard` — Wiederverwendbare glasartige Karte mit optionalem Expand
- 10 Facetten: Lagebild, Änderungen, Konflikte, Themen, Timeline, Entscheidungen, Offene Punkte, Dokumente, Stakeholder, Feedback

**Layout:** Bento Grid mit variablen Spalten (1–4), responsive, volle Breite mit großzügigem Padding
