## Tier A3 — Mittelfristige Architektur-Härtung

Drei unabhängige Bausteine. Reihenfolge bewusst: erst die saubere DB-Wand (A3.3), dann der God-Hook (A3.2), zuletzt die TypeScript-Strictness-Schleife (A3.1) — weil die letzten beiden ohne valide DB-Daten und ohne saubere Schichten unnötig viele False-Positives produzieren.

---

### Schritt 1 — A3.3: JSONB-Validierung auf DB-Ebene

**Warum zuerst:** Ich submitte jetzt selbst Facts (Sandbox) und der `commit-fact`-Pfad ist offen für beliebigen JSONB-Müll. Trigger schließt das Loch hart, bevor Tier B Refactors die Frontend-Validierung anfassen.

**Umfang (eine Migration):**
1. PL/pgSQL-Funktion `validate_canonical_fact_content(content jsonb, fact_type fact_type)` returns void.
   Pro `fact_type` (`decision`, `deadline`, `task`, `open_point`, `topic`, `stakeholder`, `reference`, `other`) Pflichtfelder:
   - `decision` → `title` (text) Pflicht, optional `value`/`previous`/`decided_by`
   - `deadline` → `title` + `due_date` (ISO-parsebar) Pflicht
   - `task` → `title` Pflicht
   - `topic` → `title` ODER `name` Pflicht
   - `stakeholder` → `title` ODER `name` Pflicht
   - `open_point` → `title` Pflicht
   - `reference` → `title` Pflicht
   - `other` → keine Pflicht
   Verstoß → `RAISE EXCEPTION 'canonical_fact_content_invalid: <feldname> fehlt für <fact_type>'`.
2. Trigger `trg_validate_canonical_fact_content` BEFORE INSERT OR UPDATE auf `canonical_facts`.
3. Pendant für `proposed_facts` (gleiche Funktion, gleiche Regeln) → früher Fehler statt erst beim Commit.
4. Sandbox-Bestand vor Migration verifizieren: `SELECT count(*) FROM canonical_facts WHERE NOT (content ? 'title')` — falls Treffer: Migration startet mit `UPDATE` auf einen Default-Title-Fallback (kein Datenverlust).

**Verify:**
- Migration läuft idempotent (`CREATE OR REPLACE FUNCTION`, `DROP TRIGGER IF EXISTS`).
- 1 Insert mit Garbage über `supabase--insert` schlägt mit klarer Message fehl.
- 1 Insert mit korrekter Form geht durch.
- Bestehender Sandbox-Pfad (`commit-fact` auf eine offene Box) bleibt grün.

---

### Schritt 2 — A3.2: `useProject.ts` (514 LOC) in 3 Schichten

**Ziel:** Testbarkeit der ViewModel-Mapper, Vorbereitung für Wave-B-Detektoren.

**Aufteilung:**
1. **`useProjectData.ts`** — nur die 16 Queries + Realtime-Subscription. Liefert benannte Roh-Arrays (`canonicalFacts`, `proposedFacts`, `reviewCases`, …). Kein Mapping, kein Aggregat.
2. **`useProjectViewModel.ts`** — pure Funktionen: `toKonfliktVM(rows)`, `toGapVM(rows)`, `toSubstanzVM(rows)`, `toEntscheidungVM(rows)`, `toTimelineVM(rows)`. Nehmen Rohdaten, geben fertige Render-Modelle. Keine Hook-Calls drinnen, deshalb sofort unit-testbar.
3. **`useProjectSignals.ts`** — Aggregate: `handlungsbedarf`, `konfliktcount`, `gapSeverity`, `outcomeReady`. Reine Funktionen über die ViewModels.
4. **`useProject.ts`** schrumpft zur Composition: ruft `useProjectData()` → mappt mit `useMemo(() => toXVM(rows), [rows])` → kombiniert Signale → gibt heutiges Interface 1:1 zurück.

**Tests:** `useProjectViewModel.test.ts` mit Vitest, je 2–3 Cases pro Mapper (Empty / Happy / Edge-Case). Snapshot-Test für ein realistisches Sandbox-Set (Tübingen Tower mit Höhen-Konflikt).

**Verify:**
- ProjectScreen rendert visuell unverändert (manueller Klickpfad: Hase → Tübingen → Spätzbohrer).
- Vitest grün, mind. 8 neue Mapper-Tests.
- Keine `any` neu eingeführt.
- Bundle-Size unverändert ±2 KB.

---

### Schritt 3 — A3.1: `strictNullChecks: true` ordnerweise

**Warum zuletzt:** Nach A3.2 sind die Mapper sauber typisiert; nach A3.3 sind DB-Felder vorhersagbar. Damit drücken wir die Error-Welle von ~300 auf wahrscheinlich 100–150.

**Vorgehen:**
1. `strictNullChecks: true` in `tsconfig.app.json` setzen, lokal `tsc --noEmit` zählen.
2. Errors nach Ordner gruppieren mit `tsc --noEmit | rg "error TS" | awk '{print $1}' | sort | uniq -c | sort -rn`.
3. Reihenfolge: `src/lib/` → `src/data/` → `src/hooks/` → `src/components/`. Pro Ordner ein Commit.
4. Regeln: kein neues `as any`, kein `!`-Suppression ohne `// reason: ...`-Kommentar daneben.
5. Wenn ein Ordner > 80 Errors hat: weiter splitten (z.B. `src/components/dialog/` separat).

**Verify pro Schritt:**
- `tsc --noEmit` für den Ordner grün.
- ESLint weiterhin 0 Errors.
- Vitest + Deno-Tests grün.
- Pre-commit (`--max-warnings 0`) blockt.

**Abbruchkriterium:** Wenn nach Ordner 1 (`src/lib/`) mehr als 200 Errors verbleiben, stoppe ich, melde Zahlen + Top-5-Cluster und wir entscheiden, ob wir Stage-2 splitten oder pausieren. Kein Big-Bang.

---

### Doku-Updates am Ende

- `docs/NOW.md` Recently completed: ein Eintrag pro abgeschlossenem Schritt mit Zahlen.
- `docs/DECISIONS.md` Append:
  - `A3.3` JSONB-Validierung als Trigger statt CHECK-Constraint (CHECK darf nicht IMMUTABLE-bruch verursachen).
  - `A3.2` 3-Schichten-Pattern als Vorlage für künftige God-Hooks.
- `docs/qa-seam-inventar.md`: Risikoabbau für `canonical_facts.content` (von „garbage möglich" → „trigger-protected").

### Was nicht passiert

- Kein UI-Redesign.
- Keine neuen Features.
- Keine Änderungen an Edge Functions außer falls A3.3 dort eine Validierung dupliziert (dann Cleanup, kein Wachstum).
- Auth, RLS, Routing bleiben unangetastet.