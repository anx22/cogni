## Phase 7.5.2 — Bugfix: Foreign-Key zeigt auf falsche Tabelle

### Befund (eindeutig)

Edge-Log:

```
review_cases: insert or update on table "review_cases"
violates foreign key constraint "review_cases_session_id_fkey"
```

Schema-Inspektion zeigt warum:

```
review_cases.session_id  →  review_sessions(id)   ← falsche Tabelle
```

Der gesamte neue Verstehens-Loop schreibt aber in `dialog_sessions` (Phase 7). `review_sessions` ist eine Alttabelle aus dem ursprünglichen Datenmodell, die nicht mehr genutzt wird. Folge: `dialog_sessions`-Insert klappt, sofortiger `review_cases`-Insert scheitert an der FK → Asset wird auf `failed` gesetzt → „Das hat nicht geklappt — nochmal?" erscheint zurecht. Genau das sieht man im Screenshot.

Eine Test-Notiz schlägt deshalb **immer** fehl, völlig unabhängig vom Inhalt.

### Lösung — eine kleine, präzise Migration

1. **Constraint umbiegen**
  - `ALTER TABLE review_cases DROP CONSTRAINT review_cases_session_id_fkey;`
  - `ALTER TABLE review_cases ADD CONSTRAINT review_cases_session_id_fkey FOREIGN KEY (session_id) REFERENCES dialog_sessions(id) ON DELETE CASCADE;`
2. **Symmetrisch prüfen & reparieren** (gleiche Klasse von Bug)
  Wir prüfen alle FKs, die auf die alten Tabellen `review_sessions` / `change_events` (falls Alttabelle existiert) zeigen, und biegen sie auf die aktiven Tabellen um, falls vorhanden. Konkret zu prüfen in der Migration: `proposed_facts`, `change_events`, `gap_signals`, `dependencies` — falls dort noch eine `session_id` mit alter Referenz hängt, gleicher Fix.
3. **Alttabelle** `review_sessions` **DROPPEN**.
4. **Hängendes Test-Asset zurücksetzen** (optional, sauber)
  Setzt das eine `failed`-Asset und sein gehängtes Sibling zurück auf `pending`, damit der Retry-Knopf am Kern (oder ein erneuter Wurf) sie noch einmal durchlaufen lässt — ohne hängende Karteileichen in der DB.

### Test-Erwartung nach dem Fix

`testdatei.txt` mit „Lisa Müller / Aurora-Angebot / Budget 2050 EUR / Email-Hinweis" reinwerfen →

1. Voice: „Ich nehme deine Datei auf."
2. Voice: „Ich verstehe gerade."
3. Voice: „Ich erkenne etwas." (erster proposed_fact)
4. Kern wird golden, Voice: „Bereit. N Sachen für dich."
5. Klick auf Kern → Dialog mit **Zuordnungsbox** (mode=`new`, Vorschlag „Aurora-Angebot" o. ä., weil keine Projekte existieren) + Wissensboxen für Stakeholder (Lisa Müller), Topic (Aurora-Angebot), Open-Point (Frist Freitag), Budget-Update.

### Betroffene Dateien

- **Migration (neu):** Constraint `review_cases.session_id` von `review_sessions` auf `dialog_sessions` umbiegen, plus Sweep für gleichartige Bugs auf den anderen verwandten Tabellen
- Keine Code-Änderungen am Frontend nötig
- Keine Änderungen an Edge Functions nötig

### Was bewusst nicht in diesem Schnitt

- `review_sessions`-Tabelle löschen (eigener Schritt)
- Backfill aller alten `failed`-Assets (nur das eine relevante)
- Visualisierung des `understanding_status` an `RecentAssets`-Tiles (separater Politurschritt)