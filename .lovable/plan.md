## Ziel

Aktuell liegen QA-Wissen und Produkt-/Tech-Doku verstreut in 8 Dateien unterschiedlicher Reife. Das Workspace-Konvention (`AGENTS.md` / `PRODUCT.md` / `ARCHITECTURE.md` / `NOW.md` / `DECISIONS.md`) wird nur teilweise eingehalten. Diese Konsolidierung bringt das Repo auf den Standard, verdichtet Vergangenes und bildet den heutigen Stand (Stages 1–7 abgeschlossen, 40 Vitest + 18 Deno grün, 11/16 Edge Functions mit Logger) sauber ab.

## Bestand

```text
Wurzel:   README.md   NOW.md   QA-PLAN.md   QA-AUDIT-REPORT.md
docs/:    produkt-gesamt.md  implementierung-aktuell.md  geplant.md  qa-seam-inventar.md
fehlt:    AGENTS.md   PRODUCT.md   ARCHITECTURE.md   DECISIONS.md
```

## Zielzustand

```text
Wurzel (5-Datei-System):
  AGENTS.md         neu, Karte (≤40 Zeilen)
  PRODUCT.md        neu, aus produkt-gesamt.md verdichtet (≤80 Zeilen)
  ARCHITECTURE.md   neu, aus implementierung-aktuell.md + Techstack-Memory verdichtet (≤80 Zeilen)
  NOW.md            bleibt, aktueller Sprint + Backlog + Recently completed (2 Sprints)
  DECISIONS.md      neu, Append-only, beginnt mit Rück-Datierung der wichtigsten Calls
  README.md         bleibt minimal, zeigt auf AGENTS.md

docs/:
  qa-seam-inventar.md   bleibt unverändert (Referenz für Phase 1)
  qa-historie.md        neu, einmalige Verdichtung aus QA-PLAN.md + QA-AUDIT-REPORT.md
                        (Phase-1–4-Plan + Auditor-Befund vom 14.05. + Stages 1–7)
  produkt-gesamt.md     archiviert → wird durch PRODUCT.md ersetzt, Datei wird gelöscht
                        nachdem alle Inhalte in PRODUCT.md/ARCHITECTURE.md übernommen sind
  implementierung-aktuell.md  archiviert, gleicher Vorgang
  geplant.md            archiviert, Inhalte fließen in NOW.md-Backlog ein

gelöscht:
  QA-PLAN.md            → Inhalt in docs/qa-historie.md
  QA-AUDIT-REPORT.md    → Inhalt in docs/qa-historie.md
```

## Inhaltliche Verdichtung

**PRODUCT.md** (max 80 Zeilen) enthält: Vision (PM-App), Zielnutzer, kanonischer Datenfluss `asset → parsed_document → proposed_facts → review_cases → canonical_facts → change_events → graphiti_sync_log → Episode/Entities → RAG`, Feature-Map (Entität, Projekt, Overlay, Voice, Pipeline-Health, Review-First), explizite "Was es nicht ist"-Sektion (kein Auto-Commit, keine Sidebar, keine Dashboard-Ästhetik).

**ARCHITECTURE.md** (max 80 Zeilen): Stack (React 18 + Vite 5 + Tailwind, Supabase = Wahrheit, Graphiti/Neo4j = Spiegel, Unstructured = Parsing, AOL-Service auf Railway, LangSmith Prompts, Lovable AI Gateway). Layer-Regeln. Golden Principles aus AGENTS.md + Memory mit `[HARD]`/`[PREFER]`-Tags (z. B. `[HARD] Roles in separater Tabelle`, `[HARD] Logger statt console.log`, `[PREFER] withErrorBoundary auf jeder Edge Function`).

**NOW.md** wird beim Konsolidieren leicht überarbeitet: Sprint-Tabelle bleibt, Backlog nur noch echte offene Punkte (Browser-E2E, Inspector-Logger), "Recently completed" auf die letzten 2 Sprints (Stage 1–4 + Stage 5–7) komprimiert, ältere Einträge wandern nach DECISIONS/qa-historie.

**DECISIONS.md** (Append-only, Format `[YYYY-MM-DD] Problem → Choice → Reason`) startet mit ~10 Rückeinträgen aus Memory + QA-Audit:
- 2026-05-14 commit-fact-Logik testbar machen → pure `commitFact()` extrahieren → Closure war nur via HTTP-Curl prüfbar
- 2026-05-14 Edge-Function-Last-Resort → `withErrorBoundary` Pflicht → vorher stille Crashes ohne `correlation_id`
- 2026-05-14 console.log in Edge Functions → CI-Smoke-Job blockt → Logger-Disziplin nicht verlässlich nur via Lint
- 2026-05-14 Knowledge Graph → Graphiti statt Cognee → bessere Episode-Semantik
- (weitere ältere Einträge aus `mem://features/entscheidungen`)

**docs/qa-historie.md** verdichtet QA-PLAN.md (4-Phasen-Plan) + QA-AUDIT-REPORT.md (Soll-Ist-Audit) auf eine Datei: oben Methodik + Phasen-Tabelle, dann Audit-Befund vom 14.05., dann Stages 1–7 chronologisch (jeweils 2–3 Zeilen). So bleibt das Wissen auffindbar, blockiert aber kein neues Onboarding.

**AGENTS.md** (max 40 Zeilen): nur Karte. Was wo liegt, aktueller Sprint-Verweis nach NOW.md, Routing nach PRODUCT/ARCHITECTURE/DECISIONS, Hinweis auf Memory-Files für Detailwissen.

**README.md**: einzeiliger Verweis auf AGENTS.md.

## Technische Schritte (Build-Mode)

1. `AGENTS.md`, `PRODUCT.md`, `ARCHITECTURE.md`, `DECISIONS.md` neu schreiben (4 neue Dateien im Root, jeweils nach Vorlage oben).
2. `NOW.md` straffen: Backlog auf 2 echte Items kürzen, "Recently completed" auf 2 Sprints (alte Einträge in `qa-historie.md` migrieren).
3. `docs/qa-historie.md` neu erstellen mit verdichtetem Inhalt aus QA-PLAN.md + QA-AUDIT-REPORT.md.
4. `QA-PLAN.md`, `QA-AUDIT-REPORT.md`, `docs/produkt-gesamt.md`, `docs/implementierung-aktuell.md`, `docs/geplant.md` löschen.
5. `README.md` auf einen Verweis kürzen.
6. `mem://index.md` Core-Block prüfen — die "TOTALE OBSERVABILITY"-Regel bleibt; Memory-Liste unverändert (zeigt schon auf die richtigen Sub-Files).

## Akzeptanzkriterium

- 5 Wurzel-Dateien existieren, jede unter dem definierten Limit.
- `QA-PLAN.md` + `QA-AUDIT-REPORT.md` weg, Inhalt in `docs/qa-historie.md` auffindbar.
- `docs/qa-seam-inventar.md` unverändert.
- `NOW.md` zeigt aktuellen Stand (alle vier QA-Phasen ✅, 40 Vitest + 18 Deno grün, Backlog leer bis auf optionale Browser-E2E-Lane + Inspector-Logger).
- Keine Code-Änderungen, kein Edge-Function-Touch.
