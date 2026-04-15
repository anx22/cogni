# Produktintelligenz — Aktuelle Implementierungen & Entscheidungen

## Status: Phase 0–2 (Setup, Entity Screen & Datenmodell)

### Getroffene Entscheidungen

| Entscheidung | Ergebnis | Begründung |
|---|---|---|
| Knowledge Graph | **Graphiti** gewählt | Temporale Beziehungen, Fact Invalidation, Widerspruchslogik als Kern. Cognee verworfen (Risiko Vermischung Produktlogik/Engine). |
| Design-System | Dunkles Theme, glasartig, dezente Verläufe | Gemäß Designhaltung: reduziert, ruhig, technisch |
| Entität-Animation | CSS Gradients mit Blur (21st.dev-inspiriert) | Kein Canvas nötig für V1, performant, wartbar |
| Hauptnavigation | Keine klassische Sidebar | Orientierung über Zustandswechsel: Entität ↔ Projekt ↔ Overlay |

### Aktuell implementiert

- [x] Projektstruktur und Dokumentation (`docs/`)
- [x] Design-System: Dunkles Theme mit HSL-Tokens
- [x] Entität-Screen mit animiertem Kern (5 Zustände)
- [x] Dropzone-Funktionalität
- [x] Lovable Cloud aktiviert (Supabase-Backend)
- [x] Supabase-Datenmodell (24 Tabellen, 9 Enums, RLS, Storage)
- [ ] Projekt-Screen
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
