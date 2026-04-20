## Phase 7.7.1 — Intake-Korrekturen, vier konkrete Bugs

Vier eigenständige Fehler aus dem letzten Schnitt. Kein neues Konzept, nur Reparatur.

---

### 1. Kein Fullscreen-Blocker mehr beim Verarbeiten

**Bug:** `HomeDropOverlay` legt sich beim Drag *und* beim "busy"-Zustand mit `fixed inset-0 backdrop-blur-md` über den gesamten Screen. Im Screenshot: alles unscharf, unbedienbar.

**Fix:**

- `HomeDropOverlay` rendert sich **nur** während eines aktiven Drags (`active === true`). Ohne Drag = nicht im DOM, kein Backdrop.
- Während `busy` ohne Drag passiert visuell **nichts** auf Home. Der Kern wird heiß (das ist die Rückmeldung), das Stimm-Voice-Element informiert.
- Wenn der Nutzer während `busy` *droppt*: Das Overlay erscheint kurz mit "Noch beschäftigt" — aber es **blockiert die UI nicht ungefragt**. Der Drag-Counter macht es ohnehin nur sichtbar, solange Files über der Seite sind. Sobald man sie wegzieht oder fallenlässt → weg.
- Restliche Home-UI (`SideGrid`, `IntakeSessionsPanel`, Top-Buttons, EntityVoice) bleibt während `busy` voll bedienbar. Nur neue Drops werden in `handleDrop` abgelehnt — alles andere unverändert klickbar.

### 2. Projektzuordnung kann nicht mehr abgelehnt/übersprungen werden

**Bug:** `ZuordnungsBox` zeigt einen "Später"-Button, der `commitBox(..., "reject")` aufruft. Damit kann die Box als verworfen markiert werden, ohne dass je eine Projekt-ID gewählt wurde — Folge: alle anderen Boxen scheitern später mit `NEEDS_ASSIGNMENT`.

**Fix:**

- "Später"-Button aus `ZuordnungsBox` entfernen. Es gibt nur noch **eine** Aktion: "Zuordnen".
- VOR Zuordnung können andre fragen nicht beantwortet werden
- Entscheidung ist immer `confirm` mit entweder `project_id` (vorhandenes Projekt) oder `new_project_name` (neu anlegen).
- Im `BoxFrame`-Footer wird in der Zuordnungsbox ausschließlich der "Zuordnen"-Button gerendert.
- Backend: `commit-fact` → `handleAssignment` darf bei `box_type='assignment'` keine `decision='reject'` mehr akzeptieren. Falls doch → 400 mit klarer Meldung. Damit ist es auch über Direktaufrufe nicht mehr möglich.

### 3. „Lisas Projekt" wird nicht vorausgewählt / vorgeschlagen

**Bug:** Bei der Testdatei mit „Lisa Müller" liefert der Agent `reason_short` wie *„Die explizite Nennung von Lisa Müller legt Zuordnung zu Lisas Projekt nahe."* — aber:

- Es existiert kein DB-Projekt namens „Lisas Projekt" → lexikalischer Score = 0 → `mode='new'`.
- `suggested_new_name` vom Agent ist null (Tool-Schema erlaubt es, aber der Agent füllt es bei `project_id=null` häufig nicht).
- Aktueller Fallback: `reason_short.split(/[.,;:–—-]/)[0]` → ergibt einen ganzen Halbsatz wie „Die explizite Nennung von Lisa Müller legt Zuordnung zu Lisas Projekt nahe", nicht „Lisas Projekt".

**Fix in zwei Ebenen:**

**a) Prompt-Klarstellung in `agentConfig.ts` (`ASSIGNMENT_SYSTEM_PROMPT`):**

- Wenn `project_id=null`, MUSS `suggested_new_name` ein **knapper, sauberer Projektname** sein (max ~40 Zeichen), keine Erklärung. Beispiele in den Prompt aufnehmen: *„Lisas Projekt"*, *„Aurora-Angebot"*, nicht *„Projekt für Lisa"*.

**b) Robusterer Server-Fallback in `intake-understand`:**

- Wenn `suggested_new_name` leer ist:
  1. Erstens: aus `reason_short` einen quotierten Namen extrahieren via Regex auf `„…"`, `"…"`, `'…'`. Bei der Testdatei matcht das auf `„Lisas Projekt"`.
  2. Zweitens: dominanten Stakeholder/Topic-Namen aus den extrahierten `facts` ziehen. Bei „Lisa Müller" als Stakeholder-Fact → `"Lisa Müllers Projekt"`.
  3. Erst danach: Dateiname-Fallback.
- `defaultSelection` in `ZuordnungsBox`: bei `mode='new'` → `__new__` (steht schon richtig); das Textfeld bekommt den Default-Wert direkt aus `suggestedNewName` — heute schon korrekt verdrahtet. Wenn der Backend-Fallback greift, steht der Name automatisch im Eingabefeld.

### 4. Bereits entschiedene Boxen müssen während der Session korrigierbar sein

**Bug:** `BoxFrame` collapsed bestätigte Boxen (`collapsed = bestaetigt && !readonly`) → Aktionen weg, Inhalte weg, kein Weg zurück.

**Fix:**

- Im Edit-Modus bleiben bestätigte und verworfene Boxen sichtbar (Opacity wie heute), aber:
  - Sie zeigen ihren finalen Zustand (Häkchen / durchgestrichen) ungeändert.
  -  "Übernehmen/Verwerfen"-Aktionen bleibt änderbar  

  - Wichtig: das funktioniert nur lokal-zustandsmäßig vor dem nächsten Commit-Klick. Bei Klick auf "Übernehmen/Verwerfen" geht erneut ein `commitBox`-Call raus — der Backend-Code in `commit-fact` updated `review_cases.box_state` einfach idempotent, das ist heute schon so.
- Im Read-Only-Modus (geschlossene Session)  Nur lesend.

### 5. Auto-Close + Auto-Apply nach voller Beantwortung

**Bug:** Wenn alle Boxen entschieden sind, bleibt der Dialog offen, der Nutzer muss manuell schließen.

**Fix:**

- In `DialogProvider`/`DialogOverlay`: kleiner Effect, der bei jedem `commitBox`-Erfolg prüft, ob alle Entscheidungs-Boxen (alle außer `kontext`) im End-Zustand sind (`END_STATES`).
- Wenn ja:
  - Kurze, leise Bestätigung (Voice oder kleines Toast: „Verstanden — abgeschlossen."), 1.2 s sichtbar.
  - Dann `closeDialog()`.
- Backend: `commit-fact.updateSessionProgress` setzt heute schon `status='completed'` wenn `resolved >= total` → die Session erscheint automatisch als grün im rechten Panel. Nichts zu ändern.
- Nebenwirkung: `entityState` in `Index.tsx` darf nach Auto-Close zurück auf `idle` — der bestehende Effekt (`if (!dialogSession && entityState === "review-ready")`) greift, sobald der Dialog dicht ist.

### 6. Overlay öffnet sich erst wenn die Entität fertig ist (Klärung)

Heute korrekt verdrahtet: `dialog_sessions INSERT` → 1.4 s Voice-Beat → `openSessionFromDB`. Voraussetzung ist, dass `entityState` vorher auf `processing` steht (Heißfarbe) und beim Insert auf `review-ready` wechselt. Das stimmt im Code. Falls beim Test wieder nicht: in `pendingSessionId`-Logik die Race-Condition mit dem dialogSession-Auto-Close-Effect entschärfen — der setzt heute `entityState='idle'`, sobald `dialogSession === null`, was nach einem manuellen Schließen direkt das Overlay-Wieder-Öffnen verhindert. Wir entkoppeln das: `pendingSessionId` wird **nicht** in dem Effekt zurückgesetzt; nur `setEntityState('idle')`.

---

### Betroffene Dateien

- `src/components/entity/HomeDropOverlay.tsx` — bleibt strikt drag-only, kein Busy-Vollblocker
- `src/components/dialog/boxes/ZuordnungsBox.tsx` — „Später"-Aktion entfernen, nur „Zuordnen"
- `src/components/dialog/BoxFrame.tsx` — bestätigte Boxen mit „Korrigieren"-Link statt collapse
- `src/components/dialog/DialogProvider.tsx` — Auto-Close bei vollständiger Beantwortung
- `src/pages/Index.tsx` — Pending-Session-Effect sauber entkoppeln (kein vorzeitiger Reset)
- `supabase/functions/_shared/agentConfig.ts` — Prompt schärft `suggested_new_name`
- `supabase/functions/intake-understand/index.ts` — robusterer Fallback (quotierter Name → Stakeholder → Filename)
- `supabase/functions/commit-fact/index.ts` — `box_type='assignment'` darf nicht `reject` werden

### Akzeptanzkriterien

- Während Verarbeitung ist die UI **voll** bedienbar; nichts liegt blockierend übers Bild.
- Beim Drag erscheint das Overlay nur, solange tatsächlich gezogen wird, und verschwindet beim Loslassen.
- Die Zuordnungsbox hat nur einen Button: „Zuordnen". Keine Möglichkeit zu überspringen.
- Bei der Testdatei steht im neuen-Projekt-Feld bereits ein sauberer Name (z. B. „Lisas Projekt") als Default.
- Während des Verstehens-Laufs lassen sich bereits entschiedene Boxen immer noch bearbeiten.
- Sobald alle Boxen entschieden sind, schließt sich der Dialog automatisch nach kurzer Bestätigung.
- Vom Panel rechts geöffnete, abgeschlossene Sessions bleiben strikt read-only (kein „Korrigieren"-Link).

### Bewusst draußen

- Kompletter Re-Open einer geschlossenen Session in den Edit-Modus.
- Undo nach dem Auto-Close.
- Re-Run von einzelnen Boxen gegen den Agent.