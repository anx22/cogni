# Produktintelligenz — Geplante Umsetzungen & Roadmap (v2)

## Phase 4: Dialog-Overlay ✓ (abgeschlossen, V1-Minimalprinzip)

**Leitprinzip:** Die 8 Box-Typen sind ein **Systembaukasten, kein Pflichtsatz pro Fall**. Einfache Projekt-Overlays folgen dem Muster **Inhalt + ggf. Widerspruch/Kontext + Antwort** — meist 1–2 Boxen.

**Standardmuster nach Trigger:**
- Handlungsbedarf → Sachverhalt + Antwort
- Konflikt → Konflikt mit eingebauter Auswahl + optionaler Begründung
- Gap → Lücke mit eingebauter Antwort
- Feedback → nur Eingabefeld
- Dokument / Quelle / Thema / Verlauf → reine Kontext-Box

**Begriffe (V1):** `Antworten` als Einstieg, `Übernehmen` als Abschluss. Eingabe-/Konflikt-/Gap-Boxen schließen die Session selbst beim Senden. Eskalieren / Mergen / separater Aktionsblock entfernt aus der Standard-UI (intern weiter verfügbar).

**Nicht in V1 sichtbar:** `vorgeschlagen`, `aufgeklappt`, `eskaliert` als prominente Nutzerlabels.

## Phase 6: Upload-Pipeline ✓ (V1 abgeschlossen)

- Auth (Email/Passwort, Auto-confirm), `useAuth`-Hook, `/auth`-Route
- Storage-Bucket `intake-files` (privat, RLS pfadbasiert)
- `useIntake` echt: Datei → Storage + assets-Insert + invoke `intake-process`; Notiz/Link → asset mit `metadata.kind`
- Edge Function `intake-process` (Unstructured) → `parsed_documents` + `sources`, Status pending → processing → completed/failed
- Realtime-Subscription auf `assets` spiegelt Verarbeitungsstatus auf den Kern
- `RecentAssets` (rechtes SideGrid) zeigt letzte 16 Inputs mit Typ-Icon + Status-Punkt

**Out of Scope (Phase 7+):** Voice-Aufnahme, Proposed-Facts-Generierung, Knowledge-Graph, Projekt-Zuordnung beim Intake, Dokument-Preview

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
- ✓ Phase 3.6: Side-Grids Entity-Screen + Audit-Verfeinerung Projekt-Screen
- ✓ Phase 3.7: Auflösung „Signale"-Zone + Manuell-Kennzeichnung
- ✓ Phase 4: Dialog-Overlay (Minimalprinzip, manuell-Flag automatisch)
- ✓ Phase 5: Universeller Input (Drop am Kern + Click-Overlay mit Pills)
- ✓ Phase 6: Upload-Pipeline V1 (Auth + Storage + Edge Function + Realtime)
