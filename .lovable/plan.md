## Phase 7.5 — Härtung, Projektzuordnung & Live-Stimme

Vier zusammenhängende Baustellen, die zusammen den Verstehens-Loop produktionsreif machen.

---

### A. Robustheit & Fehlerpfade

**Problem heute**

- Agent-Timeout nicht explizit (kein AbortController, hängt bis Plattform-Timeout)
- Leere Extraction = stilles `facts: 0` ohne UI-Feedback → Kern bleibt auf „processing" hängen
- Rate-Limit/402 wird in `intake-understand` erkannt, aber **nicht zurück an den Asset/UI** gespiegelt
- Kein Idempotenz-Schutz: wenn `intake-process` zweimal anstößt, gibt's doppelte Sessions
- Wenn `intake-understand` crasht, bleibt das Asset auf `completed`, ohne Session — Nutzer sieht nichts

**Lösung**

1. **Verstehens-Status pro Asset** (eigene Spur, getrennt vom Parsing-Status)
  - Neue Spalte `assets.understanding_status` (Enum: `pending | running | empty | review_ready | failed | rate_limited | payment_required`)
  - Neue Spalte `assets.understanding_error` (text, kurz)
  - Wird vor jedem Agentenlauf auf `running` gesetzt, am Ende auf den passenden Endzustand
  - UI hört auf diese Spalte, nicht auf das alte `processing_status`
2. **Idempotenz**
  - Eindeutiger Index `proposed_facts(extraction_run_id)` und vor dem Lauf: wenn Asset schon `understanding_status in ('running','review_ready')`, nichts tun und 200 zurück
  - `extraction_run_id` deterministisch aus `asset_id + attempt_n` ableiten, damit Wiederholungen nicht Doubletten produzieren
3. **Agent-Timeout**
  - `AbortController` mit 30s in `agentClient.ts`, sauberer Fehler `AgentTimeoutError`
  - `intake-understand` mappt das auf `understanding_status='failed'` mit klarem Text
4. **Leere Extraction = sichtbar**
  - `understanding_status='empty'`, Live-Stimme sagt: „Nichts Neues erkannt — Original ist gespeichert."
  - Kein Session-Insert (so wie jetzt), aber UI weiß Bescheid
5. **Retry-Knopf am Kern**
  - Wenn `understanding_status in ('failed','rate_limited','payment_required')`: Kern zeigt subtilen Retry-Affordance neben dem Live-Text
  - Klick ruft `intake-understand` mit `attempt_n+1` erneut auf (zählt im Asset hoch)

---

### B. Projektzuordnung — das Kernfeature

**Briefing-Auftrag (§7.4 + §6.3 + §3.3 Zuordnungsbox):** Jedes Asset/jeder Fakt muss einem Projekt zugeordnet werden, **mit Review**. Heute landet alles bei `project_id=null` oder im Default-„Allgemein"-Projekt. Das ist falsch.

**Strategie: schmal, präzise, agentisch — kein Overengineering**

Drei Signale, eine Entscheidung, ein Review:

1. **Explizit (stärkstes Signal):**
  Wenn der Nutzer das Asset im **Projekt-Screen** abgelegt hat → `project_id` ist gesetzt → keine Zuordnungsfrage. Steht heute im Datenmodell, wird nur noch nicht genutzt. Wir verdrahten den ProjectScreen-Drop sauber an `useIntake({ projectId })`.
2. **Lexikalisch (billig, oft richtig):**
  Beim Verstehens-Lauf scoren wir den Roh-Text gegen alle Projekte des Users:
  - Treffer auf Projektname (case-insensitive, ganzes Wort) → +3
  - Treffer auf jeden Stakeholder-Namen (`persons.name`) verknüpft per `project_stakeholder_links` → +2 pro Match
  - Treffer auf Themennamen (`topics.name`) im Projekt → +2 pro Match
  - Treffer auf Org-Domain in URL/Mail-Header → +1
   Höchster Score ≥ 3 = klarer Kandidat. Score 1–2 = unsicher. 0 = unklar.
3. **Agentisch (Tie-Breaker, nur bei Unsicherheit):**
  Wir geben dem Agenten **zusätzlich zum Text** eine kompakte Liste „Vorhandene Projekte" (Name + 1-Satz-Beschreibung + Top-3-Themen + Stakeholder-Initialen, max ~600 Tokens) und ein zweites Tool `suggest_project_assignment` mit Schema:
   Der Agent darf `null` zurückgeben („eher neues Projekt"). Lexikalischer Score wird im System-Prompt mitgegeben („Lexikalische Hinweise: …") — der Agent gewichtet, entscheidet aber selbst.

**Was passiert mit dem Ergebnis**


| Lage                              | UI-Verhalten                                                                                                                                                                                                             |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Score ≥ 3 **und** Agent stimmt zu | Asset bekommt `project_id` direkt. Im Dialog erscheint eine **Zuordnungsbox** als sanfte Bestätigung („Zuordnung zu „Aurora Rebrand" — passt?"). Default = bestätigt; ein Klick reicht zum Verwerfen.                    |
| Score 1–2 **oder** Agent unsicher | Asset bleibt `project_id=null`. Die Zuordnungsbox ist die **erste** Box im Dialog mit den Top-3 Kandidaten + „Neues Projekt" + „Allgemein". Erst nach Wahl werden die Wissens-Boxen committet (sie übernehmen die Wahl). |
| Score 0 **und** Agent leer        | Zuordnungsbox mit „Neues Projekt anlegen" als Default + Vorschlagsname aus dem Text.                                                                                                                                     |


**Konsequenzen für den Commit**

- `commit-fact` liest die Projektwahl aus der **Session-Metadaten** (`dialog_sessions.metadata.assigned_project_id`) statt lazy „Allgemein" anzulegen
- Die Zuordnungsbox schreibt die Wahl in die Session, sobald sie aufgelöst ist
- Keine Lazy-„Allgemein"-Logik mehr — sauberer Bruch

**Datenmodell**

- Bestehende Spalten reichen: `assets.project_id`, `dialog_sessions.project_id`, `proposed_facts.project_id`
- Neuer Enum-Wert in `box_type`: existiert bereits als `assignment` ✓
- `dialog_sessions.metadata` bekommt strukturiertes Feld `{ assignment: { suggested_project_id, score, agent_reason, candidates: [...] } }`

**Was bewusst nicht reinkommt**

- Embedding-Ähnlichkeit auf Asset-Inhalt vs. Projekt-Vektor (das ist Phase 8 mit Graphiti/pgvector)
- Auto-Splitting eines Assets über mehrere Projekte (selten, später)
- Lernende Gewichtung der Score-Faktoren

---

### C. Intake & Intelligenz — Briefing-Audit

Geprüft gegen §3 (Datenfluss) und §7 (kritische Stellen):


| Briefing-Pflicht                                                  | Status                                                                                                                                                              |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| §4-Datenfluss App→Supabase→Unstructured→Wissensmotor→Supabase→App | **Teilweise.** Wissensmotor heute = Lovable AI Agent (kein Graph). Pfad ansonsten korrekt. Graphiti = Phase 8.                                                      |
| §6.4 Provenance (Quelle, Zeit, Run, Review, Commit)               | ✓ über `sources`, `proposed_facts.extraction_run_id`, `change_events`                                                                                               |
| §6.3 Delta-Logik (bestätigt/ergänzt/ersetzt/widerspricht)         | **Schmal:** nur `add` / `confirm` per Title-Match. Phase 8 erweitert. Das ist akzeptiert.                                                                           |
| §6.5 Gap-Logik                                                    | Agent kann `open_point` extrahieren → Gap-Box. **Aber:** kein Schreiben in `gap_signals`. → in dieser Phase nachziehen, weil sonst Handlungsbedarf-UI nichts sieht. |
| §6.6 Dependency-Logik                                             | Agent kann `reference` extrahieren, **schreibt aber nicht in `dependencies**`. Symmetrisch zu Gap nachziehen.                                                       |
| §7.3 Direkte Inputs gleichwertig                                  | ✓ Notiz/Link laufen parallel zu Datei                                                                                                                               |
| §7.5 Gap Signals nicht dekorativ                                  | Heute dekorativ, weil wir nur Box anzeigen. Mit Schritt oben behoben.                                                                                               |
| §7.8 Overlay-Backend-Kopplung                                     | ✓ Session/Cases/Facts/Events sauber verdrahtet                                                                                                                      |


**Konkrete Korrekturen in 7.5**

- `commit-fact`: bei `fact_type='open_point'` zusätzlich Eintrag in `gap_signals`
- `commit-fact`: bei `fact_type='reference'` zusätzlich Eintrag in `dependencies`
- `intake-understand`: bei Datei mit Email-Headern (heutige Notiz-Detection) → `sources.source_type='email'` statt pauschal `upload`

---

### D. Live-Stimme der Intelligenz

**Idee:** Unter dem Kern, mittig, schwebend, große aber dünne Typo (≈ `text-2xl font-light tracking-wide opacity-70`), ein einziger Satz, der die Intelligenz **in Echtzeit** sprechen lässt. Kein Toast, kein Banner. Nur Text.

**Beispielstimmen (alle ≤ ~70 Zeichen)**

- „Ich lese gerade dein PDF."
- „Drei Personen erkannt, eine kenne ich schon."
- „Das gehört vermutlich zu Aurora Rebrand."
- „Nichts Neues entdeckt - Original ist gespeichert."
- „Widerspruch erkannt, helfe mir bitte ..."
- „Eine Lücke beim Budget, das ist ein Blocker."
- „Bereit. Gib mir Daten."

**Mechanik**

1. Neue UI-Komponente `EntityVoice` direkt unter `EntityCore`
  - Fade/Blur-Übergang zwischen Sätzen (200ms), niemals abrupt
  - Eine Queue mit Min-Anzeigedauer pro Satz (1.5s), damit nichts flackert
2. Quelle der Sätze: ein neuer Hook `useEntityVoice()`
  - Hört auf dieselben Realtime-Channels wie heute (`assets`, `dialog_sessions`)
  - Hört zusätzlich auf neue Channels: `proposed_facts` (INSERT, gefiltert auf user) und auf Updates von `assets.understanding_status`
  - Ein kleiner reducer mappt **Event → Satz**. Z. B. Asset-Insert → „Ich nehme das auf.", first proposed_fact → „Ich erkenne etwas.", session open → „Ich habe X Sachen für dich.", failed → „Das hat nicht geklappt — nochmal?"
3. Backend liefert die spezifischen Sätze nicht — die werden im Frontend aus den Events komponiert. Das hält den Agent fokussiert und macht die Stimme deterministisch und sofort.
  - Ausnahme: bei der Zuordnungsbox blenden wir den `agent_reason_short` aus der Session-Metadaten ein („Klingt nach Aurora Rebrand wegen 'Lisa Müller' und 'Brand-Workshop'.")
4. Bestehender `lastImpact`-Text und der „Review öffnen"-Button verschwinden — beides geht in die Stimme auf. Der Kern bekommt im `review-ready`-Zustand einen subtilen Pulse als Klick-Affordance, mehr braucht es nicht.

---

### Reihenfolge der Umsetzung

1. Migration: `assets.understanding_status` + `understanding_error`, Enum dafür
2. `agentClient.ts`: AbortController + `AgentTimeoutError`
3. `intake-understand`: Idempotenz, Status-Spur, Gap-/Dependency-Schreibpfad in `commit-fact`
4. Lexikalisches Scoring + zweiter Agent-Tool-Call `suggest_project_assignment`
5. Zuordnungsbox als erste Box wenn unsicher; Session-Metadaten erweitern
6. `commit-fact` liest Projektzuordnung aus Session statt Lazy-„Allgemein"
7. `useEntityVoice` + `EntityVoice`-Komponente, alte Status-Texte/Buttons entfernen
8. Retry-Affordance bei `failed/rate_limited/payment_required`
9. End-to-End-Test: Notiz mit Bezug auf bestehendes Projekt → Auto-Zuordnung mit Bestätigungsbox; Notiz ohne Bezug → Auswahlbox mit Kandidaten

### Betroffene Dateien

**Migration:** neue Spalten + Enum auf `assets`

**Edge Functions:**

- `supabase/functions/_shared/agentConfig.ts` — neues Tool-Schema `suggest_project_assignment`, neue System-Prompt-Sektion
- `supabase/functions/_shared/agentClient.ts` — Timeout, neuer Call `callSuggestAssignment`
- `supabase/functions/_shared/projectScoring.ts` (neu) — lexikalisches Scoring
- `supabase/functions/intake-understand/index.ts` — Statusspur, Idempotenz, Assignment-Pass, Zuordnungsbox-Insert
- `supabase/functions/commit-fact/index.ts` — liest Session-Assignment, schreibt Gap/Dependency

**Frontend:**

- `src/components/entity/EntityVoice.tsx` (neu)
- `src/lib/voice/useEntityVoice.ts` (neu)
- `src/pages/Index.tsx` — entfernt `lastImpact`-Bottom-Strip, hängt EntityVoice unter den Kern, hört auf `understanding_status`, Retry-Knopf
- `src/components/dialog/boxes/ZuordnungsBox.tsx` — bekommt echte Kandidaten + „Neues Projekt"-Option
- `src/lib/dialog/loadSession.ts` — Assignment-Box als erste Box wenn unsigned
- `src/lib/dialog/boxMapping.ts` — Default für `assignment` schon da

**Docs/Memory:**

- `mem://features/verstehens-loop` — um Projektzuordnung & Voice ergänzen
- `mem://features/projekt-zuordnung` (neu) — Scoring-Regeln + Schwellen

### Was bewusst draußen bleibt

- Embedding-Linking (Phase 8 mit Graphiti)
- Voice-Eingabe (Mikro)
- Persistente Voice-Historie
- Lernende Score-Gewichte
- Auto-Splitting eines Assets