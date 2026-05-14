## Ziel

Drei Schritte in dieser Reihenfolge:
1. **Doku-Konsolidierung** — `agent-execution-plan.md` + `audit-2026-05-14.md` in das bestehende 5-Datei-System auflösen, File-Anzahl in `docs/` reduzieren.
2. **Live-Smoke** — Agent submittet selbst neue Fakten in Sandbox-Projekte und verifiziert, dass Welle-B-Detektoren (Conflict / Gap / Dependency) und Spiegel-Pfad korrekt feuern.
3. **UI-Trennung vorbereiten** — Frontend/Interface scharf von Backend/Core trennen, damit das kommende UI-Redesign nur eine Schicht anfasst.

---

## Schritt 1 — Doku-Konsolidierung

**Problem.** Wir haben aktuell in `docs/`:
`AGENTS.md` (Wurzel), `PRODUCT.md`, `ARCHITECTURE.md`, `NOW.md`, `DECISIONS.md`, `agent-execution-plan.md` (476 LOC, historischer Strategie-Plan), `audit-2026-05-14.md` (5 KB, mehrere Audit-Schichten), `qa-seam-inventar.md`, `agent_review.md`, `design-implementation-plan.md`, plus `docs/input/*` (Quellmaterial).

`agent-execution-plan.md` und `audit-2026-05-14.md` sind seit Welle B vollständig durchgearbeitet — sie sind faktisch History, nicht Steuerung.

**Vorgehen.**
1. **`agent-execution-plan.md` auflösen.**
   - Tier-Status-Tabelle (Z. 10–26) → in `NOW.md` als kompakter Block „Agent Execution Plan — Endstand" (4 Zeilen).
   - Leitprinzipien (Z. 31–37) → bereits in `ARCHITECTURE.md` Golden Principles enthalten; nicht duplizieren.
   - Tier A/B-Detail (Z. 41–417) → archivierter Inhalt; nicht erneut speichern. Alle relevanten Outcomes stehen bereits in `DECISIONS.md`.
   - Verification Master-Checklist (Z. 463–476) → in `audit`-Konsolidat (s. u.) übernehmen.
   - Datei löschen.
2. **`audit-2026-05-14.md` auflösen.**
   - Endstand-Master-Checklist + Findings → in `NOW.md` als ein knapper Abschnitt „Master-Checklist (Stand)".
   - Re-Audit-Abschnitt (Welle B) → in `NOW.md` Sprint-Block; Detail-Tabellen entfallen.
   - Claude-Review-Abgleich → einmalig in `DECISIONS.md` als ein Eintrag (Datum + „Claude-Review 9 Punkte: 7 erledigt / 1 zurückgestellt / 1 gestartet").
   - Datei löschen.
3. **`agent_review.md` und `design-implementation-plan.md`** prüfen: wenn ebenfalls historisch → in `DECISIONS.md` zusammenfassen und löschen. (Wenn `design-implementation-plan.md` für den UI-Milestone gebraucht wird, **bleibt** sie und wird in Schritt 3 referenziert.)
4. **`NOW.md` straffen.** Vorheriger-Sprint-Blöcke (B2, B3, Tier A3, Sandbox-Seed etc.) auf max. 3 Zeilen je Eintrag in „Recently completed" zusammenziehen — Workspace-Regel ist „letzte 2 Sprints, 3 Zeilen each".
5. **`AGENTS.md`** Routing-Block aktualisieren: Verweis auf `agent-execution-plan.md` raus.

**Endzustand `docs/` (Soll).**
```
AGENTS.md (Wurzel)
docs/PRODUCT.md
docs/ARCHITECTURE.md
docs/NOW.md
docs/DECISIONS.md
docs/qa-seam-inventar.md         (lebende QA-Karte, bleibt)
docs/design-implementation-plan.md  (nur falls für UI-Milestone aktiv)
docs/input/                      (Quellmaterial, unangetastet)
```

Reduktion: 7 Markdown-Dateien in `docs/` → 4–5.

---

## Schritt 2 — Live-Smoke mit echten Fakten

**Ziel.** Beweisen, dass nach Welle B der Vollpfad `commit-fact` → `mirrorToGraphiti` → Detektoren parallel sauber arbeitet, und dass die Detektor-Footprints, die heute leer sind (5/6 Sandbox-Projekte = 0/0/0), nicht an Code, sondern an Datenmangel liegen.

**Vorgehen.**
1. Sandbox-Projekt **„Hase & Söhne Couture"** wählen (kleinster Footprint, gut isoliert).
2. Per `supabase--insert` und `supabase--curl_edge_functions` drei Fakten setzen, die jeweils einen Detektor zünden:
   - **Conflict-Hit:** zwei `deadline`-Facts mit identischem Title („Final Lookbook"), unterschiedlichem `due_date`.
   - **Gap-Hit:** ein `decision`-Fact ohne korrespondierende deadline → `decision_without_deadline`.
   - **Dependency-Hit:** ein `task` mit `title: "Schnitt freigeben — blockiert durch Final Lookbook"` → `blockiert_durch` Trigger + Title-Substring-Match auf den deadline-Title.
3. Pro Commit: über `commit-fact` echten Pfad nehmen, **nicht** direkt in `canonical_facts` schreiben.
4. Per `supabase--read_query` verifizieren:
   - `change_events` → 3 neue Einträge, `event_type=add`.
   - `contradictions` → 1 neuer Eintrag (`contradiction_type` für deadline).
   - `gap_signals` → 1 neuer Eintrag mit `metadata.kind=decision_without_deadline`.
   - `dependencies` → 1 neuer Eintrag (`dependency_type=blockiert_durch`, `metadata.source=commit-fact/dependencyDetector`).
   - `graphiti_sync_log` → 3 Einträge, Endstatus `ok` (sync läuft async, ggf. ein Reconcile-Tick warten).
5. Im Frontend (Project-Screen Hase & Söhne) prüfen: Konfliktbanner, Gap-Karte, Dependency-Karte erscheinen ohne Reload-Hack.
6. `pipeline_events` per Korrelation kontrollieren — alle Stages durchgängig.
7. Ergebnis (Counts + Auffälligkeiten) als Eintrag „Welle-B-Use-Case-Smoke" in `DECISIONS.md` ablegen, „Use-Case-Smoke offen"-Backlog-Item in `NOW.md` schließen.

**Abbruch / Auffälligkeit.** Findet sich ein Detektor-Pfad als nicht feuernd, wird das in `NOW.md` als neuer Loop dokumentiert, nicht ad hoc gepatcht. Smoke ist Diagnostik, nicht Refactor.

---

## Schritt 3 — Vorbereitung UI-Redesign-Milestone

**Ziel.** Wenn die neuen Interface-Entwürfe kommen, soll **nur** die UI-Schicht angefasst werden müssen. Logik, Pipelines, Daten-Mapping bleiben unberührt.

**Bestandsaufnahme (heute).**
- `src/components/` enthält UI (`ui/`, `entity/`, `project/`, `dialog/`, `devlog/`, `shared/`, `ErrorBoundary`, `NavLink`).
- `src/lib/<domain>/` enthält Hooks + ViewModel-Mapper (z. B. `lib/project/useProject.ts` + `projectViewModel.ts` + `mappers/*`).
- `src/pages/` mischt Layout + Daten-Anbindung (z. B. `Project.tsx`).
- Schichtgrenze ist gesetzt, aber an einigen Stellen unscharf: Komponenten kennen DB-Felder über VM-Typen; Hooks sind sauber.

**Vorbereitende Trennung (ohne Verhaltensänderung).**
1. **ViewModel-Vertrag einfrieren.** `src/lib/project/types.ts` (KonfliktVM, GapVM, DependencyVM, HandlungsbedarfVM, …) ist die Schnittstelle UI ↔ Core. Aktuell schon der Fall — formal als „UI-Contract" markieren (Header-Kommentar + kurzer Eintrag in `ARCHITECTURE.md` als [HARD]-Regel: „UI darf nur ViewModel-Typen aus `lib/<domain>/types.ts` importieren, niemals Supabase-Row-Typen, niemals `integrations/supabase/types`").
2. **Linter-Regel ergänzen.** ESLint `no-restricted-imports`: in `src/components/**` ist `@/integrations/supabase/*` und `@/lib/**/use*Data*` verboten. Komponenten sehen nur den Composition-Hook (`useProject`, `useProjects`) und die VM-Typen.
3. **Page-Komponenten ausdünnen.** `src/pages/Project.tsx` und `src/pages/Index.tsx` prüfen, ob noch direkte Daten-Logik drin ist; wenn ja, in einen Page-Hook (`usePageProject`) verschieben. Sichtbares Verhalten 1:1.
4. **Komponenten-Ordner strukturieren** (Vorbereitung, kein Move-Sturm):
   - `src/components/ui/` = primitives (shadcn)
   - `src/components/<domain>/` = domain-Composites (project, dialog, entity)
   - `src/components/shared/` = übergreifende Composites (Card, Section, etc.)
   - Keine Moves jetzt — Ordnung dokumentieren in `ARCHITECTURE.md`. Move kommt mit dem Redesign.
5. **Design-Token-Audit.** `index.css` + `tailwind.config.ts` durchgehen: alle in Komponenten verwendeten Farben/Radii/Schatten als semantische Tokens vorhanden? Findings als Liste in `NOW.md`-Sprint „UI-Redesign Vorbereitung". Keine Token-Änderungen jetzt — Inventur, damit das Redesign eine klare Greenfield-Basis hat.
6. **Doku.** Neue Doku-Datei nicht nötig; Block in `ARCHITECTURE.md` „Schichtgrenze UI ↔ Core" + Sprint-Block in `NOW.md` „UI-Redesign Milestone — Vorbereitung".

**Bewusst nicht in dieser Phase.**
- Keine UI-Komponente neu zeichnen — wir warten auf die Redesign-Doku.
- Kein Komponenten-Rename / Move (würde Diff-Lärm im Redesign-PR erzeugen).
- Keine neue State-Lib (React Query bleibt Wave-3-Backlog).

---

## Reihenfolge & Verify

1. Doku-Konsolidierung → `ls docs/` zeigt 4–5 .md, Inhalt in NOW/DECISIONS verlustfrei.
2. Live-Smoke → DB-Counts steigen wie geplant, Frontend rendert die drei neuen Karten.
3. UI-Trennung → ESLint-Regel scharf, `bun run lint` grün, `bunx vitest run` 60/60, `tsc --noEmit` grün.

Nach Approval starte ich mit Schritt 1 und melde nach jedem Schritt zurück.
