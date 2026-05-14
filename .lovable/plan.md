## Nächster Schritt — Welle B-W3 Gap-Detector

Nach B-W1 (Linker via Graph-Match) und B-W2 (Conflict-Detector) ist als nächstes laut Roadmap **B-W3 Gap-Detector** dran. Danach optional B-W4 Dependency-Detector.

### Ziel B-W3
Nach jedem Canonical-Commit Lücken im Projektzustand erkennen und in `gap_signals` schreiben — deterministisch, fail-soft, idempotent. UI (`GapBox`, `mappers/gaps.ts`) ist bereits da, liest realtime aus `gap_signals`.

### Erkannte Gap-Typen (Stufe 1, deterministisch)

1. **`deadline_without_owner`**
   Deadline-Fakt ohne `assignee`/`owner`/`responsible` im content + kein `fact_references` auf Person/Stakeholder.
   → Title: „Verantwortlicher fehlt für Deadline X"

2. **`decision_without_deadline`**
   Decision-Fakt ohne korrespondierende Deadline (gleicher normalisierter Title oder verlinkt via `fact_references`).
   → Title: „Umsetzungsfrist fehlt für Entscheidung X"

3. **`task_without_due_date`**
   Task-Fakt ohne `due_date` im content.
   → Title: „Frist fehlt für Aufgabe X"

Jede Lücke hat: `affects` (was ist betroffen), `impact` (warum kritisch — fixed string pro Typ), `canonical_fact_id`.

### Implementation

**Neu:** `supabase/functions/commit-fact/gapDetector.ts`
- `detectGapsPure(fresh, projectFacts) → DetectedGap[]` — pure Funktion, testbar.
- `detectAndPersistGaps(admin, args)` — side-effect-Wrapper, fail-soft, idempotent über `(project_id, title, status='open')`.

**Edit:** `supabase/functions/commit-fact/kernel.ts`
- Nach `detectAndPersistConflicts` zusätzlich `detectAndPersistGaps` aufrufen (parallel via `Promise.all`).

**Neu:** `supabase/functions/commit-fact/gapDetector_test.ts`
- 6+ Pure-Tests: jeder Gap-Typ einmal positiv, einmal negativ (z.B. Deadline mit Owner → kein Gap).
- Mit bestehender 20er-Suite → Ziel 26+ grün.

### Verifikation
1. `deno test supabase/functions/commit-fact/` → grün.
2. `commit-fact` deploy.
3. Smoke in Sandbox: 1 Deadline ohne Owner committen → `gap_signals`-Row erscheint, `GapBox` rendert.

### Doku
- `docs/NOW.md`: B-W3 live, Sprint-Update.
- `docs/DECISIONS.md`: [2026-05-14] Gap-Detector deterministisch in commit-fact statt im AOL-Service (Konsistenz mit B-W2).
- `.lovable/plan.md`: B-W3 als done markieren, B-W4 als nächsten Schritt vormerken.

### Bewusst nicht heute
- **B-W4 Dependency-Detector** — kommt nach Sandbox-Validierung von B-W3 (gleiche Architektur, andere Heuristik: blockiert_durch / wartet_auf via `against_fact_id` + Title-Substring-Match).
- **React Query** — Wave 3.
- **LLM-basierte Gap-Heuristik** — Wave 3, jetzt nur deterministisch.

### Stop-Bedingungen
- Falls `gap_signals` durch frühere Migrations Pflichtfelder hat, die hier fehlen → erst Schema-Check, dann Mapping anpassen.
- Falls Tests > 100ms langsam werden (Bestand-Read pro Commit) → mit `fact_type`-Filter eingrenzen wie in B-W2.
