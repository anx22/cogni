# NOW — Aktueller Sprint & Backlog

> Co-Doku zu `AGENTS.md`, `PRODUCT.md`, `ARCHITECTURE.md`, `DECISIONS.md`.
> Seam-Inventar (lebende QA-Karte) in `./qa-seam-inventar.md`.
> Aktive Refactor-Detailpläne (UI-Milestone) in `./design-implementation-plan.md`.

---

## Aktueller Sprint — UI-Overhaul v2 (Master in `./design-implementation-plan.md`)

Stand 2026-05-14. Vorbereitung + Phase 1 abgeschlossen. Master-Quelle: `docs/design-implementation-plan.md`. Prototyp-Referenz (Code + Screenshots): `docs/redesign/`.

| Phase | Inhalt | Status |
|---|---|---|
| Vorber. | Prototyp & Screenshots nach `docs/redesign/`, Sprint-Block, History-Backup | ✅ |
| 1 | Geist-Font, `[data-theme]`-Tokens (Hex), Utility-Klassen, Tailwind-Aliase, `data-theme="day"` am `<html>` | ✅ Tag, Vitest 60/60 |
| 2 | LageZone Hero (44px Title, 24px Lage, Atmosphären-Stripe + Glow) | ✅ |
| 3 | AppSidebar (240px) + Mini-Entity, ProjectScreen-Layout (Handlungsbedarf links / Verlauf rechts) | ✅ |
| 4 | Home-Screen 3-spaltig: Sidebar · Entity+HomePrompt · ImpactPipelinePanel | ✅ Vitest 60/60, tsc clean |
| 5 | Dialog V2 default: BatchReviewOverlay + FaktDrillOverlay, alte BoxRenderer/BoxFrame/BoxStateBadge + 8 Box-Komponenten gelöscht | ✅ Vitest 60/60 |
| 6 | AssetOrbit (oberer Bogen 225°, Realtime auf assets+dialog_sessions, Klick auf review-ready öffnet Session) | ✅ |

**Stopp-Bedingungen:** keine `src/lib/**`-Edits außer Format-Dateien; `ProjectViewModel`-Vertrag unberührt; Schema/Edge Functions tabu; alte Boxen erst nach Phase-5-Verify löschen; `data-theme` darf nicht durch `.dark` ersetzt werden.

**Welle B / Loops (parallel):**
1. Live-Smoke Welle B ✅ in „Hase & Söhne Couture" — siehe DECISIONS.
2. Loops: Graphiti-Sync-Diagnose · Vier-Rollen-Screen User-Smoke · `_shared/` console.warn → Logger.

### Master-Checklist (Stand)

| # | Check | Ist | Status |
|---|---|---|---|
| 1 | Graphiti-Sync 24h | 29 ok / 10 failed / 24 queued (Altlasten + queued) | ⚠ Diagnose-Loop |
| 2 | Deno-Tests | commit-fact 36/36 + sonstige 14/14 | ✅ |
| 3 | Vitest | 60/60 grün, 10 Files | ✅ |
| 4 | E2E-Smokes | 3/3 in `src/test/e2e-smokes.test.ts` | ✅ |
| 5 | Logger-Coverage | 16/16 Edge Functions | ✅ |
| 6 | strictNullChecks | aktiv (`tsconfig.app.json`) | ✅ |
| 7 | LOC-Budget FE/BE | ~17.9k / ~5.5k — überschritten, akzeptiert | ❌ akzeptiert |
| 8 | UI verhaltensidentisch | nach Welle B nicht final geprüft | ⚠ User-Smoke offen |
| 9 | Wave-B-Detektoren angebunden | alle 4 live, fail-soft, idempotent | ✅ |

### Welle-B-Detektoren — Heuristiken & Testfälle

Alle vier folgen demselben Vertrag: pure `detectXPure(fresh, projectFacts)` + fail-soft `detectAndPersistX`. Parallel via `Promise.all` nach `mirrorToGraphiti`. Idempotent über fachlichen Schlüssel. Kein Detektor bricht je den Commit.

**B-W1 Linker** (`intake-understand/linker.ts` + `_shared/clients/graphitiSearch.ts`)
- Reihenfolge: 1) exact title-Match → 2) Graph-Hit-Substring + same-fact_type-Title → 3) add (kein Match).
- Graphiti-`/search` als Evidenz, nicht als ID-Quelle. Fail-soft auf Title-only-Pfad.
- Tests (6 Pure + 14 Bestand): exact, no-match, hit-but-no-title-overlap, hit-with-title-overlap-other-type, fail-soft auf throw, leere Hits.

**B-W2 Conflict-Detector** (`commit-fact/conflictDetector.ts`)
- Vergleicht frischen Canonical-Fakt deterministisch gegen alle Facts gleichen Typs im Projekt.
- Kinds: gleicher `title` + abweichende Kerngröße (deadline.due_date · decision.outcome/status · task.due_date oder assignee).
- Idempotent über `contradiction_type` + sortiertes Paar (`fact_a_id`, `fact_b_id`).
- Tests (6 Pure): deadline-Datums-Konflikt, decision-Outcome-Konflikt, gleiche Werte → kein Konflikt, Self-Match-Ausschluss, Title-Mismatch → kein Konflikt, Idempotenz beim Re-Run.

**B-W3 Gap-Detector** (`commit-fact/gapDetector.ts`)
- Drei Kinds, deterministisch, idempotent über `(project_id, kind, canonical_fact_id)`:
  - `deadline_without_owner` — fact_type=deadline ohne `assignee`/`owner`/`responsible`.
  - `decision_without_deadline` — fact_type=decision ohne deadline mit Title-Substring im selben Projekt.
  - `task_without_due_date` — fact_type=task ohne `content.due_date`.
- Schreibt in `gap_signals` mit `metadata: {source, kind}`.
- Tests (8 Pure): jeder Kind positiv + negativ, leerer Content, mehrere Tasks, Title-Match-Variationen.

**B-W4 Dependency-Detector** (`commit-fact/dependencyDetector.ts`)
- Zwei Kinds, deterministisch, fail-soft, idempotent über `(source_id, target_id, dependency_type)`:
  - `blockiert_durch` — task mit Trigger-Phrase + Title-Substring eines anderen task/decision/deadline. Token ≥ 4, case-insensitive.
  - `wartet_auf` — deadline, dessen Title/Description einen Decision-Title als Substring enthält.
  - `haengt_ab_von` (für `reference`) bleibt im Kernel — Detektor doppelt nicht.
- Self-Match in beiden Kinds ausgeschlossen.
- Tests (8 Pure): Trigger-Hit, kein Trigger, Trigger ohne Match, Deadline→Decision, Deadline ohne Match, Reference ignoriert, Self-Match, Token-Länge < 4.

**Bewusst nicht in Welle B:** LLM-Heuristiken (semantische Synonyme, Embedding-Ähnlichkeit, Kausalketten). Erst zünden, wenn Sandbox-Recall zu niedrig ist.

---

## Backlog (nach Priorität)

1. **UI-Milestone** — neue Interface-Entwürfe einspielen (Doku folgt vom User). Voraussetzung: Schritt „UI ↔ Core trennen" abgeschlossen.
2. **Loops aus Re-Audit**
   - Graphiti-Sync-Diagnose (`inspect-graphiti diagnose`, failed-Reasons gruppieren).
   - Vier-Rollen-Screen User-Smoke nach Welle B.
   - `_shared/` console.warn → Logger (12 Stellen, niedrige Priorität).
3. **Wave 3 — bewusst zurückgestellt**
   - LLM-Heuristiken für Linker/Conflict/Gap/Dep.
   - React Query (Caching/Mutations).
   - Browser-E2E mit Playwright (Persona-Cookies).
   - LOC-Budget-Reduktion.

---

## Recently completed

- **2026-05-14 — Doku-Konsolidierung Schritt 3** Historik ausgelagert: `agent-execution-plan.md`, `audit-2026-05-14.md`, `agent_review.md` aufgelöst (Endstand in `NOW.md` Master-Checklist, Heuristik-Detail hier, Tier-Entscheidungen in `DECISIONS.md`). `docs/`-Markdown-Dateien: 7 → 5.
- **2026-05-14 — Welle B komplett** B-W1 Linker (Graph-Match) · B-W2 Conflict · B-W3 Gap · B-W4 Dependency live, fail-soft, idempotent, parallel via `Promise.all`. commit-fact-Suite 36/36 grün. Detektor-Footprint Sandbox: Reels-Projekt 1 Dep + 1 Gap, übrige zu klein für Treffer (kein Bug, Datenmangel).
- **2026-05-14 — Welle C Godfile-Eliminierung** commit-fact (-603 LOC), intake-understand (-505 LOC), projectViewModel (-307 LOC). Vitest 60/60, Deno 14/14.
- **2026-05-14 — A-Tier + B-Tier abgeschlossen** strictNullChecks, useProject 3-Schichten, JSONB-Trigger, Logger 16/16, withErrorBoundary auf allen 16 Functions, railway-admin modular (Router 72 LOC + 6 Handler). Master-Checklist 8/10 grün, 2 LOC-Budgets dokumentiert akzeptiert.
