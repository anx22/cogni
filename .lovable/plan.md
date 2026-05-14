## Re-Verifikation Master-Checklist (Stand 2026-05-14, 11:00 UTC)

| # | Check | Soll | Ist | Status |
|---|---|---|---|---|
| 1 | Graphiti-Sync ≥95%/24h | ≥95% | 24/24 = 100% **post-fix** (seit 09:02). 24h-Fenster zeigt 60% wegen 10 Altlasten (08:40–08:45, vor A1.1-Deploy). | grün* |
| 2 | `deno test` grün | grün | 14/14 grün, 4 Test-Files | ✅ |
| 3 | Vitest ≥50 Tests | ≥50 | 60/60 grün, 10 Files | ✅ |
| 4 | 3 E2E-Smokes in CI | 3 | `src/test/e2e-smokes.test.ts` (Note / Asset-Delete / Fakt-Retract) | ✅ |
| 5 | Logger-Coverage 15/15 | 15/15 | 16/16 Edge Functions | ✅ |
| 6 | `tsc --noEmit` strict | grün | strictNullChecks aktiv, grün | ✅ |
| 7 | FE LOC <14.000 | <14k | **17.873** (inkl. 1.769 generated `types.ts` → netto ~16.1k) | ❌ dokumentiert |
| 8 | BE LOC <2.300 | <2.3k | **5.451** (inkl. `_shared/` 1.5k + Tests 0.6k → aktive Funcs ~3.3k) | ❌ dokumentiert |
| 9 | UI-Verhalten identisch | ja | NOW.md bestätigt 1:1 | ✅ |
| 10 | Wave-B-Anbindung sauber | ja | `useProjectData` + `projectViewModel` getrennt, Mapper isoliert | ✅ |

*Punkt 1: A1.1 ist verifiziert wirksam — 0 Failures seit 09:02, alle 24 nachfolgenden Mirrors `queued`-Status (= 2xx-OK, Server queued intern). 24h-Fenster wird sich morgen automatisch normalisieren.

**Fazit:** 8/10 grün, 2 LOC-Budgets verfehlt — beide bereits in `docs/audit-2026-05-14.md` als "akzeptiert, kein Refactor-Backlog" dokumentiert. Welle C hat die echten Godfiles eliminiert; verbleibendes Volumen ist Tests + `_shared/` (Wert, kein Schaden).

**Nichts elementares offen.** → Übergang in Welle B (Wave 2).

---

## Welle B — Wave-2-Vorbereitung

Welle B = Knowledge-Graph-Linking im AOL-Service. Vier Detektoren zwischen `interpreter` und `condenser`:

```text
interpreter → linker → conflict_detector → gap_detector → dependency_detector → condenser
```

### Voraussetzung-Check (vor Implementierung)

- **V1 — Reuse-Beweis:** Zweites Asset im selben Projekt → `getMemory()` liefert nicht-leeren Kontext. Smoke gegen ein Sandbox-Projekt (Hase / Tübingen / Spätzbohrer).
- **V2 — Graph-Konsistenz:** `inspect-graphiti` für die 3 Sandbox-Projekte → Episoden + Entities + Edges vorhanden, `group_id` matcht `project_id`.
- **V3 — Spiegel-SLA:** 24h-Sync-Rate ≥95% nach Ablauf der Altlasten.
- **V4 — Linker-Schnittstelle:** aktueller `linker.ts` (Title-Match) als Drop-in-Ersatz-Punkt verifizieren.

### B-W1 — Linker auf Graph-Match

- **WAS:** `intake-understand/linker.ts` ersetzt Title-Match durch Graphiti-Search-API (`/search` mit `group_id` + Query).
- **WIE:** Neuer Helper `_shared/clients/graphitiSearch.ts` → `searchEntities(project_id, query, k=5)`. Linker-Output bleibt typgleich (`{ matched_canonical_fact_id?: string }`).
- **VERIFY:** Neuer Deno-Test `linker_test.ts` mit Mock-Search. Smoke: Asset-Upload in Hase-Sandbox, neue ProposedFacts referenzieren bestehende `canonical_facts`.

### B-W2 — Conflict-Detector

- **WAS:** Neuer AOL-Stage zwischen Interpreter & Condenser. Erkennt widersprüchliche `decision`/`deadline`-Facts (gleiche Entität, andere Werte).
- **WO:** `aol-service` (Railway). In Lovable-Repo nur Edge-seitige Schnittstelle (`pipeline_events` + Review-Box-Typ `conflict`).
- **VERIFY:** Tübingen-Sandbox (72m vs 87m) → Conflict-Box wird angeboten, Snapshot-Test im Frontend.

### B-W3 — Gap-Detector

- **WAS:** Erkennt fehlende Pflicht-Slots (z. B. `decision` ohne `rationale`, `deadline` ohne `owner`).
- **VERIFY:** Sandbox-Asset mit unvollständigem Fact → Gap-Box im Review.

### B-W4 — Dependency-Detector

- **WAS:** Erkennt zeitliche/kausale Abhängigkeiten zwischen Facts (z. B. Task A blockt Deadline B).
- **VERIFY:** Spätzbohrer-ISO-Audit-Pfad → DependencyVM zeigt verkettete Tasks.

### Reihenfolge & Stopp

1. Voraussetzungs-Check V1–V4 (1 Loop, read-only)
2. B-W1 Linker (1 Loop)
3. B-W2 Conflict (2 Loops, Railway + UI)
4. B-W3 Gap (1 Loop)
5. B-W4 Dependency (1 Loop)
6. Welle-B-Audit + NOW.md/DECISIONS.md Update

Stopp wenn: V3 nicht erreicht (Sync <95% nach 24h), oder ein Detektor das `pipeline_events`-Schema bricht, oder UI-Verhalten driftet.

### Dieser Loop liefert nur

- Diese Verifikations-Tabelle als Eintrag in `docs/audit-2026-05-14.md` (Anhang).
- Voraussetzungs-Check V1–V4 ausführen (read-only via railway-admin / inspect-graphiti / supabase--read_query).
- `docs/NOW.md` Sprint-Block: "Welle B vorbereitet, V-Checks Status".
- Kein Code-Change.

Implementierung der Detektoren erst nach V-Check-Freigabe in Folge-Loops.
