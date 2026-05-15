# Zwei-Stufen-Vorgehen — Stufe 1: Gesamt-Review & Zielmodell-Inventar

Stufe 2 (Umsetzung) folgt erst nach deinen Kommentaren auf Stufe 1.

## Leitsatz

Die Prototype-JSX unter `docs/redesign/prototype/*.jsx` ist **Zielmodell**, nicht Pixel-Wahrheit.
Sie definiert Blöcke, Hierarchie, UX-Charakter. Sie definiert nicht: exakte Maße, Demo-Daten, finale Mikro-Interaktion.
Abweichungen dürfen sein — aber nur bewusst und mit kurzer Begründung.

## Was Stufe 1 produziert

Eine einzige Datei: **`docs/redesign/REVIEW.md`**.
Kompakt, lesbar in einem Durchgang, kein Ticketberg. Aufgebaut in drei Teilen:

### Teil A — Sieben High-Level-Entscheidungen

Pro Screen/Modus eine Leitfrage, an der hängt der Rest. Jede mit kurzem Vergleich Ist↔Soll und einer Empfehlung. Keine Tickets, keine Komponentennamen — Produktentscheidungen.

Geplante Leitfragen:
1. **Home-Charakter** — Stage mit zentraler Entität vs. Dashboard-mit-Orb. Was soll man in der ersten Sekunde fühlen?
2. **Sidebar-Rolle** — sekundärer Anker (Prototype) vs. heimliche Hauptnavigation (Ist). Wie viel darf sie?
3. **Project-Detail-Dramaturgie** — vier Rollen mit Atmosphäre-Streifen vs. Karten-Stapel. Wie liest man den Screen vertikal?
4. **Project-Hero-Inhalt** — Lagetext + Status-Pills + Outcome-Bar vs. nur Eyebrow+Titel. Was ist „aktueller Stand"?
5. **Dialog-Paradigma** — Git-Diff-Liste mit inline-Auflösung in 10 Sekunden vs. Box-Stapel. Wie viel Vorentscheidung delegieren wir an cogni?
6. **Konflikt- & Lücken-Choreografie** — collapsed mit Inline-Chips, expandable mit Quellen-`vs`-Cards und „cogni empfiehlt"-Begründung vs. nur Variantenwahl. Wie sichtbar ist Provenance?
7. **Drill-vs-Batch-Wechsel** — wann öffnet sich die große Display-Card-Ansicht, wann bleibt es Liste?

### Teil B — Soll-Ist-Inventar je Screen (kompakt)

Pro Screen eine kurze Tabelle, max. ~12 Zeilen. Keine Code-Pfade, keine Mikro-Pixel. Spalten:

| Block | Soll-Charakter (1 Zeile) | Ist-Stand | Lücke (visuell / UX-Logik / Daten) |

Abgedeckte Screens:
- Home (Entity-Stage, Sidebar mit Mini-Entität, PipelineWidget mit Jetzt+Pipeline+Footer, HomePrompt, Asset-Orbit)
- Project-Detail (Atmosphäre, Sidebar, Hero, Lage, Handlungsbedarf+Verlauf, Substanz)
- Dialog-Batch (Header, Row-Varianten, Commitbar, Bulk-Logik)
- Dialog-Drill (Display-Cards, vs-Trenner, Begründung)
- Entity-Modi (Idle, Drag-Over, Processing, Review-Ready)

Lücken werden in jeder Zeile in drei Dimensionen markiert:
- **V** = Visuell (Tokens, Spacing, fehlender Block)
- **UX** = UX-Logik (Verhalten, State-Wechsel, Erwartung)
- **D** = Daten (ViewModel-Feld fehlt, Pipeline liefert nichts)

### Teil C — Querschnitts-Befunde

Drei bis fünf Punkte, die screenübergreifend auffallen. Keine Tickets, sondern Muster:
- z. B. „Stillschweigendes Weglassen statt Skeleton/Platzhalter"
- z. B. „Provenance/Quelle nirgends als sichtbare Ebene, nur als Tooltip"
- z. B. „Atmosphäre-Streifen / Mini-Entität-Anker durchgehend nicht implementiert → Bruch der Botschaft ‚Entität ist immer da'"

Am Ende: eine kurze **Empfehlungsreihenfolge** für Stufe 2 (Welcher Screen zuerst, welche Querschnittssache vor Screen-Arbeit), 5–8 Zeilen.

## Vorgehen Stufe 1

1. Alle relevanten Prototype-JSX (`home`, `project-detail`, `project-card`, `dialog-overlay`, `entity`, plus Drill-Szenen in `app.jsx`) und ihre Code-Pendants nebeneinander lesen.
2. Browser-Screenshots der echten App auf den drei Routen (Home, Projekt-Detail, Dialog-Overlay batch+drill) einholen, um „Ist" nicht aus Erinnerung zu schreiben.
3. `docs/redesign/REVIEW.md` schreiben — eine Datei, drei Teile, fertig.
4. Im Chat einen 4–6-Zeilen-Anriss posten und auf deine Kommentare warten.

## Was Stufe 1 NICHT macht

- Keine Code-Änderungen.
- Keine ViewModel-Erweiterung.
- Keine Tickets, keine Tabellen mit Komponentenpfaden, keine Mikro-Pixel-Notizen.
- Keine `INVENTORY.md` als Riesenmatrix — bewusst kompakt.

## Was Stufe 2 später macht (zur Orientierung, nicht jetzt)

Nach deinen Kommentaren auf das REVIEW: gezielte Implementierung in der von dir freigegebenen Reihenfolge, mit Skeleton/Platzhalter für fehlende Daten, DECISIONS-Einträge für bewusste Abweichungen.
