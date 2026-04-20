

## Block B1 — ProjectScreen liest live aus Supabase

Echte Projekte (9 in der DB) statt `demoProject.ts` und `demoProjects.ts`. Side-Grid links, Projekt-Routing und Projekt-Screen werden komplett auf Live-Daten umgestellt. `demoProject.ts` bleibt nur als Typ-Quelle/Fallback erhalten, bis B2/B3 abgeschlossen sind.

---

### 1. Zentraler Hook `useProject(id)` — neu

`src/lib/project/useProject.ts`

Lädt parallel und mappt auf das von den UI-Komponenten erwartete Shape:

| UI-Feld                | Quelle                                                                                                         |
|------------------------|----------------------------------------------------------------------------------------------------------------|
| `name`, `description`, `status` | `projects` (eq id)                                                                                    |
| `lagetext`             | aktuell: aus jüngstem `project_state_snapshots.summary` oder Fallback aus Counts                              |
| `outcome`              | `outcome_signals` (eq project_id, neueste Zeile)                                                              |
| `stats.naechsterTermin`| frühestes `deadlines.due_date` in der Zukunft                                                                |
| `stats.letzteAenderung`| `MAX(updated_at)` aus relevanten Tabellen → relativer Zeitstring                                              |
| `stats.budget`         | aus `canonical_facts` mit `fact_type='budget'` (falls vorhanden), sonst leer                                  |
| `konflikte`            | `contradictions` mit `resolved=false`                                                                         |
| `gaps`                 | `gap_signals` mit `status='open'`                                                                             |
| `dependencies`         | `dependencies` mit `resolved=false`                                                                           |
| `handlungsbedarf`      | abgeleitet: `decisions` (entscheiden), `gap_signals`+`open_points` (klaeren), `tasks` (umsetzen), `feedback` (pruefen), `dependencies` (klaeren+blocker) |
| `verlauf`              | `change_events` (limit 100, sortiert)                                                                        |
| `themen`               | `topics` + abgeleitete Counts via Aggregat-Query                                                              |
| `dokumente`            | `assets` mit `project_id=eq id` (file_name, file_type, created_at, metadata.version ?? 1)                    |
| `stakeholder`          | `project_stakeholder_links` joined mit `persons` und `organizations`                                          |

Realtime-Subscription auf alle relevanten Tabellen (`canonical_facts`, `change_events`, `tasks`, `decisions`, `deadlines`, `gap_signals`, `dependencies`, `contradictions`, `assets`, `outcome_signals`, `topics`, `project_stakeholder_links`) gefiltert auf `project_id=eq.${id}` → invalidiert nur die betroffene Teilabfrage.

Status: `loading | ready | empty | error`. `empty` zeigt einen leeren Lagebild-Platzhalter („Noch keine Erkenntnisse — leg etwas ab").

---

### 2. ProjectScreen umbauen

`src/components/project/ProjectScreen.tsx`

- `demoProject` raus, stattdessen `useProject(projectId)`.
- Bei `loading`: dezenter Skeleton (gleiche Höhe wie LageZone).
- Bei `empty`: nur LageZone mit Lagebild „Noch keine Substanz" + Drop-Hinweis.
- Bei `ready`: bestehende Komponenten unverändert weiterverwenden, Props kommen aus dem Hook.
- `realProjectId` bleibt der einzige akzeptierte Wert; Demo-IDs (`p1` …) lösen einen Toast „Projekt nicht gefunden" + Zurück-Button aus.

---

### 3. Side-Grid auf echte Projekte umstellen

`src/data/demoProjects.ts` wird **nicht gelöscht** (Typ `DemoProject`/`ProjectSignal` werden weiter referenziert), aber:

- Neuer Hook `src/lib/project/useProjects.ts` lädt alle Projekte des Users (`projects` + Aggregat-Counts pro Projekt: `open_count` aus `tasks`+`open_points`+`decisions(draft)`, `signal` aus `contradictions`/`gap_signals`/Deadline-Druck).
- `Index.tsx` ersetzt `demoProjects` durch das Ergebnis dieses Hooks.
- Mapping zur DemoProject-Shape: `initial = name.split(' ').map(w=>w[0]).join('').slice(0,3).toUpperCase()`, `lastChangedAt = updated_at`, `signal` deterministisch aus den Counts berechnet (`conflict` > `review` > `action` > `calm`).

---

### 4. Komponenten-Anpassungen (minimal)

Alle vier Subkomponenten (`LageZone`, `HandlungsbedarfList`, `VerlaufFeed`, `SubstanzSection`) lesen heute via `typeof demoProject`. Damit sie weiter typsicher mit dem Hook-Output funktionieren, wird ein zentraler Typ `ProjectViewModel` in `src/lib/project/types.ts` definiert (entspricht dem bisherigen `demoProject`-Shape) und die Komponenten-Imports werden umgestellt.

`VerlaufFeed` enthält bereits eine eigene Direkt-Query auf `change_events`. Diese wird **entfernt**, weil der Verlauf jetzt zentral aus dem Hook kommt (kein doppeltes Laden).

---

### 5. Bewusst draußen (gehört zu B2/B3)

- URL-basiertes Routing `/projekt/:id` → B2.
- Projekt anlegen / leerer Side-Grid-Add-Button verdrahtet → B3.
- ZuordnungsBox „neues Projekt" → B3.
- Echtes Stakeholder-CRUD, Themen-Merging, Dokument-Preview → Block E.

---

### 6. Akzeptanzkriterien

- Klick auf eine echte Projektkachel öffnet den Projekt-Screen mit den **tatsächlichen** Counts und Inhalten dieses Projekts aus der DB.
- Ein neuer Commit über den Verstehens-Loop ändert sichtbar: Lagebild-Counts, Verlauf bekommt einen Eintrag, Handlungsbedarf wächst — ohne Reload.
- Side-Grid zeigt die 9 vorhandenen Projekte sortiert nach `updated_at`, mit Initial-Token und Signal-Punkt aus echten Konflikt/Gap-Daten.
- Klick auf eine Demo-ID-Kachel (existiert nach Umstellung nicht mehr) ist ausgeschlossen, weil der Side-Grid nur noch echte UUIDs erzeugt.

---

### 7. Betroffene Dateien

- `src/lib/project/useProject.ts` — neu
- `src/lib/project/useProjects.ts` — neu
- `src/lib/project/types.ts` — neu (`ProjectViewModel`)
- `src/components/project/ProjectScreen.tsx` — Datenquelle umstellen, Loading/Empty
- `src/components/project/LageZone.tsx` — Typ-Import umstellen
- `src/components/project/HandlungsbedarfList.tsx` — Typ-Import umstellen
- `src/components/project/VerlaufFeed.tsx` — eigene Query entfernen, Typ-Import umstellen
- `src/components/project/SubstanzSection.tsx` — Typ-Import umstellen
- `src/pages/Index.tsx` — `demoProjects` → `useProjects`-Hook
- `docs/implementierung-aktuell.md` — Block B1 als erledigt markieren

