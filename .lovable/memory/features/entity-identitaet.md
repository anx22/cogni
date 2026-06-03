# Feature: Entity-Identität (M4)

> Detail-Spec zu `docs/NOW.md` → M4. Begründungen in `docs/DECISIONS.md` 2026-06-03.
> Quelle: KG/RAG-Kern-Review 2026-06-03, Abgleich gegen Standard-Pattern
> (Proposal → Review → Canonical · Provenance · Confidence+Risk-Routing · Entity-Identity · Feedback-Loop).

## Warum

Das Skelett steht (Proposal/Canonical getrennt, Confidence-Routing, Graphiti-Spiegel,
DB-Validierung, Provenance sichtbar). Es fehlen drei Bedeutungs-Schichten, ohne die der
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

## Stufen (Reihenfolge S1 → S6)

### S1 — Risk-Gate im Silent-Commit (klein, sofort)
- WO: `understandRun.ts` `canSilent`-Prädikat + Helper `isRisky()` in `factRules.ts`.
- REGEL: nie still bei `fact_type === 'decision'` · `modality ∈ {risk, exclusion, condition, assumption}`
  · `delta_type ∈ {replace, contradict, merge}` · `against_fact_id` auf decision/deadline/status.
- TEST: Matrix-Unit `fact_type × modality × delta_type`.

### S2 — „Anders" / Related-not-same (klein)
- WO: `commitRoute.planCommitRoute` + `commit-fact/kernel.ts` + DialogProvider + Box-Render.
- Aktion nur sichtbar bei confirm-Kandidat (`delta_type === 'confirm'` && `against_fact_id`).
- Effekt: committet als **neuer** Fakt + Negativ-Link `change_events.event_type='link_rejected'`.
- Kein neues Schema. Saat für S5.

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
- **Anti-Bloat:** Entities = nur Identität. Statements bleiben im getypten Fact-Modell. Kein Prädikat-Graph.

### S4 — Entity-Resolver ersetzt `linker.ts`
- Lokaler Guard zuerst: `normalized`-exakt + E-Mail-exakt gegen `entity_aliases` (deterministisch, netzfrei).
- Graphiti primär (semantisch) über `_shared/clients/graphitiSearch.ts` → Kandidaten via `graphiti_uuid → entities`.
- Output `{ match: entity_id|null, confidence, candidates[], matched_via: 'local'|'graphiti'|'none' }`.
- Routing: eindeutig → confirm-Vorschlag · mehrdeutig → Review-Card mit Kandidaten + „Anders" (S2) · kein Match → neue Entity beim Commit.
- Performance: batchen, cappen, per-Run cachen; alles async (`waitUntil`). Guard short-circuited Offensichtliches.
- Observability: `matched_via` loggen (messen statt vertrauen — Lehre aus 422).

### S5 — Feedback-Schleife minimal schließen
- Resolver liest `link_rejected` → kein Re-Vorschlag desselben Falsch-Matches.
- Akzeptierte Aliasse wachsen → deterministische Auflösung verbessert sich.
- Zurückgestellt (L1): Prompt-Tuning aus `corrections`, Confidence-Rekalibrierung.

### S6 — Cross-Project-Identitäts-Signal (UI)
- „Dieser Stakeholder erscheint in N Projekten" — Read in bestehende `useProject`/`useProjects` falten, kein neuer Roundtrip.
- Verzahnt mit M2-Präsenz. Der Magic-Moment.

## Owner-Entscheidungen (gesetzt)
- Generische `entities`-Tabelle (statt persons/orgs/topics aktivieren).
- Graphiti-getriebene Resolution **+ deterministischer lokaler Guard** (Robustheits-Leitplanke).
- Zwei geordnete Blöcke: billige Bedeutungs-Fixes (S1/S2) vor der Identitäts-Schicht (S3–S6).

## Leitplanken (Anti-Bloat — verbindlich)
- Keine separate Review-Inbox (Dialog-Overlay + Projekt-Screen sind die Review-Oberfläche).
- Kein rollenbasiertes Routing (Solo-Owner). Kein blindes Zweit-Review.
- Kein generischer Prädikat-Graph. Kein Prompt-Lernen jetzt. Kein „Split"-Button.
- Wo neue Logik alter widerspricht: ersetzen (z. B. `linker.ts` → Resolver), nicht stapeln.
