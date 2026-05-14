# Milestone Review — Abgleich Claude vs. Code-Stand 2026-05-14

## Was Claude richtig sieht (aktuell)

- **Vision-Architektur trägt** — Datenmodell, Vier-Rollen, Universal Input, Review-First UI: alles live, kein Drift.
- **React Query fehlt** — stimmt. Direkte Supabase-Subscriptions mit Debounce. Wird bei 500+ Facts spürbar.
- **Graph-Intelligence ist der wertvollste, aber labilste Teil** — stimmt strategisch.
- **Wave B blockiert ohne stabile Wave A** — Reihenfolge bleibt richtig.

## Was Claude veraltet sieht (bereits erledigt in Welle A+C)


| Claudes Punkt                    | Realität                                                                                                                                |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Graphiti 422 (`role` fehlt)      | **Fixed** in `_shared/graphiti.ts:120` (`role: input.role ?? role_type`). Letzte 24h: 15 ok, 10 failed (Altlasten vor Fix), 24 queued.  |
| `commit-fact` 643 LOC, untestbar | **Refactored**: `index.ts` 70 LOC, `kernel.ts` 245 LOC, `commitFact_test.ts` + `projectScoring_test.ts` mit 14/14 grün.                 |
| `useProject.ts` 515 LOC God-Hook | **Split**: `useProject.ts` 42 LOC, `useProjectData.ts` 189 LOC, `projectViewModel.ts` 160 LOC + Tests.                                  |
| `strictNullChecks: false`        | **Auf `true**` in `tsconfig.app.json:26`.                                                                                               |
| Keine E2E-Smokes                 | `src/test/e2e-smokes.test.ts` existiert (3 Pfade).                                                                                      |
| JSONB-Validation fehlt           | **Trigger live**: `validate_fact_content` als IMMUTABLE pro fact_type.                                                                  |
| Logger-Coverage 33% (5/15)       | **13/16 Edge Functions instrumentiert.** Nur 3 Inspector-Funktionen ohne Logger (inspect-graphiti, inspect-langsmith, inspect-railway). |


## Was wirklich offen ist (echte Lücken)

### Kritisch

1. **Graphiti-Sync-Queue staut** — 24 Einträge "queued", nur 15 "ok" in 24h. Backfill-Job läuft nicht durch. Erfolgsmetrik (≥95%) wird verfehlt obwohl der Fix deployed ist.
2. **10 alte "failed"-Einträge** verzerren die Quote — müssen explizit retried oder als terminal markiert werden.

### Mittel

3. **3 Inspector-Funktionen ohne Logger** — kosmetisch, aber blockiert "100% Coverage" auf der Master-Checklist.
4. **React Query nicht eingeführt** — Claude hat Recht, ist aber Wave-3-Thema, nicht Blocker für Wave B.

### Wave B (jetzt freigegeben sobald Queue grün)

5. Linker auf Graph-Match (B-W1) — Schnittstelle in `intake-understand/linker.ts` als Drop-in vorbereitet.
6. Conflict-Detector (B-W2), Gap-Detector (B-W3), Dependency-Detector (B-W4).

---

## Plan für heute

### Stufe 1 — Wave-A-Stabilität schließen (ca. 2 Loops)

1. **Sync-Queue diagnostizieren**: `graphiti_sync_log` queued-Einträge inspizieren, Ursache klären (Cron läuft nicht? `graphiti-backfill` wirft Fehler?).
2. **Queue drainen**: `graphiti-backfill` direkt aufrufen, Erfolgsrate prüfen.
3. **Failed-Altlasten retryen oder als terminal markieren**, damit 24h-Fenster ≥95% zeigt.
4. **Inspector-Logger nachziehen** (3 Funktionen, je ~5 Zeilen `withErrorBoundary` + `createLogger`).

### Stufe 2 — Wave B starten (B-W1 Linker, ca. 2 Loops)

5. `_shared/clients/graphitiSearch.ts` neu: `searchEntities(project_id, query, k=5)` gegen `/search`.
6. `intake-understand/linker.ts` von Title-Match auf Graph-Match umstellen, Fallback auf Title.
7. Deno-Test `linker_test.ts` mit Mock-Search.
8. Smoke: 1 Asset in Sandbox → prüfen, dass Linker Graph-Hits nutzt.

### Stufe 3 — Dokumentation

9. `docs/NOW.md`: Welle A geschlossen, Welle B B-W1 live.
10. `docs/DECISIONS.md`: Eintrag "Linker via Graphiti-Search statt Title-Match".
11. `docs/audit-2026-05-14.md`: Abgleich-Tabelle Claude-Review vs. Realität anhängen.

### Nicht heute (bewusst zurückgestellt)

- React Query Migration → Wave 3, eigener Sprint.
- Wave B-W2/B-W3/B-W4 → erst nach B-W1 stabil.
- Volle Browser-E2E (Playwright) → Backlog.

---

## Stop-Bedingungen

- Wenn Sync-Queue nach Backfill weiter wächst: stoppen, Root-Cause statt Wave B.
- Wenn Linker-Smoke in Sandbox keinen Graph-Hit produziert: B-W1 als Spike beenden, nicht durchziehen.
- Wenn `pipeline_events`-Schema bricht: rollback.

Bei Freigabe lege ich direkt mit Stufe 1 los.  
  
Docs genaustens mit neusten Plänen aktualsieiren und loslegen mit Stufe 1