## Welle B abschließen — B-W4 Dependency-Detector

B-W1 Linker (Graph-Match), B-W2 Conflict-Detector, B-W3 Gap-Detector laufen. Übrig aus Roadmap-Punkt 1: **B-W4 Dependency-Detector**.

### Ziel
Nach jedem Canonical-Commit deterministisch erkennen, ob der frische Fakt einen anderen Fakt im selben Projekt blockiert oder von ihm abhängt — und nach `dependencies` schreiben. UI (`DependencyVM`/`mappers/dependencies.ts`) liest realtime, ist bereits da.

### Erkannte Dependency-Kinds

1. **`blockiert_durch`** — frischer **task** mit Hinweisphrase ("blockiert von …", "wartet auf …", "abhängig von …", "depends on …", "blocked by …") im `description`/`text`/`note` referenziert per Substring einen anderen Fakt-Title (task/decision/deadline). → `source = fresh`, `target = match`, `dependency_type = "blockiert_durch"`.
2. **`wartet_auf`** — frische **deadline** referenziert eine andere **decision** (Substring im `title`/`description`). → `source = deadline`, `target = decision`.
3. **`haengt_ab_von`** — bereits abgedeckt für `fact_type === "reference"` direkt im Kernel (Bestand). Bleibt unverändert; Detektor doppelt nicht.

Heuristik bewusst eng (Substring + Triggerwort) — kein LLM. Token-Längenfilter ≥ 4, case-insensitive, normalisierte Whitespaces.

### Implementation

**Neu:** `supabase/functions/commit-fact/dependencyDetector.ts`
- `detectDependenciesPure(fresh, projectFacts) → DetectedDependency[]` — pure, testbar.
- `detectAndPersistDependencies(admin, args)` — fail-soft, idempotent über `(source_id, target_id, dependency_type)` (Read-then-Insert wie bei Conflicts/Gaps).

**Edit:** `supabase/functions/commit-fact/kernel.ts`
- Im `Promise.all` neben Conflict + Gap zusätzlich `detectAndPersistDependencies` aufrufen.

**Neu:** `supabase/functions/commit-fact/dependencyDetector_test.ts`
- 6+ Pure-Tests:
  - task mit "blockiert von Foo" + Foo existiert → 1 dep `blockiert_durch`.
  - task ohne Triggerwort → 0.
  - task mit Trigger aber kein Match-Title → 0.
  - deadline mit Decision-Title-Substring → 1 dep `wartet_auf`.
  - deadline ohne passende Decision → 0.
  - reference-Typ wird vom Detektor ignoriert (Kernel macht es).
  - Self-Match ausgeschlossen.

### Verifikation
1. `deno test commit-fact/` → 34+/34+ grün (28 Bestand + ≥6 neu).
2. `commit-fact` deploy.
3. Smoke in Sandbox: 1 task "blockiert von Tübingen Tower Statik-Freigabe" committen → `dependencies`-Row sichtbar im Project-Screen.

### Doku
- `docs/NOW.md`: B-W4 live, Welle B vollständig abgeschlossen.
- `docs/DECISIONS.md`: [2026-05-14] Dependency-Detector deterministisch (Substring + Trigger), keine LLM-Heuristik in Wave B.
- `.lovable/plan.md`: Welle B done; nächste Themen aus Backlog (React Query Wave 3, Browser-E2E, Tier B Quick Wins).

### Stop-Bedingungen
- Falls `dependencies`-Insert wegen `source_type`-Constraint scheitert (nur "canonical_fact" erlaubt?) → erst Schema-Check, dann Mapping anpassen.
- Falls Trigger-Heuristik zu viele False Positives liefert → Trigger-Liste enger ziehen, Wort-Boundary statt reinem Substring.

### Bewusst nicht heute
- LLM-Dependency-Heuristik (Wave 3).
- React Query, Browser-E2E, Tier B Quick Wins — bleiben Backlog.
