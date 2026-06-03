# 10x Analysis: Produktintelligenz / Cogni
Session 1 | Datum: 2026-05-18

> **Basis:** Vollständige Codebase-Analyse — Entity, ProjectScreen, DialogOverlay,
> Intake-Pipeline, AOL-Service (Python/LangGraph), Supabase-Typen, Mapper,
> Devlog, OrbLab, Tests. **Nicht** nur die Planungs-Docs.

---

## Echter Code-Zustand (was tatsächlich gebaut ist)

### Was funktioniert, vollständig:

- **Entity Screen** — Pointer-Follow-Physics via rAF, State Machine
  (idle/hover/processing/review-ready/failed), Orb-Character-System (SiriCharacter
  + FacePillCharacter), EntityVoice mit Realtime-Queue + Min-Display-Timer,
  Drop Zone window-scoped, InputOverlay, AssetOrbit, IntakeSessionsPanel, AccountDrawer
- **Intake-Pipeline** — Datei → Supabase Storage → assets-Insert → intake-process
  Edge Function → Unstructured-Parse → AOL-Run; Notiz + Link direkt als Asset;
  fire-and-forget mit pollAolRun-Polling; Toast-Spur
- **AOL-Service (Python/LangGraph)** — FastAPI + LangGraph, State mit 12 Feldern
  (text → candidates → deltas → gaps → dependencies → conflicts → cases → session),
  LangSmith-Tracing, Callback-Pattern zu Lovable Cloud; `/aol/run` läuft durch
- **Dialog-System** — BatchReviewOverlay (Listen-View, Bulk-Confirm mit Enter,
  Schwellen-Confirm ab 5), FaktDrillOverlay (Einzel-Case), Escape-Doppelklick,
  Routing per openCount, alle Box-Typen: wissen/zuordnung/konflikt/gap/eingabe/
  kontext/aktion/auswahl
- **Project Screen** — LageZone (Hero mit editierbarem Name, ConflictBanner,
  Outcome, Stakeholder-Popover, MetaChips), HandlungsbedarfList (4 Arbeitsmodi,
  Blocker-Badge, Detail + Antworten), VerlaufFeed (6 Filter-Typen, clickable →
  Dialog), SubstanzSection (Themen-Cards + Dokument-Liste)
- **Project View Model** — Composer aus allen DB-Tabellen (canonical_facts,
  contradictions, gap_signals, dependencies, decisions, tasks, open_points,
  feedback, change_events, topics, assets, stakeholder_links), 8 Mapper-Module,
  Tests vorhanden
- **Sidebar** — AppSidebar existiert und ist in ProjectScreen eingebaut
- **Auth** — Vollständig, inkl. Redirect

### Kritische Lücken im Code (nicht nur im Plan):

1. **`/aol/confirm` ist ein kompletter Stub** — `return {"ok": True, "queued": True}`.
   Review-Commits fließen NICHT zurück in den LangGraph / Graphiti. Das bedeutet:
   Das Knowledge-Graph-Update nach jedem Review existiert im Code nicht.
   `TODO D4: confirm_to_graph` — unimplementiert.

2. **AOL-Run ist synchron** — `COMPILED.invoke(initial)` blockiert den FastAPI-Worker
   für die gesamte Run-Dauer. Bei langen Dokumenten → Timeout-Risiko.
   `TODO D2: durabler Aufruf mit Checkpointer` — unimplementiert.

3. **Demo-Daten noch aktiv** — `demoProject.ts`, `demoProjects.ts` existieren.
   `ProjectScreen` wirft Demo-IDs mit Toast-Error zurück. Kein sauberer
   "leerer Zustand" für neue Nutzer ohne Demo-Crutch.

4. **Kein projektübergreifender Review-Queue-Zähler** — kein Component, keine Query.

5. **Kein Confidence-Decay** — weder im DB-Schema noch in der UI.

6. **Kein Export** — keine "Briefing generieren"-Funktion.

7. **Kein Keyboard-Navigation (J/K)** — BatchReview hat Enter für Bulk-Confirm,
   aber kein Row-Navigation-Shortcut.

8. **`ImpactPipelinePanel.tsx` + `HomePrompt.tsx`** — existieren in `home/`,
   aber werden nirgends im Hauptflow verwendet. Stehen still.

---

## Die Frage

Was würde Cogni 10x wertvoller machen — basierend auf dem, was **wirklich** im Code steht?

Die schwerste Arbeit ist getan: Intake → Parse → Understand → Propose → Review → Commit.
Der Kern rennt. Die Engpässe sind jetzt:

1. **Der Feedback-Loop fehlt**: Commits verschwinden im Stub.
2. **Der Projektzustand ist statisch nach dem ersten Build**: Kein Decay, keine Proaktivität.
3. **Der Nutzer muss immer kommen**: Das System wartet.
4. **Das Review ist noch zu aufwändig**: Gute Ansätze, aber nicht schnell genug.
5. **Null Außenwirkung**: Kein Export, kein Teilen, kein Teaminput.

---

## Massive Opportunities

### 1. AOL Confirm → Graph schließen (der fehlende Ring)

**Was:** Den TODO D4 wirklich implementieren: `/aol/confirm` triggert nach jedem
Commit einen LangGraph-Knoten, der die Entscheidung (confirm/reject + Nutzerpräzisierung)
als Episode in Graphiti schreibt — Fact Invalidation bei Reject, Verknüpfung bei Confirm.

**Warum 10x:** Ohne diesen Ring lernt das System nichts. Jede Review-Entscheidung
verhallt ungehört. Mit dem Ring: Das Graphiti-Kontextfenster beim nächsten Dokument
enthält die vorige Nutzerentscheidung. Konflikt-Erkennung wird schärfer. Gap-Erkennung
wird präziser. Das ist der Unterschied zwischen einem Extraktionswerkzeug und einem
System, das mit dir denkt.

**Was wird möglich:** Das nächste Dokument zum selben Projekt bekommt bereits
Kontext aus vorigen Reviews. "Du hast letztes Mal entschieden, dass Stakeholder X
keine Entscheidungshoheit hat — das hier widerspricht dem direkt."

**Effort:** Mittel — FastAPI-Callback-Infrastruktur existiert bereits. Graphiti-Client
im AOL-Service muss Episoden schreiben können.

**Risiko:** Graphiti-Integration noch offen (TODO D2). Muss robust gegen Graphiti-Ausfälle sein.

**Score:** 🔥 Must do — ohne das ist der Knowledge Graph Dekoration

---

### 2. Asynchroner AOL-Run (durables Invite + Checkpointer)

**Was:** Den TODO D2 schließen: LangGraph-Invoke async, mit PostgresSaver als
Checkpointer, Intermediate-States über Callback sichtbar. FastAPI-Worker blockiert
nicht mehr auf die gesamte Lauf-Dauer.

**Warum 10x:** Aktuell ist jeder Run ein Glücksspiel gegen den Worker-Timeout.
Große PDFs, langsame Unstructured-Antworten, Graphiti-Latenz — alles kumuliert in
einem synchronen HTTP-Call. Bei mehreren parallelen Uploads kollabiert das.
Asynchron: Der Worker gibt sofort zurück, der Run läuft im Hintergrund,
Realtime bringt den Status.

**Was wird möglich:** Mehrere Dateien gleichzeitig einwerfen ohne Angst. Produktiv
für echte Nutzung mit großen Dokumentenpaketen. Retry bei Zwischenfehlern (Checkpointer).

**Effort:** Hoch — aber die Infrastruktur ist fast da: aol_runs-Tabelle existiert,
Callback-Pattern existiert, pollAolRun existiert.

**Score:** 🔥 Must do — Stabilität für echte Nutzung

---

### 3. Proaktive Gap-Alarmierung ("Das System kommt zu dir")

**Was:** Ein Supabase cron-Job (`pg_cron`) läuft täglich und prüft pro Projekt:
- Gap Signals ohne Aktivität seit > 14 Tagen
- Konflikte ohne Commit seit > 7 Tagen
- Letzte Nutzeraktion auf dem Projekt > 21 Tage

Wenn Schwellen erreicht: Push-Event → EntityVoice-Queue (via Realtime), optional
Email-Notification.

**Warum 10x:** Das System reagiert heute nur. Du musst etwas einwerfen, damit etwas
passiert. Aber Projekte rotten im Stillen: Eine offene Entscheidung 6 Monate unbeantwortet,
ein Konflikt ungelöst während das Projekt sich verschiebt. Proaktiv = das System
erinnert dich, bevor du es öffnest.

**Was wird möglich:** Cogni wird zu etwas, das du morgens checkst — nicht weil du
etwas einwerfen willst, sondern weil es dir etwas zu sagen hat.
Das ist der Unterschied zwischen Werkzeug und Partner.

**Effort:** Mittel — pg_cron auf Supabase, Score-Logik auf vorhandenen Tabellen,
neuer Realtime-Kanal in useEntityVoice.

**Risiko:** Noise-Management kritisch. Zu viele Alerts → Abstumpfung.
Max 1 Alert pro Projekt pro Woche als harte Schranke.

**Score:** 🔥 Must do (nach AOL-Stabilisierung)

---

### 4. Email-Direct-Connect (Gmail/Outlook)

**Was:** OAuth-Flow zu Gmail/Outlook. Cogni scannt den Posteingang nach neuen Emails
von bekannten Stakeholdern (aus `project_stakeholder_links`). Schlägt automatisch vor:
"Neue Email von Stakeholder X — für Projekt Y verarbeiten?" Ein Klick → Intake.

**Warum 10x:** Die größte Reibung im Intake-Flow ist Copy-Paste von Emails.
Jeder PM verbringt 60%+ seiner Arbeitszeit in Email. Wenn der Einwurf-Kanal
direkt aus dem Posteingang kommt, verdoppelt sich die Nutzungsfrequenz ohne
Verhaltensänderung.

**Was wird möglich:** Cogni hält sich selbst aktuell. Stakeholder schreibt →
Cogni schlägt vor → Review in 30 Sekunden.

**Effort:** Hoch — OAuth-Scope (gmail.readonly), Email-Parsing, Privacy-Guardrails,
Vorschlags-UI. Nicht für V1.

**Risiko:** Privacy-Sensitivität hoch. Opt-in muss granular und transparent sein.
Absolut kein Auto-Intake ohne Bestätigung.

**Score:** 👍 Strategische Wette — nach V1-Härtung

---

## Medium Opportunities

### 5. Confidence Decay — Wissen altert

**Was:** Alle `canonical_facts` bekommen ein Decay-Modell: Wenn ein Fakt älter als
N Tage und seit dem letzten Commit nie revalidiert wurde, wird ein `gap_signal`
(type: `stale_fact`) erzeugt. Im Handlungsbedarf sichtbar als "Prüfen"-Item.

**Warum 10x:** Projekte leben. Eine Entscheidung von vor 6 Monaten kann durch
Marktänderungen, Personalwechsel, neue Anforderungen obsolet sein. Das System
weiß das nicht — sofern es nicht fragt. Ein Fakt mit hohem Confidence-Score
der still altert ist schlimmer als ein bekannter Gap.

**Impact:** Macht temporale Integrität sichtbar. Nutzer werden daran erinnert,
Fakten zu revalidieren. "Diese Entscheidung ist 8 Monate alt — noch gültig?"

**Effort:** Niedrig — pg_cron auf `canonical_facts`, Alter + letzter
Review-Timestamp aus `commit_results`. Kein neues Datenmodell.

**Score:** 🔥 Must do

---

### 6. Export "Project Briefing" (PDF/Markdown)

**Was:** Ein Klick im ProjectHeaderActions → generiert strukturiertes Dokument
aus aktuellem `projectViewModel`: Lagetext + offene Punkte + letzte Entscheidungen
+ Stakeholder + nächster Termin. Als Markdown oder PDF.

**Warum 10x:** Jede Agentur, jede Beratung, jeder interne PM muss regelmäßig
Statusberichte produzieren. Das Projektmodell enthält alles Nötige — es fehlt nur
der letzte Schritt: Ausgabe. Wenn Cogni in 30 Sekunden liefert, was sonst 45 Minuten
kostet, ist das sofortiger, messbarer ROI für jeden neuen Nutzer.

**Impact:** Macht Cogni für Stakeholder sichtbar, die nicht im System sind.
Jeder exportierte Briefing ist ein Referral-Moment.

**Effort:** Niedrig-Mittel — Liest aus bestehendem ViewModel, generiert
strukturierten Text. Markdown sofort, PDF via Browser-Print oder jsPDF.

**Score:** 🔥 Must do

---

### 7. Keyboard-Navigation im Review (J/K + Enter)

**Was:** Im BatchReviewOverlay: J navigiert zur nächsten Row, K zur vorigen,
Enter committet die aktuelle, R verwirft. Tab springt durch interaktive Felder.
Focus-Ring visuell sauber.

**Warum 10x:** BatchReview ist der am häufigsten genutzte Pfad nach einem
Dokument-Upload. 20 Cases mit der Maus durchzuklicken kostet 5 Minuten.
Mit Tastatur: 60 Sekunden. Power-User-Retention hängt an dieser Fließgeschwindigkeit.

**Impact:** Enter für Bulk-Confirm existiert bereits. J/K für Row-Navigation
fehlt. Das ist der fehlende halbe Meter zur Keyboard-first-Experience.

**Effort:** Sehr niedrig — 20 Zeilen State + keydown-Listener im BatchReviewOverlay.

**Score:** 🔥 Must do

---

### 8. Automatische Konfliktlösungs-Vorschläge

**Was:** Im AOL-Service, beim Schreiben einer `conflict`-Review-Case: Der conflict_detector-
Knoten formuliert nicht nur den Widerspruch, sondern auch einen Auflösungsvorschlag
basierend auf Zeitstempel, Quelle, Confidence. "Fakt B (Email, 3. Mai) ist jünger
als Fakt A (Präsentation, 1. Mai). Empfehlung: Fakt A verwerfen."

**Warum 10x:** Konflikte sind der Review-Schritt mit dem höchsten kognitiven Aufwand.
Wer entscheiden muss statt nur bestätigen, bricht den Flow. Ein guter Vorschlag
reduziert Review-Fatigue bei gleichzeitiger Autonomie.

**Impact:** Konflikt-Review-Zeit sinkt. Completion-Rate steigt.

**Effort:** Mittel — Erweitert den conflict_detector im AOL-LangGraph.
Vorschlag landet als `ctx.suggested_resolution` in der Review-Case.

**Score:** 👍 Stark

---

### 9. Dokument-Diff-Intelligenz (Version-Delta)

**Was:** Wenn ein Dokument hochgeladen wird, das einem bereits bekannten ähnelt
(gleicher Name, gleicher Asset-Typ, gleiches Projekt), schlägt Cogni vor:
"Klingt nach einer neuen Version von Angebot_v2.pdf — Diff verarbeiten?"
AOL-Run vergleicht dann nur die Fakten-Deltas statt alles neu zu extrahieren.

**Warum 10x:** Bei iterativen Projekten (Angebote, Specs, Protokolle) lädt der
Nutzer Versionsfolgen hoch. Ohne Diff-Erkennung werden dieselben Fakten dreimal
extracted und dreimal reviewed. Das erzeugt Review-Lärm.

**Impact:** Review-Aufwand bei Versions-Uploads sinkt auf das wirklich Neue.

**Effort:** Mittel — Hash-Vergleich + Titel-Similarity bei asset-Insert;
neuer AOL-Graph-Pfad für "version_update"-Runs.

**Score:** 👍 Stark

---

### 10. Projektzustand-Gesundheits-Score

**Was:** Pro Projekt ein berechneter Score (0–100) aus: Gap-Dichte, offene Konflikte,
Zeit seit letztem Commit, Blocker-Anzahl, Staleness. Im Entity Screen auf
ProjectTiles als Farb-Indikator sichtbar. Nicht als Vanity-Metrik, sondern als
operative Triage-Hilfe.

**Warum 10x:** Wer 5 Projekte hat, braucht 5 Sekunden Orientierung. Der Score
macht Urgenz sichtbar ohne Einlesen. "Rot: 3 ungelöste Konflikte, 0 Commits
letzte 7 Tage." Macht die richtige Frage sofort sichtbar: Wo brennt es?

**Effort:** Niedrig — Algorithmus auf bestehenden Daten im ViewModel,
Farb-Badge im ProjectTile.

**Score:** 👍 Stark

---

## Small Gems

### 11. ImpactPipelinePanel aktivieren

**Was:** `ImpactPipelinePanel.tsx` und `HomePrompt.tsx` existieren in `home/`,
sind aber nirgends im Hauptflow eingebunden. Verstehen und aktivieren — oder
bewusst entfernen.

**Warum mächtig:** Totes Code ist technische Schuld und kognitive Last.
Falls es eine geplante Funktion ist: Jetzt rein, oder es wächst weiter als Zombie.

**Effort:** Minimal — Analyse der Intention + einbinden oder löschen.

**Score:** 👍 Kläre das

---

### 12. Demo-Daten vollständig ersetzen

**Was:** `demoProject.ts` und `demoProjects.ts` aus dem Produktfluss entfernen.
`ProjectTile` mit echten Projekten oder einem sauberen Onboarding-Zustand.

**Warum mächtig:** Demo-Kacheln, die mit Toast-Error abbrechen, sind kein guter
erster Eindruck. Sauberer Leer-Zustand ("Kein Projekt — leg eins an") ist klarer.

**Effort:** Niedrig — Demo-Daten entfernen, Leer-State UI bauen.

**Score:** 🔥 Must do vor jedem echten User-Test

---

### 13. Projektübergreifender Review-Queue-Badge

**Was:** Persistent sichtbare Zahl "7 offene Reviews" im Header oder Sidebar.
Cross-project Query auf `review_cases` mit `box_state = 'proposed'`.

**Warum mächtig:** Ohne Badge weiß der Nutzer nicht, was ihn erwartet.
Mit Badge: tägliche Eintrittsmotivation ohne Push-Notification.
"Ich muss Cogni kurz checken — 3 offene Erkenntnisse."

**Effort:** Sehr niedrig — 1 Supabase-Query, 1 Badge-Component.

**Score:** 🔥 Must do

---

### 14. AOL-Service /health robuster machen

**Was:** Aktuell checkt `/health` nur, ob env-Variablen gesetzt sind (bool-Flag).
Echte Health-Checks: Graphiti erreichbar? Supabase erreichbar? Last run timestamp?

**Warum mächtig:** Für Betrieb und Debugging. Wenn der AOL-Service stumm ausfällt,
sieht der Nutzer "Verstehen fehlgeschlagen" ohne Kontext. Gutes Health-Check →
bessere Monitoring-Basis.

**Effort:** Sehr niedrig — 3 HTTP-Pings in `/health`.

**Score:** 👍 Gut für Stabilität

---

### 15. Wöchentlicher Digest (Supabase cron + Email)

**Was:** Jeden Montag 08:00: automatische Zusammenfassung pro Projekt aus
`change_events` + `gap_signals` der Vorwoche. Als Email oder als einmalige
EntityVoice-Nachricht beim ersten App-Open.

**Warum mächtig:** Nutzer, die Cogni nicht täglich öffnen, werden zurückgeholt.
Externes Gedächtnis für das System.

**Effort:** Mittel — pg_cron, Email-Kanal (Supabase Edge Function + Resend/SendGrid).

**Score:** 👍 Stark (nach 3+ Monaten echter Nutzung relevant)

---

## Recommended Priority

### Do Now (Technische Schuld schließen + sofortiger UX-Gewinn)

1. **AOL Confirm → Graph schließen** (#1) — Ohne das lernt das System nichts.
   Der fehlende Ring macht jeden bisherigen Commit wertlos für den nächsten Run.
2. **Demo-Daten entfernen** (#12) — Vor jedem echten User-Test. Kein Verhandeln.
3. **Review-Queue-Badge** (#13) — Eine Query, sofortiger Retention-Effekt.
4. **Keyboard-Navigation J/K** (#7) — 20 Zeilen Code, massiv verbesserte
   Review-Geschwindigkeit für Power-User.
5. **Confidence Decay** (#5) — Cron auf vorhandenen Tabellen, baut temporale
   Integrität ins Produkt ein.

### Do Next (Stabilität + hohe Hebelwirkung)

1. **AOL-Run asynchron** (#2) — Voraussetzung für echte Nutzung mit größeren
   Dokumentenpaketen. Blockiert parallele Uploads.
2. **Export Project Briefing** (#6) — Sofortiger ROI-Nachweis, macht Cogni
   für externe Stakeholder sichtbar.
3. **Projektzustand-Gesundheits-Score** (#10) — Kein neues Datenmodell,
   sofortiger Orientierungsgewinn.
4. **Automatische Konfliktlösungs-Vorschläge** (#8) — Reduziert Review-Fatigue.
5. **ImpactPipelinePanel klären** (#11) — Kläre ob es rein oder raus soll.

### Explore (Strategische Bets)

1. **Proaktive Gap-Alarmierung / Project Pulse** (#3) — Transformiert Cogni von
   reaktivem Werkzeug zu aktivem Partner. Timing: nach AOL-Stabilisierung.
   - Risiko: Noise-Management. 1 Alert/Projekt/Woche als harte Schranke.
   - Upside: Der Hauptgrund, warum Nutzer Cogni täglich öffnen.

2. **Email-Direct-Connect** (#4) — Eliminiert größte Intake-Reibung.
   - Risiko: Privacy, OAuth-Komplexität.
   - Upside: 2-3x tägliche Nutzung ohne Verhaltensänderung.

3. **Dokument-Diff-Intelligenz** (#9) — Macht Versionen semantisch statt dateibasiert.
   - Timing: nach Grundstabilisierung des AOL-Flows.

### Backlog

1. **Wöchentlicher Digest** (#15) — Erst relevant mit 3+ Monate echter Nutzung.
2. **AOL /health robuster** (#14) — Gut, aber kein User-Value.

---

## Fragen

### Aus Code beantwortet

- **Q: Ist der Graphiti-Feedback-Loop implementiert?**
  A: Nein. `/aol/confirm` ist Stub. TODO D4 offen. Das ist der kritischste fehlende Ring.
- **Q: Ist AOL-Run durabel/async?**
  A: Nein. Synchroner `COMPILED.invoke()`. TODO D2 offen. Timeout-Risiko bei langen Runs.
- **Q: Gibt es Keyboard-Shortcuts im Review?**
  A: Enter für Bulk-Confirm existiert. J/K für Row-Navigation fehlt.
- **Q: Sind Demo-Daten im Produktfluss?**
  A: Ja. `demoProject.ts` + `demoProjects.ts` aktiv, ProjectScreen wirft sie mit Toast zurück.
- **Q: Gibt es Cross-Project-Review-Badge?**
  A: Nein. Kein Component, keine Query.
- **Q: Was ist `ImpactPipelinePanel.tsx`?**
  A: Existiert in `home/`, wird nicht verwendet. Unklarer Status.

### Offen / Entscheidungsbedarf

- **Q: Ist Graphiti aktuell überhaupt connected?** — `/health` prüft nur `bool(os.environ.get("GRAPHITI_SERVICE_URL"))`.
  Ob echte Graphiti-Calls im graph.py passieren, ist aus dieser Analyse nicht ersichtlich.
- **Q: Was ist die Zielgruppe für V1-Launch?** — Einzelnutzer oder kleines Team?
  Entscheidet ob Team-Layer vorgezogen wird.
- **Q: Gibt es echte Testnutzer?** — Würde Demo-Daten-Priorität und Digest-Timing stark verschieben.

## Next Steps

- [ ] TODO D4 schließen: `/aol/confirm` → Graphiti-Episoden schreiben
- [ ] TODO D2 schließen: AOL-Run async + PostgresSaver-Checkpointer
- [ ] Demo-Daten entfernen, sauberer Onboarding-Leer-Zustand
- [ ] Review-Queue-Badge einbauen (1 Query + Badge-Component)
- [ ] J/K-Navigation in BatchReviewOverlay
- [ ] ImpactPipelinePanel: Intention klären → einbinden oder löschen
- [ ] Graphiti-Connectivity im Health-Check verifizieren
- [ ] Confidence Decay: pg_cron auf canonical_facts
- [ ] Export Briefing: Markdown-Ausgabe aus ProjectViewModel
