## Ziel

Stand prüfen, Doku auf einen Stand bringen, Agent Execution Plan auf echte Restschuld eindampfen. Keine neuen Features — nur Audit + Doku.

## Befund (vor Plan)

- **A-Tier:** komplett (A1.1–A3.3) ✅
- **B-Tier:** komplett mit dokumentierten Verschiebungen (B2.2 / B3.1 / B4.2 partial) ✅
- **Welle B (Knowledge-Graph-Linking):** B-W1 Linker, B-W2 Conflict, B-W3 Gap, B-W4 Dependency — alle live, 36/36 Tests grün ✅
- **Master-Checklist:** 8/10 grün; LOC-Budget bewusst akzeptiert
- **Bewusst out of scope (Backlog):** React Query (Wave 3), LLM-Heuristiken (Wave 3), Browser-E2E (Playwright), Tier-B-Restposten ohne Mehrwert
- **Echte offene Findings:**
  1. Graphiti-Sync 24h-Fenster zeigt 60 % wegen 10 Altlasten vor A1.1-Deploy — normalisiert sich, aber nicht final verifiziert
  2. 9 `console.warn` in `_shared/` (best-effort) — unverändert
  3. Vier-Rollen-Screen User-Smoke nach Welle B nicht durchgeführt

## Schritte

### 1. Re-Audit (read-only)

- `graphiti_sync_log` 24h-Fenster aktuell abfragen → Status #1 final beziffern
- `dependencies`/`gap_signals`/`contradictions` Counts pro Sandbox-Projekt → Welle-B-Detektoren produzieren tatsächlich Daten?
- `rg "console\.(log|warn)"` auf `supabase/functions/` → Drift-Check
- Vitest + Deno-Tests Stand bestätigen (60 + 36)

### 2. Doku-Update

- `**docs/audit-2026-05-14.md**`: neuer Abschnitt „Re-Audit nach Welle B" mit Welle-B-Tabelle (B-W1…B-W4 grün), aktualisierte Sync-Rate, Dependency/Gap/Conflict-Counts.
- `**docs/NOW.md**`: 
  - aktuellen Sprint umbenennen zu „Welle B abgeschlossen — Konsolidierung"
  - Backlog neu sortieren: (1) React Query / LLM-Heuristiken (Wave 3, explizit out of scope), (2) Browser-E2E optional, (3) Graphiti-Sync-Diagnose-Loop, (4) `_shared/` console.warn → Logger
  - „Recently completed" um B-W1…B-W4 ergänzen
- `**docs/agent-execution-plan.md**`: Statusspalte am Anfang jedes Tiers (A1/A2/A3/B1/B2/B3/B4) ergänzen — `✅ done`, `⏸ postponed (Wave 3)`, `⚠ partial`. Ausführungsreihenfolge-Tabelle um Status-Spalte ergänzen. Master-Checklist mit Ist-Werten markieren.
- `**.lovable/plan.md**`: archivieren (B-W4 Plan ist erledigt) → Inhalt durch kurzes „Welle B done — nächste Themen liegen im NOW-Backlog" ersetzen.  
  


### 3. Verifikation

- `tsc --noEmit` weiterhin grün
- Alle Tests grün
- Doku-Querverweise konsistent (NOW ↔ audit ↔ execution-plan)

## Bewusst nicht im Scope

- LLM-Heuristik-Erweiterungen (Wave 3)
- React Query (Wave 3)
- Browser-E2E
- LOC-Budget-Reduktion
- Graphiti-Failure-Diagnose-Loop (eigener Loop)