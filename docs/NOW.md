# NOW — Aktueller Sprint & Backlog

> Co-Doku zu `AGENTS.md`, `PRODUCT.md`, `ARCHITECTURE.md`, `DECISIONS.md`.
> Seam-Inventar (lebende QA-Karte) in `./qa-seam-inventar.md`.
> Aktive Refactor-Detailpläne (UI-Milestone) in `./design-implementation-plan.md`.

---

## Aktueller Sprint — UI-Overhaul v2 (Master in `./design-implementation-plan.md`)

Mach ein Dokumentations Review und doublechecke, was alles umgesetzt ist und was nicht. komprimiere vergangenes und schreibe es in die richtigen doc files. Ziel ist design implementation plan loszuwerden und wieder in unsere standard doc architektur zu kommen mit der wir effizient arbeiten koennen

Stand 2026-05-14. Vorbereitung + Phase 1 abgeschlossen. Master-Quelle: `docs/design-implementation-plan.md`. Prototyp-Referenz (Code + Screenshots): `docs/redesign/`.

| Phase   | Inhalt                                                                                                                                                                                                                                                                                                                                                                                                               | Status                     |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| Vorber. | Prototyp & Screenshots nach `docs/redesign/`, Sprint-Block, History-Backup                                                                                                                                                                                                                                                                                                                                           | ✅                         |
| 1       | Geist-Font, `[data-theme]`-Tokens (Hex), Utility-Klassen, Tailwind-Aliase, `data-theme="day"` am `<html>`                                                                                                                                                                                                                                                                                                            | ✅ Tag, Vitest 60/60       |
| 2       | LageZone Hero (44px Title, 24px Lage, Atmosphären-Stripe + Glow)                                                                                                                                                                                                                                                                                                                                                     | ✅                         |
| 3       | AppSidebar (240px) + Mini-Entity, ProjectScreen-Layout (Handlungsbedarf links / Verlauf rechts)                                                                                                                                                                                                                                                                                                                      | ✅                         |
| 4       | Home-Screen 3-spaltig: Sidebar · Entity+HomePrompt · ImpactPipelinePanel                                                                                                                                                                                                                                                                                                                                             | ✅ Vitest 60/60, tsc clean |
| 5       | Dialog V2 default: BatchReviewOverlay + FaktDrillOverlay, alte BoxRenderer/BoxFrame/BoxStateBadge + 8 Box-Komponenten gelöscht                                                                                                                                                                                                                                                                                       | ✅ Vitest 60/60            |
| 6       | AssetOrbit (oberer Bogen 225°, Realtime auf assets+dialog_sessions, Klick auf review-ready öffnet Session)                                                                                                                                                                                                                                                                                                           | ✅                         |
| 7a      | Tag/Nacht-Toggle im AccountDrawer (`localStorage.cogniTheme`, Hydrate in App.tsx)                                                                                                                                                                                                                                                                                                                                    | ✅                         |
| 7b      | Mobile-Audit Projekt-Screen: `100dvh` + Body-Scroll-Lock + `overscroll-contain` auf inneren Container                                                                                                                                                                                                                                                                                                                | ✅                         |
| 7c      | Theme-Bridge: shadcn-HSL-Tokens (--background, --card, --primary, --border, --sidebar-_, ...) in `[data-theme="day"]` und `[data-theme="night"]` neu zugewiesen → alle ui/_ Komponenten erben Day/Night automatisch. Overlay-Tints (`bg-black/80`) in dialog/sheet/drawer/alert-dialog auf `bg-[hsl(var(--background)/0.78)] backdrop-blur-xl`. Restharte Farben (ConfirmDestructive, FacePillCharacter) auf Tokens. | ✅ Vitest 60/60            |
| —       | Realtime-Channel-Kollision behoben: `useRealtimeTables` h\u00e4ngt automatisch `useId`-Suffix an                                                                                                                                                                                                                                                                                                                     | ✅                         |

**Stopp-Bedingungen:** keine `src/lib/**`-Edits außer Format-Dateien; `ProjectViewModel`-Vertrag unberührt; Schema/Edge Functions tabu; alte Boxen erst nach Phase-5-Verify löschen; `data-theme` darf nicht durch `.dark` ersetzt werden.

**Welle B / Loops (parallel):**

1. Live-Smoke Welle B ✅ in „Hase & Söhne Couture" — siehe DECISIONS.
2. Loops: Graphiti-Sync-Diagnose · Vier-Rollen-Screen User-Smoke · `_shared/` console.warn → Logger.

### Master-Checklist (Stand)

| #   | Check                        | Ist                                                | Status             |
| --- | ---------------------------- | -------------------------------------------------- | ------------------ |
| 1   | Graphiti-Sync 24h            | 29 ok / 10 failed / 24 queued (Altlasten + queued) | ⚠ Diagnose-Loop    |
| 2   | Deno-Tests                   | commit-fact 36/36 + sonstige 14/14                 | ✅                 |
| 3   | Vitest                       | 60/60 grün, 10 Files                               | ✅                 |
| 4   | E2E-Smokes                   | 3/3 in `src/test/e2e-smokes.test.ts`               | ✅                 |
| 5   | Logger-Coverage              | 16/16 Edge Functions                               | ✅                 |
| 6   | strictNullChecks             | aktiv (`tsconfig.app.json`)                        | ✅                 |
| 7   | LOC-Budget FE/BE             | ~17.9k / ~5.5k — überschritten, akzeptiert         | ❌ akzeptiert      |
| 8   | UI verhaltensidentisch       | nach Welle B nicht final geprüft                   | ⚠ User-Smoke offen |
| 9   | Wave-B-Detektoren angebunden | alle 4 live, fail-soft, idempotent                 | ✅                 |

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

## Aktueller Sprint — Produktions-Sprint 1: Dialog-Schicht (ab 2026-05-19)

| #     | Aufgabe                                                                                   | Status                                                                                                                      |
| ----- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| P1-F1 | 5 neue Session-Factories (Zuordnung/Korrektur/Versionen/ThemaMerge/Rückfrage)             | ✅ 65/65 Tests, tsc clean                                                                                                   |
| P1-F2 | `aktion`-Box expliziter Renderer mit konfigurierbaren Buttons                             | ✅ über modality-matrix in main's `ReviewRow.tsx`                                                                           |
| P1-F5 | Delta-Tag optional auf Fakt-Ebene in ReviewRow                                            | ✅ DeltaChip in Default-Branch + Sprechhandlungs-Matrix (add/replace/contradict/merge), Backend schreibt context.delta_type |
| P1-F6 | Paste-Preview-Mode in InputOverlay (≥100 Zeichen)                                         | ✅                                                                                                                          |
| P1-B1 | `delta_type ENUM` um `unclear` erweitern oder Mapping dokumentieren                       | ✅ TS-Typ + DeltaTag (DB-Migration offen; `DialogBox` hat parallel `BoxType "unklar"` aus modality-matrix)                  |
| P1-B2 | `ProjectViewModel.coverage`-Felder (knownFacts, openGaps, conflictsActive, lastIntakeAge) | ◐ VM-Daten + Composer ✅; UI-Anbindung offen (main hat LageZone umgebaut)                                                   |
| P1-B4 | Edge Function `topic-merge` + UI-Flow                                                     | ✅ Detector (commit-fact/topicMergeDetector) + EF + topics-Trigger/Backfill + HandlungsbedarfVM mit topic_merge-Objekttyp   |
| P1-F3 | `SubstanzSection` Themen-Cluster zu echtem Drilldown                                      | ✅ `toThemen` sammelt jetzt verknüpfte Decisions + OpenPoints, `buildThemaSession` rendert pro Item eine kontext-Box        |

### 2026-05-20 — Antwort-Pipeline (stilles Daten-Loch geschlossen)

User-Eingaben aus Factory-Sessions fließen jetzt durch die Verstehens-Pipeline statt verworfen zu werden:

- `__submitIntent`-Pattern auf Box-Payload-Ebene (`kind: "intake_note"`, projectId, contextHint, sourceRef)
- `submitNote(text, options)`-Helper in `src/lib/intake/submitNote.ts` — geteilt zwischen `useIntake` und `DialogProvider.commitBox`
- 4 Factories erweitert: `buildHandlungsbedarfSession`, `buildFeedbackSession`, `buildRueckfrageSession`, `buildKorrekturSession` nehmen optional `projectId` und tragen `__submitIntent`
- HandlungsbedarfList, FeedbackButton drillen `projectId` durch
- `hinweis: "Wird vorgemerkt — Persistenz folgt..."` als Lüge aus Factories entfernt

Tests: 67/67 grün (+ 2 neue Unit-Tests für \_\_submitIntent), tsc clean.

### 2026-05-20 — Modality-Matrix Dead-End-Audit

Sieben tote Click-Pfade in Dialog-System glattgezogen (Details in DECISIONS).

| #   | Toter Pfad                                                                | Fix                                                                                                              |
| --- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| 1   | `aktion` ignorierte `payload.aktionen[]`                                  | Eigener Renderer, konfigurierbare Buttons in beiden Overlays                                                     |
| 2   | 5× Sekundär-Buttons sendeten `{secondary:true}` ohne Eingabe              | Inline-Edit (Bezug/Frist/Entscheidung) in ReviewRow + FaktDrillOverlay                                           |
| 3   | `annahme` „Bestätigen" Dublette zu Primary                                | Entfernt                                                                                                         |
| 4   | FaktDrillOverlay's `renderGeneric` = Title + „Bestätigen" für 16 BoxTypes | Modality-aware mit understood/attaches_to/evidence + Factory-Felder                                              |
| 5   | `LageZone` „Material" + „Review öffnen" ohne `onClick`                    | Verdrahtet in `ProjectScreen`: Material → `InputOverlay`, Review → Query `dialog_sessions` + `openSessionFromDB` |
| 6   | 4× Factory-Stubs „folgt in Phase 6" (6 Tage alte Lügen)                   | Entfernt aus `buildDokumentSession`, `buildSourceSession`                                                        |

## Backlog (nach Priorität)

1. **Loops aus Re-Audit**
   - Vier-Rollen-Screen User-Smoke nach Welle B.
   - `_shared/` console.warn → Logger Rest (7 Stellen in graphiti.ts, promptHub.ts, testFixtures.ts — bewusst belassen: Module-Init bzw. silent fail-soft ohne Caller-Logger-Kontext).
2. **Wave 3 — bewusst zurückgestellt**
   - LLM-Heuristiken für Linker/Conflict/Gap/Dep.
   - React Query (Caching/Mutations).
   - Browser-E2E mit Playwright (Persona-Cookies).
   - LOC-Budget-Reduktion.

---

## Recently completed

- **2026-05-21 — inspect-graphiti `diagnose` + agentClient-Logger** Neue Action `inspect-graphiti diagnose` aggregiert `graphiti_sync_log` user-scoped: totals (counts pro status), failed_reasons (normalisiert via UUID/Number-Maskierung, sortiert nach count desc), recent_failures (Top-20). Pure-Modul `diagnose.ts` mit 7 Deno-Tests. `_shared/agentClient.ts`: `callExtractFacts` und `callSuggestAssignment` nehmen optional einen Logger und schreiben prompt-version/source via `log.stage("agent.prompt_used", …)` statt `console.warn`; Aufrufer in `intake-understand/understandRun.ts` durchgereicht. Verbleibende 7 console.warn-Stellen in `_shared/` bewusst belassen (Module-Init in `graphiti.ts`, silent fail-soft in `promptHub.ts`/`testFixtures.ts`, Logger-Selbstaufrufe in `logger.ts`). Vitest 70/70, tsc clean.
- **2026-05-21 — P1-F3 SubstanzSection Drilldown** `ThemaVM` um `items: ThemaItemRef[]` erweitert. `toThemen`-Mapper sammelt jetzt nicht nur Counts, sondern die verknüpften Decisions + OpenPoints (über `decisions.canonical_fact_id === topics.canonical_fact_id`). `buildThemaSession` rendert pro Item eine eigene kontext-Box mit Status-Hint. SubstanzSection bleibt unverändert (`buildThemaSession(t)` bekommt `items` jetzt automatisch via VM). Vitest 70/70 (+2 Mapper-Tests), tsc clean, eslint clean.
- **2026-05-21 — P1-B4 Topic-Merge Full-Stack live** Migration mit `topics`-Backfill + AFTER-INSERT-Trigger auf `canonical_facts` (heilt vestigial `topics`-Tabelle, die seit 2026-04-15 leer war). Neue Tabelle `topic_merge_candidates` mit `pair_key`-Unique-Index für idempotente Erkennung. Detector `topicMergeDetector` (Token-Substring ≥ 4 Zeichen) läuft parallel zu Konflikt/Gap/Dep in `commit-fact/kernel.ts`. Standalone EF `topic-merge` für die User-Aktion. UI-Flow: Kandidaten landen über `toHandlungsbedarf` als `objektTyp='topic_merge'` im Handlungsbedarf-Stream, ActionRow öffnet `buildThemaMergeSession` mit `merge`-Param, `__submitIntent.kind="topic_merge"` routet im `DialogProvider.commitBox` zur EF. Vitest 68/68, tsc clean, eslint clean (auf berührten Dateien).
- **2026-05-21 — Entity-Rotationsreset gefixt** `Entity.tsx`: `presets`-Dependency aus `setSample`-Effect entfernt, Ref-Pattern eingeführt. CSS `siri-orb-rotate` re-startet nicht mehr beim async `useNamespace("orb")`-DB-Load → kein sichtbares Zucken bei Cursor-Bewegung. OrbLab-Preset-Änderungen wirken jetzt erst beim nächsten State-Wechsel (akzeptabel, OrbLab ist Debug-Tool). Vitest 67/67, tsc clean, eslint clean.
- **2026-05-14 — Doku-Konsolidierung Schritt 3** Historik ausgelagert: `agent-execution-plan.md`, `audit-2026-05-14.md`, `agent_review.md` aufgelöst (Endstand in `NOW.md` Master-Checklist, Heuristik-Detail hier, Tier-Entscheidungen in `DECISIONS.md`). `docs/`-Markdown-Dateien: 7 → 5.
- **2026-05-14 — Welle B komplett** B-W1 Linker (Graph-Match) · B-W2 Conflict · B-W3 Gap · B-W4 Dependency live, fail-soft, idempotent, parallel via `Promise.all`. commit-fact-Suite 36/36 grün. Detektor-Footprint Sandbox: Reels-Projekt 1 Dep + 1 Gap, übrige zu klein für Treffer (kein Bug, Datenmangel).
- **2026-05-14 — Welle C Godfile-Eliminierung** commit-fact (-603 LOC), intake-understand (-505 LOC), projectViewModel (-307 LOC). Vitest 60/60, Deno 14/14.
- **2026-05-14 — A-Tier + B-Tier abgeschlossen** strictNullChecks, useProject 3-Schichten, JSONB-Trigger, Logger 16/16, withErrorBoundary auf allen 16 Functions, railway-admin modular (Router 72 LOC + 6 Handler). Master-Checklist 8/10 grün, 2 LOC-Budgets dokumentiert akzeptiert.

---

## 2026-05-18 — Modalitäts-Vertrag (siehe DECISIONS)

Pipeline + UI auf Sprechhandlungs-Modalität umgestellt. `box_type`-Enum um 10 Werte erweitert (additiv). `ReviewRow.tsx` rendert pro Modalität eigene Aktion (Übernehmen / Bezug ändern / Verwerfen). Eingabefeld nur bei `asks`. Stille Substanz ab `confidence ≥ 0.9` ohne Pflicht-Click. `modality=unclear` wird telemetriert.

**Backlog-Loops (Modalität):**

- Korrektur-Schleife: User-Verwerfen/Bezug-Wechsel in `corrections` mit Original-Modalität speichern → in Klassifier zurückspeisen.
- Reference-Token auflösen: heute Klartext-String, später Mini-Token mit Quell-Fakt-Verknüpfung.
- LangSmith-Prompt `extract-facts` Live-Version mit Modalitäts-Block neu publishen (Code-Fallback steckt bereits drin).
