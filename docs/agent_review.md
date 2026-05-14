# Strategische Review: cogni — Vision vs. aktueller Stand

---

## Context

Der User möchte eine ehrliche, strategische Einschätzung des Projekts auf Architekturebene — keine Bugfixes, sondern ein klarer Spiegel: Wo steht die Codebasis gemessen an der Vision? Was ist stark, was ist gefährlich, wie würde ich es angehen?

---

## Die Vision — was cogni wirklich ist

cogni ist **keine PM-App.** Die Vision ist scharf: eine **Produktintelligenz** — eine Entität, die Rohprojekte versteht, Wissen extrahiert, Lücken und Widersprüche sichtbar macht, und einen verlässlichen Projektzustand durch menschlichen Dialog herstellt.

Die drei Kernprinzipien, die alles tragen:
1. **Review-First** — kein Auto-Commit, jeder extrahierte Fakt geht durch menschliche Prüfung
2. **Vier-Rollen-Modell** — jeder Inhalt hat genau eine Rolle (Lage/Handlungsbedarf/Verlauf/Substanz)
3. **Provenienz + Delta** — jeder kanonische Fakt trägt Quelle und Änderungstyp

Das ist eine genuine, differenzierte Produktidee. Kein Dashboard, kein Graph-Viewer, kein Task-Tool.

---

## Gesamtbewertung: Vision vs. aktueller Stand

| Dimension | Vision | Aktueller Stand | Gap |
|---|---|---|---|
| **Datenmodell** | 27+ Tabellen, temporale Facts, Provenienz, Delta | ✅ vollständig umgesetzt | Keiner |
| **Review-First UI** | 8 Box-Typen, 6 Zustände, Dialog-Overlay | ✅ implementiert | Keiner |
| **Vier-Rollen-Screen** | Lage/Handlungsbedarf/Verlauf/Substanz | ✅ live | Keiner |
| **Universal Input** | File, Text, Paste, Link, Voice | ✅ alle 5 Kanäle | Keiner |
| **Graph-Intelligence** | Graphiti als Knowledge Engine, zeitliche Relationen | ⚠️ Mirror läuft (Wave A live), aber 0% Erfolgsrate | **Kritisch** |
| **Konflikte/Gaps/Dependencies sichtbar** | 4 Core Signals im UI | ⚠️ Schema existiert, UI-Sichtbarkeit partiell | Mittel |
| **AOL-Pipeline** | FastAPI + LangGraph auf Railway | ✅ live, aber unzureichend beobachtbar | Mittel |
| **Testbarkeit** | E2E-Smokes + Unit + Integration | ⚠️ 33 Unit-Tests, keine E2E, commit-fact untestbar | Hoch |
| **Observability** | Pipeline-Events, Health-Panel | ⚠️ 33% Coverage (5/15 Edge Functions) | Mittel |

**Kurzurteil:** Die Architektur trägt die Vision. Die Grundfeste sind solide. Aber der kritischste Pfad — der Graph — ist gerade tot.

---

## Das Starke — was ich explizit gut finde

### 1. Das Datenmodell ist exzellent
27 Tabellen, temporale Validität (`valid_from`/`valid_until`), `superseded_by`, Change-Events als Audit-Log, Delta-Typen (confirm/add/replace/contradict/merge/discard) — das ist ein ernsthaftes Wissensmodell, nicht ein CRUD-System. Die RLS-Enforcement ist konsistent, Idempotenz via `extraction_run_id` ist durchdacht.

### 2. Die Architektur-Schichtung ist richtig
Die Ownership-Boundary — Railway hat keinen DB-Key, alle Writes bleiben in Lovable Cloud — ist eine mutige und richtige Entscheidung. Das Coupling-Prinzip (App → Supabase → Unstructured → Graphiti) ist sauber durchgehalten.

### 3. Kein technischer Schuldeneberg
Keine TODOs, keine auskommentierten Blöcke, keine Legacy-Pattern. ESLint + Prettier + Husky ist aktiv. Die Codebasis ist überraschend sauber für ihre Komplexität und Entstehungsgeschichte.

### 4. Das Vier-Rollen-Prinzip ist konsequent umgesetzt
Das Datenmodell und der Project-Screen folgen dem gleichen Prinzip. Kein konzeptioneller Drift zwischen Vision und Implementation.

### 5. Die QA-Dokumentation ist außergewöhnlich gut
Seam-Inventar mit Risikomatrix, detaillierter Audit-Report, priorisierter Fix-Plan — das ist PM-Reife, die man in dieser Projektphase selten sieht.

---

## Das Gefährliche — was ich direkt ansprechen muss

### 1. Graphiti läuft mit 0% Erfolg — das ist ein Totalausfall des Wertversprechens
Die RAG-Pipeline (graph-based matching, Konflikt- und Gap-Detektion via Graph) ist das Herz der Phase-B-Vision. Solange Graphiti 422 wirft, sind alle Canonical Facts Supabase-only. Der Knowledge Graph existiert als Konzept, aber nicht als lebende Entität. Fix ist bekannt (`role: "user"` in `_shared/graphiti.ts`) — das muss sofort raus.

### 2. `strictNullChecks: false` ist eine Zeitbombe
Bei einem System, das mit optionalen DB-Feldern, null-able Relationen und JSONB-Content arbeitet, ist das keine theoretische Gefahr. Das wird zu Runtime-Crashes führen, die der Compiler hätte fangen können. Mittel-/langfristig muss das auf `true`.

### 3. `useProject.ts` (515 Zeilen) und `commit-fact` (643 Zeilen Edge Function) sind God-Objekte
`useProject` führt 16 parallele Queries durch, transformiert ViewModels, aggregiert Handlungsbedarf und subscribed auf Realtime — alles in einem Hook. `commit-fact` schreibt canonical_facts, derived tables, change_events und ruft Graphiti auf. Beides ist schwer zu testen, schwer zu debuggen, schwer zu erweitern. Das `commit-fact`-Problem ist akut, weil die Logik im `Deno.serve`-Closure eingeschlossen ist und Integration-Tests damit faktisch unmöglich sind.

### 4. Keine Validierung der JSONB-Fact-Strukturen auf DB-Ebene
`canonical_facts.content` ist freies JSONB. Die Strukturvalidierung (decisions MÜSSEN title + rationale haben, tasks MÜSSEN assigned_to haben) passiert nur im Frontend. Wenn eine Edge Function einen Fehler macht oder direkter DB-Zugriff genutzt wird, kann Garbage-Data reinrutschen ohne jede Warnung. Langfristig: CHECK-Constraints oder DB-Trigger pro fact_type.

### 5. Kein React Query — fehlende Caching-Schicht
Die App nutzt direkte Supabase-Subscriptions mit 250ms Debounce statt React Query. Das ist für Phase 1 okay, wird aber bei wachsender Datenmenge zu Performance-Problemen führen: keine Normalisierung, kein intelligentes Re-Fetching, kein Background-Refresh-Scheduling. Wenn ein Projekt 500+ Facts hat, wird `useProject` mit seinen 16 parallelen Queries spürbar langsam.

---

## Was ich allgemein denke

Das ist ein ungewöhnliches Projekt. Die meisten Apps in dieser Entwicklungsphase haben entweder eine klare Vision oder eine saubere Codebasis — selten beides. cogni hat beides in einem erstaunlichen Maß. Die Dokumentationstiefe ist nicht Marketing, sondern echter Kompass: die Docs taugen tatsächlich als Entscheidungsgrundlage.

Was mich beeindruckt: Der Mut zur Reduktion. Kein Sidebar, kein Dashboard, kein klassisches Nav-Pattern. Die App folgt ihrer eigenen Logik (State-Transitions statt Routing) und weicht davon nicht ab — das ist selten und richtig.

Was mich besorgt: Die App ist aktuell in einem Zustand, wo der interessanteste Teil (die Graph-Intelligence) tot ist und die kritischsten Funktionen (commit-fact, intake-understand) nicht autonom testbar sind. Das ist kein Drama — es ist lösbar — aber es bedeutet, dass Wave B (conflict_detector, gap_detector, linker) nicht sauber gebaut werden kann, solange Wave A nicht stabil läuft.

**Wie ich es angehen würde:**
Vor jeder Feature-Arbeit (Wave B) würde ich eine harte Stabilitäts-Woche erzwingen: Graphiti fixen, commit-fact in eine testbare Form bringen, Logger-Coverage auf 100% bringen. Erst dann Wave B. Der Versuch, Features auf einem wackligen Fundament zu bauen, ist der klassische Weg zu technischen Schulden.

---

## Empfehlungsplan

### Sofort (diese Woche) — Stabilität vor Features

**1. Graphiti-422 fixen** (2–3h)
- `_shared/graphiti.ts`: `role: "user"` ins POST-Body der `/messages`-Calls
- Danach: manuell 2–3 Facts committen, Graphiti-Sync-Log prüfen
- Erfolgsmetrik: `graphiti_sync_log.status = 'success'` für alle neuen Facts

**2. `commit-fact` refactoren** (3–4h)
- Kernel-Logik aus `Deno.serve`-Closure in eine pure Funktion extrahieren
- 3 Integration-Tests schreiben: happy path, conflict path, re-commit path
- Erfolgsmetrik: `deno test` läuft für `commit-fact` ohne live Supabase-Connection

**3. Logger-Coverage auf 100%** (4h)
- `intake-trigger`, `intake-understand`, `voice-transcribe`, `asset-delete`, `project-delete`, `aol-callback` instrumentieren
- Alle `console.log` in Edge Functions entfernen
- Erfolgsmetrik: Health-Panel zeigt vollständige Pipeline-Traces ohne Lücken

### Kurzfristig (nächste 2 Wochen) — QA-Gate schließen

**4. E2E-Smokes implementieren** (4–6h)
- Drei Pfade: Note → Review → Commit → sichtbar in ProjectScreen
- File-Upload → Review → Commit → canonical_fact prüfbar
- Asset-Delete → Cascade korrekt

**5. Phase-4-Gate vollständig schließen** (3–4h)
- Prettier + lint-staged final konfigurieren
- Nightly CI-Cron für Vitest + ESLint
- ESLint `--max-warnings` auf 0 reduzieren (aktuell 52 conscious warnings)

**6. `strictNullChecks: true` schrittweise aktivieren** (1–2 Wochen parallel)
- Nicht alles auf einmal — per File supprimieren, dann sukzessive aufheben
- Startet bei `lib/` und `types/`, endet bei `hooks/` und `components/`

### Mittelfristig (1 Monat) — Wave B vorbereiten

**7. `useProject.ts` aufteilen**
- `useProjectData.ts` — reine Queries und Supabase-Subscriptions
- `useProjectViewModel.ts` — Transformation und Aggregation
- `useProjectSignals.ts` — Konflikte, Gaps, Handlungsbedarf
- Erst dann: Wave-B-Detektoren können sauber auf diese Schichten aufsetzen

**8. Wave B aktivieren** (nach stabiler Wave A)
- `linker`: graph-basiertes Matching statt Title-Match
- `conflict_detector`: gegen Graph
- `gap_detector`: aus Graph-Kanten
- `dependency_detector`: Graph-Traversal
- Reihenfolge: linker → gap_detector → conflict_detector → dependency_detector

**9. JSONB-Validierung auf DB-Ebene** (Langfristig, parallel zu Wave B)
- CHECK-Constraints oder trigger-based Validation pro `fact_type`
- Schützt Datenintegrität unabhängig vom Frontend-Code

---

## Verification (wie Fortschritt messbar ist)

| Milestone | Erfolgsmetrik |
|---|---|
| Graphiti fix | `graphiti_sync_log`: success-Rate ≥ 95% in 24h |
| commit-fact refactor | `deno test supabase/functions/commit-fact` grün |
| Logger 100% | Alle Pipelines im Health-Panel vollständig tracebar |
| E2E Smokes | 3 Pfade automatisch grün |
| strictNullChecks | TypeScript compile ohne null-Suppressions in lib/ + types/ |
| Wave B | Konflikte und Gaps werden automatisch aus Graph erkannt, UI sichtbar |