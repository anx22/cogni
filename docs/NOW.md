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
- **Tests**: Vitest 89/89 grün, Deno-Suiten pro Detector, 19/19 EFs mit Boundary + Logger, RLS überall.

---

## Achse 3 — Drei Milestones zum Prototyp

Statt Backlog-Friedhof: drei Sprints, jeder mit klarem Outcome. Reihenfolge M1 → M2 → M3.

### M1 — Provenance & Empfehlung schließen

Konflikt-Source-Metadaten und cogni-Empfehlung sind UI-seitig vorbereitet, aber backend-leer. Review wirkt heute wie blinder Vergleich.

- `KonfliktVM.faktA/B`: String → Objekt (Datum, Mode, Hint, Quelle).
- `commit-fact` schreibt Empfehlungstext + Begründung in Konflikt-Payload.
- BatchReview und FaktDrill rendern beides ohne weitere UI-Änderung.

### M2 — Entity bleibt überall präsent

Spatial-Continuity-Geste komplettieren. Heute bricht „Entity ist immer da" ab, sobald ein Projekt offen ist.

- Atmosphären-Streifen mit Realtime-Hook (Pipeline-aktiv → beschleunigt + review-warm).
- Universal-Overlay (⌘+Space): Entity-Bühne über jedem Screen, Kontext-Anker.
- AssetOrbit-Retry für `failed`-Chips (Polish, gehört thematisch hier rein).

### M3 — Antwort-Loops schließen

Readonly-Reste auflösen: Verlauf-Notiz, Feedback-Button, Impact-Pfeile. Damit ist der Prototyp ein geschlossener Kreis.

- Edge Functions `note-create` + `feedback-create`.
- ImpactPipelinePanel-Pfeile öffnen referenzierte Sessions/Items.
- Readonly-Hints aus Dialog-Sessions entfernen, sobald Backend live.

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
- **Sprach-Restposten** — Pipeline-Vokabular noch in drei Toast-/Fallback-Strings: `useIntake.ts:36-40` („Verstehen fehlgeschlagen/läuft länger"), `IntakeSessionsPanel.tsx:156` („Verstehens-Loop startet erneut"), `ImpactPipelinePanel.tsx:35-37` EVENT_LABELS-Fallback („Erkenntnis übernommen/verworfen/aktualisiert"). Beim nächsten Sprache-Pass mit ablösen.
- **Pre-existing Build-Fehler aus Lovable-Hand-Off** — `useProjectData` Migrations-Drift, `submitNote` DevLogCategory, `VerlaufFeed`. Brauchen klare Backend-Entscheidung, kein blinder Fix.

---

## Recently completed

- **2026-05-26 — UX-Konzepttreue: Sprache, Drilldowns, Projekt-Detail** Pipeline-Begriffe und interne IDs aus dem UI entfernt (`Konflikt #` / `Gap #` / `Dependency #` / `Thema #` / `Dokument #` → fachliche Quellen-Labels „Widerspruch"/„Offene Frage"/„Abhängigkeit"/„Hinweis"/„Thema"/„Dokument"). `humanizeSnapshotSummary` filtert Commit-Log-Sätze als Lagetext aus; `buildProjectViewModel` baut die Lage aus Widersprüchen/Blockern/offenen Fragen. ImpactPipelinePanel-Aggregat: „Eingang · Auswertung · Zu klären · Widerspruch". Drill-Routing nach Objekttyp: Konflikt → `buildKonfliktSession` (A/B im FaktDrillOverlay), Gap → `buildGapSession` mit Antwortfeld, Dependency → neue `buildDependencySession` mit Quelle/Ziel + Auflöse-Eingabe; Thema/Dokument bleiben readonly-Inspect. shadcn-Overlays (`dialog`, `alert-dialog`, `dropdown-menu`) auf solide `--surface-1` + `--hair-2` + `--shadow-pop` — keine halbtransparenten Glas-Flächen mehr über hellem Projekt-Screen. Substanz-Themen mit Item-Preview + lesbarem Zähler („3 Entscheidungen · 2 offen · 1 Dokument"). Docs nachgezogen (dieser Eintrag + DECISIONS). Restposten siehe „Sprach-Restposten" in Aktive Loops.
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
