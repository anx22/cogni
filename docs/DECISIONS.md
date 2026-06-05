# DECISIONS — Das Warum

> Stehende Grundsatz- & Architekturentscheidungen, thematisch. Hält fest, **warum** etwas so ist und **welche Alternative verworfen** wurde — besonders dort, wo die Realität vom ursprünglichen Plan abwich.
>
> **Abgrenzung:** _Was_ das Produkt ist → `PRODUCT.md` · _Wie_ es gebaut ist (Ist-Zustand) → `ARCHITECTURE.md` · _Was wann geliefert_ wurde → Git (`git log --oneline -- docs/`). Die vollständige chronologische Fassung liegt unter `concept/veraltet/DECISIONS-chronologisch-bis-2026-06-04.md`.

---

## 1. Wissensmotor: Graphiti, nicht Cognee

- **Graphiti statt Cognee** (2026-05-13) — bessere Episode-Semantik, native LangGraph-Integration. Cognee verworfen (Produktmodell + Commit-Logik dürfen nicht im Motor verschwinden).
- **Der Graph ist nie die Wahrheit.** Kanonischer Zustand ausschließlich in Supabase; Graphiti/Neo4j ist nur Spiegel + Kontextprojektion. Integrationstiefe bewusst begrenzt: Wissensmotor nur für Kontext/Relationen/Retrieval/Historisierung.
- **Mirror asynchron + Client-UUID** — Mirror-Fehler brechen den Commit nicht; Idempotenz über Client-UUID. (`graphiti_sync_log.status='ok'` direkt synchron gesetzt.)
- **AOL-Service nur lesend** über Graphiti — alle Schreibpfade laufen ausschließlich über Cloud-Edge-Functions (kein Service-Role-Key auf Railway).

## 2. Review vor Commit — das Kernversprechen

- **Kein Auto-Commit.** Nichts wird kanonisch ohne `review_case.decision = accepted`. Diese Regel ist nicht verhandelbar.
- **Stille Substanz** (2026-05-18) — Fakten mit `confidence ≥ 0.9` (+ kein Konflikt/`asks`/unclear) überspringen die _Review-Fläche_. Schwelle: `SILENT_COMMIT_CONFIDENCE`. _Bewusste Nuance:_ sie werden dadurch nicht auto-committet — sie bleiben unbestätigt. (Spannung mit der Sichtbarkeit im Projektzustand → offenes QA-Risiko, s. `qa-seam-inventar.md`.)
- **Escalate als echter Zustand** (S8) — `escalate:true` stellt einen Fakt zurück statt ihn still zu rejecten (vorher toter Pfad). Verdrahtet 2026-06-04.
- **Commit-Routing testbar herausgelöst** — reine Entscheidung in `commitRoute.planCommitRoute`, Seiteneffekte im Provider. Macht den Hot-Path prüfbar ohne UI-Eingriff.

## 3. Erkenntnis = Empfehlung, nicht Rohvergleich (M1)

- **Empfehlung-First** (2026-05-30) — Drilldowns zeigen cogni-Empfehlung primär (36px) mit Quelle + Begründung; der neutrale A/B-Vergleich ist nur noch sekundärer Fallback. Verworfen: gleichrangiges A/B als Default.
- **Bausteine statt Prozentwerte** — „5 Tage neuer · direkte Quelle" statt „87 %". Berater-Stimme, nicht Maschinen-Stimme.
- **Empfehlungs-Vertrag deterministisch** über Konflikt/Gap/Dependency/Entscheidung — einheitliches `Empfehlung`-Interface, Heuristiken in den Mappern. Kein LLM-Signal (LLM-Hebung bleibt zurückgestellt, L1).

## 4. Modalitäts-Vertrag — wie Fakten zu UI werden

- **Drei Achsen statt `fact_type` allein** (2026-05-18) — Modalität (11 Werte) · `attaches_to` · `asks` (`null` = kein Eingabefeld), plus `understood` + `evidence`. `mapToBoxType` priorisiert Modalität (Konflikt schlägt alles).
- **Ein Pipeline-Pfad für alle Eingaben** — `__submitIntent` → `submitNote` → `intake-trigger`. Kein separater `note-create`/`feedback-create`-EF. Direkte Nutzereingaben = gleichwertige Inputs neben Dateien (gleicher Provenance-Standard).
- **Delta-Tag sichtbar** — `delta_type` → `DeltaChip` (add/replace/contradict/merge; confirm zeigt nichts).

## 5. Entity-Identität — die geplante Kern-Schicht (M4)

> Macht das Cross-Project-Versprechen erst echt. Reihenfolge + Status: `m4-spec.md`. Owner-Entscheidungen 2026-06-03:

- **Generische `entities` + `entity_aliases`** (bounded enum person/org/topic/tool/artifact) — verworfen: getrennte `persons`/`organizations`-Tabellen (wurden nie geschrieben). Nur Identität, kein generischer Prädikat-Graph (Anti-Bloat).
- **Graphiti-primär + lokaler Guard** — semantische Auflösung über Graphiti, deterministischer Fallback (Name + E-Mail) fängt den Fail-soft-Fall, damit ein Graphiti-Ausfall nicht still Duplikate erzeugt. `matched_via` wird geloggt (messen, nicht vertrauen).
- **„Anders"/Related-not-same** — Identitäts-Aktion „nicht dieselbe Entität" verhindert die häufigste KG-Korruption (Ähnlich ≠ Gleich). Persistentes Negativ-Link-Gedächtnis in `entity_link_rejections` (eigene Tabelle, weil `change_events.event_type` ein gebundenes Enum ist).
- **Reject als Negativ-Signal** — abgelehnte Fakten/Links bekommen eine Grund-Taxonomie; Resolver liest sie → kein Re-Vorschlag.
- **Beleg via Segment-Referenz** — Zitat auf `parsed_documents.segments[].element_id` abgebildet, Modell + Prompt-Version in `provenance`. Verworfen: Offsets/Rohtext speichern (DSGVO-schonend).
- **Risk-Gate `isRisky()`** — Confidence ≠ Tragweite: nie still bei decision/risk/replace/Impact, auch wenn confident.
- **Fakt-Status abgeleitet** (`factStatus()`) statt gespeicherter Spalte — kein Drift (bitemporale Best Practice).

## 6. Entität als geschlossenes Modul (Entity-Core)

- **`src/lib/entity/` als eigenständiges Modul** (2026-06-02) — vorher `useState` in `Index.tsx`, Verhalten verteilt, keine Tests. Jetzt reines Gehirn (machine/signals/…), Signal-Interface, `EntityProvider`-Singleton. Öffentliche API nur via Barrel, keine Tiefimporte.
- **Kein ⌘+Space-Overlay** — gestrichen; Wiederverwendung über persistente Mount-Punkte (`EntityRail` u.a.) statt eines Overlays.

## 7. Navigation & UX-Konzept

- **Persistente `AppSidebar`** — _revidierte Entscheidung:_ ursprünglich „keine klassische Sidebar, Orientierung nur über Zustandswechsel" (2026-05-11) → nach User-Test verworfen, weil die Projekt-Übersicht fehlte. Sidebar (Projektliste) seit 2026-05-18, Vision-Doks angepasst. **Weiterhin kein Dashboard.**
- **Home-Entität zentral** (2026-06-04) — die Entität ist auf Home das zentrale Gesicht; `EntityRail` gehört nur auf den ProjectScreen. (Zwischenzeitliche Rail-auf-Home-Platzierung war ein Missverständnis, zurückgebaut.)
- **Lage ≠ Verlauf** — Lagetext aus dem aktuellen Zustand, nicht aus dem Commit-Log.
- **Objekt-spezifisches Drill-Routing** — `buildKonfliktSession`/`buildGapSession`/… statt eines generischen Frames. Substanz ist Wissensfläche (Themen mit Beschreibung), keine Titel+Zahlen-Kacheln.
- **Entity-Visual: CSS-Gradients** statt Canvas — Theme-Tokens nutzbar, ruhige Performance. Overlay-Surfaces auf Cogni-Tokens (`--surface-1`/`--hair-2`/`--shadow-pop`), nicht shadcn-`bg-popover` (Day-Theme-Drift).

## 8. Provenance & Projekt-Zuordnung

- **Drei Signale, ein Commit-Pfad** — explizit (`project_id` gesetzt) · lexikalisch (`projectScoring`) · agentisch (Tie-Breaker). Detail: `PRODUCT.md §Projekt-Zuordnung`.
- **Manuelle Eingaben nur als `SourceMarker.manuell`** — kein eigenes Datenmodell; gleiche Delta-/Gap-/Review-Logik wie Dateien.

## 9. Architektur-Härtung (Grundsatz)

> Leitlinie: die kanonische Wahrheit darf nicht still korrumpieren. Daher strikte Observability + Boundaries statt pragmatischem Ad-hoc-Logging. Konkreter Ist-Zustand (Regeln, Pfade) → `ARCHITECTURE.md`.

- **`withErrorBoundary` + `createLogger` + `pipeline_events`** als einzige Trace-Quelle; jede Stage trägt `correlation_id`. `console.log` CI-blockiert.
- **RLS überall**, Rollen in separater `user_roles`-Tabelle via `has_role()`.
- **Pure-Function-Pattern** — Kernlogik aus `Deno.serve`-Closures herausgezogen (testbar); 3-Schichten-Hook-Pattern (`useXData`/`xViewModel`/`useX`); Detektoren pure + fail-soft + idempotent.
- **Semantische Tokens / Theme-System** — `data-theme="day|night"`, keine Roh-Farben in Komponenten.
- **JSONB-Validierung via Trigger** (CHECK muss IMMUTABLE sein). Test-Disziplin: neue Funktion = Pure-Test, `test_run_id`-Marker + Nightly-Sweep.

## 10. Doku-System (Projekt-Memory)

> Entscheidung 2026-06-04 — die Doku ist das sessions-übergreifende Gedächtnis. Zwei Achsen, sauber getrennt:

- **Zeit (bewegt sich):** `NOW` (Gegenwart) · `PLAN` (Zukunft, vormals ROADMAP) · **Vergangenheit = Git** (`git log --oneline -- docs/`; alten Stand: `git show <commit>:<datei>`). Kein eigenes History-File — Git ist verlustfrei und auslesbar; das _Warum_ kann Git aber nicht, deshalb bleibt DECISIONS kuratiert.
- **Wissen (steht):** `PRODUCT` (was) · `ARCHITECTURE` (wie) · `DECISIONS` (warum, thematisch).
- **`CLAUDE.md`** wird automatisch injiziert (Pflichtregeln), `AGENTS.md` ist der Router. **Branch-Flow:** Direkt-Push auf `dev`, `main` nur via PR.

## 11. Security-Hygiene (Dependabot, 2026-06-05)

> Getrennt vom v1-Dogfood-Meilenstein. Wahrheit = `origin/dev`; npm- (`package-lock.json`) und bun-Lockfile (`bun.lock`) konsistent gehalten.

- **JS/TS-Stack: 0 Vulnerabilities.** Sichere Transitiv-Bumps via `npm audit fix` (ohne `--force`); danach gekoppelter Major-Bump **vitest 3→4 + vite 5→6** (vitest 4 verlangt vite ^6/7/8). Bewertet: `lovable-tagger` (peer vite `>=5 <9`) und `@vitejs/plugin-react-swc` (peer vite `^4..^8`) bleiben kompatibel → Lovables paralleler Build bricht nicht. Gate grün (tsc 0, vitest 205/205, lint 0 Errors, build ok).
- **`bun.lockb` entfernt** — stale seit Template-Commit (2025-01-01), nie gepflegt, von bun bei vorhandenem Text-`bun.lock` ignoriert; eine tote, verwundbar gepinnte Datei.
- **Python (`aol-service/requirements.txt`):** `langsmith 0.1.142→0.8.0` (high+moderate) und `python-dotenv 1.0.1→1.2.2` (moderate) — beide nur transitiv/deklarativ genutzt (kein direkter Import), Resolver-kompatibel mit gepinntem `langgraph 0.2.50` (pip-Dry-Run verifiziert).
- **OFFEN — `langgraph 0.2.50 → 1.0.10` (moderate):** Major-API-Bruch (0.2→1.0), zieht vermutlich `langgraph-checkpoint-postgres` nach. **Nicht blind geforct** — aol-service hat kein Test-Gate; Migration gehört zum Service-Owner mit Python-Lauf. Bis dahin akzeptiertes Restrisiko (moderate, interner Graph-Runtime-Dep).
