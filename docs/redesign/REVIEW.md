# Redesign Review — Stufe 1

> **Quellenpaket.** Drei Quellen, ein Zielbild:
> - **Prototype-JSX** (`docs/redesign/prototype/*.jsx`) — Blöcke, Hierarchie, Charakter.
> - **Screenshots** (`docs/redesign/screenshots/`) — finale Wirkung, Komposition, Tonalität.
> - **`docs/design-implementation-plan.md`** — Übersetzung Ist→Soll: welche Phase, welche Datei, welche Logik. Plan ist verbindlich für Reihenfolge, Sidebar-Doktrin, Dialog-Vererbung, Stopp-Bedingungen.
>
> Diese drei sprechen von **demselben** Produkt. Wo sie sich scheinbar widersprechen, gewinnt die Logik des Implementation-Plans, weil er die Brücke vom existierenden Code in die Prototype-Welt baut.
>
> **Nicht im Scope dieses Reviews.** Token-Format (Hex/HSL), Theme-Vehikel (`data-theme` vs `.dark`), CSS-Mechanik. Das ist gelöst oder lösbar — die Architektur trägt. Hier geht es um **neue Logik, neuer Aufbau, neues Design**.

Status quo: Vieles ist schon redesigned (CardSurface, RoleHeader, BatchReviewOverlay-Skelett, FaktDrillOverlay-Skelett, GlobalCommandMenu, Mapper-/ViewModel-Schicht). Was fehlt, ist die **Schärfung an den richtigen Stellen** — und ein paar erhebliche Nacharbeiten dort, wo das aktuelle UI das Zielmodell strukturell unterläuft.

---

## Teil A — Sieben Entscheidungen, an denen der Rest hängt

Pro Entscheidung: **Soll** (Quellenpaket) ↔ **Ist** ↔ **Schärfung** (was Stufe 2 zu tun hat). Kein Code, keine Tickets.

### 1. Home ist eine Bühne, kein Tool-Deck

- **Soll.** Eine zentrale Figur (Entity ~340 px) atmet in der Mitte. Material schwebt im oberen Bogen um sie herum (AssetOrbit, 225°), der Prompt sitzt darunter wie ihr Mund. Links eine schmale, ruhige Projektliste, rechts ein Impact-Strom (letzter Impact + „Jetzt" + Pipeline + Tagesfooter). Erste Sekunde: *„Hier arbeitet eine Intelligenz."*
- **Ist.** Drei vertikal gestapelte Slots (Stage / HomePrompt / Voice-Footer). Entity geclamped 220–320 px, kein Orbit-Bogen, Impact-Panel reduziert auf Pipeline-Liste, Voice-Footer drückt die Bühne hoch.
- **Schärfung.** Bühnen-Komposition wiederherstellen: Entity dominiert, Orbit oben (Phase 6 im Plan), Prompt direkt unter Entity ohne dazwischengeschobenen Footer, ImpactPipelinePanel als eigenständiger rechter Akteur (Phase 4.3). Prompt-Frage ist **„Was gibt es neues?"**, nicht „Was liegt an?".

### 2. Sidebar ist Anker, nicht Hub — und sie wechselt ihre Aussage je Screen

- **Soll** (Plan §3 + §4.1).
  - 240 px breit, **persistent auf beiden Screens**.
  - **Home:** Sidebar zeigt **nur** die Projektliste (+ „Neues Projekt"-Ghost). Keine Mini-Entity — die echte Entity ist ja im Zentrum.
  - **Projekt-Detail:** Mini-Entity (~56 px) **oben** in der Sidebar als Spatial-Continuity-Geste („die Entity ist mit dir mitgegangen, sie ist jetzt klein, aber da"), darunter die Projektliste mit Initialen + Signal-Dots, aktives Projekt markiert.
- **Ist.** Klassische AppSidebar. Mini-Entity fehlt in beiden Modi, Spatial-Continuity-Geste fehlt komplett. Wirkt wie Standard-Nav, nicht wie Anker.
- **Schärfung.** Sidebar-Doktrin aus dem Plan ohne Abweichung übernehmen. Das ist die einfachste, wirkungsvollste Botschaftsreparatur im ganzen Redesign — sie entscheidet, ob die App eine **Intelligenz mit Projekten** oder ein **Projekttool mit Orb-Spielzeug** ist.

### 3. Project-Detail liest sich vertikal in vier Rollen

- **Soll.** Harte vertikale Dramaturgie:
  1. **Atmosphären-Streifen** ganz oben (3 px Aurora-Linie + 60 px weicher Glow-Hauch). Atmet 6 s; wenn Pipeline läuft, beschleunigt sie auf 3 s und färbt sich review-warm um. Botschaft: *„Entity ist anwesend, auch hier."*
  2. **LAGE** — full-width, größte Typo (44 px Name, 24 px Light Lagesatz), Status-Chips, Key-Facts rechts (nächster Termin groß+mono, letzte Änderung), Outcome-Bar.
  3. **HANDLUNGSBEDARF links (breit) + VERLAUF rechts (schmal)** — zweispaltig. Operatives Zentrum + Chronologie in einem Blickfeld.
  4. **SUBSTANZ** unten — Themen + Dokumente, kleinste Skala, ruhig.
- **Ist.** Vertikal gestapelte Cards, alles untereinander, **Verlauf unter Handlungsbedarf statt daneben**, kein Atmosphären-Streifen, kein Outcome, keine Status-Chips, keine Key-Facts.
- **Schärfung.** Die zweispaltige Mitte ist nicht verhandelbar — sie ist der Unterschied zwischen „Lagekarte" und „Modul-Stapel". Atmosphären-Streifen ist die Mini-Entität-Geste für den Top-Edge. Plan §2 + §3.3 decken beides ab.

### 4. Der Hero ist eine Lagekarte, kein Section-Header

- **Soll.** Sechs Inhaltsblöcke verdichtet in eine ruhige Komposition: Breadcrumb (Kunde · Phase · Stakeholder · Budget) + Header-Actions · Eyebrow „Lage · rekonstruiert vor 2 Min" · 44 px Projektname · 24 px Light Lagesatz · Status-Chips („Konflikt 2", „Review fällig", „on track") · Key-Facts rechts · **Outcome-Bar** mit Flag-Icon („Wofür tun wir das?").
- **Ist.** Eyebrow + H2 + Beschreibungstext + ConflictBanner. Status-Chips, Key-Facts, Outcome — nicht da.
- **Schärfung.** Outcome ist der konzeptionelle Gegenpol zu Handlungsbedarf und gehört prominent in den Hero. `project.outcome` und `project.stats.naechsterTermin` liegen bereits im ViewModel — die UI muss sie nur lesen lernen. Status-Chip-Counts ergeben sich aus `konflikte.length`, `handlungsbedarf.filter(...)` etc. und brauchen kein neues Datenfeld.

### 5. Dialog ist ein 10-Sekunden-Diff — collapsed by default, inline aufgelöst

- **Soll** (Plan §5).
  - **BatchReviewOverlay** = kompakte Tabelle (48 px Zeilen, 16 px Border-Radius, ein Hairline). Je Zeile: Status-Icon · **Type-Chip** (TERMIN · ENTSCHEIDUNG · KONFLIKT · STAKEHOLDER · LÜCKE · DOKUMENT) · Content · Projekt · **Inline-Aktion**.
  - Konflikt-Row collapsed: 3 inhaltliche Inline-Chips (z. B. `15. Mai` / `1. Juni` / `offen lassen`) + „Details ▲". Expandiert: Quellen-Cards mit Provenance-Footer + `vs`-Pille + **„cogni empfiehlt …"-Begründungszeile**.
  - Lücke-Row collapsed: nur „Eingeben"-Chip. Expandiert: Eingabefeld + **Suggestion-Pills aus `box.suggestions[]`**.
  - Commitbar: „X offen · Y bereit" + Bulk-Button mit ↵, glüht wenn alles ready. „Alle verwerfen" links als sekundäre Geste.
  - **Dialog erbt App-Theme** — kein forced dark.
- **Ist.** BatchReviewOverlay existiert, ReviewRow existiert, Type-Chip-System teilweise da. Aber: Konflikt zeigt generische `Variante A`/`Variante B` statt inhaltlicher Chips. Empfehlungszeile fehlt. Lücken zeigen sofort das Eingabefeld statt erst „Eingeben"-Chip. Suggestion-Pills fehlen. Provenance-Footer in Quellen-Cards fehlt. „Alle verwerfen" fehlt.
- **Schärfung.** Das Paradigma steht — die **Mikro-Choreografie** muss nachgezogen werden: collapsed-by-default, inhaltliche Chip-Werte direkt aus dem Konflikt-Payload, Suggestion-Pills aus Session-Daten, Empfehlungszeile als feste Bestandteil der Konflikt-Expansion. Sonst wird aus „10-Sekunden-Diff" wieder „Formular pro Zeile".

### 6. Provenance ist sichtbare Ebene, nicht Tooltip

- **Soll.** Quelle ist überall ein **eigenständiges Designelement**: Quellen-Cards mit Metadata-Footer („09.04.2026 · 14:22 · informell"), `vs`-Pille als räumlicher Trenner, „cogni empfiehlt X — *Begründung*. Klick zum Überschreiben.", Source-Marker im Verlauf-Feed, Source-Spalte in Handlungsbedarf-Rows.
- **Ist.** Quelle erscheint höchstens als Mini-Mono-Text oder `title=`-Attribut. Im Drill-Overlay sind Cards da, aber **ohne Datum-Hervorhebung (38 px), ohne Metadata-Footer, ohne `vs`-Pille als Pseudo-Element, ohne Empfehlungszeile**.
- **Schärfung.** Provenance ist Produktkern (`mem://features/produkt-prinzipien` — *„jede Erkenntnis hat Quelle + Delta"*). Sie wird als wiederverwendbares Building-Block-Pattern (Quellen-Card + vs + Empfehlung) einmal sauber gebaut und überall durchgezogen. Wenn das fehlt, wirkt Review wie blinder Vergleich, nicht wie informierte Entscheidung.

### 7. Drill ist eine Bühne, nicht „Batch mit einem Item"

- **Soll** (Plan §5.3 + §5.4).
  - **Konflikt-Drill:** Roter Soft-Banner oben („Zwei Quellen widersprechen sich"), darunter zwei großformatige Quellen-Cards (38 px Datum, Metadata, Hint), dazwischen 48 px `vs`-Kreis. Darunter „Was stimmt?" mit **drei Tiles** (Quelle A · Quelle B · Offen lassen), eine ist amber-vorgemerkt als cogni-Empfehlung. Footer: links „Als Handlungsbedarf markieren", rechts „Verwerfen / Entscheidung speichern →".
  - **Gap-Drill:** Split-Layout 2/5 | 3/5 — links Kontext-Card + **„Blockiert"-Liste** (was hängt an dieser Lücke), rechts Lücken-Card (amber) + Eingabefeld + Suggestion-Pills.
  - Header: „← Handlungsbedarf · {Item-Titel} · {Projektname}".
- **Ist.** FaktDrillOverlay existiert mit SessionHeader-Mode `drill`, aber: kein Banner, keine 38-px-Datums-Cards, kein `vs`-Kreis, keine 3-Tile-Auswahl mit Subtexten, keine Blockiert-Liste, kein Split-Layout für Gap. Generische Card-Optik.
- **Schärfung.** Drill ist eine **andere Räumlichkeit** als Batch — Großformat, gegenübergestellt, mit Kontext-Spalte. Diese Trennung ist UX-konstitutiv: *„Die Liste zeigt mir, dass ich entscheiden muss. Die Bühne zeigt mir, was."*

---

## Teil B — Soll-Ist je Screen

Spalten: **Block** · **Soll-Charakter (1 Zeile)** · **Ist** · **Lücke** mit Marker:
- **V** = visuell (Komposition, Spacing, fehlender Block)
- **UX** = Verhalten/Geste/State
- **D** = ViewModel-Feld liest die UI noch nicht (oder fehlt im VM, dann → C1)

Plan-Referenzen in Klammern verweisen auf `design-implementation-plan.md`.

### B1 · Home (Plan §1, §4, §6)

| Block | Soll-Charakter | Ist | Lücke |
|---|---|---|---|
| Entity zentral | Bühnenfigur ~340 px, warme Aurora, ruhige Atmung | Orb 220–320 px clamp | V |
| AssetOrbit (oberer Bogen 225°) | Schwebende Asset-Chips um Entity, Status-Visuals (parsing dashed / understanding spin / review-ready amber / failed red) | Komponente vorhanden, aber nicht sichtbar/komponiert mit Entity | V + UX |
| HomePrompt | „Mund" der Bühne, **„Was gibt es neues?"** 48 px light, 4 kreisförmige Buttons (Datei · Einfügen · Link · Sprache), Hover-Lift | Vorhanden, kleinere Buttons, Hover-Lift fehlt, ggf. falsche Frage | V (Größe/Lift) + UX (Frage) |
| ActiveInputPaste-State | Pasted-Mail/Text mit `cogni liest…`-Spinner + erkannte Chips + „Review öffnen ↵" | Existiert nicht — Paste geht direkt in Pipeline | V + UX (kompletter State) |
| Sidebar | 240 px, **nur Projektliste** + „Neues Projekt"-Ghost (keine Mini-Entity auf Home) | Standard-AppSidebar | V + UX |
| ImpactPipelinePanel rechts | Letzter Impact (3–4 verdichtete Zeilen) + JETZT-Block + Pipeline-Liste + Tagesfooter „heute · X eingegangen" | Nur Pipeline-Liste | V + D (Impact-Liste, Today-Counter) |
| Voice/Hint Footer | Im Prototype kein eigener Footer — Voice ist Pill in HomePrompt | Eigener min-h-64 Footer drückt Stage hoch | UX (Hierarchie) |

**Composition-Vertrag.** Studio mit anwesender Intelligenz. Figur in der Mitte, Material schwebt darum, Prompt ist ihr Mund. Links Projekte als ruhige Liste, rechts der Impact-Strom.

### B2 · Project-Detail (Plan §2, §3)

| Block | Soll-Charakter | Ist | Lücke |
|---|---|---|---|
| Atmosphären-Streifen (top-edge) | 3 px Aurora-Linie + 60 px Glow-Hauch, atmet 6 s, Pipeline-aktiv → 3 s + review-warm | Fehlt komplett | V + UX |
| Sidebar mit Mini-Entity oben | Mini-Orb (56 px) als Anker, „cogni"-Label, Live-Status, darunter Projektliste mit Initialen + Signal-Dots | Standard-Sidebar, keine Mini-Entity | V + UX |
| Hero-Breadcrumb + Header-Actions | Kunde · Phase · Stakeholder · Budget links, Material/Review-Buttons rechts | Header-Actions teilweise da | V + D (Phase, Budget) |
| Hero-Lagetext | 44 px Name + 24 px Light Lagesatz, max ~880 px | Eyebrow + H2 + Description-Text | V (Skala) |
| Status-Chips inline | „Konflikt 2 · Review fällig 3 · on track" als verdichtete Pills | Nur ConflictBanner separat | V (Counts liegen im VM) |
| Key-Facts rechts | „Nächster Termin" groß+mono + „Letzte Änderung" | Fehlt | V + D (Felder im VM vorhanden) |
| Outcome-Bar | Flag-Icon + „Outcome: …" als ruhige Zeile unter Hero | Fehlt | V + D (`project.outcome` im VM) |
| Mittelfeld zweispaltig | **Handlungsbedarf links (breit) · Verlauf rechts (schmal)** | Vertikal gestapelt | V + UX |
| Handlungsbedarf | Gruppiert nach Modus (entscheiden/klären/umsetzen/prüfen), Filterleiste „Alle / Nur Blocker / Ohne Frist", Owner-Avatar + Frist + Source pro Row | Liste vorhanden, ungruppiert, ohne Filterleiste, ohne Owner-Avatare | V + UX + D (mode-Aggregation, Owner-Field) |
| Verlauf | Schmaler Feed (~340 px), Timeline mit farbigen Dots nach Delta-Typ, Source-Marker pro Eintrag | Liste vorhanden, eigene Section unter Handlungsbedarf | UX (Layout) + V (Timeline-Linie) |
| Substanz: Themen | 2-spaltiges Grid, kleine Cards „Name + E·P·D-Counts" + Chevron | 3-spaltig, Counts vorhanden | V (Layout/Counts-Render) |
| Substanz: Dokumente | Schmale Liste rechts, Typ-Badge + Name + Version + Datum | Hairline-Liste vorhanden | V (Grid 1.4fr/1fr) |
| Universal-Overlay (⌘+Space) | Vollbild über Projekt, Entity zurück im Zentrum, Backdrop-Blur, Kontext „über Hafen Nord" | GlobalCommandMenu existiert, aber ohne Entity-Bühne | UX + V |

**Composition-Vertrag.** Vertikale Lagekarte: oben spürt man die Entity (Aurora), darunter liest man den Stand, dann arbeitet man (zweispaltig), unten ruht die Substanz. Vier Rollen, vier Schriftgrößen, ein Lese-Sog.

### B3 · Dialog-Batch (Plan §5.1, §5.2)

| Block | Soll-Charakter | Ist | Lücke |
|---|---|---|---|
| SessionHeader | Pulse-Dot · „Review · {Quelle} · {N Erkenntnisse · M Konflikte · K Lücken}" · Counter · esc-Pille | Vorhanden | klein V |
| Type-Chip-System | TERMIN · ENTSCHEIDUNG · KONFLIKT · STAKEHOLDER · LÜCKE · DOKUMENT (mono, uppercase, klein) | Teilweise | V (vollständiges Set) |
| Row Accepted | Gedimmt, Check-Outline, Type-Chip, Content, Projekt-Name mono rechts | Vorhanden | klein V |
| Row Conflict (collapsed) | Amber Left-Stripe (3 px), 3 inhaltliche Inline-Chips (`15. Mai` / `1. Juni` / `offen lassen`) + „Details ▲" | Generische `Variante A`/`Variante B` | UX + V (Chip-Inhalt aus Payload) |
| Row Conflict (expanded) | Quellen-Cards mit großem Datum, Quelle, Metadata-Footer, dazwischen `vs`, darunter „cogni empfiehlt … — *Begründung*" | Cards vorhanden, ohne Hervorhebung, ohne Footer, ohne Empfehlung | V + D (Source-Metadata, Empfehlung) |
| Row Gap (collapsed) | Nur „Eingeben"-Chip rechts | Sofort Input-Feld | UX (zwei States) |
| Row Gap (expanded) | Input + Suggestion-Pills aus `box.suggestions[]` | Input vorhanden, Pills fehlen | V + D (suggestions im Payload) |
| CommitBar | „X offen · Y bereit" + Bulk-Button mit ↵, glüht im Ready-State | Vorhanden | klein V (Glow) |
| „Alle verwerfen" | Sekundärer Button links | Schließen-Button stattdessen | UX |
| Theme-Vererbung | Erbt App-Theme via Dialog-Token-Mapping | OK | — |

**Composition-Vertrag.** Git-Diff. Oben woher es kommt, mittig was zu tun ist (meist nichts, weil grün), unten der Hebel. Konflikt und Lücke bleiben **schmal und inline**, bis man sie öffnet.

### B4 · Dialog-Drill (Plan §5.3, §5.4)

| Block | Soll-Charakter | Ist | Lücke |
|---|---|---|---|
| Drill-Header | „← Handlungsbedarf · {Item-Titel} · {Projekt} · Konflikt #{id}" + esc | SessionHeader Mode `drill`, ohne Back-Geste + Item-Anchor | UX + V |
| Konflikt-Banner | Roter Soft-Bar oben „Zwei Quellen widersprechen sich" + Erläuterungssatz | Fehlt | V |
| Display-Cards (Konflikt) | Zwei großformatige Cards mit 38 px Datums-Anchor, Quelle als Untercard, Metadata-Footer, Hint („älter · direkter Absender" / „neuer · formelles Protokoll"), dazwischen 48 px `vs`-Kreis | Generische Cards | V (komplett neu) |
| 3-Tile-Auswahl „Was stimmt?" | Drei Tiles mit Subtexten, eine amber-vorgewählt als cogni-Empfehlung | Inline-Chips wie in Batch | UX (Drill-Variante) + V |
| Footer-Actions | Links „Als Handlungsbedarf markieren", rechts „Verwerfen / Entscheidung speichern →" (disabled bis Tile gewählt) | Generische Commit-Bar | V + UX |
| Gap-Drill: Kontext-Spalte (2/5) | Kontext-Card + **„Blockiert"-Liste** (Dependencies, was hängt an der Lücke) | Fehlt | V + D (`dependencies` im VM nutzen) |
| Gap-Drill: Eingabe-Spalte (3/5) | Lücken-Card amber + Eingabefeld + Suggestion-Pills | Eingabe vorhanden, Pills fehlen | V + D |

**Composition-Vertrag.** Bühne, kein Listenzettel. Großformat. Räumliche Gegenüberstellung. Der Mensch entscheidet visuell, nicht durch Lesen.

### B5 · Entity-Modi (Plan §6 + Tokens)

| Modus | Soll | Ist | Lücke |
|---|---|---|---|
| Idle | Warme Aurora, langsame Atmung (6 s), Halo-Pulse 7 s, leichte Layer-Rotation | Funktioniert, aber Tokens noch alt-cold | V |
| Drag-Over | Magnetische Vergrößerung, Sog-Effekt, Aurora heller | Border-color-Wechsel, kein Sog | UX + V |
| Processing | Innere Aktivität steigt — Layer-Rotation beschleunigt, Halo intensiver, kein Spinner | Generischer Loading-Indikator | V + UX |
| Review-Ready | Sammelt sich sichtbar, klarer Übergang in Dialog | Kein eigener visueller Zustand | UX + V |
| Failed/Unclear | Ruhige Störung, präzise nächste Aktion, kein Drama | Toast-basiert | UX |

**Composition-Vertrag.** Das Wesen lebt sichtbar. Jeder Zustand ist Teil seiner Persönlichkeit, kein Status-Icon.

---

## Teil C — Querschnitt: was vor Screen-Arbeit geklärt sein muss

### C1 · Stillschweigendes Weglassen statt Skeleton

Wo ein Block ein VM-Feld bräuchte, das die UI noch nicht liest (Outcome, Status-Counts, Key-Facts, Today-Counter, mode-Gruppierung in Handlungsbedarf, Source-Metadata, Empfehlungstext), wurde der Block ganz weggelassen. **Fix-Prinzip:** Block wird mit Skeleton/„—" gerendert, plus DECISIONS-Eintrag. Lücke wird sichtbar, nicht verschluckt. Gilt explizit auch dann, wenn das Feld im VM noch nicht existiert — denn Stufe 2 darf nach Plan-Doktrin **das ViewModel nicht für Designwünsche aufbohren**.

### C2 · Provenance ist nirgends sichtbare Ebene

Quellen erscheinen nur als Tooltip oder Mini-Mono-Text. Im Zielmodell sind sie ein eigenes Designelement (Quellen-Card + Metadata-Footer + `vs`-Pille + Empfehlungszeile + Source-Marker im Verlauf + Source-Spalte in Handlungsbedarf). Pattern wird einmal als wiederverwendbares Building-Block gebaut und durchgezogen. Ohne das wirkt jeder Review-Moment wie blinder Vergleich.

### C3 · „Entity ist immer da" bricht ab, sobald man ein Projekt öffnet

Im Zielmodell ist die Entity auch im Projekt präsent: Atmosphären-Streifen oben, Mini-Entity in der Sidebar (Spatial-Continuity-Geste), Universal-Overlay (⌘+Space) holt sie vollformatig zurück. Im Code ist sie ein Home-only Element. Diese drei Gesten zusammen sind die zentrale Produktbotschaft — sie müssen vor jeder Screen-Schärfung stehen, sonst arbeitet man am falschen Detail.

### C4 · Hierarchie-Disziplin pro Screen ist unscharf

Das Zielmodell definiert harte Schriftgrad-Hierarchien (Home: Entity dominiert, Hero 48 px; Project-Detail: Lage 44+24 / Handlungsbedarf 28 / Verlauf 20 / Substanz 18). Im Code wirken Sections gleich gewichtet. Folge: kein Lese-Sog. Schärfung pro Screen muss **eine** dominante Skala festlegen und dann konsequent abstufen.

### C5 · Visuell halb da ≠ UX da — die Mikro-Choreografie fehlt

Beispiel Konflikt: Cards existieren (visuell halb da), Buttons existieren (UX halb da) — aber die **Geste „in 1 s scannen, in 2 s entscheiden"** fehlt, weil generische Labels statt inhaltlicher Chips, keine Empfehlungszeile, keine Hervorhebung der Vorauswahl. Visuelle Treue allein reicht nicht. Stufe 2 muss explizit fragen: *„Was sieht der User zuerst, was klickt er als Default, wo landet sein Auge nach dem Klick?"*

### C6 · UI ↔ Logik-Trennung ist eine Stopp-Linie

Plan zieht eine harte Grenze: kein Design-Commit fasst `src/lib/**` oder `ProjectViewModel` an. Das ist Befreiung, nicht Einschränkung — es macht Stufe 2 planbar. Wo immer ein Block ein neues Datenfeld bräuchte, gilt **C1** (Skeleton + DECISIONS), nicht stillschweigendes VM-Erweitern. Ausnahmen müssen explizit aufschlagen und vom Menschen freigegeben werden.

---

## Empfehlungsreihenfolge für Stufe 2

Direkt an die Plan-Phasen angedockt — die Reihenfolge ist nicht zufällig, sie löst Querschnitts-Themen vor Screen-Themen.

| # | Plan-Phase | Was es im Produkt bewirkt | Querschnitt abgedeckt |
|---|---|---|---|
| 1 | **Phase 1** — Tokens + `data-theme` + Geist | Theme-Schalten funktioniert, Aurora-Farben verfügbar, Dialog-Vererbung möglich | (Voraussetzung) |
| 2 | **Phase 2** — LageZone-Hero + Atmosphären-Streifen | Project-Detail bekommt Top-Edge-Geste + Lese-Hierarchie | C3 (für Detail) + Teil B2 |
| 3 | **Phase 3** — Persistente Sidebar + Mini-Entity + zweispaltige Mitte | Anker-Doktrin, Spatial-Continuity, B2-Layout korrekt | C3, B2 |
| 4 | **Phase 4** — Home-Bühne + ImpactPipelinePanel | Home wird zur Bühne, Sidebar passt sich an Home-Modus an | B1 |
| 5 | **Phase 5** — BatchReview + FaktDrill scharfziehen | 10-Sekunden-Diff Realität, Provenance-Pattern überall | C2, C5, B3, B4 |
| 6 | **Phase 6** — AssetOrbit + Entity-Modi-Politur | Bühne wird lebendig, Material schwebt sichtbar | B5, Rest B1 |

**Vor jeder Phase:** kurze visuelle Ist-Aufnahme (Screenshot Day + Night), nach jeder Phase: Verify gegen Plan-Checklist + Screenshot-Vergleich. Eine Phase nie offen lassen, bevor die nächste beginnt.

**Warte auf deine Kommentare** zu Teil A (Entscheidungen) und zur Reihenfolge — dann startet Stufe 2 mit Phase 1.
