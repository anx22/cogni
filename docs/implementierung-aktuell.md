# Produktintelligenz — Aktuelle Implementierungen & Entscheidungen (v2-synchronisiert)

## Status: Phase 0–9 abgeschlossen + Welle A (Graph-Enrichment) live

### Aktuell implementiert (Frontend)
- [x] Projektstruktur und Dokumentation (`docs/`, v2-synchronisiert)
- [x] Design-System: Dunkles Theme mit HSL-Tokens
- [x] Entität-Screen mit animiertem Kern, Dropzone, universellem Input-Overlay (Pills: Notiz · Link · Datei · Sprache)
- [x] **Side-Grids am Entitäts-Screen** — schwebendes Projekt-Grid links (4×5 Kacheln, Pagination, Drop-Zone-Schutz), `RecentAssets` rechts (letzte 16 Inputs mit Typ-Icon + Status-Punkt)
- [x] **Vier-Rollen-Projektscreen** — `LageZone`, `HandlungsbedarfList`, `VerlaufFeed`, `SubstanzSection`
- [x] **Audit & Verfeinerung Projekt-Screen** — Gaps/Dependencies in Handlungsbedarf, Stakeholder-Popover, Feedback-/Korrektur-Button, Konflikt-Markierung im Verlauf, Toast-Brücken, Stats-Cleanup, sortierte Dokumente
- [x] **Manueller Eingriff — Kennzeichnung** — `SourceMarker` zeigt bei `manuell={true}` ein UserCheck-Icon. Kein Datenmodell, keine Sonderlogik bei Re-Konflikten.
- [x] **Dialog-Overlay** — Vollbild mit 8 Box-Typen / 6 Zuständen als Systembaukasten. Minimalprinzip: pro Anlass nur 1–2 Boxen. Begriffe: `Antworten` / `Übernehmen`. Manuelle Werte aus Boxen werden automatisch als `manuell` markiert.
- [x] **Universeller Input** — Drop am Kern + Klick öffnet Pills-Overlay, `useIntake`-Hook als Eintrittspunkt, Voice via MediaRecorder + Gemini Flash Transkription
- [x] **Routing & Projekt anlegen** — `/projekt/:id`, Projekt anlegen über Side-Grid-Button, Inline-Name-Edit
- [x] **UX-Sweep** — Voice echt, Retry für `failed`/`rate_limited`/`payment_required`, HoverCard Asset-Preview

### Aktuell implementiert (Backend / Pipeline)
- [x] Lovable Cloud aktiviert
- [x] **Datenmodell** — 24 + 3 Tabellen inkl. `gap_signals`, `dependencies`, `outcome_signals`, `dialog_sessions`; Enum `box_type` um `gap_box` erweitert
- [x] **Upload-Pipeline** — Auth, Storage (`intake-files`, RLS pfadbasiert), Edge Function `intake-process` (Unstructured), Realtime auf `assets`. Storage-Keys ASCII-normalisiert via `sanitizeStorageName`.
- [x] **Verstehens-Loop** — `intake-understand` (Lovable AI Gateway, Tool-Calling) erzeugt `proposed_facts` mit `delta_type`, lexikalisches Scoring + Assignment-Agent, `dialog_sessions` + `review_cases`, Härtung über `understanding_status`/`understanding_attempt`.
- [x] **Commit-Pfad** — `commit-fact` schreibt `canonical_facts`, `change_events`, bei Korrektur `corrections` (event_type=`replace`), Spezialpfade `open_point` → `gap_signals`, `reference` → `dependencies`, triggert `project_state_snapshot`.
- [x] **Graphiti-Mirror (commit-fact)** — Jeder Commit spiegelt das Faktum nach Graphiti: `_shared/graphiti.ts` mit URL-Härtung (`https://`-Erzwingung, Path-Normalisierung), async `POST /messages`, Client-seitige UUID für Idempotenz, `graphiti_uuid` zurück nach `canonical_facts`. Fehler werden geloggt, brechen den Commit nicht.
- [x] **AOL-Service (Welle A)** — FastAPI + LangGraph auf Railway. Knoten `router → context_loader → condenser → END`. `context_loader` ruft Graphiti `POST /get-memory` mit `group_id = project_id`, max 20 Facts, formatiert als kompakte Bullet-Liste. `/aol/run` liefert nur `graph_context` zurück. Bewusst kein DB- oder Service-Role-Zugriff.
- [x] **Welle-A-Integration** — `intake-trigger` ruft AOL → erhält `graph_context` → invoked `intake-understand` mit `graph_hint`. `_shared/agentClient.ts → callExtractFacts(text, graphHint?)` hängt den Hint als zweite System-Message vor den User-Text (Limit 4 KB). Fallback auf Legacy-Extraction wenn AOL-Secrets fehlen.
- [ ] **Welle B** — `linker` (Graph-Match), `conflict_detector`, `gap_detector`, `dependency_detector`. Geplant zwischen `interpreter` und `condenser`.

### Backend-Architektur (Datenfluss)

```text
Asset upload
   │
   ▼
intake-trigger (Edge)
   ├─► AOL /aol/run (Railway, LangGraph)
   │      └─ context_loader → Graphiti /get-memory(group_id=project_id)
   │      └─ liefert graph_context (Bullet-Liste, ≤4 KB)
   │
   └─► intake-understand (Edge, Lovable AI Gateway)
          └─ graph_hint als 2. System-Message vor User-Text
          └─ Tool-Calling → proposed_facts + review_cases

User-Review (Dialog-Overlay)
   │
   ▼
commit-fact (Edge)
   ├─► canonical_facts + change_events + project_state_snapshot
   └─► Graphiti /messages (async, Client-UUID, Idempotenz)
          └─ graphiti_uuid → canonical_facts
```

**Besitzschnitt:** Railway hat keinen Service-Role-Key, keinen DB-Zugriff. Alle Schreibpfade laufen ausschließlich über Lovable-Cloud-Edge-Functions.

### Komponenten-Inventar

**Projekt-Screen (Frontend)**
- `ProjectScreen.tsx` — 60/40-Mittelteil (Verlauf links, Handlungsbedarf rechts)
- `LageZone.tsx`, `HandlungsbedarfList.tsx`, `VerlaufFeed.tsx`, `SubstanzSection.tsx`
- `shared/ConflictBanner.tsx`, `shared/StakeholderPopover.tsx`, `shared/FeedbackButton.tsx`
- `shared/SourceMarker.tsx` (mit `manuell`-Flag), `shared/ObjectToken.tsx`, `shared/DeltaTag.tsx`

**Edge Functions (Lovable Cloud)**
- `intake-process` — Unstructured-Parsing, schreibt `parsed_documents` + `sources`
- `intake-trigger` — Orchestriert AOL-Aufruf + intake-understand-Invoke; Legacy-Fallback ohne AOL
- `intake-understand` — AI-Gateway Tool-Calling, akzeptiert optionalen `graph_hint`
- `commit-fact` — Schreibt kanonischen Zustand + spiegelt nach Graphiti
- `_shared/agentClient.ts` — `callExtractFacts(text, graphHint?)`
- `_shared/graphiti.ts` — URL-Härtung, async Mirror-Calls

**AOL-Service (Railway)**
- `aol-service/app/main.py` — FastAPI, `/aol/run`-Endpoint
- `aol-service/app/graph.py` — LangGraph mit `router`, `context_loader`, `condenser`
- `aol-service/app/state.py` — Pydantic-State

### Bekannte Phase-4-Aufhängungen (Toast-Brücken)
Alle `toast()`-Aufrufe im Projekt-Screen sind explizite Übergabepunkte für Dialog-Overlay-Erweiterungen: Konflikt-Items, Themen, Dokumente, Handlungsbedarf-Buttons, SourceMarker, Verlauf-Einträge, Feedback-Button.

### Was bleibt unverändert
- Drei Außenmodi (Entität / Projekt / Overlay)
- Review-vor-Commit, Provenance, Delta-Logik
- Designhaltung: dunkel, glasartig, ruhig, technisch
- Entity-Screen-Animation und Zustandswechsel

### Datenmodell (aktueller Stand)

**Enums:** asset_type, processing_status, delta_type, review_status, box_type (8 Werte inkl. gap_box), box_state, fact_type, decision_status, contradiction_type, dependency_type, gap_status, dialog_status

**Tabellen:** projects, assets, sources, parsed_documents, proposed_facts, canonical_facts (mit `graphiti_uuid`), review_sessions, review_cases, change_events, commit_results, topics, decisions, deadlines, tasks, open_points, persons, organizations, project_stakeholder_links, contradictions, feedback, corrections, fact_references, version_links, project_state_snapshots, gap_signals, dependencies, outcome_signals, dialog_sessions, **aol_runs** (Pipeline-Trace)

### Nächster Schritt
**Welle B**: `linker` gegen Graphiti (statt Title-Match), `conflict_detector`, `gap_detector`, `dependency_detector` zwischen `interpreter` und `condenser` einfügen — sobald Welle A nachweislich Daten in den Graph legt und der Reuse-Check (zweites Asset im selben Projekt → Kontext nicht leer) sauber läuft.
