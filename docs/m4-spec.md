# M4 — Entity-Identität & Bedeutungs-Integrität (Detailspec)

> Detail-Spec zu `docs/NOW.md` → M4. Begründungen in `docs/DECISIONS.md` (2026-06-03).
> Quelle: KG/RAG-Kern-Review 2026-06-03, Abgleich gegen Standard-Pattern
> (Proposal → Review → Canonical · Provenance · Confidence+Risk-Routing · Entity-Identity · Feedback-Loop).

## Warum

Das Skelett steht (Proposal/Canonical getrennt, Confidence-Routing, Graphiti-Spiegel,
DB-Validierung, Provenance sichtbar). Es fehlen die Bedeutungs-Schichten, ohne die der
Graph Deko bleibt:

1. **Bedeutung rutscht still durch** — `canSilent` hat kein Risk-Gate.
2. **Keine Identität** — `persons`/`organizations`/`topics` werden beim Commit nie geschrieben;
   „Max Müller" / „M. Müller" werden getrennte Fakten. Cross-Project (Achse 1 §2) ist damit unmöglich.
3. **Schleife offen** — Korrekturen/Negativ-Links liegen write-only.

**Abgrenzung zu M2:** M2 = Entity-**Präsenz** (visuell, `EntityRail`). M4 = Entity-**Identität**
(semantisch, dieselbe Entität über Quellen + Projekte). Verschiedene Schichten.

## Was schon da ist (nicht neu bauen)

- Provenance sichtbar: `FaktDrillOverlay` rendert Evidenz-Blockquote (`loadSession` reicht `evidence` durch).
- Empfehlung-First über Konflikt/Gap/Dependency/Entscheidung (M1), bewusst **keine Prozentwerte** — Berater-Stimme.
- Commit-Routing testbar herausgelöst: `src/lib/dialog/commitRoute.ts` (`planCommitRoute`) + `commit-fact/kernel.ts`.
- Confidence-Routing: `SILENT_COMMIT_CONFIDENCE = 0.9` (stille Substanz).

## Stufen (S0 → S9)

> Build-Reihenfolge (s. NOW.md): S0 → S1 → S2 → S8 → S3 → S4 → S5 → S6 → S7 → S9.
> Hier numerisch sortiert.

### S0 — Beleg-Verankerung (Gap A, vorgezogen, aktiv)

- Agent liefert schon `evidence` (Zitat) — heute nur im Konflikt-Drill gezeigt, kein model/prompt-Version.
- (a) Zitat per Substring-Match auf ein `parsed_documents.segments[]`-Element abbilden → **stabile Segment-Referenz** (`element_id` falls vorhanden, sonst Array-Index; Unstructured-Elemente tragen `element_id`, Notiz/Link-Segmente Index 0).
- (b) Beleg-Referenz + Modell (`google/gemini-2.5-pro`) + Prompt-Version **first-class in `provenance`** (proposed → canonical).
- (c) Beleg-Zitat an **jeder** Review-Card zeigen (heute nur `FaktDrillOverlay`-Konflikt). Segment-Referenz → später „im Dokument zeigen".
- Owner-Entscheid: Segment-Referenz statt Offsets/Rohtext — highlightbar genug, DSGVO-schonend (kein Rohtext-Speichern). Best Practice: Anchor-to-Source / Citation-Grounding.

### S1 — Risk-Gate im Silent-Commit (klein, sofort)

- WO: `understandRun.ts` `canSilent`-Prädikat + Helper `isRisky()` in `factRules.ts`.
- REGEL: nie still bei `fact_type === 'decision'` · `modality ∈ {risk, exclusion, condition, assumption}`
  · `delta_type ∈ {replace, contradict, merge}` · `against_fact_id` auf decision/deadline/status.
- **Impact-Achse (gefaltet, Gap #4):** zusätzlich nie still bei hoher Tragweite (Fakt betrifft mehrere Projekte/Entities oder Budget-/Architektur-Bezug, abgeleitet) → S1 deckt Confidence + Risk + Impact. Kein neues Schema.
- TEST: Matrix-Unit `fact_type × modality × delta_type`.

### S2 — „Anders" / Related-not-same (klein)

- WO: `commitRoute.planCommitRoute` + `commit-fact/kernel.ts` + DialogProvider + Box-Render.
- Aktion nur sichtbar bei confirm-Kandidat (`delta_type === 'confirm'` && `against_fact_id`).
- Effekt: committet als **neuer** Fakt (delta `add` statt `confirm`) + markiert Review-Case session-intern.
- **Kein neues Schema** in S2 (nur vorhandene Enums). Achtung: `change_events.event_type` IST `public.delta_type`
  (`confirm/add/replace/contradict/merge/discard`) — kein freier Wert wie `link_rejected` möglich.
- Persistentes Negativ-Link-Gedächtnis → `entity_link_rejections` (landet mit S3, gelesen in S5).

### S3 — Entity-Identitäts-Schicht (groß, der Kern)

```
entities(id, user_id, entity_type, canonical_name, metadata jsonb, graphiti_uuid, created_at, updated_at)
  entity_type: person | organization | topic | tool | artifact   (bounded)
entity_aliases(id, entity_id→entities, alias, normalized, source, created_at)
  normalized: lower/trim/diakritika-frei
```

- `canonical_facts` + `proposed_facts`: nullable `entity_id`.
- Cross-Project: entities user-scoped → spannen Projekte natürlich.
- Backfill aus bestehenden stakeholder/topic-`canonical_facts`.
- `pg_trgm` GIN auf `entity_aliases.normalized`.
- `entity_link_rejections(id, user_id, subject_norm | proposed_fact_id, rejected_entity_id, reason, created_at)` — Negativ-Link aus S2, gelesen vom Resolver (S5).
- **Anti-Bloat:** Entities = nur Identität. Statements bleiben im getypten Fact-Modell. Kein Prädikat-Graph.

### S4 — Entity-Resolver ersetzt `linker.ts`

- Lokaler Guard zuerst: `normalized`-exakt + E-Mail-exakt gegen `entity_aliases` (deterministisch, netzfrei).
- Graphiti primär (semantisch) über `_shared/clients/graphitiSearch.ts` → Kandidaten via `graphiti_uuid → entities`.
- Output `{ match: entity_id|null, confidence, candidates[], matched_via: 'local'|'graphiti'|'none' }`.
- Routing: eindeutig → confirm-Vorschlag · mehrdeutig → Review-Card mit Kandidaten + „Anders" (S2) · kein Match → neue Entity beim Commit.
- Performance: batchen, cappen, per-Run cachen; alles async (`waitUntil`). Guard short-circuited Offensichtliches.
- Observability: `matched_via` loggen (messen statt vertrauen — Lehre aus 422).

### S5 — Feedback-Schleife minimal schließen

- Resolver liest `entity_link_rejections` → kein Re-Vorschlag desselben Falsch-Matches.
- Akzeptierte Aliasse wachsen → deterministische Auflösung verbessert sich.
- **Erweitert (Gap C, spezifiziert): Fakt-Level-Reject als Negativ-Signal.** `reject` erfasst Grund-Taxonomie (`falsch`/`Duplikat`/`irrelevant`/`Beleg fehlt`) → vereinheitlichte Negatives-Schicht (mit `entity_link_rejections`); Extraktion/Resolver liest sie → kein Re-Vorschlag. Heute verschwindet ein abgelehnter Fakt spurlos.
- Zurückgestellt (L1): Prompt-Tuning aus `corrections`, Confidence-Rekalibrierung.

### S6 — Cross-Project-Identitäts-Signal (UI)

- „Dieser Stakeholder erscheint in N Projekten" — Read in bestehende `useProject`/`useProjects` falten, kein neuer Roundtrip.
- Verzahnt mit M2-Präsenz. Der Magic-Moment.

### S7 — Einheitlicher Fakt-Status (Gap B, abgeleitet, spätere Stufe)

- Status heute über 4 Tabellen verstreut.
- Reine `factStatus()`-Ableitung (Funktion/View) aus `valid_until`/`superseded_by` + offenen `contradictions`: `active | superseded | contradicted | deprecated | needs_review`.
- **Keine gespeicherte Spalte** → kein Drift (bitemporale Best Practice). Workflow-State `needs_review` orthogonal.
- Speist UI-Badges, Resolver, Projektzustand.

### S8 — Aktions-Set: Needs-source + Escalate (Gap #7, aktiv)

- Commit kennt nur `confirm`/`reject`; `escalate:true` aus `FaktDrillOverlay` wird vom Kernel ignoriert (toter Pfad); „Beleg fehlt" ist nur Reject-Grund.
- **Needs-source** = blockierender Wartezustand: Fakt mit schwachem/keinem Beleg (nutzt S0-Segment-Referenz) wartet statt Commit/Reject.
- **Escalate** zu echtem zurückgestelltem Review-Zustand verdrahten (Kernel respektiert es, Box bleibt offen + markiert).
- Schließt Aktions-Lücke + latenten Bug. Split bleibt bewusst gestrichen.

### S9 — Pre-commit Supersede/Contradict-Emission (Gap #9, spätere Stufe)

- Heute: Linker emittiert nie `replace`; Ersetzungen/Widersprüche erst post-commit von Detektoren erkannt.
- Resolver markiert eindeutige Ersetzung/Widerspruch schon **vor** dem Commit als `replace`/`contradict` → Review-Case erscheint sofort als Supersede/Konflikt (Empfehlung-First).
- Größerer Umbau → spätere Stufe; post-commit-Detektoren + S1/S7 bleiben Sicherheitsnetz.

## Owner-Entscheidungen (gesetzt)

- Generische `entities`-Tabelle (statt persons/orgs/topics aktivieren).
- Graphiti-getriebene Resolution **+ deterministischer lokaler Guard** (Robustheits-Leitplanke).
- Zwei geordnete Blöcke: billige Bedeutungs-Fixes (S1/S2) vor der Identitäts-Schicht (S3–S6).
- Delta-Lücken (2026-06-03): Beleg via **Segment-Referenz** · Fakt-Status **abgeleitet** · Reject als **Negativ-Signal mit Grund**. Einbettung: **nur Evidence (S0) vorgezogen**, Status (S7) + Reject (S5) spätere Stufen.

## Leitplanken (Anti-Bloat — verbindlich)

- Keine separate Review-Inbox (Dialog-Overlay + Projekt-Screen sind die Review-Oberfläche).
- Kein rollenbasiertes Routing (Solo-Owner). Kein blindes Zweit-Review.
- Kein generischer Prädikat-Graph. Kein Prompt-Lernen jetzt. Kein „Split"-Button.
- Wo neue Logik alter widerspricht: ersetzen (z. B. `linker.ts` → Resolver), nicht stapeln.
