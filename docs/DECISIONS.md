# DECISIONS — Append-only

Format: `[YYYY-MM-DD] Problem → Choice → Reason`

## 2026-06-03 — 10x-Analyse: Triage & Wave-3-Auswahl

- `2026-06-03` **10x-Analyse (2026-05-18) bewertet, einsortiert & aufgelöst**: 15 Chancen lagen verwaist → nach ROI × Vision-Fit bewertet, in den Fahrplan gehoben, Quelldatei danach entfernt (Erkenntnisse leben in NOW.md weiter). **Jetzt geplant (Wave 3 „Lebendiges System", aktive Stufen LS-1/2/3):** Confidence Decay · Project Pulse · Cross-Project Review-Badge — die machen den Zustand lebendig + holen den Nutzer zurück, auf bestehenden Flächen, kein Dashboard. **Backlog (Langfristig L6–L14):** AOL-Lernring (TODO D4), Export-Briefing, Gesundheits-Score (Owner: „advanced later"), Async AOL (D2), Doc-Diff, Keyboard J/K, Health-Checks, Digest, Demo-Daten-Cleanup. **Erledigt seit 18.05.:** Auto-Konfliktlösung (#8 = M1 Empfehlung-First), ImpactPipelinePanel (#11 = M2). **Wette (L4):** Email-Direct-Connect (#4) — stärkster Adoptions-Hebel, aber V2/Privacy/OAuth → bewusst geparkt. Reason (Owner-Entscheid): lebendiger Projektzustand + Retention zuerst (billig, vision-tragend), die output-/infra-lastigen Hebel folgen nach M4; nichts geht verloren, nichts vorschnell gebaut. Kalibrierung: 10x-Flaggschiff #1 war überzeichnet — `commit-fact` spiegelt Fakten bereits nach Graphiti, offen ist nur der AOL-Lernring.

## 2026-06-03 — Bedeutungs-Integrität & Entity-Identität (M4)

- `2026-06-03` **Risk-Gate im Silent-Commit**: `canSilent` (`understandRun.ts`) gated nur auf `confidence ≥ 0.9` + kein Konflikt/`asks`/unclear → eine hochkonfidente Entscheidung committet still, ohne Review → **Helper `isRisky()` in `factRules.ts`**: niemals still bei `fact_type === 'decision'`, `modality ∈ {risk, exclusion, condition, assumption}`, `delta_type ∈ {replace, contradict, merge}` oder gesetztem `against_fact_id` auf decision/deadline/status-Typ. Reason: Review-First (Achse 1 §4) gilt gerade für Bedeutung. Confidence misst Extraktions-Sicherheit, nicht Tragweite — ein sicher extrahierter „Wir nehmen Neo4j" darf nicht stiller sein als eine unsichere Notiz. Reine Funktion, Matrix-Unit-Test.

- `2026-06-03` **„Anders" / Related-not-same als Identitäts-Aktion**: Review kennt nur Übernehmen/Korrigieren/Offen-lassen → es fehlt „nicht dieselbe Entität, nur ähnlich" → **kontextuelle Aktion**, nur sichtbar wenn confirm-Kandidat vorliegt (`delta_type === 'confirm'` && `against_fact_id`); committet als **neuer** Fakt (delta `add`) und markiert den Review-Case session-intern. Reason: „Ähnlich = Gleich" ist die häufigste Wissens-Korruption in KGs. Ohne diesen Ausweg merged der Reviewer entweder falsch oder lehnt korrekte Fakten ab.

- `2026-06-03` **Negativ-Link in eigener Tabelle, nicht in `change_events`** (Korrektur nach Codex-Review PR #12): `change_events.event_type` ist `public.delta_type` (`confirm/add/replace/contradict/merge/discard`) — ein erfundenes `link_rejected` würde am Enum-Insert scheitern → **dediziertes `entity_link_rejections`** (`subject_norm`/`proposed_fact_id` × `rejected_entity_id`, `reason`, `created_at`), das **mit S3** landet. Reason: das Negativ-Link-Gedächtnis wird ohnehin erst vom Resolver (S4/S5) gelesen; eine eigene winzige Tabelle hält `delta_type` sauber (Fact-Delta ≠ Identitäts-Entscheid) und ist genau die Datenbasis der Feedback-Schleife. S2 bleibt dadurch migrationsfrei.

- `2026-06-03` **Generische `entities`-Tabelle statt persons/orgs/topics aktivieren**: `persons`/`organizations`/`topics` existieren, werden beim Commit aber nie geschrieben — Identität ist faktisch nicht modelliert → **eine generische `entities` + `entity_aliases`** (bounded `entity_type`: person/organization/topic/tool/artifact), nullable `entity_id` auf `canonical_facts` + `proposed_facts`, Backfill aus bestehenden Fakten. Reason (Owner-Entscheid): einheitliche Identitäts-Schicht ist zukunftssicherer als drei Sonderpfade; akzeptierter Preis = Migration bestehender Referenzen. **Anti-Bloat-Leitplanke:** Entities tragen nur Identität — Statements/Beziehungen bleiben im getypten Fact-Modell (`decisions`/`dependencies`/`contradictions`). Kein generischer Prädikat-Graph, keine 200 Relationstypen.

- `2026-06-03` **Graphiti-getriebene Resolution + deterministischer lokaler Guard**: Dedup („Max Müller" = „M. Müller") braucht eine Auflösungs-Engine → **Graphiti-Suche primär (semantisch), aber lokaler Guard zuerst** (normalisierter Name + E-Mail-exakt gegen `entity_aliases`, `pg_trgm`-Index). Output `{ match, candidates[], matched_via: 'local'|'graphiti'|'none' }`, `matched_via` wird geloggt. `linker.ts` **wird ersetzt** durch den Resolver, nicht ergänzt. Reason (Owner-Entscheid Graphiti-primär): semantisch stärkste Auflösung. **Robustheits-Leitplanke (ergänzt):** Graphiti ist fail-soft — ein stiller Leerlauf bei Ausfall würde genau die Duplikate erzeugen, die wir verhindern wollen; der lokale Guard fängt das Loch und macht offensichtliche Treffer netzfrei + testbar. `matched_via`-Telemetrie, weil wir aus dem 422-Drama gelernt haben: messen statt vertrauen.

- `2026-06-03` **Feedback-Schleife minimal, nicht als Lern-Pipeline**: Korrekturen/Negativ-Links lagen bisher write-only → **Resolver konsumiert `entity_link_rejections`** (schlägt Falsch-Match nicht erneut vor); akzeptierte Aliasse wachsen → deterministische Auflösung verbessert sich. Reason: schließt die Schleife mit vorhandenen Daten, ohne Prompt-Lernen/Confidence-Rekalibrierung (bleibt L1, zurückgestellt). Autopilot für Verarbeitung, Review für Bedeutung, Provenance für Vertrauen — ohne Enterprise-Lernmaschine.

- `2026-06-03` **Beleg-Verankerung via Segment-Referenz (nicht Offsets/Rohtext)**: Beleg lag nur als Zitat-String in `content`/`review_cases.context`, nur im Konflikt-Drill gezeigt, kein model/prompt-Version → **Zitat per Substring-Match auf ein `parsed_documents.segments[]`-Element abbilden, stabile Referenz (`element_id`/Index) + Modell + Prompt-Version first-class in `provenance`**, Beleg an jeder Review-Card sichtbar. Reason (Owner-Entscheid): Segment-Ebene ist „highlightbar genug", vermeidet dauerhafte Rohtext-Haltung (DSGVO) und Offset-Komplexität. Best Practice: Anchor-to-Source / Citation-Grounding (Anthropic Citations, AEVS). Als aktive Stufe S0 vorgezogen.

- `2026-06-03` **Einheitlicher Fakt-Status abgeleitet, nicht gespeichert**: Status über 4 Tabellen verstreut (`proposed_facts.status` · `valid_from/until/superseded_by` · `decisions.status` · `box_state`) → **reine `factStatus()`-Ableitung** (Funktion/View) aus `valid_until`/`superseded_by` + offenen `contradictions` (`active|superseded|contradicted|deprecated|needs_review`). Reason (Owner-Entscheid): bitemporale Best Practice — eine Quelle der Wahrheit, kein Drift zwischen Statusspalte und temporalen Feldern; Workflow-States (`needs_review`) bleiben orthogonal. Spätere M4-Stufe (S7).

- `2026-06-03` **Reject als bewahrtes Negativ-Signal mit Grund**: ein abgelehnter Fakt verschwand spurlos → **Grund-Taxonomie (`falsch`/`Duplikat`/`irrelevant`/`Beleg fehlt`) in vereinheitlichter Negatives-Schicht** (mit `entity_link_rejections`), von Extraktion/Resolver gelesen → kein Re-Vorschlag. Reason (Owner-Entscheid): rejected = Hard Negative / Edge-Case; der Grund bestimmt den Downstream-Nutzen (Dedup jetzt, Eval/Routing später). In S5 gefaltet.

- `2026-06-03` **Einbettung: nur Evidence vorgezogen**: von den drei Delta-Lücken wird **Beleg-Verankerung als aktive Stufe S0 vorgezogen** (höchster ROI, unabhängig von der Entity-Arbeit); Fakt-Status (S7) und Reject-Signal (in S5) sind voll spezifiziert, aber spätere Stufen. Reason (Owner-Entscheid): sichtbarer Nutzen sofort, ohne Schema-Risiko der größeren Schichten.

## 2026-06-02 — Entity-Core als eigenständiges Kernmodul (Spec + Refactor-Roadmap)

Die Entität (Orb/Avatar = Gesicht der App) war gewachsen statt entworfen: Zustand als `useState` in `Index.tsx`,
von außen gesetzt; Verhalten verteilt; Eingebot dreifach; `components/entity/` mit 7 fremden Komponenten vermischt;
null Tests. Entscheidung: Refactor zu einem **in sich geschlossenen Modul** mit reinem testbarem Gehirn
(`src/lib/entity/`), Signal-Interface, Singleton-`EntityProvider`, Verhaltensvertrag (Standardset vs. `manifest`),
Zwei-Achsen-Ausdruck und Hybrid-Composer. Volle Spec: `docs/entity-core.md`.

- `2026-06-02` **Modulgrenze**: Inputs (Signale) / Outputs (`vm`/`controller`) statt Hardcoding; öffentliche API
  via Barrel `@/lib/entity`, keine Tiefimporte, kein externes `setEntityState`.
- `2026-06-02` **Ordner-Hygiene (Phase A)**: 7 Nicht-Entity-Komponenten raus aus `components/entity/`
  (→ `home/`: AccountDrawer/MobileNavSheet/SideGrid/IntakeSessionsPanel; → `project/`: ProjectTile/CreateProjectDialog).
  `RecentAssets` (abgelöster Altcode, kein Importeur) gelöscht.
- `2026-06-02` **Phase A + 0 umgesetzt & auf `dev` gemerged**: `src/lib/entity/` (machine/signals/interaction/
  signalMapping/deriveExpression/capabilities + Barrel) + 36 Tests. Beim Merge dev's vorbestehenden Fehler behoben:
  `Index.tsx` rendert `<AccountDrawer/>` ohne Import → Import aus `@/components/home/AccountDrawer` ergänzt; `EntityRail`-
  Import auf neuen Pfad gezogen. Verifiziert: tsc 0, Vitest grün. Phasen 1–7 folgen inkrementell (Spec).
- `2026-06-02` **Abstimmung mit M2**: ⌘+Space-Overlay ist gestrichen (M2 = persistente `EntityRail`); Entity-Core
  Phase 1 nimmt `EntityRail`/`Index` als ersten `useEntity()`-Konsumenten auf, statt daran vorbeizubauen.

- `2026-06-03` **Impact-Achse in S1 gefaltet, kein eigenes Feld**: Routing kannte nur Risk → **`isRisky()` bekommt ein abgeleitetes Impact-Signal** (hohe Tragweite = betrifft mehrere Projekte/Entities oder Budget-/Architektur-Bezug) → nie still. Reason (Owner-Entscheid): deckt die dritte Standard-Achse (Confidence+Risk+Impact) ab, ohne `impact_level`-Schema + Agent-Last + Kalibrierung; für ein Solo-PM-Tool reicht ein abgeleitetes Signal. Bleibt reine Funktion.

- `2026-06-03` **Aktions-Set: Needs-source + Escalate als echte Aktionen (S8)**: Commit kennt nur `confirm`/`reject`; `escalate:true` wird vom Kernel ignoriert (toter Pfad), „Beleg fehlt" ist nur Reject-Grund → **Needs-source als blockierender Wartezustand** (Fakt ohne tragfähigen Beleg, nutzt S0-Segment-Referenz) **+ Escalate zu echtem zurückgestelltem Zustand verdrahten**. Reason (Owner-Entscheid): schließt eine Aktions-Lücke des Standards **und** einen latenten Bug; aktive Stufe. Split bleibt bewusst gestrichen.

- `2026-06-03` **Pre-commit Supersede/Contradict-Emission als spätere Stufe (S9)**: Linker emittiert nie `replace`, Widersprüche werden erst post-commit erkannt → **Resolver markiert eindeutige Ersetzung/Widerspruch schon vor dem Commit** als `replace`/`contradict`, damit der Review-Case sofort als Supersede/Konflikt erscheint. Reason (Owner-Entscheid): klarere UX (Empfehlung-First greift früher), aber größerer Umbau → spätere Stufe; post-commit-Detektoren + S1/S7 bleiben Sicherheitsnetz.

## 2026-05-30 — Empfehlung-First-Drilldown (M1, Stufe 1)

- `2026-05-30` **Empfehlung dominiert, Vergleich ist sekundär**: Konflikt-Drilldown war neutrale A/B-Bühne mit „cogni empfiehlt …" als 12.5px-Fußnote, Default-Selection nur A → **`FaktDrillOverlay.renderConflict` zweistufig**: Variante A (Empfehlung-First) zeigt den empfohlenen Fakt 36px groß, Quelle + Begründung darunter, Sekundärzeile „Im Vergleich: …", Footer „Übernehmen / Korrigieren / Offen lassen"; Variante B (klassische A/B-Gegenüberstellung) erscheint erst, wenn User „Korrigieren" drückt oder cogni keine Empfehlung hat (`empfehlungBlock === null`). Slot `payload.empfehlungBlock` mit `winnerSide/winnerFact/winnerQuelle/winnerDatum/winnerMode/loserFact/loserQuelle/loserDatum/begruendung` ist in `sessionFactories.buildKonfliktSession` zentral gebaut. Reason: Review-First bedeutet „cogni hat entschieden, du bestätigst" — nicht „cogni stellt dir zwei Optionen vor und wartet". Der bestehende neutrale Vergleich bleibt als Fallback, weil bei ähnlicher Confidence + ähnlichem Alter wirklich der User entscheiden muss.

- `2026-05-30` **Empfehlungs-Text als Bausteine, nicht als Prozentwerte**: `deriveEmpfehlung` schrieb „Höhere Zuverlässigkeit (87 %) — cogni bevorzugt diese Version" → **Bausteine kombinieren**: Recency („N Tage neuer"), Mode-Übergang („direkte Quelle statt abgeleiteter" / „direkte Quelle"), Fallback „aus zuverlässigerer Quelle". Reason: Prozentwerte sind Maschinen-Stimme, Bausteine sind Berater-Stimme; der User entscheidet auf „direkte Quelle" + „5 Tage neuer", nicht auf „87 %".

- `2026-05-30` **Empfehlungs-Slot nur für Konflikt gefüllt**: Gap/Dependency/Decision haben keine Recommendation-Logik im Detector → **Slot ist im Box-Payload-Schema vorgesehen, aber leer für andere Objekttypen**. Reason: Pattern für künftige Detektor-Heuristiken angelegt; Befüllung ohne echte Logik wäre Augenwischerei. Triggers Wave 3.

## 2026-05-26 — UX-Konzepttreue: Sprache, Drilldowns, Lage


- `2026-05-26` **UI-Sprachregel**: Pipeline-Vokabular und interne IDs gehören nicht ins sichtbare UI → **Sprachschicht beim Mapper, nicht beim Render-Point** → `toHandlungsbedarf`/`sessionFactories` setzen `quelle` als fachliche Kategorie („Widerspruch"/„Offene Frage"/„Abhängigkeit"/„Hinweis"/„Thema"/„Dokument"), nicht als `Konflikt #abc` o. ä. Reason: Internes Maschinenprotokoll im User-Pfad erzeugt Anstrengung statt Klarheit; eine PM-App muss in Projektsprache reden, nicht in Pipeline-Sprache. Restposten (drei Toast-Strings + ein EVENT_LABELS-Fallback) sind als Loop in `NOW.md` markiert, nicht in dieser Runde gefixt.

- `2026-05-26` **Lage ≠ Verlauf**: `project_state_snapshots.summary` lieferte Commit-Log-Sätze („Termin übernommen — 11 bestätigte Erkenntnisse"), die fälschlich als Lagetext gerendert wurden → **`humanizeSnapshotSummary` filtert generische Commit-Log-Muster** (3 Regex: `^Snapshot nach …`, `übernommen.*enthält`, `^X übernommen|verworfen|aktualisiert`) und gibt `undefined` zurück, wenn der Satz Verlauf statt Zustand ist; `buildProjectViewModel` baut den Lagetext dann aus dem aktuellen Zustand (Widersprüche, Blocker, offene Fragen, „Stand ist konsistent" als Ruhefall). Reason: Lage muss „wie steht es gerade" beantworten, nicht „was wurde zuletzt committed" — das ist die Aufgabe des Verlauf-Feeds.

- `2026-05-26` **Drill-Routing nach Objekttyp statt generischem Review**: jeder Klick öffnete bisher `buildHandlungsbedarfSession`, also denselben „Wissen + Antwortfeld"-Frame, egal ob Widerspruch, Lücke, Abhängigkeit oder Dokument → **objektbezogene Factories**: `buildKonfliktSession` (A/B-Gegenüberstellung im `FaktDrillOverlay`), `buildGapSession` (Antwortfeld + `asks`), neue `buildDependencySession` (Quelle/Ziel-Kontextbox + Auflöse-Eingabe), `buildThemaSession`/`buildDokumentSession` als readonly-Inspect, `buildHandlungsbedarfSession` bleibt Default für `entscheidung/aufgabe/offener_punkt/feedback`. `HandlungsbedarfList.ActionRow.handleClick` dispatcht nach `item.objektTyp`. Reason: Konflikt-Vergleich braucht andere Bühne als „Lücke füllen" braucht andere Bühne als „Dokument ansehen" — die Generalisierung war Pseudo-Sparsamkeit und produzierte den „immer derselbe Screen"-Eindruck.

- `2026-05-26` **Overlay-Surfaces solid, nicht transparent**: shadcn-`dialog`/`alert-dialog`/`dropdown-menu` rendern teilweise über hellen Projekt-Screens und waren mit `bg-background`/`bg-popover` (HSL-Tokens) + halbtransparenten Glas-Tints unlesbar → **Cogni-Tokens direkt**: `bg-[var(--surface-1)]` + `border-[var(--hair-2)]` + `shadow-[var(--shadow-pop)]` + `rounded-2xl` (Dialog/AlertDialog/Dropdown). Overlay-Backdrop bleibt `color-mix(in oklab, var(--surface-0) 82%, transparent) + backdrop-blur-xl`. Reason: shadcn-HSL-Bridge funktionierte gut für Komponenten-Innenleben, aber Floating-Surfaces über fremdem Hintergrund brauchen einen harten Cogni-Surface-Anker; jede Indirektion via `bg-popover` führte zu Drift im Day-Theme.

- `2026-05-26` **Substanz als Wissensfläche, nicht als Tabelle**: Themen-Karten zeigten nur Titel + drei Zahlen, kein semantischer Kontext → **Themen-Karten enthalten jetzt Beschreibung + erste 2 Items als Mini-Zeilen + lesbaren Zähler** („3 Entscheidungen · 2 offen · 1 Dokument"); Dokument-Reihen mit Typ-Chip + Version + Datum, ohne Vollscreen-Review beim Click (readonly-Inspect via `buildDokumentSession`). Reason: Substanz war als „Wissenslandkarte" konzipiert, nicht als Datenbank-View; die Lese-Mini-Zeilen geben den Karten Substanz ohne neuen Daten-Layer.

## 2026-05-24 — Redesign abgeschlossen + Doku-Konsolidierung

- Redesign-Pässe 1–6 + Audit-Fixbatch sind durch (Sidebar, Hero, Mittelfeld, Substanz, BatchReview, FaktDrill, Readonly-Sessions, `deriveSignal`, Material/Review-Buttons, `escalate`-Payload). UI-Sprache deckt sich mit `docs/redesign/prototype/` + `docs/redesign/screenshots/`.
- `.lovable/plan.md`, `docs/redesign/REVIEW.md` und `docs/redesign/Cogni.zip` gelöscht — waren Übergangs-Tracker. Visuelle Quelle bleibt der Prototyp-Ordner.
- NOW.md auf drei Milestones zum Prototyp gestrafft (M1 Provenance + Empfehlung, M2 Entity-Präsenz inkl. Universal-Overlay, M3 Antwort-Loops). Kein Klein-Klein-Backlog mehr.
- Stopp-Linie bestätigt: keine `src/lib/**`-Eingriffe für reine Designwünsche.

## 2026-05-22 — K1+K2+K4 aus MainCompass abgehakt

Drei kurzfristige Compass-Punkte in derselben Session umgesetzt:

- `2026-05-22` **K1**: Migration `20260522120000_delta_type_unclear.sql` schließt 5-Tage-Drift TS↔DB. ENUM `public.delta_type` bekommt Wert `'unclear'`, der seit 2026-05-19 in `src/lib/project/types.ts:19` lebt. Heute wird der Wert nirgends geschrieben — Migration ist Vorrats-Fix damit künftige Inserts nicht knallen.
- `2026-05-22` **K2**: Vier-Rollen-User-Smoke als Playwright-E2E `e2e/04-vier-rollen-smoke.spec.ts` + Persona-Helper `e2e/_persona.ts`. Seedet „Hase & Söhne Couture" via Service-Role (Projekt + 2 Stakeholder + Asset + 3 canonical_facts + Konflikt + Gap + TopicMerge-Kandidat + ChangeEvent), Spec navigiert nach Login zu `/projekt/{id}` und prüft alle vier Rollen-Renderer. Sweep über `metadata.test_run_id` kompatibel zu `test-data-sweep`. Graceful skip ohne `SUPABASE_URL`/`SERVICE_ROLE_KEY`. Architekturwahl Node-TS in `e2e/` statt Deno-EF, weil Playwright ohnehin in Node läuft und `@supabase/supabase-js` v2 dort sauberer ist. `package.json:test:e2e` als Script ergänzt.
- `2026-05-22` **K4**: Graphiti-Diagnose-Loop wird aktiv. Drei Bausteine:
  - Schema-Migration `20260522121000_graphiti_retry_loop.sql`: `graphiti_sync_log.last_retry_at` ergänzt, Partial-Index für `(status='failed', attempt, last_retry_at)`, Extensions `pg_cron` + `pg_net` in `extensions`-Schema (Supabase-Konvention).
  - `graphiti-reconcile/retryFilter.ts` als pure Pure-Function `selectRetryCandidates(rows, opts)` extrahiert mit 10 Deno-Tests (attempt-Max, Cooldown, Reason-Substring-Match, kombinierte Skip-Gründe). `now: Date`-Injection als Test-Hook.
  - `graphiti-reconcile/index.ts` um Retry-Pfad erweitert: vier neue Payload-Felder (`reconcile_failed`, `failed_reason_filter`, `max_attempts`, `retry_cooldown_min`). Wenn `reconcile_failed=true`: failed-Sync-Logs laden → durch `selectRetryCandidates` filtern → zugehörige `canonical_facts` in `pending` mergen → `attempt+1`/`last_retry_at=NOW()` vorab schreiben (Cooldown läuft selbst wenn Episode-Match noch nicht greift, kein Lock-In auf eine Reconcile-Runde). retryStats in done-Stage-Log + Response. `/* eslint-disable @typescript-eslint/no-explicit-any */` als Header-Workaround für pre-existing `logSync(admin: any)` — Cogni-Konvention für Deno-EFs.
  - Cron-Migration `20260522121500_graphiti_retry_cron.sql`: `cron.schedule('graphiti-reconcile-loop', '*/30 * * * *', ...)` mit `net.http_post` gegen die EF, Vault-Pattern für Service-Role-Auth (`vault.decrypted_secrets`). `DO $$ IF EXISTS cron.unschedule ... $$` macht die Migration re-runnable. Manueller Setup-Schritt für `vault.create_secret('service_role_key')` ist im SQL-Kommentar dokumentiert, NICHT committet.
- `2026-05-22` **Architektur-Konsistenz**: Persona-Fixture für K2 nicht in `_shared/testFixtures.ts` (das ist Deno-Service-Role-mockAdmin-Gegend), sondern eigene Node-Variante `e2e/_persona.ts`. Mit `auth.admin.listUsers()` wird die `user_id` aus dem Test-User-Email resolvet — Annahme: User existiert in Staging und ist in `PLAYWRIGHT_USER_EMAIL` konfiguriert.
- `2026-05-22` **Risiken offen**: (a) Migrations sind committed aber nicht applied — manueller Apply-Schritt (mcp-Tool oder CLI) steht noch aus, ebenso Vault-Secret-Einspielung. (b) Wenn Vault-Pattern scheitert, GitHub-Actions-Cron als dokumentierte Alternative im Plan. (c) Playwright-Smoke wurde lokal nicht ausgeführt (kein Staging-Login-User in Sandbox) — erstes echtes Run ist Aufgabe der Session-übergreifenden K3.

## 2026-05-22 — Doku-Konsolidierung: NOW.md als MainCompass

Doku war über drei parallele Sprint-Tracks gewachsen (Master-Checklist, Phasen-Tabelle, handover-Anhang). Jede Session las an zwei bis drei Stellen den Stand und musste sie versöhnen. Konsolidierung:

- `2026-05-22` `docs/NOW.md` → komplett umgeschrieben als sessions-übergreifender **MainCompass** mit drei Achsen: (1) Vision-Säulen aus PRODUCT.md destilliert, langlebig, (2) Status-Säulen mit Ist-Stand (Pipeline 7/7, Detektoren 5/5, Dialog 18 Modalitäten, Tests, Infra, LOC), (3) Pläne kurz/mittel/lang mit konkreten Triggern statt Deadlines. Statt Master-Checklist und Sprint-Phasen-Tabelle nun ein einziger Status-Block, der pro Session aktualisiert wird. 162 → 137 Zeilen.
- `2026-05-22` `docs/design-implementation-plan.md` gelöscht. War Übergangs-Doku für UI-Overhaul v2 Phasen 1–7. Alle Phasen ✅ (Tokens, LageZone, Sidebar, Home-3-Spalter, Dialog V2 default, AssetOrbit, Theme-Toggle, Mobile-Audit Projekt, shadcn-Bridge). Endstand in NOW.md absorbiert, Tier-Entscheidungen in DECISIONS bereits dokumentiert.
- `2026-05-22` `docs/handover-2026-05-21.md` gelöscht. Inhalt (Antwort-Pipeline, P1-F5 Delta-Tag, P1-B2 Coverage-Chips, Entity-Rotationsreset, Backlog) ist in NOW.md "Recently completed" + Pläne überführt. Handover-Dateien sind tot, sobald die nächste Session sie konsumiert hat.
- `2026-05-22` `AGENTS.md` Routing-Tabelle: Verweis auf `design-implementation-plan.md` entfernt. AGENTS bleibt minimal (Karte, kein Handbuch).
- `2026-05-22` NOW.md Recently-completed bekommt feste Pflege-Regel: Einträge älter als 14 Tage wandern in DECISIONS (chronologische Quelle), NOW behält den aktuellen Stand. Keine Duplikation.

Ergebnis: 7 → 5 Markdown-Dateien in `docs/`. Eintrittspunkt eindeutig (`NOW.md`). Doku-Drift gegen Code wird beim nächsten Standup geringer, weil weniger Stellen synchron gehalten werden müssen.

## 2026-05-22 — Test-Overhaul Vitest 70 → 89

Drei-Pass-Audit (Drift / Obsolet / Lücken) ergab 11 Drift-Items, 1 Obsolet, 12 Lücken. Eindeutige Funde implementiert, ambivalente zurückgestellt:

- `2026-05-22` **Neue Tests für kritische Lücken**: `src/lib/project/deriveSignal.test.ts` (6, pure Priority-Logik), `src/lib/dialog/loadSession.test.ts` (10, mockt Supabase + boxMapping + sessionMode via `vi.mock`, deckt conflict/gap_box/assignment/silent_substanz/fallback ab), `supabase/functions/commit-fact/assignment_test.ts` (7 Deno, alle 4 confirm-Branches + reject + asset/proposed_facts-Side-Effects via `mockAdmin`), `supabase/functions/intake-understand/factRules_test.ts` (16 Deno, `summarizeFact` per fact_type + `LINKABLE_FACT_TYPES`-Set).
- `2026-05-22` **Drift-Fixes**: `sessionFactories.test.ts` (`buildThemaMergeSession` mit `merge`-Param verifiziert `__submitIntent.kind=topic_merge`), `projectViewModel.test.ts` (Coverage-Felder + `topicMergeCandidates`-Composition-Path), `gapDetector_test.ts` (`owner` + `assigned_to` Owner-Varianten), `projectScoring_test.ts` (Topic-Score-Faktor +2 pro Hit), `commitFact_test.ts` (`box_type=assignment`-Branch + `/* eslint-disable @typescript-eslint/no-explicit-any */`-Header für vorhandene pre-existing `any` in `silentLog()`).
- `2026-05-22` **Obsolet**: `src/test/example.test.ts` gelöscht (`expect(true).toBe(true)`-Stub, kein Wert).
- `2026-05-22` `loadSession.test.ts` Mock-Pattern: pro Table-Name eine Queue, `from(table)` baut Chain-Builder mit `chain()` als no-op (alle `.eq/.order/.limit/.in/.filter` reentrant), `maybeSingle()` und `then()` rufen `nextFrom(table)`. Array-Werte werden als List zurückgegeben (für `review_cases`/`projects`-Queries), Objects als Single-Row. Dieses Pattern ist auch für künftige Supabase-Client-Tests übertragbar; nicht aus `_shared/testFixtures.ts` (Deno) holen — der dortige `mockAdmin` ist auf den Service-Role-Builder zugeschnitten, hier brauchen wir die Client-API.
- `2026-05-22` Zurückgestellt mit Begründung: D6 (`entscheidungen === items.filter(kind=entscheidung).length` als Invariante in `toThemen` — heute funktional konsistent, aber Test würde die Implementierung doppeln statt einen Vertrag prüfen), L3 (`submitNote`-Metadata-Strukturtest — `useIntake.ts` ist eng mit DOM/Storage gekoppelt, lohnt erst mit React-Testing-Library-Setup), L5 (Side-Effect-Pfad in `detectAndPersistTopicMerges` mit Pre-Insert-Pair-Key-Check — Idempotenz hängt am DB-`UNIQUE`-Index, Test wäre Mock-Overfit).

Vitest 70 → 89 (+19), 1 Stub gelöscht. Deno-Suites geschrieben aber lokal nicht ausführbar (kein Deno in dieser Sandbox); werden in CI gegen Supabase-Test-Runner geprüft. ESLint clean nach Hinzufügen des disable-Headers in `commitFact_test.ts`.

## 2026-05-21 — inspect-graphiti diagnose + agentClient-Logger-Thread

Zwei Handover-Loops in einem Schritt:

- `2026-05-21` `inspect-graphiti` um Action `diagnose` erweitert: aggregiert `graphiti_sync_log` user-scoped zu `{totals, failed_reasons[], recent_failures[]}`. Reason-Normalisierung in separatem Pure-Modul `diagnose.ts` (UUID → `<uuid>`, lange Zahlen → `<n>`, erste Zeile, max 80 Zeichen) — so fallen Request-IDs/Status-Codes in einen gemeinsamen Bucket statt jede failed-Row als Unikat zu zählen. Sort: count desc, dann reason asc. Optionaler `project_id`-Filter über `payload.project_id` (Best-Effort, da Spalte nicht indexed). 7 Deno-Tests für Pure-Aggregation.
- `2026-05-21` `_shared/agentClient.ts`: `callExtractFacts` und `callSuggestAssignment` nehmen einen optionalen `log?: LogStage`-Parameter (Pick<Logger, "stage">, lockerer Vertrag). Wenn übergeben, schreibt der Client `log.stage("agent.prompt_used", …)` mit `prompt.version` + `prompt.source` statt `console.warn`. Fallback: console.warn — Tests/Setups ohne Logger laufen weiter. `intake-understand/understandRun.ts` reicht `log` durch. Damit landen Prompt-Version-Breadcrumbs im strukturierten Pipeline-Log statt im Console-Stream.
- `2026-05-21` Restliche console.warn-Stellen in `_shared/` (graphiti.ts:23 Module-Init, promptHub.ts 5× silent fail-soft, testFixtures.ts:143 Test-Util, logger.ts 3× Self-Calls) bewusst belassen — kein Caller-Logger im Scope bzw. der Logger ist selbst gerade am Flushen. Handover-Schätzung "12 Stellen" war zu hoch; reale Zahl ist 9, von denen 2 (agent-Breadcrumbs) tatsächlich Mehrwert im Pipeline-Log haben.

## 2026-05-21 — P1-F3 SubstanzSection-Drilldown

Themen-Karten waren bisher Click → readonly Dialog mit Beschreibung + Counts (toter Endpunkt). Drilldown re-applied auf main's ChevronRight-Affordance:

- `2026-05-21` `ThemaVM` um `items: ThemaItemRef[]` erweitert (`{id, kind: 'entscheidung'|'offener_punkt', titel, beschreibung, status?}`). Bewusst nur Decisions + OpenPoints in dieser Iteration — Dokument-Verknüpfung bleibt offen, weil Topics → Dokumente bisher kein Datenmodell-Pfad hat.
- `2026-05-21` `toThemen`-Mapper sammelt Items über die existierende Beziehung `decisions.canonical_fact_id === topics.canonical_fact_id` (analog `open_points`). Topics ohne `canonical_fact_id` haben `items: []` (verwaiste Topics nach Trigger-Insert vor Backfill-Lücke). Counts (`entscheidungen`/`offenePunkte`) bleiben numerisch konsistent mit `items.length`.
- `2026-05-21` `buildThemaSession` rendert jetzt Header-kontext-Box (Beschreibung + Summary „X Entscheidungen · Y offen · Z Dokumente") + pro Item eine eigene kontext-Box mit `begruendung` als Status-Hint. Session bleibt readonly — Inspect-Modus, keine Commit-Pfade. Multi-Box landet im DialogOverlay (BatchReviewOverlay), das List-Rendering schon kann.
- `2026-05-21` SubstanzSection unverändert — `buildThemaSession(t)` bekommt `items` automatisch aus dem ViewModel; ChevronRight-UX bleibt, das Drilldown öffnet sich jetzt als reichhaltiger Dialog statt als hohle Beschreibungs-Box.
- 2 neue Mapper-Tests (Items-Sammlung + verwaiste Topics). Vitest 70/70, tsc clean, eslint clean.

## 2026-05-21 — P1-B4 Topic-Merge Full-Stack

Themen-Verschmelzung Ende-zu-Ende verdrahtet: vom commit-fact-Detektor über DB-Status bis zur User-Aktion im Handlungsbedarf-Stream.

- `2026-05-21` `topics`-Tabelle existierte seit 2026-04-15 mit `merged_into`-Spalte, wurde aber **von nichts auto-populated** (vestigial). Topics existierten faktisch nur als `canonical_facts` mit `fact_type='topic'`. → **DB-Trigger `sync_topic_from_canonical_fact`** (AFTER INSERT auf canonical_facts) legt korrespondierende `topics`-Zeile an. Backfill aller historischen Topics in derselben Migration. Idempotent über `canonical_fact_id`-Lookup.
- `2026-05-21` Neue Tabelle `topic_merge_candidates(id, user_id, project_id, source_topic_id, target_topic_id, status, pair_key GENERATED, ...)` für vom Detector erkannte Merge-Kandidaten. Analog zu `contradictions`/`gap_signals`/`dependencies` (Welle-B-Pattern). Idempotent über `UNIQUE (project_id, pair_key)`, mit `pair_key = LEAST||GREATEST` für ungerichtete Paar-Identifikation. RLS + Realtime-Publikation.
- `2026-05-21` Detector `commit-fact/topicMergeDetector.ts` mit gewohntem Welle-B-Vertrag: pure `detectTopicMergesPure(fresh, others)` (Token-Substring ≥ 4 Zeichen, case-insensitive, beide Richtungen) + fail-soft `detectAndPersistTopicMerges`. Parallel via `Promise.all` in `kernel.ts` nach `mirrorToGraphiti` — niemals throw, niemals den Commit-Pfad abbrechen. 8 Deno-Tests (Pure).
- `2026-05-21` Standalone Edge Function `topic-merge` für die User-Aktion: POST `{candidate_id, decision: "merge"|"reject"}` → setzt `topics.merged_into = target_topic_id` (merge) oder markiert candidate als 'rejected'. Ownership-Check über `user_id`. Idempotent (already-merged → ok'es out).
- `2026-05-21` UI-Flow läuft über Handlungsbedarf-Stream: Mapper-Erweiterung `toHandlungsbedarf` reicht Kandidaten mit neuem `objektTyp: 'topic_merge'` + Payload (`topicMerge: {candidateId, sourceTopicId, targetTopicId, titel/beschreibungA/B}`) durch. `HandlungsbedarfList.ActionRow` öffnet bei `objektTyp='topic_merge'` `buildThemaMergeSession` mit `merge`-Parameter statt der Default-`buildHandlungsbedarfSession`.
- `2026-05-21` `__submitIntent`-Pattern um `kind: "topic_merge"`-Variante erweitert. `DialogProvider.commitBox` routet bei diesem Intent zur `topic-merge` EF: `aktion === "Zusammenführen"` + confirm → merge; alles andere → reject. Toast-Feedback bei beiden Pfaden. Konsistent zum 2026-05-20 Antwort-Pipeline-Pattern.
- `2026-05-21` `useProjectData.ts`: topics-Query filtert nun `.is("merged_into", null)`; `topic_merge_candidates` werden parallel geladen (status=open); Realtime auf neuer Tabelle angemeldet.
- `2026-05-21` `ProjectViewModel.topics`-Mapper unverändert — `merged_into IS NULL` reicht auf Query-Ebene. Beidseitige Sortierung im `pair_key` verhindert "A↔B" + "B↔A"-Doppel-Kandidaten.

## 2026-05-20 — P1-F5 Delta-Tag in modality-matrix ReviewRow

Linker-Ergebnis (add | replace | contradict | merge) wird jetzt im Review als kleines Delta-Chip neben dem TypeChip gerendert — vorher unsichtbar im Frontend, nur als interne `proposed_facts.delta_type`-Spalte vorhanden.

- `2026-05-20` `intake-understand/understandRun.ts` schreibt `delta_type` jetzt in `review_cases.context.delta_type` → Frontend hat Lesepfad
- `2026-05-20` `loadSession.ts` liest `ctx.delta_type` und propagiert es als `box.payload.delta_type`
- `2026-05-20` `ReviewRow.tsx`: Inline `DeltaChip`-Komponente rendert add/replace/contradict/merge mit passendem Tone (blau/amber/amber/muted), `confirm` zeigt nichts (Default-Fall, kein Informations-Mehrwert). Eingebaut in Default-Branch (wissen/kontext) und in Sprechhandlungs-Matrix (für attribut).
- `2026-05-20` `FaktDrillOverlay.tsx`: gleiche Logik in `renderGeneric` neben dem Type-Label.

## 2026-05-20 — Antwort-Pipeline: stilles Daten-Loch geschlossen

User-Eingaben in Factory-Sessions (Handlungsbedarf-Antwort, Feedback, Rückfrage, Korrektur) wurden bisher nur lokal als Box-State `bestaetigt` markiert und beim Schließen verworfen. Das war das vermutlich nervigste Dead-End: User tippt eine Antwort, sieht „aufgenommen", aber nichts wird persistiert.

- `2026-05-20` `commitBox` in `DialogProvider` ignorierte Factory-Sessions ohne `__reviewCaseId` → **`__submitIntent`-Pattern** auf Box-Payload-Ebene: Factory-built Eingabe-Boxen können einen Intent-Discriminator (`kind: "intake_note"`, plus `projectId`, `contextHint`, `sourceRef`) anhängen. Bei `confirm` ohne reviewCaseId routet commitBox die Eingabe an `submitNote()` statt silent zu returnen.
- `2026-05-20` `submitNote(text, options)` als neuer Helper in `src/lib/intake/submitNote.ts` extrahiert: Insert in `assets` (`file_type='note'`, `metadata.kind='note'`, plus `text`/`context_hint`/`source_ref`), Trigger `intake-trigger`. Reused von `useIntake.ts` (Home/Project-Drop) und `DialogProvider.commitBox` (Dialog-Sessions). Eine Quelle der Wahrheit, kein duplizierter Insert.
- `2026-05-20` Vier Factories um optionalen `projectId`-Parameter erweitert und mit `__submitIntent` versehen: `buildHandlungsbedarfSession` (Antwort), `buildFeedbackSession` (Feedback aus beliebigem Screen), `buildRueckfrageSession` (Antwort auf System-Frage), `buildKorrekturSession` (Korrektur einer bestehenden Information). Caller (HandlungsbedarfList, FeedbackButton) drillen `projectId` durch.
- `2026-05-20` `hinweis: "Wird vorgemerkt — Persistenz folgt..."` aus Factories entfernt — die Lüge ist obsolet, weil persistiert wird.
- `2026-05-20` Mit dem Routing über `intake-trigger` fließen die Antworten durch die volle Verstehens-Pipeline: LLM extrahiert ggf. neue Fakten („Frist verschiebt sich auf 15.06" → deadline), Linker hängt sie an existierende Fakten an, Detektoren laufen. Sandbox-Effekt: Antworten werden Teil des Projektzustands.

## 2026-05-20 — Modality-Matrix: tote Pfade glattgezogen

Audit von `ReviewRow.tsx` (Batch-Liste) und `FaktDrillOverlay.tsx` (Single-Box-Drill) gegen den 2026-05-18 Modalitäts-Vertrag. Sieben tote Click-Pfade identifiziert und gefixt; alle 65 Tests grün, tsc clean.

- `2026-05-20` `aktion`-Box fiel in den Default-Renderer mit einzelnem ✓-Button — `payload.aktionen[]` (z. B. aus `buildThemaMergeSession` „Zusammenführen" / „Getrennt lassen") wurde **komplett ignoriert** → **eigener `aktion`-Branch** in `ReviewRow.tsx` und in `FaktDrillOverlay.renderGeneric`: rendert konfigurierbare Buttons aus `payload.aktionen[]`, erster Button primärer Ok-Tone, Rest neutral. Klick sendet `user_decision = { aktion: label }`. Plus eigene Verwerfen-Option mit `ConfirmDestructive`.
- `2026-05-20` Sechs Sprechhandlungs-Sekundär-Buttons in `ReviewRow.tsx` schickten `onConfirm({ secondary: true })` und flippten die Box bestaetigt **ohne irgendeine User-Eingabe einzusammeln** (Bezug ändern bei bedingung/ausschluss/attribut/beziehung, Frist setzen bei risiko, Jetzt entscheiden bei vorschlag, Bestätigen bei annahme) → **Inline-Edit-Pattern eingeführt**: Klick auf Sekundär öffnet ein Inline-Input/Binär-UI in derselben Zeile, prefilled mit aktuellem `attaches_to` wenn vorhanden. Enter/✓ committed `{ attaches_to: x }` bzw. `{ due_date: x }` bzw. `{ entscheidung: "ja"|"nein" }`. ESC/✕ schließt. `annahme` „Bestätigen" war semantisch identisch zu Primary „Als Annahme" → **entfernt** (Dublette).
- `2026-05-20` `FaktDrillOverlay.tsx` hatte nur `renderConflict` und `renderGap` — **alle 16 anderen BoxTypes** (bedingung, ausschluss, annahme, vorschlag, frage, notiz, beziehung, attribut, risiko, unklar, aktion, wissen, kontext, eingabe, auswahl, zuordnung) landeten im `renderGeneric` mit nichts als Titel + „Bestätigen" → **modality-aware `renderGeneric`**: zeigt jetzt `understood`, `attaches_to` (als Chip), `evidence` (als Zitat), plus klassische Factory-Session-Felder `auszug`/`sachverhalt`/`begruendung`/`quelle`. Aktion-Buttons aus identischer MODALITY-Map wie ReviewRow. Sekundär-Aktionen mit Inline-Edit (Bezug/Frist/Entscheidung).
- `2026-05-20` `LageZone.tsx` „Material"- und „Review öffnen"-Buttons hatten **gar keinen `onClick`** — stiller Fehlschlag bei Click → **Props `onMaterialClick` und `onReviewClick`** ergänzt, in `ProjectScreen.tsx` verdrahtet: Material → öffnet `InputOverlay` (Datei/Link/Notiz, projektgebunden); Review öffnen → Supabase-Query auf `dialog_sessions` für offene Reviews dieses Projekts, öffnet die nächste mit `openSessionFromDB`, fallback Toast „Keine offenen Reviews". Buttons sind `disabled` wenn Handler fehlen (sichtbar via opacity-50 + not-allowed).
- `2026-05-20` Vier Factory-Stubs verwiesen auf „folgt in Phase 6" / „Phase 6 (Dokumenten-Preview)" — Phase 6 war bereits 2026-05-14 abgeschlossen, die Texte waren **6 Tage alte Lügen** → entfernt: `buildDokumentSession.begruendung` und `buildSourceSession.auszug` weg, übrige Daten bleiben. Drill-Inhalt jetzt ehrlich karg statt mit irreführendem Versprechen.

## 2026-05-19 — Sprint 1 Produktion: Wissensstand, Drilldown, Delta

- `2026-05-19` `DeltaTyp` hatte keinen `unclear`-Wert; DB-ENUM-Erweiterung ist ein separater Migration-Schritt → **`"unclear"` in `src/lib/project/types.ts` ergänzt**, `DeltaTag.tsx` importiert fortan aus `@/lib/project/types` (kanonische Quelle statt `@/data/demoProject`), neutrales `unklar`-Tag (#muted). DB-Migration folgt in eigenem Sprint, sobald Staging-DB verfügbar.
- `2026-05-19` `ProjectViewModel` hatte kein `coverage`-Feld → **`CoverageVM { knownFacts, openGaps, conflictsActive, lastIntakeAge }` ergänzt** in `types.ts`, aus `canonical.length`, `gaps.length`, `konflikte.length`, letztem `canonical.created_at` in `buildProjectViewModel`. UI-Anbindung an `LageZone` während des Rebase nicht gelandet: `main` hat `LageZone.tsx` parallel grundlegend umgebaut (RoleHeader-Layout + Konflikt-Chip); VM-Daten stehen bereit, Wissensstand-Chip-Zeile folgt in eigenem Sprint auf die neue Section.
- `2026-05-19` `SubstanzSection` Themen-Karten Drilldown → Implementierungs-Versuch zur Rebase-Zeit zurückgenommen. `main` hat `SubstanzSection.tsx` parallel auf `RoleHeader` + `ChevronRight`-Pattern umgestellt; lokaler Inline-Expand (`expandedThema`-State) war inkompatibel. Re-Apply in eigenem Sprint auf Basis von main's `ChevronRight`-Affordance.
- `2026-05-19` Entity-Pointer-Follow jitterte bei langsamer/mittlerer Mausbewegung → **Feedback-Loop in zwei Stellen beseitigt**: (1) `usePointerFollow` (Entity.tsx) kompensiert `getBoundingClientRect()` Translation via `naturalCx/naturalCy = rect.center - current.x/y`; (2) `FacePillCharacter.tsx` `handlePointerMove` nutzt `restRect` (gecaptured bei `onPointerEnter`, wenn Karte flach und Wrapper in Ruhe) statt live `getBoundingClientRect()`.

## 2026-05-19 — Sprint 1 Produktion: Dialog-Schicht komplettieren

- `2026-05-19` `src/lib/dialog/sessionFactories.ts` stand im Design-Overhaul-Sprint unter "DARF SICH NICHT ÄNDERN" → **Constraint aufgehoben ab Produktions-Sprint**. Design-Sprint (Phasen 1–7) abgeschlossen, Constraint diente dem Schutz vor UI-seitigen Logikbrüchen während der visuellen Überarbeitung. Produktions-Sprint hat explizit Factories als Lieferobjekt. Neue Constraint-Regel: Factories erweitern ist erlaubt, Signaturen bestehender Factories und `types.ts`-Vertrag bleiben unberührt.
- `2026-05-19` Fünf fehlende Dialog-Anlässe (Produktkern 3.2: Projektzuordnung, Korrektur, Dokumentversion, Thema-Merge, Rückfrage) → **`buildZuordnungSession` / `buildKorrekturSession` / `buildVersionsSession` / `buildThemaMergeSession` / `buildRueckfrageSession` added** in `sessionFactories.ts`. Alle via `mkSession`/`mkBox`-Helfer, kompatibel mit bestehendem `useDialog()`-Vertrag. Tests: 5 neue Unit-Tests, Gesamt 65/65, tsc clean.
- `2026-05-19` `aktion`-Box hatte keinen expliziten Renderer → lokaler Patch zur Rebase-Zeit zurückgenommen, weil `main` parallel die **modality-matrix** in `src/lib/dialog/types.ts` etabliert hat (18 BoxTypes inkl. eigenständigem `aktion`-Renderer in `ReviewRow.tsx`). `buildThemaMergeSession` wird über die modality-matrix korrekt gerendert; eigener Branch wäre redundant gewesen.
- `2026-05-19` Delta-Information am Fakt im Review → lokaler `payload.delta`-Patch zur Rebase-Zeit zurückgenommen (main's neue ReviewRow hat keinen Slot). Re-Apply offen: Delta-Tag muss in einen der modality-matrix-Renderer (vermutlich `wissen`/`attribut`) integriert werden, statt als pauschaler Title-Suffix.
- `2026-05-19` Paste in InputOverlay war unsichtbar (Text ging direkt in Textarea ohne Feedback) → **Paste-Preview-Mode** in `InputOverlay.tsx`: bei Paste ≥ 100 Zeichen im Note-Modus erscheint ein Read-only-Preview mit "Direkt übernehmen" / "Bearbeiten". File-Paste-Pfad unberührt.

## 2026-05-14 — UI-Overhaul v2 Phase 5+6 Abschluss

- `2026-05-14` Dialog V2 hinter Flag oder default? → **Default**. `useDialogV2Flag` und Legacy-Branch in `DialogOverlay.tsx` entfernt, alle 11 alten Dialog-Komponenten gelöscht (`BoxRenderer`, `BoxFrame`, `BoxStateBadge` + 8 Box-Varianten in `boxes/`). `useDialog`/`DialogProvider`/`sessionFactories` unverändert (Vertrag). Single-Box-Sessions → `FaktDrillOverlay`, sonst `BatchReviewOverlay`. Verify: Vitest 60/60, tsc clean.
- `2026-05-14` AssetOrbit als orbitierende Chips um die Entität → **eigene Komponente `src/components/entity/AssetOrbit.tsx`**, nutzt direkten Supabase-Read (analog `RecentAssets`), Realtime auf `assets` + `dialog_sessions`, kein `src/lib/`-Eingriff. Status-Ableitung: `parsing` (processing/pending), `understanding` (understanding_status='running'), `failed` (failed/rate_limited/payment_required), `review-ready` (offene `dialog_sessions` für `trigger_ref_id=asset.id`). Klick auf review-ready → `openSessionFromDB`. Geometrie: oberer 225°-Bogen, Radien 250/290px, ageRing-Falloff. Mobile (`<md`) ausgeblendet wegen Kollision mit HomePrompt + Touch-Entity.

## 2026-05-14 — UI-Overhaul v2 Phase 1

- `2026-05-14` Theme-System wechselt von `:root`/`.dark` HSL auf cogni-Hex-Tokens → **dual betrieben**: shadcn-Tokens (`:root`/`.dark`, HSL) bleiben, cogni-Tokens kommen additiv unter `[data-theme="day"|"night"]` (Hex). Vorteil: shadcn-Komponenten unverändert, neuer cogni-Layer überlagert. `data-theme="day"` als Default am `<html>` in `App.tsx` gesetzt. Tailwind-Aliase `c-surface-*`, `c-ink-*`, `sig-*`, `c-accent*` zeigen direkt auf die CSS-Vars (kein `hsl()` Wrapper). Geist + Geist Mono über Google Fonts in `index.html`. Utility-Klassen `.t-*`, `.dot--*`, `.chip*`, `.cogni-btn*`, `.kbd`, `.cogni-card`, `.hairline`, `.atmosphere-stripe`, `cogni-pulse`, `cogni-entity-breathe` in `src/index.css`. Verify: Vitest 60/60.

## 2026-05-14 — Welle B Detektoren

- `2026-05-14` Dependency-Erkennung könnte LLM-basiert im AOL-Service laufen → **deterministisch in `commit-fact/dependencyDetector.ts`** → Trigger-Phrase + Title-Substring (Token-Länge ≥ 4), kinds `blockiert_durch` (task) und `wartet_auf` (deadline → decision); `haengt_ab_von` bleibt im Kernel für `reference`. Idempotent über `(source_id, target_id, type)`, fail-soft, 8 Pure-Tests. Welle B damit komplett.
- `2026-05-14` Gap-Erkennung könnte LLM-basiert im AOL-Service laufen → **deterministisch in `commit-fact/gapDetector.ts`** (analog B-W2) → drei Kinds (deadline_without_owner, decision_without_deadline, task_without_due_date), idempotent über `(canonical_fact_id, metadata.gap_kind)`, fail-soft, 8 Pure-Tests. LLM-Heuristik bleibt Wave 3.

## 2026-05-14 — Tier B4 + Audit

- `2026-05-14` Session-Factories duplizierten `{id, anlass, context, boxes}`-Scaffold → **`mkSession()`-Helper in `sessionFactories.ts`** → 8 Factories teilen sich den Kern, öffentliche Signaturen 1:1.
- `2026-05-14` Edge-Function-Boilerplate `createLogger` + `handleOptions` + `try/finally flush` mehrfach kopiert → **`_shared/withLogging.ts`** → migrierbar nur dort, wo der catch-Pfad an `withErrorBoundary` delegiert werden darf. **Skips dokumentiert**: `aol-callback` (gibt 400 statt 500 im catch), `voice-transcribe` & `commit-fact` (eigene Body-Shape `{ok:false, error: msg}` statt `internal_error`-Hülle), `intake-trigger` (updated `aol_runs.status='failed'` im catch). Migriert: `asset-delete`, `project-delete`.
- `2026-05-14` `linkAgainstExisting` & `factSummary` mit hardcodierten Type-Switches in `intake-understand/index.ts` → **`intake-understand/factRules.ts`** mit `LINKABLE_FACT_TYPES` Set + `FACT_SUMMARIZERS` Record → neue Fact-Types nur Map-Eintrag, kein switch.
- `2026-05-14` Abschluss-**Audit aller A/B-Tier-Punkte** in `docs/audit-2026-05-14.md` mit Tool-Evidenz pro Anspruch. Findings (Graphiti-Sync 60 %/24h, 9 `console.warn` in `_shared/`, LOC-Budget gerissen, Vier-Rollen-User-Smoke offen) als separate Loops, kein Refactoring-Backlog mehr.

## 2026-05-14 — Doku-System & QA-Härtung

- `2026-05-14` Detail-Docs in der Wurzel verstreut → **alle nach `docs/` verschoben, nur `AGENTS.md` + `README.md` bleiben in der Wurzel** → klare Trennung Karte (Wurzel) / Inhalt (`docs/`).
- `2026-05-14` `docs/qa-historie.md` doppelte Buchführung zu `NOW.md`/`DECISIONS.md` → **aufgelöst**: 4-Phasen-Methodik (Bestand/Instrumentierung/Tests/Automatisierung) und Stages 1–7 leben als Einträge hier; aktuelle Endmetriken in `NOW.md`. `docs/qa-seam-inventar.md` bleibt als lebende Referenztabelle (Frontend/Edge/DB/Externe-Seams mit Risiko 1–5).
- `2026-05-14` QA-Methodik rückwirkend dokumentiert: **Phase 1 Seam-Bestand → Phase 2 Logger + `pipeline_events` + ErrorBoundary → Phase 3 Fixtures + Unit/Edge/E2E-Smokes → Phase 4 ESLint scharf + Husky + CI + `withErrorBoundary` + console.log-Smoke**. Reihenfolge ergibt sich aus Top-10-Risiko-Liste im Seam-Inventar.

- `2026-05-14` Edge Functions stürzen ohne Spur → **Pflicht-Wrapper `withErrorBoundary("fn", handler)`** → Last-Resort-Catch + 500-Hülle mit `correlation_id`, CORS-Preflight automatisch.
- `2026-05-14` `commit-fact`-Logik nur via HTTP-Curl prüfbar → **pure `commitFact({admin,user,payload,log})` extrahiert, Deno.serve bleibt dünner Adapter** → ermöglicht 3 Deno-Integrationstests (Happy/NEEDS_ASSIGNMENT/Reject).
- `2026-05-14` `aol-callback` analog nicht testbar → **pure `handleCallback({admin,payload,log})`** → 5 Deno-Tests für Status-Übergänge.
- `2026-05-14` Logger-Disziplin nur via Lint nicht verlässlich → **CI-Smoke-Job `qa.yml::smoke` blockt jeden `console.log` außer `_shared/logger.ts`**.
- `2026-05-14` Async-Pipeline-Hänger unsichtbar → **`createLogger` in jede Hot-Path-Edge-Function** (`commit-fact`, `intake-trigger/process/understand`, `aol-callback`, `voice-transcribe`, `asset-delete`, `project-delete`, `graphiti-reconcile`, `graphiti-backfill`, `test-data-sweep`). Inspector-/Admin-Funktionen bewusst ausgespart.
- `2026-05-14` Graphiti `/messages` 422 (Mirror-Ausfall) → **`addMessage()` setzt `role="user"` als Pflichtfeld-Default**, `graphiti-backfill` Edge Function zieht ungemirrorte canonical_facts nach.
- `2026-05-14` ESLint-Warnings ohne Druck → **`no-unused-vars`, `prefer-const`, `eqeqeq`, `no-console` (Browser) auf `error`** hochgezogen, Husky 9 + lint-staged 17 als Pre-commit-Gate, Prettier 3 als letztes Extends.
- `2026-05-14` Test-Daten-Leichen → **Marker `metadata.test_run_id`** in allen Fixtures, `test-data-sweep` Edge Function + Nightly-Cron `qa-nightly.yml` 03:17 UTC.
- `2026-05-14` MSW-basierte Browser-E2Es zu schwer → **Hook-Integrationstests mit `vi.mock`** (`src/test/e2e-smokes.test.ts`: Note→intake-trigger / Asset-Delete / Fakt-Retract). Echte Browser-E2E-Lane bleibt optionaler Backlog-Punkt.

## Vor 2026-05-14 (rückdatiert aus Memory + Implementierungs-Doku)

- `2026-05-13` Knowledge Graph → **Graphiti statt Cognee** → bessere Episode-Semantik, native LangGraph-Integration.
- `2026-05-13` Graphiti-Mirror nicht im kritischen Pfad → **async `POST /messages`, Client-seitige UUID** → Idempotenz; Mirror-Fehler brechen den Commit nicht.
- `2026-05-13` Railway darf nicht in Supabase schreiben → **Besitzschnitt: AOL-Service nur Read über Graphiti**, Schreibpfade ausschließlich in Cloud-Edge-Functions.
- `2026-05-12` Projekt-Zuordnung beim Intake → **Lexikalisches Scoring + Assignment-Agent als Tie-Breaker** → `NEEDS_ASSIGNMENT`-Pfad in `commit-fact`.
- `2026-05-12` Manuelle Eingaben → **kein eigenes Datenmodell**, nur visueller Marker `SourceMarker.manuell={true}` → Konflikte folgen normaler Delta-Logik.
- `2026-05-11` Navigation → **keine klassische Sidebar**, Orientierung über Zustandswechsel zwischen Entität / Projekt / Overlay.
- `2026-05-11` Entity-Visual → **CSS-Gradients statt Canvas** → ruhige Performance, Theme-Tokens nutzbar.
- `2026-05-10` Pipeline-Trace → **eigene Tabelle `pipeline_events`** mit RLS, Index auf `(asset_id)`, `(run_id)`, `(fn,ts)`. Kein Parallel-Logging.
- `2026-05-14` QA-Begleitung → **Drei fiktionale Sandbox-Projekte** (Hase & Söhne Couture / Tübingen Tower / Spätzbohrer 4.0) unter `account@animatex.de`. Agent submittet Facts selbstständig via `supabase--insert` (Bulk-Seed) + `supabase--curl_edge_functions` → `commit-fact` (echter Pfad inkl. Graphiti-Spiegel). Diese Projekte sind never-ending-stories: bei jedem neuen Feature/Fact-Typ würfelt der Agent neue Mails/Konflikte hinein. Kein neuer Code, keine Migration — reine Daten + Tool-Aufrufe. Vorteil: realistische, wiederkehrende Test-Daten ohne Persona-Setup. Nachteil: nur unter einem User, kein Multi-User-Test.
- `2026-05-14` JSONB-Validierung → **Trigger statt CHECK-Constraint** auf `canonical_facts.content` + `proposed_facts.content`. Begründung: CHECK muss IMMUTABLE sein, was bei künftigen Erweiterungen (z.B. NOW()-Vergleich für Deadlines) bricht. Trigger ist flexibel und liefert klare `RAISE EXCEPTION`-Messages.
- `2026-05-14` God-Hook-Pattern → **3-Schichten-Aufteilung** als Vorlage: `useXData.ts` (Queries + Realtime, dünn) + `xViewModel.ts` (pure Mapper, testbar) + `useX.ts` (Composition, ~40 LOC). Erstmals angewandt auf `useProject` — Vorbild für künftige große Hooks.

## 2026-05-14 — Shared `_shared/http.ts` + `_shared/auth.ts` als Edge-Pattern

**Problem:** Pro Edge Function eigene `corsHeaders`/`ok`/`fail`-Definitionen +
inline Bearer-Token-Auth. Drift bei CORS-Headern und Fehler-Response-Format.

**Choice:** Zwei kanonische Module:

- `_shared/http.ts` → `corsHeaders`, `ok(payload, init?)`, `fail(message, status?, extra?)`,
  `handleOptions(req)`.
- `_shared/auth.ts` → `getAuthenticatedUser(req)` mit Discriminated Union
  (`{ok:true, userId, user, client, token} | {ok:false, error, status}`).

`withErrorBoundary` und `inspect-auth` re-exportieren `corsHeaders` aus
`_shared/http.ts` — eine Quelle der Wahrheit, keine Duplikate.

**Reason:** Sicherheitskritischer Pfad (Auth) bekommt eine getestete Quelle.
Functions, die spezifische Response-Shapes brauchen (z. B. `{ok:true, ...}`
in `commit-fact`/`intake-trigger`), behalten lokale `ok`/`fail`-Wrapper, nutzen
aber die geteilten `corsHeaders` — Verhalten unverändert.

[2026-05-14] Realtime-Subscriptions → Problem: Channel-Boilerplate (subscribe/removeChannel/Debounce) in 8+ Stellen mit Drift-Risiko. → Choice: Zentraler `useRealtimeTables(channelName, listeners, opts)` mit per-Listener-Handlern und optionalem debounced `onTrigger`. → Reason: Eine Quelle für Cleanup, stabile Channel-Namen erzwungen, Debounce nicht mehr ad hoc.

[2026-05-14] Inspector-Skeleton → Problem: 3 inspect-\* Functions mit ~95 % identischem Skelett (CORS, Auth, Logger, Body-Parse, Action-Dispatch). → Choice: `_shared/inspector.ts` als Action-Map-Wrapper. `inspect-pipeline` bewusst NICHT migriert (Selektor-API statt Action-Dispatch). → Reason: Wartung an einer Stelle, Inspector wird zu reiner Probe-Map; bricht keine Caller.

[2026-05-14] External-Service-Clients → Problem: Fetch-Logik für Railway/LangSmith mehrfach dupliziert mit divergentem Token-/Header-Handling. → Choice: `_shared/clients/{railway,langsmith}.ts` als typsichere Mini-Clients. `railway-admin` nutzt sie via dünnem Adapter-Shim ohne Call-Site-Änderungen. → Reason: Ein Token-Pfad pro Service; ermöglicht spätere B3.2-Modularisierung von `railway-admin`.

[2026-05-14] railway-admin Modularisierung (B3.2) → Problem: 599-LOC-Monolith mit 18 Action-Branches, vermischte Domänen (Railway-GraphQL, LangSmith-Debug, Graphiti, AOL, PromptHub, Diagnose). Nicht testbar, schwer auffindbar. → Choice: Verzeichnis-Layout mit `index.ts` als Router (~70 LOC), `_helpers.ts` (gql-Shim, listAll/setVars/redeploy/autoDiscover), und `handlers/<domain>.ts` mit jeweils `export const handlers: Record<string, Handler>`. Action-Map wird im Router via Spread zusammengebaut. → Reason: Jede Domäne <210 LOC und einzeln lesbar/testbar; keine Action umbenannt; dynamische Imports im PromptHub-Handler erhalten (Cold-Start-Schutz).

[2026-05-14] B3.1 Box-Builder bewusst zurückgeschnitten → Problem: Originalplan B3.1 verlangte konfig-getriebenen `BoxBuilder` mit `BoxConfig.renderContent`. Realitätscheck: 8 Boxen = 558 LOC, Scaffolding bereits in `BoxFrame` extrahiert; ein BoxBuilder hätte denselben Code in `renderContent`-Callbacks umgehängt — kein Lines-Win, +1 Indirektionsschicht, +Risiko. → Choice: Stattdessen ein kleiner Hook `useBoxSubmit(box, opts)` in `src/lib/dialog/`, der das tatsächlich wiederholte Pattern (updateBoxPayload + commitBox + optional markManual) kapselt. Migriert: AuswahlBox, KonfliktBox, GapBox. EingabeBox/ZuordnungsBox bleiben (eigene Pfade). → Reason: Ehrliches Refactor an realer Wiederholung statt Indirektion ohne Substanzgewinn.

[2026-05-15] Welle C — Godfile-Eliminierung nachgezogen

- C1: commit-fact/index.ts 673 → 70 LOC, Logik in kernel.ts/assignment.ts/snapshot.ts/notifications.ts/mirror.ts. Tests grün (4/4 commitFact + 10/10 projectScoring).
- C2: intake-understand/index.ts 561 → 56 LOC, Orchestrierung in understandRun.ts, Splits agentBridge/linker/helpers. runUnderstand returnt typisiertes Result statt Response.
- C3: projectViewModel.ts 467 → 160 LOC (Composer + Barrel), 9 Mapper unter src/lib/project/mappers/. Re-Exports erhalten.
- C4: ok/fail-Sweep — alle 6 Edge Functions mit lokalem `{ok:true|false}`-Envelope explizit als `// custom shape, intentional` markiert. Shared `_shared/http.ts` bleibt für neue Functions ohne Envelope-Anforderung.
- C5: Postponed (IntakeSessionsPanel split nicht zwingend nötig).

[2026-05-14] B-W1 Linker auf Graph-Match. Problem: Linker mappte Facts nur über exakten Title-Match — semantische Synonyme (z. B. "Bibliothek aufbauen" vs. "Bibliothek einrichten") wurden als neue Facts geführt. Choice: Async-Erweiterung von `linkAgainstExisting` mit optionalen `searchHits` aus neuem `_shared/clients/graphitiSearch.ts`. Reihenfolge: 1) exact title, 2) Hit-Substring + same-fact_type-Title, 3) add. Reason: Graphiti `/search` liefert Edges/Facts (keine source_description-Mappings zurück), daher Hit als Evidenz, nicht als ID-Quelle. Fail-soft auf Title-only bei Graphiti-Ausfall — Backwards-compat. Tests: 6 neue Linker-Tests + Bestand grün (20/20).

[2026-05-14] B-W2 Conflict-Detector deterministisch im commit-fact-Pfad. Problem: Widersprüche zwischen Facts wurden bisher nur via `delta_type=contradict` aus dem Linker propagiert; semantische Konflikte (zwei deadlines mit gleichem Titel und unterschiedlichem Datum, zwei decisions mit unterschiedlichem outcome) blieben unerkannt. Choice: Neuer pure Detektor `commit-fact/conflictDetector.ts` läuft nach `mirrorToGraphiti` und vergleicht den frischen Canonical-Fakt deterministisch gegen alle Facts gleichen Typs im Projekt. Schreibt in `contradictions` (idempotent über Typ + sortiertes Paar). Fail-soft: jeder Fehler → `log.warn`, niemals throw, Commit bleibt grün. Reason: Konflikte sind Kern des Produkts; deterministische Regeln (gleicher Titel + abweichende Kerngröße) sind robust und ohne LLM-Roundtrip; Graph-/LLM-Detektion folgt erst, wenn Sandbox-Daten zeigen, dass deterministischer Recall zu niedrig ist. Tests: 6 Pure-Tests, commit-fact-Suite 20/20 grün.

[2026-05-14] B-W3 Gap-Detector deterministisch. Problem: Lückenhafte Fakten (Deadline ohne Owner, Decision ohne Deadline, Task ohne Fälligkeit) blieben unsichtbar bis zum nächsten Review. Choice: `commit-fact/gapDetector.ts` läuft nach Conflict-Detektor parallel via `Promise.all`. Drei Kinds, alle deterministisch + idempotent über (project_id, kind, canonical_fact_id):

- `deadline_without_owner`: fact_type=deadline ohne assignee/owner/responsible im content.
- `decision_without_deadline`: fact_type=decision, im selben Projekt existiert keine deadline mit case-insensitive Title-Substring auf den Decision-Title.
- `task_without_due_date`: fact_type=task ohne content.due_date.
  Fail-soft: log.warn + return, kein throw. Schreibt in `gap_signals` mit metadata `{source: "commit-fact/gapDetector", kind}`. Reason: gleiche Heuristik-Familie wie B-W2; LLM-Verfeinerung ist Wave 3. Tests: 8 Pure-Tests (alle 3 Kinds + Edge-Cases: leerer Content, mehrere Tasks, Title-Match-Variationen). Suite 28/28 grün.

[2026-05-14] B-W4 Dependency-Detector deterministisch. Problem: Abhängigkeiten zwischen Facts (Task wartet auf Decision, Deadline hängt an Decision) wurden nur sichtbar, wenn ein Reference-Fakt explizit committed wurde — Mehrheit der echten Abhängigkeiten blieb unverdrahtet. Choice: `commit-fact/dependencyDetector.ts` läuft im Promise.all neben Conflict + Gap. Zwei Kinds, deterministisch, fail-soft, idempotent über (source_id, target_id, dependency_type):

- `blockiert_durch`: fact_type=task, dessen content.title/description/text/note eine Trigger-Phrase enthält (`blockiert von`, `blockiert durch`, `wartet auf`, `abhängig von`, `depends on`, `blocked by`) UND danach den Title eines anderen Facts (task/decision/deadline) im selben Projekt als Substring matcht. Token-Längenfilter ≥ 4, case-insensitive, Whitespace normalisiert. Self-Match ausgeschlossen.
- `wartet_auf`: fact_type=deadline, dessen Title oder Description einen Decision-Title als Substring enthält. Self-Match ausgeschlossen.
- `haengt_ab_von` (für fact_type=reference) bleibt im Kernel — Detektor doppelt nicht.
  Schreibt in `dependencies` mit metadata `{source: "commit-fact/dependencyDetector"}`. Reason: bewusst eng (Substring + Trigger), keine LLM-Roundtrips in Wave B; semantische Erweiterung folgt in Wave 3 wenn Sandbox False-Negatives liefert. Tests: 8 Pure-Tests (Trigger-Hit, kein Trigger, Trigger ohne Match, Deadline→Decision, Deadline ohne Match, Reference ignoriert, Self-Match-Ausschluss, Token-Länge). Suite commit-fact 36/36 grün.

[2026-05-14] Heuristik-Familie Welle B insgesamt → Choice: alle vier Detektoren (Linker B-W1, Conflict B-W2, Gap B-W3, Dependency B-W4) folgen demselben Vertrag: pure `detectXPure(fresh, projectFacts)` exportiert + `detectAndPersistX(admin, args)` als fail-soft Side-Effect, idempotent über fachlichen Schlüssel, parallel via `Promise.all` nach `mirrorToGraphiti`. Reason: einheitliche Erweiterbarkeit (Wave 3 LLM-Schicht kann pro Detektor unabhängig nachgezogen werden), einheitliche Test-Struktur (Pure-Tests ohne Supabase-Mocks), einheitliche Fehler-Semantik (kein Detektor-Fehler bricht je den Commit).

## 2026-05-14 — Doku-Konsolidierung Schritt 3 + Endstände

- `2026-05-14` `agent-execution-plan.md` (476 LOC, historischer Tier-A/B-Plan) → **aufgelöst**. Endstand: A1/A2/A3 ✅ · B1/B2 ✅ · B3 ⚠ partial (B3.1 als `useBoxSubmit`-Hook umgesetzt, kein Builder; B3.2 modular) · B4 ⚠ partial (B4.1+B4.3 done, B4.2 nur 2/6 wegen catch-Pfaden, dokumentiert oben) · Welle B (B-W1…B-W4) ✅. LOC-Targets bewusst überschritten, akzeptiert. Verification-Master-Checklist lebt jetzt in `NOW.md`.
- `2026-05-14` `audit-2026-05-14.md` (5 Audit-Schichten) → **aufgelöst**. Endstand: 8/10 Master-Checks grün, 2 LOC-Budgets akzeptiert. Findings (Graphiti-Sync 24h-Fenster, 12 `console.warn` in `_shared/`, Vier-Rollen-User-Smoke offen) als Loops in `NOW.md` Backlog.
- `2026-05-14` `agent_review.md` (Strategie-Review) → **aufgelöst**. Vision/Stand-Diff: Datenmodell + Review-First-UI + Vier-Rollen-Screen vollständig umgesetzt; Kernlücken (LLM-Verfeinerung, React Query, Browser-E2E, LOC-Reduktion) als Wave-3-Backlog.
- `2026-05-14` Claude-Review (9 Punkte) → **7 erledigt vor Review-Eingang** (Graphiti-422, commit-fact Godfile, useProject God-Hook, strictNullChecks, JSONB-Validation, E2E-Smokes, Logger 16/16). 1 zurückgestellt (React Query). 1 gestartet (Wave B → komplett).
- `2026-05-14` `docs/`-Endstand: nur noch `PRODUCT`, `ARCHITECTURE`, `NOW`, `DECISIONS`, `qa-seam-inventar`, `design-implementation-plan` (aktiv für UI-Milestone), plus `input/` (Quellmaterial). Workspace-5-Datei-Modell + 2 lebende Arbeitsdateien.

## 2026-05-14 — Welle-B-Use-Case-Smoke (Sandbox „Hase & Söhne Couture")

- `2026-05-14` Smoke-Pfad: temporäre Edge Function `smoke-welle-b` mintet Magiclink + verifyOtp für `account@animatex.de` und ruft `commit-fact` als realer User. Erlaubt Agent-getriebene End-to-End-Smokes ohne UI-Klicks. Nur Sandbox; Function bleibt deployed (verify_jwt=false, klarer Header-Kommentar).
- `2026-05-14` Smoke-Ergebnis: 4 commits → **B-W2 Conflict 1×** (deadline-Kollision), **B-W3 Gap 4×** (2× deadline_without_owner, 1× decision_without_deadline, 1× task_without_due_date), **B-W4 Dependency 2×** (`blockiert_durch` Task → beide Deadlines, je ein sortiertes Paar). Detektoren feuern wie spezifiziert, idempotent über fachliche Schlüssel, Commit nie gebrochen. Graphiti-Sync queued → läuft async. Backlog-Item „Welle-B-Use-Case-Smoke" geschlossen.

[2026-05-14] Home-Screen 3-Spalten-Layout → AppSidebar (links) · Entity+HomePrompt (Mitte) · ImpactPipelinePanel (rechts) → ersetzt SideGrid+IntakeSessionsPanel im Markup. Alte Komponenten-Dateien bleiben (Cleanup nach Phase-5-Verify).
[2026-05-14] Dialog V2 (BatchReviewOverlay+FaktDrillOverlay) parallel zur BoxRenderer-Welt → Feature-Flag `?dialogV2=1` / `localStorage.cogniDialogV2` → alte Boxen bleiben Default bis Live-Smoke. `useDialog`-Vertrag (commitBox/gateReason/session) unverändert. Token-Mapping `[data-dialog]` → `--d-blue = var(--accent)` (NICHT sig-action).

[2026-05-14] shadcn ↔ Cogni Theme-Bridge → shadcn-HSL-Tokens in [data-theme="day|night"] neu zugewiesen statt alle ui/_ Komponenten umzuschreiben → Reason: Single Source of Truth bleibt Cogni-Hex; ui/_-Komponenten brauchen keine Edits, Day/Night-Toggle wirkt in jeder Schicht.

## 2026-05-15 — Audit-Response (Sync-Semantik + UX-Bugs)

- `2026-05-15` `graphiti_sync_log.status='queued'` war irreführend (Mirror-Send synchron erfolgreich, aber Status implizierte Pending) → **`mirror.ts` schreibt jetzt `status='ok'` direkt**, `graphiti-reconcile` flippt zusätzlich alte `mirror|backfill_mirror`-Zeilen mit `queued` → `ok`, sobald `canonical_facts.graphiti_uuid` gesetzt ist, und entfernt stale `provenance.graphiti_error`. PipelineHealth-Header zeigt nur noch 24h-Fenster.
- `2026-05-15` „Umbenennen" im Projektmenü war No-Op (`forceEdit`/`onEditDone` als `void` verworfen) → **`LageZone` mit `useRef`-Fokus + Selection auf `forceEdit`**, `Escape` revertiert, leerer Name wird abgefangen + Toast, `spellCheck={false}`.
- `2026-05-15` Bulk-Confirm war stumm wenn nur Konflikte/Lücken offen → **`canBulk` enger gefasst** (nur `wissen|aktion|zuordnung|kontext`), Disabled-Tooltip, Enter-Shortcut verdrahtet, `BULK_CONFIRM_THRESHOLD=5` öffnet `ConfirmDestructive` (Architektur „Review-First final" bleibt — kein Undo).
- `2026-05-15` Konflikt-Variante zeigt Varianten A/B jetzt **default expanded**; „offen lassen" → „Verwerfen" mit `ConfirmDestructive` (semantisch korrekt: Reject ist final).
- `2026-05-15` Datei-Drop hat keine Client-Validierung → **`src/lib/intake/supportedFileTypes.ts`** mit SUPPORTED/BLOCKED-Sets, Archive/Programme/Medien werden früh abgelehnt, Unbekanntes wird als Toast-Warnung markiert aber akzeptiert (Server bleibt Source of Truth).
- `2026-05-15` `AssetOrbit` schnitt URLs zu „https://exam…" → **Domain-Extraktion via `new URL().hostname`** statt char-cut.
- `2026-05-15` `aol-service/app/graph.py` Welle-B-Stubs sahen aus wie unvollständige TODOs → **expliziter Header-Kommentar**: kanonische Detektion lebt in `supabase/functions/commit-fact/{conflict,gap,dependency}Detector.ts`, Stubs sind beabsichtigt.

**Bewusst deferred** (zu groß für diese Runde): T1 typisierte `RawProjectData`, U6 echter Voice-Visualizer (RMS-Mapping), B2 Playwright-Smokes — neue Tasks in `docs/NOW.md`.

## 2026-05-18 — Modalitäts-Vertrag (generalistische Lösung für Falschklassifikation)

- `2026-05-18` **Problem**: Jede Aussage wurde als `fact_type` modelliert. Alles Nicht-Standardisierte landete in `open_point` → Review-UI rendert als `gap_box` mit Eingabefeld. Bedingungen, Annahmen, Ausschlüsse, Notizen, Beziehungen, Risiken — alles erschien als „Wert eingeben"-Lücke. Symptom-Bug pro Sprechhandlung.
- `2026-05-18` **Entscheidung**: Drei orthogonale Achsen statt einem `fact_type`:
  1. **Modalität** (Sprechhandlung): `assertion | condition | exclusion | assumption | suggestion | question | note | relation | attribute | risk | unclear`.
  2. **Bezug**: `attaches_to` (Klartext-Bezugsobjekt, Pflicht bei condition/exclusion/attribute/risk/relation).
  3. **Erwartung**: `asks` (exakte User-Frage). **`null` = keine Frage = kein Eingabefeld** — goldene Regel gegen die Sackgasse.
     Zusätzlich `understood` (1-Satz-Klartext „Verstanden: …") und `evidence` (wörtliches Quellfragment).
- `2026-05-18` **Mapping**: `mapToBoxType(delta, fact, modality)` priorisiert Modalität vor Fact-Type. Konflikt schlägt alles. Legacy-Fakten ohne Modalität fallen aufs alte Verhalten zurück.
- `2026-05-18` **Stille Substanz**: `confidence ≥ 0.9 && asks=null && !conflict && modality∉{question,unclear}` → kein Review-Click, einzeilige „N Punkte still übernommen"-Sammelzeile. Schwelle in `SILENT_COMMIT_CONFIDENCE`.
- `2026-05-18` **Drift-Telemetrie**: `modality=unclear` wird in `pipeline_events` als `warn` mit Samples geloggt → Grundlage für künftige Schema-Vorschläge statt Einzelbug-Diskussionen.
- `2026-05-18` **DB-Migration**: `box_type` um `condition, exclusion, assumption, suggestion, question, note, relation, attribute, risk, unclear` erweitert. Bestehende Werte unverändert, Migration additiv.
- `2026-05-18` **UI-Renderer-Matrix** (`src/components/dialog/parts/ReviewRow.tsx`): pro Modalität eigene Default-Aktion + Aktionsleiste. `RefToken` zeigt `attaches_to` als Mini-Chip. Eingabefeld nur bei `gap/eingabe/frage` mit `asks`. Sprechhandlungs-Boxen (Bedingung, Annahme, …) bekommen `Übernehmen / Bezug ändern / Verwerfen` ohne Eingabezwang.
- `2026-05-18` **Kein neues Designsystem** — Modalität ist Daten-/UX-Vertrag, nicht Optik. Architektur (Token-System, ProjectViewModel-Vertrag, Edge-Function-Hülle) unangetastet.

[2026-06-01] Empfehlungs-Vertrag über alle Drilldown-Objekte → Einheitlicher `Empfehlung`-Slot in `types.ts`, deterministische Heuristik in den Mappern (kein erfundenes KI-Signal), `FaktDrillOverlay` rendert eine gemeinsame Bühne → Ein visueller Vertrag für Konflikt/Gap/Dependency/Entscheidung, ohne LLM-Abhängigkeit.

[2026-06-01] Verlauf-Notiz nutzt `submitNote` statt neuer `note-create` Edge Function → submitNote schreibt bereits `assets` mit `file_type='note'` und triggert `intake-trigger` → Redundanz vermieden, ein Pipeline-Pfad statt zwei.

[2026-06-01] `AtmosphereStripe` als eigene Komponente → Spiegelt Projekt-Lebenszustand (offen/review-warm), reine Anzeige ohne Logik-Verschiebung → Spatial Continuity ohne neue Datenflüsse.
