# Produktintelligenz — Aktuelle Implementierungen & Entscheidungen (v2-synchronisiert)

## Status: Phase 0–3.6 abgeschlossen

### Aktuell implementiert
- [x] Projektstruktur und Dokumentation (`docs/`, v2-synchronisiert)
- [x] Design-System: Dunkles Theme mit HSL-Tokens
- [x] Entität-Screen mit animiertem Kern, Dropzone (noch kein universeller Input)
- [x] **Side-Grids am Entitäts-Screen** (Phase 3.6) — schwebendes Projekt-Grid links (4×5 Kacheln, Pagination, Drop-Zone-Schutz, Tastaturnavigation), Platzhalter-Grid rechts
- [x] Lovable Cloud aktiviert
- [x] Supabase-Datenmodell (24 + 3 Tabellen) inkl. `gap_signals`, `dependencies`, `outcome_signals`, `dialog_sessions`; Enum `box_type` um `gap_box` erweitert
- [x] **Vier-Rollen-Projektscreen** (Phase 3.5) — `LageZone`, `HandlungsbedarfList`, `VerlaufFeed`, `SubstanzSection`
- [x] **Audit & Verfeinerung Projekt-Screen** (Phase 3.6)
  - Gap- und Dependency-Signale sichtbar im `SignalStrip` (Lage-Zone)
  - Dependencies als Handlungsbedarf-Items mit eigenem `ObjektTyp: "dependency"`
  - Stakeholder-Liste via Popover (Name/Rolle/Org)
  - Feedback-/Korrektur-Button auf Lagebild und Verlauf-Einträgen (hover-revealed)
  - Konflikt-Eintrag im Verlauf optisch markiert (rote Punkt-Markierung)
  - Toast-Brücken auf allen bisher toten Buttons (Themen, Dokumente, SourceMarker, Konflikt-Items, Handlungsbedarf-Aktionen, Verlauf-Einträge)
  - Stats-Cleanup: `konflikte`/`handlungsbedarf`/`stakeholder` nicht mehr hardcoded, sondern aus `array.length` abgeleitet
  - Dokumente nach Datum sortiert
  - Themen mit Status-Indikator (offene Punkte → Punkt am Titel)
- [x] **Dialog-Overlay (Phase 4)** — Vollbild-Overlay mit 8 Box-Typen / 6 Zuständen als Systembaukasten. **Minimalprinzip für V1**: pro Anlass nur 1–2 Boxen (Inhalt + ggf. Antwort/Widerspruch). Eingabe-/Konflikt-/Gap-Boxen schließen sich selbst ab. Begriffe vereinheitlicht: `Antworten` (Einstieg) und `Übernehmen` (Abschluss). Eskalieren/Mergen/separater Aktionsblock aus der Standard-UI entfernt.
- [ ] Universeller Input (Phase 5)
- [ ] Upload-Pipeline (Phase 6)
- [ ] Knowledge-Graph-Integration (Phase 7, Graphiti)

### Komponenten-Inventar Projekt-Screen
- `ProjectScreen.tsx` — Layout-Komposition, 60/40-Mittelteil (Verlauf links, Handlungsbedarf rechts)
- `LageZone.tsx` — Hero-Lagebild, Meta-Strip, Konflikt-Banner, Outcome, SignalStrip
- `HandlungsbedarfList.tsx` — vier Arbeitsmodi, expandierbare Rows, Toast-Aktionen
- `VerlaufFeed.tsx` — Filter-Chips, Timeline mit Konflikt-Markierung, Feedback-Button
- `SubstanzSection.tsx` — Themen-Karten + sortierte Dokumentliste
- `shared/ConflictBanner.tsx` — klickbare Konflikt-Items
- `shared/SignalStrip.tsx` — Gaps + Dependencies kompakt
- `shared/StakeholderPopover.tsx` — Stakeholder-Liste on demand
- `shared/FeedbackButton.tsx` — universelle Feedback/Korrektur-Affordance
- `shared/SourceMarker.tsx` — Provenance-Chip (klickbar)
- `shared/ObjectToken.tsx` — Icon+Farbe pro ObjektTyp (inkl. `dependency`)
- `shared/DeltaTag.tsx` — Delta-Visualisierung im Verlauf

### Bekannte Phase-4-Aufhängungen (Toast-Brücken)
Alle `toast()`-Aufrufe im Projekt-Screen sind explizite Übergabepunkte für Phase 4 (Dialog-Overlay):
- Konflikt-Items → Konfliktbox
- Themen-Karten → Drilldown / Themen-Box
- Dokument-Zeilen → Preview / Versionshistorie (Phase 6)
- Handlungsbedarf-Buttons (Bearbeiten / Inline antworten) → passende Box-Typen
- SourceMarker → Quellen-Ansicht
- Verlauf-Einträge → Detail / verknüpfter Konflikt
- Feedback-Button → Korrektur-Dialog

### Was bleibt unverändert
- Drei Außenmodi (Entität / Projekt / Overlay)
- Stack: Lovable + Supabase + Unstructured + Knowledge Graph
- Review-vor-Commit, Provenance, Delta-Logik
- Designhaltung: dunkel, glasartig, ruhig, technisch
- Entity-Screen-Animation und Zustandswechsel

### Datenmodell (aktueller Stand)

**Enums:** asset_type, processing_status, delta_type, review_status, box_type (8 Werte inkl. gap_box), box_state, fact_type, decision_status, contradiction_type, dependency_type, gap_status, dialog_status

**Tabellen:** projects, assets, sources, parsed_documents, proposed_facts, canonical_facts, review_sessions, review_cases, change_events, commit_results, topics, decisions, deadlines, tasks, open_points, persons, organizations, project_stakeholder_links, contradictions, feedback, corrections, fact_references, version_links, project_state_snapshots, **gap_signals**, **dependencies**, **outcome_signals**, **dialog_sessions**

### Nächster Schritt
**Phase 4 — Dialog-Overlay**. Alle Toast-Brücken werden durch echte Box-Aufrufe ersetzt. 8 Box-Typen (inkl. Gap-Box) mit 6 Zuständen.
