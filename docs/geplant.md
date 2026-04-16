# Produktintelligenz — Geplante Umsetzungen & Roadmap (v2)

## Phase 3.5: Projekt-Screen Reset (NÄCHSTER SCHRITT)

Sweeping rebuild — alte Tab-Struktur, Bento-Facetten und Lagebild-Panel werden entfernt. Fresh take.

### Vier Rollen, vier Komponenten

- **`LageZone`** — Header mit Lagetext, Status-Chips, Konflikt-Banner (conditional), nächster Termin, letzte Änderung, Stakeholder-Zahl, Outcome-Signal
- **`HandlungsbedarfList`** — priorisierte, gruppierte Liste (entscheiden / klären / umsetzen / prüfen). Quick-Actions, Blocker-Marker, Inline-Antwort. Vereint offene Punkte, Aufgaben, unbestätigte Entscheidungen, Konflikte, Gaps, Dependencies, arbeitsrelevantes Feedback.
- **`VerlaufFeed`** — chronologischer Ereignisfeed mit Typfiltern und Delta-Tags. Übernimmt Timeline + bestätigte Entscheidungen + Konfliktereignisse + Uploads.
- **`SubstanzSection`** — Themen-Drilldown + Dokumentliste mit Versionen.

### Demo-Daten erweitern
Gap/Dependency/Outcome-Beispiele in `demoProject.ts` ergänzen.

### Cleanup
Alte Facetten-Komponenten entfernen oder neu zugeordnet einbetten. Tab-System weg.

## Phase 2.5: Datenmodell-Erweiterung (Migration)

- Tabelle `gap_signals` (Wissenslücken mit Lebensdauer)
- Tabelle `dependencies` (Relationsklasse: blockiert durch / wartet auf / hängt ab von)
- Tabelle `outcome_signals` (minimales Zielbild pro Projekt)
- Enum `box_type` um `gap_box` erweitern
- ggf. `dialog_sessions` separat von `review_sessions`
- RLS-Policies für alle neuen Tabellen

## Phase 4: Dialog-Overlay

- Vollbild-Overlay über beide Screens
- **8 Gesprächsbox-Typen** (inkl. neuer Gap-Box) mit 6 Zuständen
- Dynamische Komposition aus Review Cases
- Commit-Flow → kanonischer Zustand

## Phase 5: Universeller Input

Entity-Dropzone ausbauen zu universellem Input-Modul: Datei + Text + Paste + Link + Sprache + Antworten.

**Vor Umsetzung: präzise Ausgestaltung mit Nutzer klären.**

## Phase 6: Upload-Pipeline

- Dateityp-Erkennung + Supabase Storage
- Unstructured API Integration
- Strukturierte Extraktion → Proposed Facts → Review Cases

## Phase 7: Knowledge-Graph-Integration

- **Graphiti ist gesetzt** (Entscheidung final)
- Temporaler Knowledge Graph anbinden
- Delta-Logik: bestätigen, ergänzen, ersetzen, widersprechen, zusammenführen, verwerfen
- Widerspruchs- und Lückenerkennung → reviewbare Vorschläge

## Nicht in V1

- Live-Mail-Sync
- Team-Kollaboration
- Autonome Hintergrundimporte
- Überkomplexe Ontologie
- Auto-Commit ohne Review
