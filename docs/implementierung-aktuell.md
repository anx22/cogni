# Produktintelligenz — Aktuelle Implementierungen & Entscheidungen

## Status: Phase 0–1 (Setup & Entity Screen)

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
- [ ] Projekt-Screen
- [ ] Dialog-Overlay
- [ ] Supabase-Datenmodell
- [ ] Upload-Pipeline
- [ ] Graphiti-Integration
