# NOW — MainCompass

> Sessions-übergreifender Kompass. Erst hier lesen, dann gezielt weiter.
> Vision-Detail: `PRODUCT.md` · Architektur: `ARCHITECTURE.md` · Begründungen: `DECISIONS.md` · QA-Karte: `qa-seam-inventar.md`.

---

## Achse 1 — Vision-Säulen (ändern sich nicht)

Aus `PRODUCT.md` destilliert. Jede Code-Entscheidung muss eine davon stützen.

1. **Ein Eingang** — Entität nimmt jede Quelle (Datei/Text/URL/Sprache/Antwort).
2. **Projektübergreifend verstehen** — Graphiti-Spiegel liefert Kontext, AOL gibt `graph_hint`.
3. **Konflikte + Lücken sind Kern** — nicht Nebenfunktion, sichtbar in Lage + Handlungsbedarf.
4. **Review immer, kein Auto-Commit** — jeder kanonische Fakt geht durch User-Decision.
5. **Quelle + Delta an jeder Erkenntnis** — `source_marker` + `delta_type` durchgehend.
6. **Vier Rollen pro Projekt** — Lage · Handlungsbedarf · Verlauf · Substanz.
7. **Ein Interaktionspunkt** — Dialog-Overlay. Keine Sidebar, kein Dashboard.

**Was es nicht ist (laut PRODUCT.md):** kein PM-Tool, kein Dateimanager, kein Graph-Viewer, kein Bento-Dashboard, keine Live-Mail-Sync (V1), keine Team-Kollaboration.

---

## Achse 2 — Status-Säulen (Stand 2026-05-22)

Die belastbare Basis steht. Vision-Kern zu ~90% implementiert.

### Pipeline (7/7 Stufen live)

```
asset → parsed_documents → proposed_facts → review_cases
      → canonical_facts + change_events + project_state_snapshot
      → graphiti /messages (async, idempotent via client_uuid)
```

Alle Schritte mit Logger + Boundary, fail-soft, idempotent.

### Detektoren (5/5 live, Welle B-Pattern: pure + fail-soft + Promise.all)

| Detektor         | Datei                               | Schreibt nach               |
| ---------------- | ----------------------------------- | --------------------------- |
| B-W1 Linker      | `intake-understand/linker.ts`       | `proposed_facts.delta_type` |
| B-W2 Conflict    | `commit-fact/conflictDetector.ts`   | `contradictions`            |
| B-W3 Gap         | `commit-fact/gapDetector.ts`        | `gap_signals`               |
| B-W4 Dependency  | `commit-fact/dependencyDetector.ts` | `dependencies`              |
| P1-B4 TopicMerge | `commit-fact/topicMergeDetector.ts` | `topic_merge_candidates`    |

### Dialog-Schicht

- **18 BoxTypes** über Modalitäts-Vertrag (2026-05-18)
- **Factory + DB-Sessions** unified via `__submitIntent`-Discriminator
- **Antwort-Pipeline** geschlossen: Factory-Eingaben → `submitNote()` → `intake-trigger`
- **9 Factories** (Konflikt/Gap/Handlungsbedarf/Feedback/Zuordnung/Korrektur/Versionen/ThemaMerge/Rückfrage)

### Frontend

- **4 Rollen** mit RoleHeader-Layout, Coverage-Chips in LageZone, Drilldown in Substanz
- **AssetOrbit** + Realtime auf assets/dialog_sessions
- **Theme** day/night via `data-theme`, Geist-Font, shadcn-Bridge
- **Delta-Tag** E2E im Review sichtbar

### Test-Bett

- **Vitest 89/89** grün (11 Files)
- **Deno-Suite** je Detector + Kernel (commit-fact 40+/40+, intake-understand, inspect-graphiti, \_shared)
- **Pre-commit** Husky + lint-staged → ESLint `--max-warnings 0`
- **E2E-Smokes** 3 in `src/test/e2e-smokes.test.ts`

### Infrastruktur

- **19 Edge Functions**, alle mit `withErrorBoundary` oder via `inspector()`-Wrapper (intern boundary)
- **Logger 19/19** Coverage in EFs
- **strictNullChecks** aktiv
- **RLS** auf allen User-Tabellen, `has_role()` als SECURITY DEFINER

### LOC-Budget (akzeptiert überschritten)

- FE: ~21.6k (war ~17.9k @ 2026-05-14, +3.7k)
- EF: ~7.2k (war ~5.5k @ 2026-05-14, +1.7k)

---

## Achse 3 — Pläne

### Kurzfristig (nächste 1–3 Sessions)

| #   | Aufgabe                                                             | Begründung                                             |
| --- | ------------------------------------------------------------------- | ------------------------------------------------------ |
| K1  | **DB-Migration `delta_type ENUM unclear`** ergänzen                 | Closes Drift TS↔DB aus 2026-05-19                      |
| K2  | **Vier-Rollen-User-Smoke** (manuell, mit Persona „Hase & Söhne")    | Letzter offener Punkt in Master-Checklist seit Welle B |
| K3  | **Mobile-Audit Entity-Screen** (Project-Screen ist durch)           | 100dvh + Body-Scroll-Lock analog Phase 7b              |
| K4  | **Graphiti-Diagnose-Top-Reasons** in konkrete Reconcile-Jobs gießen | Aus `inspect-graphiti diagnose` Loop (siehe unten)     |

### Mittelfristig (3–6 Sessions)

| #   | Aufgabe                                                                              | Begründung                                                                 |
| --- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| M1  | **Browser-E2E mit Persona-Cookies** (Playwright)                                     | Heute nur jsdom-Smokes; UI-Drift erst beim Klick sichtbar                  |
| M2  | **Dokumenten-Versionierung** (Datenmodell topics→docs schließen)                     | Vision-Säule 6 (Substanz/Dokumente mit Versionen) ist hier unvollständig   |
| M3  | **LOC-Reduktion** (FE Components, EF intake-understand)                              | Tech-Debt vor Wave-3-Aufbau                                                |
| M4  | **Korrektur-Loop in Klassifier** zurückspeisen                                       | `corrections` mit Original-Modalität → reduziert future `modality=unclear` |
| M5  | **LangSmith-Prompt `extract-facts`** Live-Version mit Modalitäts-Block neu publishen | Code-Fallback steckt drin, Live-Prompt hängt nach                          |

### Langfristig (Wave 3 — bewusst zurückgestellt)

| #   | Aufgabe                                                                                      | Trigger zum Anpacken                                                 |
| --- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| L1  | **LLM-Heuristiken** in Linker/Conflict/Gap/Dep (semantische Synonyme, Embedding-Ähnlichkeit) | Wenn Sandbox-Recall der deterministischen Detektoren zu niedrig wird |
| L2  | **React Query** (Caching + Mutations)                                                        | Wenn Realtime-Subs + manuelle Re-Fetches zu Race-Conditions führen   |
| L3  | **Reference-Token-Auflösung** (heute Klartext, später Quell-Fakt-Verknüpfung)                | Wenn Dependency-Detector mehr False Positives als Wert liefert       |
| L4  | **Voice/Mail-Sync** (V2-Features laut PRODUCT.md)                                            | V1-Audit abgeschlossen, Vision-Kern stabil                           |

---

## Aktive Loops (parallel zu Sprints)

- **Graphiti-Sync-Diagnose** — `inspect-graphiti diagnose` live (2026-05-21). Failed-Reasons werden gruppiert. Nächster Schritt: aus Top-Reasons konkrete Fixes ableiten.
- **`_shared/` console.warn → Logger** — 7 Stellen verbleiben, bewusst belassen (Module-Init in graphiti.ts/promptHub.ts/testFixtures.ts/logger.ts, kein Caller-Logger im Scope).
- **Test-Coverage halten** — jede neue Funktion mit Pure-Test (Welle-B-Pattern), jeder Drift-Fund in DECISIONS dokumentieren.

---

## Recently completed

- **2026-05-22 — Test-Overhaul Vitest 70 → 89** Neue Tests: `deriveSignal` (6), `loadSession` (10), `assignment` (7 Deno), `factRules` (16 Deno). Drift-Fixes: `sessionFactories` (merge-Param), `projectViewModel` (Coverage + topicMergeCandidates), `gapDetector` (owner/assigned_to), `projectScoring` (Topic-Score), `commitFact` (assignment-Branch). 1 Stub gelöscht. Vitest 89/89.
- **2026-05-21 — inspect-graphiti `diagnose` + agentClient-Logger** Action `diagnose` aggregiert `graphiti_sync_log` (totals + failed_reasons gruppiert + recent_failures). Reason-Normalisierung (UUID/Number-Maskierung) in pure `diagnose.ts` + 7 Deno-Tests. `_shared/agentClient.ts` nimmt optionalen Logger und schreibt Prompt-Version via `log.stage("agent.prompt_used", …)` statt `console.warn`.
- **2026-05-21 — P1-F3 SubstanzSection-Drilldown** `ThemaVM.items: ThemaItemRef[]`. `toThemen` sammelt Decisions + OpenPoints via `canonical_fact_id`-Join. `buildThemaSession` rendert Multi-Box (Header + 1 Box je Item).
- **2026-05-21 — P1-B4 Topic-Merge Full-Stack** AFTER-INSERT-Trigger auf `canonical_facts` heilt vestigial `topics`. Neue Tabelle `topic_merge_candidates` mit `pair_key`-Unique. Detector parallel zu Konflikt/Gap/Dep. Standalone EF `topic-merge`. UI-Flow via `objektTyp='topic_merge'` + `__submitIntent`.
- **2026-05-21 — Entity-Rotationsreset gefixt** Ref-Pattern statt `presets`-Dependency → keine CSS-Animation-Restarts beim async DB-Load.
- **2026-05-20 — Antwort-Pipeline geschlossen** `__submitIntent` + `submitNote()`-Helper. Vier Factories (Handlungsbedarf/Feedback/Rückfrage/Korrektur) tragen Intent durch.
- **2026-05-20 — Modality-Matrix Dead-End-Audit** Sieben tote Click-Pfade in Dialog-System gefixt (aktion-Branch, Inline-Edit-Pattern, FaktDrillOverlay modality-aware, LageZone-Buttons verdrahtet).
- **2026-05-18 — Modalitäts-Vertrag** 18 BoxTypes, ReviewRow rendert pro Modalität eigene Aktion. Stille Substanz ab `confidence ≥ 0.9`.
- **2026-05-14 — Welle B komplett** B-W1 Linker · B-W2 Conflict · B-W3 Gap · B-W4 Dependency live, fail-soft, idempotent.
- **2026-05-14 — UI-Overhaul v2 Phasen 1–7** Tokens, LageZone, Sidebar, Home-3-Spalter, Dialog V2 default, AssetOrbit, Day/Night-Toggle, Mobile-Audit Projekt-Screen, shadcn-Theme-Bridge.
- **2026-05-14 — A/B-Tier abgeschlossen** strictNullChecks, JSONB-Trigger, Logger 16/16, withErrorBoundary auf allen EFs, railway-admin modular.

---

## Stopp-Bedingungen (immer gültig)

- `ProjectViewModel`-Vertrag in `src/lib/project/types.ts` ist Schnittstelle UI↔Logik. Erweitern erlaubt, Felder umbenennen/entfernen nur mit Mapper-Migration.
- Keine direkten Supabase-Calls aus Komponenten — immer über `src/lib/<domain>/`-Hooks.
- Edge Functions wrappen `withErrorBoundary` + `createLogger`. `console.log` ist CI-blockiert.
- `data-theme="day"|"night"` ist Quelle der Theme-Wahrheit, nicht `.dark`.
- Keine LOC-Refactors ohne Trigger (Wave-3-Vorbereitung oder konkreter Test-Schmerz).
