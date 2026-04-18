# Produktintelligenz — Geplante Umsetzungen & Roadmap (v2)

## Phase 4: Dialog-Overlay (NÄCHSTER SCHRITT)

- Vollbild-Overlay über beide Screens
- **8 Gesprächsbox-Typen** (inkl. neuer Gap-Box) mit 6 Zuständen
- Dynamische Komposition aus Review Cases
- Commit-Flow → kanonischer Zustand
- **Übergangs-Aufgabe**: Bestehende Toast-Brücken im Projekt-Screen durch echte Box-Aufrufe ersetzen
  - Konflikt-Items (`ConflictBanner`, Verlauf-Konflikt-Einträge) → Konfliktbox
  - Themen-Karten (`SubstanzSection`) → Themen-/Selection-Box
  - Handlungsbedarf-Buttons (Bearbeiten / Inline antworten) → passende Action-/Knowledge-Box
  - SourceMarker → Kontext-Box mit Quellen-Detail
  - Feedback-Buttons (Lagebild, Verlauf) → Korrektur-Box
  - Gap-Items (`SignalStrip`, Handlungsbedarf) → Gap-Box
  - Dependency-Items → Action-Box mit Relations-Kontext

## Phase 5: Universeller Input

Entity-Dropzone ausbauen zu universellem Input-Modul: Datei + Text + Paste + Link + Sprache + Antworten.

**Vor Umsetzung: präzise Ausgestaltung mit Nutzer klären.**

## Phase 6: Upload-Pipeline

- Dateityp-Erkennung + Supabase Storage
- Unstructured API Integration
- Strukturierte Extraktion → Proposed Facts → Review Cases
- Dokument-Preview im Substanz-Bereich (löst Toast-Brücke ab)

## Phase 7: Knowledge-Graph-Integration

- **Graphiti ist gesetzt** (Entscheidung final)
- Temporaler Knowledge Graph anbinden
- Delta-Logik: bestätigen, ergänzen, ersetzen, widersprechen, zusammenführen, verwerfen
- Widerspruchs- und Lückenerkennung → reviewbare Vorschläge

## Phase 8: Echtes Projekt-Routing

- ProjectTile-Klick auf Side-Grid führt zum spezifischen Projekt (statt immer demoProject)
- URL-Routing pro Projekt-ID
- Projekt-Identifier in Header bei Scroll sichtbar

## Nicht in V1

- Live-Mail-Sync
- Team-Kollaboration
- Autonome Hintergrundimporte
- Überkomplexe Ontologie
- Auto-Commit ohne Review

---

## Erledigte Phasen (siehe `implementierung-aktuell.md`)

- ✓ Phase 0–3: Grundgerüst, Design-System, Entity-Screen, Lovable Cloud
- ✓ Phase 2.5: Datenmodell-Erweiterung (gap_signals, dependencies, outcome_signals, dialog_sessions, gap_box)
- ✓ Phase 3.5: Vier-Rollen-Projektscreen
- ✓ Phase 3.6: Side-Grids Entity-Screen + Audit-Verfeinerung Projekt-Screen (Signale, Stakeholder-Popover, Feedback-Affordance, Toast-Brücken)
