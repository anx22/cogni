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

## Phase 7: Verstehens-Loop ✓ (abgeschlossen)

- `intake-understand` mit Lovable AI Gateway (Tool-Calling)
- Lexikalisches Projekt-Scoring + Assignment-Agent als Tie-Breaker
- `proposed_facts` mit `delta_type`, Härtung über `understanding_status`

## Phase 7.6: Commit-Pfad vollständig ✓ (Block A4)

- `change_events` pro Commit
- `corrections` wenn `user_decision.content` vom Vorschlag abweicht
- `project_state_snapshots` nach jedem Commit (Counts pro Tabelle)
- Spezialpfade `open_point` → `gap_signals`, `reference` → `dependencies`

## Phase 8: Echte Projekt-Anbindung (Block B) ✓

- **B1**: `ProjectScreen` liest live aus Supabase inkl. Realtime ✓
- **B2**: Routing `/projekt/:id`, ProjectTile-Klick → echtes Projekt ✓
- **B3**: Projekt anlegen (über Side-Grid-Button, Inline-Name-Edit) ✓

## Phase 9: UX-Sweep (Block C) ✓

- Voice-Aufnahme echt (MediaRecorder + Gemini Flash Transkription) ✓
- Retry-Knopf für `failed`/`rate_limited`/`payment_required` ✓
- Asset-Detail-Inline-Card (HoverCard) im Session-Panel ✓

## Phase 10: Knowledge-Graph (V1.1)

- Graphiti anbinden (Entscheidung gesetzt), erst nach stabilem Block A+B

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
