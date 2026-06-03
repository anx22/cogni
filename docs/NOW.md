# NOW — MainCompass

> Sessions-übergreifender Kompass. Erst hier lesen, dann gezielt weiter.
> Vision-Detail: `PRODUCT.md` · Architektur: `ARCHITECTURE.md` · Begründungen: `DECISIONS.md` · QA-Karte: `qa-seam-inventar.md` · Visuelle Quelle: `redesign/prototype/` + `redesign/screenshots/`.

---

## Achse 1 — Vision-Säulen (ändern sich nicht)

1. **Ein Eingang** — Entität nimmt jede Quelle (Datei/Text/URL/Sprache/Antwort).
2. **Projektübergreifend verstehen** — Graphiti-Spiegel + AOL-`graph_hint`.
3. **Konflikte + Lücken sind Kern** — sichtbar in Lage + Handlungsbedarf.
4. **Review immer, kein Auto-Commit** — jeder kanonische Fakt geht durch User-Decision.
5. **Quelle + Delta an jeder Erkenntnis** — `source_marker` + `delta_type` durchgehend.
6. **Vier Rollen pro Projekt** — Lage · Handlungsbedarf · Verlauf · Substanz.
7. **Ein Interaktionspunkt** — Dialog-Overlay. Keine Sidebar, kein Dashboard.

---

## Achse 2 — Status (Stand 2026-05-26)

Belastbare Basis steht. Vision-Kern ~90% implementiert, UI-Sprache und Drill-Routing am Prototyp ausgerichtet.

- **Pipeline 7/7**: asset → parsed → proposed → review → canonical + change_events + snapshot → graphiti async.
- **Detektoren 5/5**: Linker · Conflict · Gap · Dependency · TopicMerge.
- **Dialog**: 18 BoxTypes, Factory + DB-Sessions unified, Antwort-Pipeline geschlossen, objektbezogene Drills (Konflikt/Gap/Dependency/Thema/Dokument/Korrektur/Rückfrage).
- **Frontend**: 4 Rollen, AssetOrbit, Realtime, Day/Night-Theme, Geist-Font, shadcn-Bridge auf `--surface-1`/`--hair-2`/`--shadow-pop`.
- **UI-Sprache enttechnisiert**: keine `Konflikt #abc`/`Gap #abc`/`Dependency #abc`/`Thema #…`/`Dokument #…` mehr sichtbar; Lagetext aus Zustand, nicht aus Commit-Log.
- **Redesign durch** (Pässe 1–6 + Audit-Fixbatch): Sidebar, Hero, Mittelfeld, Substanz, BatchReview, FaktDrill — Quelle: `docs/redesign/`.
- **Tests**: Vitest 114/114 grün, Deno-Suiten pro Detector, 19/19 EFs mit Boundary + Logger, RLS überall.

---

## Achse 3 — Drei Milestones zum Prototyp

Statt Backlog-Friedhof: Sprints mit klarem Outcome. Reihenfolge M1 → M2 → M3 (durch) → **M4 (aktiv, priorisiert)**.

### M1 — Provenance & Empfehlung schließen

**Stufe 1 erledigt (2026-05-30):** Empfehlung-First-Drilldown live für Konflikt. `FaktDrillOverlay.renderConflict` zeigt cogni-Empfehlung 36px primär mit Quelle + Begründung, „Übernehmen / Korrigieren / Offen lassen" — Vergleich nur noch sekundär. `deriveEmpfehlung` liefert humane Bausteine („5 Tage neuer · direkte Quelle statt abgeleiteter") statt Prozentwerte.

**Stufe 2 erledigt (2026-06-01):** Empfehlungs-Vertrag generalisiert über Gap / Dependency / Entscheidung. `Empfehlung`-Interface in `types.ts`, deterministische Heuristiken in `mappers/gaps.ts` + `mappers/dependencies.ts` aus vorhandenen Feldern (Alter, Wirkung, Quelle). Session-Factories reichen `empfehlungBlock` einheitlich durch, `FaktDrillOverlay.renderEmpfehlungBuehne` rendert für alle drei Objekttypen die gleiche 36px-Bühne. „Korrigieren" befüllt Gap-Input vor, fällt sonst auf den klassischen Renderer zurück. Tests: `gaps.test.ts` + `dependencies.test.ts` decken Konfidenz-Staffelung + Null-Pfade ab. LLM-Hebung bleibt L1.

### M2 — Entity bleibt überall präsent

Spatial-Continuity-Geste komplettieren. Heute bricht „Entity ist immer da" ab, sobald ein Projekt offen ist.

- **Stufe 1 erledigt (2026-06-01):** `AtmosphereStripe` als eigene Komponente — spiegelt Lebenszustand des Projekts (offen / review-warm via `is-active`). Hängt an `project.handlungsbedarf`.
- ~~Universal-Overlay (⌘+Space)~~ **gestrichen (2026-06-02):** Es gibt kein Entity-Overlay im UI. Ziel ist stattdessen die persistente Entität rechts an der Seite (Main + Projektdetail).
- **Stufe 4 erledigt (2026-06-03) — Entität persistent rechts:** neue `EntityRail`-Komponente (lg+, 220px) trägt die Entität (96px) + optionalen Content-Slot. **Home:** Entität wandert aus dem Zentrum in die rechte Schiene, `ImpactPipelinePanel` liegt als Content darunter, AccountDrawer oben in der Rail; die Mitte wird zur reinen Intake-Bühne (AssetOrbit + HomePrompt). **Projekt:** `EntityRail` rechts statt Mini-Entität in der linken Sidebar — state-bewusst (idle/processing/review-ready), Drop → Intake ans Projekt, Klick bei review-ready → Review öffnen. Damit begleitet die Entität jeden Screen. **M2 abgeschlossen.**
- **Stufe 2 erledigt (2026-06-02):** AssetOrbit-Retry für `failed`-Chips — `retryIntake.ts` als gemeinsame lib-Funktion, failed-Chip zeigt RotateCcw-Icon und ist klickbar. `IntakeSessionsPanel` nutzt dieselbe Funktion.
- **Stufe 3 erledigt (2026-06-02):** Realtime-Hook `useProjectPipeline` — `AtmosphereStripe` erhält `isProcessing` prop, `.is-processing`-CSS (1.6s, sig-action-Farbe) unterscheidet aktive Pipeline-Läufe von offenem Handlungsbedarf.

### M3 — Antwort-Loops schließen

Readonly-Reste auflösen: Verlauf-Notiz, Feedback-Button, Impact-Pfeile. Damit ist der Prototyp ein geschlossener Kreis.

- **Stufe 1 erledigt (2026-06-01):** Inline-„Notiz hinzufügen" im `VerlaufFeed`. Nutzt bestehende `submitNote` mit `sourceRef.type = "verlauf"` — keine neue Edge Function nötig, das `assets`/`intake-trigger`-Routing schließt den Kreis. Optimistic UI + Toast-Feedback.
- `feedback-create` Pfad (Feedback-Button konsolidiert).
- **Stufe 2 erledigt (2026-06-02):** ImpactPipelinePanel-Impact-Rows und Active-Item navigieren per Klick zum Projekt (`/projekt/:id`). `ImpactItem` + `ActivePipelineItem` tragen `projectId`, `loadActive` selektiert `project_id` mit.
- Readonly-Hints aus Dialog-Sessions entfernen, sobald Backend live.

### M4 — Bedeutungs-Integrität & Entity-Identität

> Quelle: KG/RAG-Kern-Review 2026-06-03 (Abgleich gegen Standard-Pattern Proposal→Review→Canonical + Provenance + Confidence/Risk-Routing + Entity-Identity + Feedback-Loop). Detail: `mem://features/entity-identitaet`.
> **Abgrenzung:** M2 ist Entity-**Präsenz** (visuell, `EntityRail`). M4 ist Entity-**Identität** (semantisch: dieselbe Person/Org/Thema über Quellen + Projekte). Verschiedene Schichten — M4 macht das Cross-Project-Versprechen aus Achse 1 §2 erst echt.

Review-First steht, Provenance ist sichtbar (Evidenz-Blockquote im `FaktDrillOverlay`). Was fehlt, sind mehrere Bedeutungs-Schichten, ohne die der Graph Deko bleibt:

- **Stufe 0 — Beleg-Verankerung (vorgezogen, aktiv).** Der Agent liefert schon `evidence` (Zitat), gezeigt wird es aber nur im Konflikt-Drill; kein model/prompt-Version. → (a) nach Extraktion das Zitat per Substring-Match auf ein `parsed_documents.segments[]`-Element abbilden und eine **stabile Segment-Referenz** speichern (`element_id` falls vorhanden, sonst Array-Index); (b) Beleg-Referenz + Modell (`google/gemini-2.5-pro`) + Prompt-Version **first-class in `provenance`** führen (proposed → canonical); (c) Beleg-Zitat an **jeder** Review-Card zeigen, nicht nur im Konflikt-Drill. Segment-Referenz erlaubt später „im Dokument zeigen". Owner-Entscheid: Segment-Referenz statt Offsets/Rohtext (DSGVO-schonend, kein Rohtext-Speichern). Best Practice: Anchor-to-Source / Citation-Grounding.
- **Stufe 1 — Risk-Gate im Silent-Commit (klein, sofort).** `canSilent` (`understandRun.ts`) gated nur auf `confidence ≥ 0.9` + kein Konflikt/`asks`/unclear. Bedeutungstragende Fakten rutschen still durch. → Helper `isRisky()` in `factRules.ts`: nie still bei `fact_type === 'decision'`, `modality ∈ {risk, exclusion, condition, assumption}`, `delta_type ∈ {replace, contradict, merge}` oder gesetztem `against_fact_id` auf decision/deadline/status. **Impact-Achse (gefaltet, 2026-06-03):** zusätzlich nie still bei hoher Tragweite — Fakt betrifft mehrere Projekte/Entities oder hat Budget-/Architektur-Bezug (aus Inhalt/`modality` abgeleitet, kein neues Schema). Damit deckt S1 Confidence **+ Risk + Impact** ab. Reine Funktion, Matrix-Unit-Test. Verhindert stillen semantischen Drift.
- **Stufe 2 — „Anders" / Related-not-same (klein).** Aktuell nur Übernehmen/Korrigieren/Offen-lassen. Es fehlt die wichtigste Identitäts-Aktion: „nicht dieselbe Entität". → Aktion nur sichtbar, wenn ein confirm-Kandidat vorliegt (`delta_type === 'confirm'` && `against_fact_id`). Committet als **neuer** Fakt (delta `add` statt `confirm`) und markiert den Review-Case session-intern als „anders entschieden". Pfad über `commitRoute.planCommitRoute` + `commit-fact/kernel.ts`. **Kein neues Schema** in dieser Stufe — der Insert nutzt nur vorhandene Enums. Das *persistente* Negativ-Link-Gedächtnis (cross-run) landet mit S3 (`entity_link_rejections`), weil es erst der Resolver in S4/S5 liest. Verhindert die häufigste Wissens-Korruption (Ähnlich ≠ Gleich).
- **Stufe 3 — Entity-Identitäts-Schicht (groß, der Kern).** Generische `entities` + `entity_aliases` (bounded `entity_type`: person/organization/topic/tool/artifact). Nullable `entity_id` auf `canonical_facts` + `proposed_facts`. Backfill aus bestehenden stakeholder/topic-Fakten. `pg_trgm`-Index auf `entity_aliases.normalized`. Dazu die winzige `entity_link_rejections`-Tabelle (Negativ-Link-Gedächtnis aus S2; `subject_norm` / `proposed_fact_id` × `rejected_entity_id`, `reason`). **Anti-Bloat:** Entities = nur Identität; Statements bleiben im getypten Fact-Modell, kein generischer Prädikat-Graph.
- **Stufe 4 — Entity-Resolver ersetzt `linker.ts`.** Graphiti-primär (semantisch) **+ deterministischer lokaler Guard** (normalisierter Name + E-Mail-exakt gegen `entity_aliases`) als Fallback, damit Graphiti-Ausfall nicht still Duplikate erzeugt. Output `{ match, candidates[], matched_via: 'local'|'graphiti'|'none' }` — `matched_via` wird geloggt (messen, nicht vertrauen). Mehrdeutig → Review-Card mit Kandidaten + „Anders" (Stufe 2). Eindeutig → confirm-Vorschlag. Kein Match → neue Entity beim Commit.
- **Stufe 5 — Feedback-Schleife minimal schließen.** Resolver liest `entity_link_rejections` → schlägt denselben Falsch-Match nicht erneut vor. Akzeptierte Aliasse wachsen → deterministische Auflösung wird besser. Leichter als L1 (kein Prompt-Lernen — das bleibt zurückgestellt). **Erweitert (spezifiziert, nicht vorgezogen): Fakt-Level-Reject als Negativ-Signal** — heute verschwindet ein abgelehnter Fakt spurlos; künftig erfasst `reject` eine Grund-Taxonomie (`falsch` / `Duplikat` / `irrelevant` / `Beleg fehlt`) in der **vereinheitlichten Negatives-Schicht** (zusammen mit `entity_link_rejections`); Extraktion/Resolver liest sie → kein Re-Vorschlag. Best Practice: rejected = Hard Negative / Edge-Case mit Grund.
- **Stufe 6 — Cross-Project-Identitäts-Signal (UI).** „Dieser Stakeholder erscheint in 3 Projekten" — Read in bestehende `useProject`/`useProjects` falten (kein neuer Roundtrip). Verzahnt mit M2-Präsenz; das ist der Magic-Moment.
- **Stufe 7 — Einheitlicher Fakt-Status (abgeleitet, spätere Stufe).** Status heute über 4 Tabellen verstreut (`proposed_facts.status`, `valid_from/until/superseded_by`, `decisions.status`, `box_state`). → reine **`factStatus()`-Ableitung** (Funktion/View) aus `valid_until`/`superseded_by` + offenen `contradictions`: `active | superseded | contradicted | deprecated | needs_review`. **Keine gespeicherte Spalte** → kein Drift (bitemporale Best Practice; Owner-Entscheid). Speist UI-Badges, Resolver, Projektzustand.
- **Stufe 8 — Aktions-Set vervollständigen: Needs-source + Escalate (aktiv).** Der Commit-Pfad kennt nur `confirm`/`reject`; `escalate:true` aus `FaktDrillOverlay` wird vom Kernel **ignoriert** (toter Pfad), und „Beleg fehlt" ist nur ein Reject-Grund. → (a) **Needs-source** als echte blockierende Aktion: Fakt mit schwachem/keinem Beleg (nutzt S0-Segment-Referenz) geht in einen Wartezustand statt Commit/Reject; (b) **Escalate** zu einem echten zurückgestellten Review-Zustand verdrahten (Kernel respektiert es, Box bleibt offen + markiert). Schließt eine Aktions-Lücke **und** einen latenten Bug.
- **Stufe 9 — Pre-commit Supersede/Contradict-Emission (spätere Stufe).** Heute emittiert der Linker nie `replace`; Ersetzungen/Widersprüche werden erst **nach** dem Commit von den Detektoren erkannt. → Resolver markiert eindeutige „neuer Wert ersetzt alten" / „widerspricht" schon **vor** dem Commit als `replace`/`contradict`-Delta → der Review-Case erscheint sofort als Supersede/Konflikt (Empfehlung-First) statt erst danach. Größerer Umbau → spätere Stufe; S1/S7 + post-commit-Detektoren bleiben Sicherheitsnetz.

Reihenfolge: **S0 (Beleg)** → S1 (inkl. Impact) → S2 → **S8 (Needs-source + Escalate)** → S3 → S4 → S5 (inkl. Reject-Signal) → S6 → S7 (Status, später) → S9 (pre-commit Supersede, später). Owner-Entscheidungen 2026-06-03: generische `entities`-Tabelle · Graphiti-Resolution mit lokalem Guard · Beleg via Segment-Referenz · abgeleiteter Fakt-Status · Reject als Negativ-Signal · **Impact in S1 gefaltet · Needs-source + Escalate aktiv · pre-commit Supersede spätere Stufe** (siehe `DECISIONS.md`).

### Entity-Core (Kernmodul-Refactor) — Fundament für Entity-Präsenz (M2) + Identität (M4)

Die Entität (Gesicht der App) wird zum in sich geschlossenen Modul mit reinem Gehirn, Signal-Interface,
Singleton-Provider und Hybrid-Composer. Volle Spec: `docs/entity-core.md` (Entscheidung: DECISIONS 2026-06-02).
Macht „Ein Eingang" (Säule 1) sauber und die persistente Entität (`EntityRail`, M2) zu einem `useEntity()`-Konsumenten.
Phasen einzeln auslieferbar, visuell zunächst identisch.

- **A** Ordner-Hygiene (7 Fremd-Dateien raus aus `components/entity/`, `RecentAssets` gelöscht) — ✅ 2026-06-02 (auf dev)
- **0** Gehirn-Gerüst (`src/lib/entity/` machine/signals/interaction/signalMapping/deriveExpression/capabilities + Barrel + 36 Tests) — ✅ 2026-06-02 (auf dev)
- **1–7** Provider+Sources (`EntityRail`/Index auf `useEntity()`) · Orchestrator/Visuals · Capability-Vertrag+A11y · Ausdrucks-Engine · Unified Composer · Kommunikation+Orbit · Mehrfach-Mount-Reuse. **Kein ⌘+Space-Overlay** (gestrichen, s. M2) — Wiederverwendung über die persistente `EntityRail` + weitere Mount-Punkte.

### Langfristig (Wave 3 — bewusst zurückgestellt)

| #   | Aufgabe                           | Trigger                                           |
| --- | --------------------------------- | ------------------------------------------------- |
| L1  | LLM-Heuristiken in Detektoren     | Wenn deterministischer Recall zu niedrig wird     |
| L2  | React Query (Caching + Mutations) | Wenn Realtime + manuelle Re-Fetches racen         |
| L3  | Reference-Token-Auflösung         | Wenn Dependency-Detector zu viele False Positives |
| L4  | Voice/Mail-Sync (V2)              | Nach Prototyp-Freigabe                            |

---

## Aktive Loops

- **Graphiti-Sync-Retry** — Cron `*/30 min`, `inspect-graphiti diagnose` für Top-Reasons.
- **Test-Coverage halten** — neue Funktion = Pure-Test, Drift in DECISIONS.
- **Sprach-Restposten** — Audit 2026-06-03: Terminologie auf „Analyse" vereinheitlicht (war Mischung aus „Pipeline"/„Verstehens-Lauf"/„Erkenntnis"). 14 Strings in 7 Dateien. Loop geschlossen.
- **Pre-existing Build-Fehler aus Lovable-Hand-Off** — `useProjectData` Migrations-Drift, `submitNote` DevLogCategory, `VerlaufFeed`. Brauchen klare Backend-Entscheidung, kein blinder Fix.

---

## Recently completed

- **2026-06-03 — M2 abgeschlossen (Entität persistent rechts) + QA-Härtung Commit-Pfad + Vercel-Import** auf `dev`. **Entität persistent (M2 Stufe 4):** neue `EntityRail` (lg+, 220px) trägt die Entität auf Home und Projekt rechts an der Seite — Home: Mitte wird Intake-Bühne, `ImpactPipelinePanel` als Content-Slot, AccountDrawer in der Rail; Projekt: ersetzt Mini-Entität, state-bewusst + Drop-/Review-Eingang. **QA F3/R5:** reine Commit-Routing-Entscheidung aus `DialogProvider.commitBox` in getestetes `src/lib/dialog/commitRoute.ts` (`planCommitRoute`) herausgelöst — 17 neue Pure-Tests decken readonly-Gate, Konflikt-Resolve, Topic-Merge, Intake-Note und commit-fact ab; Seiteneffekte unverändert im Provider. **Terminologie:** auf „Analyse" vereinheitlicht (14 Strings/7 Dateien). **Infra:** `vercel.json` + Deploy-Workflow, Cogni läuft jetzt auf `cogny.vercel.app` (Import aus Lovable-Embedded-Hosting). Tests 114/114 grün, tsc 0.
- **2026-06-02 — Funktional-Sprint 1+2 (Fundament + Pipeline-Sichtbarkeit)** auf `dev`. **Sprint 1 (Fundament):** Archiv-Lifecycle repariert — `ProjectScreen` reicht `project.status` an `ProjectHeaderActions` (zeigt korrekt „Wiederherstellen"), „Archiviert"-Badge im Header, neuer Lazy-Hook `useArchivedProjects` + ausklappbarer Archiv-Bereich in `AppSidebar` mit Wiederherstellen je Zeile (vorher waren archivierte Projekte nur via Undo-Toast erreichbar). Leeres Projekt: Shell-`LageZone` bekommt „Material ablegen"-Button (vorher nur Drag&Drop). **Sprint 2 (Pipeline-Sichtbarkeit):** expliziter „Material wird ausgewertet"-Banner im Projekt-Body (via `useProjectPipeline.isProcessing`), „Klärung öffnen" zusätzlich im immer sichtbaren Sticky-Header, Spinner-Keyframe-Bug (`cogni-orb-rotate-slow` nirgends definiert) in `ProjectScreen` + `ImpactPipelinePanel` auf Tailwind `animate-spin` gefixt. Tests 97/97 grün. **Bewusst gestrichen:** Monetarisierung (nie geplant), Universal-Overlay ⌘+Space (kein Entity-Overlay im UI — Entität bleibt persistent rechts an der Seite, separate UI-Phase).
- **2026-05-30 — Empfehlung-First-Drilldown (M1 Stufe 1)** Konflikt-Bühne umgebaut von neutralem A/B-Vergleich zu „cogni empfiehlt X (Quelle, Begründung) — [Übernehmen] [Korrigieren] [Offen lassen]". Korrigieren expandiert in die alte A/B-Wahl als Sub-State. `deriveEmpfehlung` schreibt Bausteine („N Tage neuer · direkte Quelle statt abgeleiteter") statt Prozentwerte. `payload.empfehlungBlock` als strukturierter Slot in `sessionFactories.buildKonfliktSession`. KonfliktPopover bleibt als Tier-1-Schnellbestätigung, Sprache deckungsgleich. Files: `FaktDrillOverlay.tsx`, `sessionFactories.ts`, `mappers/konflikte.ts`. Sprach-Restposten-Audit erledigt — drei Strings bereits clean. Build-Drift aus Lovable-Hand-Off (`useProjectData`, `submitNote`, `VerlaufFeed`) bleibt separater Block.
- **2026-05-24 — Redesign abgeschlossen + Doku-Konsolidierung** Pässe 1–6 + Audit-Fixbatch durch (Sidebar, Hero, Mittelfeld, Substanz, BatchReview, FaktDrill, Readonly-Sessions, `deriveSignal`, Material/Review-Buttons, Sidebar `onCreateProject`, `escalate`-Payload). `.lovable/plan.md` und `docs/redesign/REVIEW.md` gelöscht — visuelle Quelle bleiben `prototype/` + `screenshots/`.
- **2026-05-22 — K1+K2+K4 aus MainCompass** Migration `delta_type unclear`, Persona-E2E `04-vier-rollen-smoke`, Graphiti-Retry-Loop mit Cron. Risiken offen: Migrations apply + Vault-Secret manuell.
- **2026-05-22 — Test-Overhaul Vitest 70 → 89** Neue Tests für `deriveSignal`, `loadSession`, `assignment` (Deno), `factRules` (Deno). Drift-Fixes in sessionFactories/projectViewModel/gapDetector/projectScoring/commitFact.
- **2026-05-21 — inspect-graphiti `diagnose` + agentClient-Logger-Thread** Reason-Normalisierung pure, Prompt-Version landet im Pipeline-Log.
- **2026-05-21 — P1-F3 SubstanzSection-Drilldown + P1-B4 Topic-Merge Full-Stack** Themen-Karten mit Items, Trigger + Detector + EF + UI-Flow.
- **2026-05-20 — Antwort-Pipeline geschlossen + Modality-Matrix Dead-End-Audit** `__submitIntent` + `submitNote()`, sieben tote Click-Pfade gefixt.
- **2026-05-18 — Modalitäts-Vertrag** 18 BoxTypes, stille Substanz ab `confidence ≥ 0.9`.
- **2026-05-14 — Welle B + A/B-Tier + UI-Overhaul v2** Detektoren, strictNullChecks, Boundary überall, Tokens/Layout/Theme.

---

## Stopp-Bedingungen (immer gültig)

- `ProjectViewModel`-Vertrag in `src/lib/project/types.ts` ist Schnittstelle UI↔Logik. Erweitern OK, umbenennen/entfernen nur mit Mapper-Migration.
- Keine direkten Supabase-Calls aus Komponenten — immer über `src/lib/<domain>/`-Hooks.
- Edge Functions wrappen `withErrorBoundary` + `createLogger`. `console.log` ist CI-blockiert.
- `data-theme="day"|"night"` ist Theme-Quelle.
- Keine `src/lib/**`-Eingriffe für reine Designwünsche.
