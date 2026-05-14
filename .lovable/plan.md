## Lage in einem Satz
Die Zuordnungsbox war kein einmaliger Schluckauf. Sie ist ein Symptom einer Reihe von Strukturfehlern in der Conversations-UI und im Backend, die ich jetzt sichtbar mache und gemeinsam in einem Schub aufräume.

## Reverse Engineering — was ist falsch und warum
Ich habe die ganze Konversations-Schicht durchgesehen (DB, Edge Functions `intake-understand` + `commit-fact`, `loadSession`, alle Boxen, BoxFrame, DialogProvider, DialogOverlay). Das sind die echten Fehler, alle aktuell live:

1. **Projektzuordnung — fehlende Kandidaten.** `intake-understand` schreibt nur lexikalische Treffer in `context.candidates`. Wenn der Agent `mode: new` zurückgibt, ist `candidates: []`, obwohl Projekte existieren. Die UI hat dann nichts, was sie zeigen könnte → Plus-Plus-Murks.
2. **Zuordnungsbox — UI mischt Symbole.** „Neues Projekt“ erscheint als Karte mit Plus + Radio gleichzeitig. Es gibt keine Trennung zwischen „bestehendes wählen“ und „neues anlegen“. Bestehende Projekte sind nur sichtbar, wenn das Backend Kandidaten liefert (siehe 1).
3. **Zuordnungsbox — Default ohne Projekte falsch.** Selbst wenn der Agent ein bestehendes Projekt auto-erkennt, fällt die Default-Auswahl bei `mode === "new"` auf `__new__`, weil die Bedingung sture Mode-Logik fährt statt die Kandidaten zu prüfen.
4. **Wissensbox — Roh-JSON in der Beschreibung.** `intake-understand` schreibt `description: stringify(orig.content)` (Key-Value-Liste), und `loadSession` mappt das nach `payload.sachverhalt`. Resultat: User sieht „name: Dennis Kalker · email: ... · role: ...“ statt einer Aussage.
5. **Konfliktbox — bekommt nie ihre Daten.** `KonfliktBox` erwartet `payload.beschreibung`, `faktA`, `faktB`. `loadSession` schreibt nur `sachverhalt/quelle/wirkung`. → Echte Konfliktboxen aus dem DB-Pfad würden völlig leer rendern.
6. **Gap-Box — gleiche Lücke.** `GapBox` erwartet `wirkung/betrifft/lebensdauer`. `loadSession` füllt nur `wirkung` (aus `content.impact`), `betrifft`/`lebensdauer` fehlen, obwohl die Felder im Fact-Content existieren (`affects`, `valid_until`).
7. **Auswahl-/Aktions-/Eingabe-Boxen — werden vom DB-Loader nie korrekt gefüttert.** `loadSession` mappt jeden Nicht-Assignment-Box auf das gleiche Generic-Payload. Wenn das Backend mal eine `selection`- oder `action`-Box anlegt, ist sie funktionsunfähig.
8. **Dialog-Header mobil zu schwer.** Auf 390 px Breite frisst der Header so viel Höhe, dass die eigentliche Auswahl gequetscht wird (siehe Screenshot).
9. **Commit-Fehler-UX.** Wenn `commit-fact` `NEEDS_ASSIGNMENT` zurückgibt, sieht der User nur einen Toast — die Zuordnungsbox wird nicht hervorgehoben oder hochgescrollt. Beim hektischen Klicken wirkt das wie „nix passiert“.
10. **Bestehende offene Sessions sind unrettbar.** Sessions, die mit der alten Logik mit `candidates: []` und `mode: new` geboren wurden (z. B. die im Screenshot), können nur „neu anlegen“ — selbst nach UI-Fix, weil die Daten in der DB unvollständig sind. Es fehlt ein Repair-Pfad.

## Warum konnte das passieren — strukturell
- `intake-understand` und `loadSession` haben nie einen gemeinsamen, getypten Vertrag für `review_cases.context`. Jede Seite legt eigene Felder ab und liest eigene Felder. Drift war garantiert.
- `description` wurde gleichzeitig als Klartext-Anzeige UND als Daten-Container missbraucht (`stringify(content)`). Damit kann ein UI-Renderer nie eine saubere Box bauen.
- Die Box-Renderer haben keine Schema-Validierung — fehlt ein Feld, rendern sie still leer.
- Es gibt keinen Integrationstest, der „Insert in `review_cases` → `loadSession` → konkrete Box rendert sinnvoll“ prüft. Genau die Lücke, die diese Klasse Bugs durchlässt.

## Umfang der Reparatur

### A. Vertrag fixieren — ein gemeinsames Box-Payload-Schema
Neue Datei `supabase/functions/_shared/reviewCaseContext.ts` und Spiegel im Frontend `src/lib/dialog/reviewCaseContext.ts`:
- `AssignmentContext`: `mode`, `recommended_project_id`, `candidates`, `all_projects`, `suggested_new_name`, `agent_reason`, `asset_id`.
- `KnowledgeContext`: `fact_type`, `summary` (Klartext, eine Zeile), `details` (Key→Value Map), `source_label`.
- `ConflictContext`: `summary`, `fact_a`, `fact_b`, `against_fact_id`.
- `GapContext`: `summary`, `wirkung`, `betrifft`, `lebensdauer`.
Sowohl `intake-understand` als auch `loadSession` benutzen ausschließlich diese Typen.

### B. `intake-understand` umbauen
- Immer alle bestehenden Projekte (Top 8 nach `updated_at`) zusätzlich in `assignment.all_projects` schreiben — unabhängig von Lexik/Agent.
- `recommended_project_id` setzen: Auto-Treffer oder bester Lex-Treffer.
- `mode` bleibt informativ, ist aber nicht mehr UI-blockierend.
- Wissensbox: `summary` aus `extracted.title` + 1 Klartextsatz aus den 1–2 wichtigsten Content-Feldern bauen, statt Roh-Stringify.
- Konflikt/Gap/Reference jeweils mit den Feldern füllen, die die Boxen wirklich brauchen.

### C. `loadSession` umbauen
- Pro `box_type` einen sauberen Mapper auf das jeweilige Frontend-Schema.
- Keine Generic-Payloads mehr.
- Alle Projektnamen in einem zweiten Query nachladen, damit `candidates`/`all_projects` mit `name` angereichert sind, falls Backend nur IDs liefert.

### D. `ZuordnungsBox` neu bauen
- Klarer Block „Empfehlung“ oben (falls `recommended_project_id` gesetzt) mit „Übernehmen“-Button.
- Darunter Auswahlliste aller bestehenden Projekte (echte Liste, optional als Combobox bei > 6).
- Separate Sektion „Neues Projekt anlegen“ unten mit Vorschlagsname, deutlich nachrangig dargestellt.
- Plus-Symbol nur in der Sektion „Neues Projekt“, nicht neben Radio-Buttons.
- Action-Button reagiert auf Auswahl: „Projekt übernehmen“ vs. „Neues Projekt anlegen“.

### E. Andere Boxen reparieren
- `WissensBox`: liest `summary` und `details` (Key→Value Liste), keine JSON-Strings mehr.
- `KonfliktBox`: liest aus dem neuen `ConflictContext`.
- `GapBox`: liest aus dem neuen `GapContext`.
- Schema-Validierung mit klaren Defaults, damit fehlende Felder sichtbar (nicht stumm leer) sind.

### F. Mobile Header & Layout
- Header-Padding auf Mobile reduzieren, Untertitel kleiner.
- Box-Innenabstände auf 390 px komprimieren.
- Sticky-Action-Footer pro Box auf Mobile, statt Buttons im Fluss.

### G. Commit-Fehler-UX
- Bei `NEEDS_ASSIGNMENT`: Auto-Scroll zur Zuordnungsbox + visuelles Highlight statt nur Toast.
- `commit-fact`: bestätigte Zuordnung darf nicht nochmal `confirmed` schreiben (idempotent), und unterscheidet `project_id` vs `new_project_name` strikt.

### H. Repair-Pfad für Altlasten
- Edge-Function `assignment-repair` (oder Migration über `supabase--insert`): findet alle offenen Assignment-Cases mit `candidates: []` und füllt `context.all_projects` + `recommended_project_id` aus den vorhandenen Projekten nach. Damit funktionieren auch die im Screenshot sichtbaren Sessions sofort.

### I. Tests, die genau diese Klasse Bug abfangen
- Edge-Test: `intake-understand` mit 0/1/3 vorhandenen Projekten → erwartet immer `all_projects` gefüllt.
- Frontend-Test: `loadSession` mit echten DB-Fixtures pro Box-Typ → garantiert keine leeren Pflichtfelder.
- Snapshot-Test pro Box-Renderer: bei minimalem gültigen Payload rendert Inhalt, kein Leer-Zustand.

## Validierung am Ende
1. Aktuelle offene Session „Dennis Kalker…“ zeigt Empfehlung + alle bestehenden Projekte + Option „Neues Projekt“.
2. „Reels für Teinacher“-Auto-Erkennung lässt sich mit einem Klick übernehmen, kein Textfeld nötig.
3. Konflikt-, Gap-, Wissens-Boxen aus echten DB-Daten rendern lesbaren Klartext, kein JSON.
4. Mobile (390 px) Layout: Auswahl ist nicht mehr unter dem Header gequetscht.
5. Commit-Fluss: Fehler-Toast + Auto-Scroll zur blockierenden Box.
6. Tests grün.

## Was ich bewusst NICHT mache
- Kein Umbau der Graphiti-/AOL-Pfade.
- Kein neues Embedding-Scoring (Phase 8).
- Kein Refactor der Pipeline-Health/QA-Phase 4 — bleibt im Backlog.