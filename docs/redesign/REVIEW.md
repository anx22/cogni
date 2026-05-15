# Redesign Review — Stufe 1

> **Leitsatz.** Die JSX-Files unter `docs/redesign/prototype/*.jsx` sind das **Zielmodell**, nicht die absolute Wahrheit.
> Sie definieren Blöcke, Hierarchie und UX-Charakter. Sie definieren nicht: exakte Pixel, Demo-Daten oder finale Mikro-Interaktionen.
> Abweichungen dürfen sein — aber bewusst, mit kurzem DECISIONS-Eintrag, nie stillschweigend.

Dieses Dokument ist die Diskussionsgrundlage für Stufe 2 (Umsetzung). Es macht **keine Tickets**, sondern hebt Produktentscheidungen, Soll-Ist-Lücken und übergreifende Muster heraus.

---

## Teil A — Sieben High-Level-Entscheidungen

Pro Entscheidung: **Soll** (Prototype-Intention) ↔ **Ist** (heutiger Code) ↔ **Empfehlung**. Keine Implementierungsdetails.

### 1. Home-Charakter — was fühlt man in der ersten Sekunde?

- **Soll.** Eine Bühne mit zentralem Lebewesen. Entität dominiert (340 px), darum schweben Asset-Fragmente im oberen Bogen, der Prompt sitzt darunter wie ein „Mund" der Bühne. Sidebar und Impact-Panel sind ruhige Ränder. Botschaft: *„Hier arbeitet eine Intelligenz, die mit Material gefüttert wird."*
- **Ist.** Drei gestapelte Slots: Stage (flex-1) → HomePrompt → Footer mit Voice/Hint. Entität schrumpft auf ~270 px (clamp 220–320), ist in einer Spalte mit dem Prompt eingequetscht. Wirkt wie *„Dashboard mit Orb obendrauf"*.
- **Empfehlung.** Entscheiden, ob die Home-Seite **eine Bühne** (zentrale Komposition Entität + Orbit + Prompt als Einheit) oder **ein Ablagedeck** (Tools nebeneinander) sein soll. Prototype meint klar Bühne. Wenn das die Richtung ist, sind Größe und Vertikal-Anker der Entität nicht verhandelbar.

### 2. Sidebar-Rolle — wie viel darf sie?

- **Soll.** Sehr zurückhaltende Sekundärnavigation. Der Anker ist die **Mini-Entität ganz oben** (Identität + Drop-Zone + „zurück zum Kern"), darunter eine schmale Projektliste, am Ende „Neues Projekt" als Ghost-Button. Sie verrät nie technische Module.
- **Ist.** Vollwertige App-Sidebar mit klassischen Nav-Patterns. Mini-Entität fehlt, Ghost-Button fehlt, kein Live-Status. Wirkt wie Standard-Linear-Klon, nicht wie „schwacher Anker".
- **Empfehlung.** Sidebar als **Anker, nicht Hub** definieren. Mini-Entität oben ist eine Identitätsaussage, nicht Deko — sie ist der einzige sichtbare Beweis, dass die Entität auch im Projekt-Modus „da" ist.

### 3. Project-Detail-Dramaturgie — wie liest man den Screen vertikal?

- **Soll.** Vier Rollen mit harter Hierarchie:
  1. **Atmosphäre-Streifen** (3 px Aurora oben, pulsiert) — Botschaft „Entität ist anwesend"
  2. **LAGE** — größte Typo (44 px Projektname, 24 px Lagesatz), full-width
  3. **HANDLUNGSBEDARF** (operatives Zentrum, breite Hauptspalte) **+ VERLAUF** (schmaler Feed rechts) zweispaltig
  4. **SUBSTANZ** (Themen + Dokumente, ruhig, kleinste Skala) unten
- **Ist.** Vertikal gestapelte Cards (LageZone → Handlungsbedarf → Verlauf → Substanz). Atmosphäre-Streifen fehlt komplett. Handlungsbedarf+Verlauf nicht zweispaltig. Substanz hat zwar Themen/Docs, aber als gleichrangige Section, nicht „kleinste Skala unten".
- **Empfehlung.** Die **vertikale Dramaturgie** ist der Kern dieses Screens — sie macht den Unterschied zwischen „Lagekarte" und „Modul-Dashboard". Sie braucht das zweispaltige Layout (Handlungsbedarf+Verlauf) ab einer bestimmten Breite und den Atmosphäre-Streifen.

### 4. Project-Hero-Inhalt — was ist „aktueller Stand"?

- **Soll.** Der Hero ist eine **redaktionell verdichtete Lagekarte**, nicht ein Dashboard-Header:
  - Breadcrumb-Zeile (Kunde · Phase · Stakeholder-Anzahl · Budget) + Action-Buttons rechts
  - Eyebrow „Lage · rekonstruiert vor 2 Min"
  - **Projektname** (44 px) + **Lagesatz** (24 px Light) — der Kernsatz, was los ist
  - **Status-Chips** (z. B. „Konflikt 2", „Review fällig 3", „on track")
  - **Key-Facts** rechts: nächster Termin (groß, mono) + letzte Änderung
  - **Outcome-Bar** mit Flag-Icon: „Was ist das Ziel dieses Projekts?"
- **Ist.** Eyebrow + H2 + Beschreibungstext, plus Conflict-Banner. Status-Chips, Key-Facts und Outcome-Bar fehlen. Wirkt wie Section-Header, nicht wie Lagekarte.
- **Empfehlung.** Entscheiden: **Hero = Lagekarte**. Dann ist „aktueller Stand" eine echte Komposition aus 5–6 Inhaltsblöcken, kein Heading. Outcome ist konzeptionell wichtig — er ist der Gegenpol zu „Handlungsbedarf" („Wofür tun wir das alles?").

### 5. Dialog-Paradigma — wie viel Vorentscheidung delegieren wir an cogni?

- **Soll.** Wie ein Git-Diff. cogni hat **alles vorentschieden**, der Mensch scannt, überschreibt inline, drückt Enter. Ziel: 10 Sekunden für eine typische Session.
  - Grüne/dezente Rows = nichts zu tun (Wissen, Termine, Stakeholder schon zugeordnet)
  - Orangene Rows = kurz anschauen (Konflikt, Lücke) — inline lösbar
  - Commitbar unten zeigt „X bereit · Y offen", Enter-Hint
- **Ist.** Schon stark in diese Richtung gebaut (`BatchReviewOverlay`, `ReviewRow`, `dlg2-*`-CSS). Aber: viele Row-Varianten zeigen *immer* Aktionsbuttons statt **collapsed-by-default mit Inline-Auflösung**. Konflikte zeigen `Variante A`/`Variante B` statt der inhaltlichen Chips (`15. Mai` / `1. Juni`). Lücken zeigen direkt das Eingabefeld statt zuerst nur „Eingeben" als Chip.
- **Empfehlung.** Das Paradigma stimmt. Was fehlt: konsequente **„collapsed by default, expand on need"**-Choreografie und **inhaltliche Inline-Chips** (echte Werte aus dem Konflikt, nicht generische Labels). Sonst wird aus „10-Sekunden-Diff" wieder „Formular pro Zeile".

### 6. Konflikt- & Lücken-Choreografie — wie sichtbar ist Provenance?

- **Soll.** Konflikt-Row aufgeklappt zeigt zwei Quellen-Cards mit großem Datum, Quellenname, Datum/Seite/Formalitätsmarker, dazwischen ein `vs`-Trenner, darunter eine Begründungszeile **„cogni empfiehlt 15. Mai — jüngere direkte Aussage des PM. Klick zum Überschreiben."**. Lücken-Row aufgeklappt zeigt Vorschläge als Pills (`< 100ms / < 200ms / < 500ms`).
- **Ist.** Konflikt expandiert zeigt zwei Cards mit Variante A/B als Text — aber **ohne Quelle-Metadaten, ohne Datum-Hervorhebung, ohne `vs`-Trenner-Pille, ohne „cogni empfiehlt"-Begründung**. Lücken haben kein Suggestion-Pillen-Set, nur ein Freitextfeld.
- **Empfehlung.** Provenance ist Produktkern (vgl. `mem://features/produkt-prinzipien`). Sie darf nicht im Tooltip versteckt sein. Die Quellen-Cards mit `vs`-Trenner und die Empfehlungszeile sind die **sichtbare Materialisierung** dieses Prinzips — ohne sie wirkt Review wie blinder Vergleich.

### 7. Drill-vs-Batch — wann öffnet sich was?

- **Soll.**
  - **Batch** = Einstieg aus Intake / Asset-Drop / Notification → Liste über alle Erkenntnisse eines Anlasses.
  - **Drill** = Einstieg aus Projekt-Handlungsbedarf-Item → **vollformatige Gegenüberstellung** mit 38 px Datum, Kontext-Frame, Abhängigkeitsliste, Ziel-Eingabe.
  - Übergang Batch → Drill, wenn der User in der Batch-Liste ein Item öffnet, das mehr Kontext braucht.
- **Ist.** Beide Overlays existieren, aber `FaktDrillOverlay` rendert keine **großen Display-Cards mit `vs`-Trenner**, kein Banner „Zwei Quellen widersprechen sich", keine Abhängigkeitsliste links beim Gap-Drill. Stattdessen generische Card-Optik.
- **Empfehlung.** Drill ist nicht nur „Batch mit nur einem Item" — er ist eine **andere Räumlichkeit**. Großformat, gegenübergestellt, mit Kontext-Spalte. Diese Trennung ist entscheidend für die UX-Logik („wann hilft die Liste, wann braucht es die Bühne").

---

## Teil B — Soll-Ist-Inventar je Screen

Spalten: **Block** · **Soll-Charakter** (1 Zeile) · **Ist** · **Lücke** mit V/UX/D-Markern (V = Visuell, UX = Verhalten, D = Datenfeld fehlt).

### B1 · Home

| Block | Soll-Charakter | Ist | Lücke |
|---|---|---|---|
| Entität (zentral) | Bühnenfigur, 340 px, Aurora-Tokens warm | Orb 220–320 px clamp, alte Cold-Glow-Tokens | V (Größe + Tokens) |
| Asset-Orbit | Schwebende Pills im oberen Bogen, Status-Dot rechts | Vorhanden, aber wenig sichtbar in Composition | UX (Composition mit Entität) |
| HomePrompt | „Mund" der Bühne unter Entität, 76 px Floating-Buttons + Hover-Lift | Funktioniert, aber 64 px ohne Lift | V (Größe, Hover) |
| ActiveInputPaste | Pasted-State zeigt Mail/Text mit `cogni liest…`-Spinner + erkannte Chips + „Review öffnen ↵" | Existiert nicht — Paste geht direkt in Pipeline | UX + V (ganzer State fehlt) |
| Sidebar mit Mini-Entität | Mini-Orb (56 px) als Identitäts-Anker oben + Live-Status `verstehe · 0:08` | Klassische AppSidebar, kein Mini-Orb | V + UX |
| „Neues Projekt"-Ghost-Button | Unauffälliger CTA am Sidebar-Ende | Fehlt | V + UX |
| Impact-Panel | Rechte Spalte: „Letzter Impact" als 3–4 verdichtete Zeilen + PipelineWidget mit Jetzt/Pipeline/Footer | Nur Pipeline-Liste, kein Impact-Block, kein „Jetzt"-Activity, kein „heute · X eingegangen"-Footer | V + D (Impact-Liste, Today-Counter) |
| Voice/Hint Footer | Im Prototype nicht als eigener Footer — Voice ist Pill in HomePrompt | Eigene Footer-Zeile mit min-h-64 drückt Stage hoch | UX (Hierarchie kippt) |

**Composition-Vertrag.** Ein leerer Tisch mit einer atmenden Figur in der Mitte. Links die Projekte als ruhige Liste, rechts der Impact-Strom. Material schwebt um die Figur, der Prompt ist ihr Mund. Fühlt sich an wie *Studio mit anwesender Intelligenz*, nicht wie Toolwand.

### B2 · Project-Detail

| Block | Soll-Charakter | Ist | Lücke |
|---|---|---|---|
| Atmosphäre-Streifen | 3 px Aurora-Gradient ganz oben, pulsiert (1.4 s wenn aktiv, sonst 6 s) | Fehlt | V + UX (Botschaft „Entität anwesend") |
| Detail-Sidebar | Mini-Entität (56 px) als Anker + Projektliste als ProjectRows | Standard-Sidebar | V + UX |
| Hero-Breadcrumb-Zeile | Kunde · Phase · Stakeholder · Budget + Material/Review-Buttons | Teilweise (Header-Actions) | V + D (Phase, Budget) |
| Hero-Lagetext | 44 px Name + 24 px Light Lagesatz, max 880 px | Eyebrow + H2 + Beschreibungstext | V + D (Kernsatz-Feld?) |
| Status-Chips | Inline-Chips „Konflikt 2", „Review fällig", „on track" | Fehlt (nur ConflictBanner separat) | V + D |
| Key-Facts rechts | „Nächster Termin" (groß, mono) + „Letzte Änderung" | Fehlt | V + D |
| Outcome-Bar | Flag-Icon + „Outcome: …" als ruhige Zeile unter Hero | Fehlt | V + D (Outcome-Feld) |
| Handlungsbedarf | Operatives Zentrum, gruppiert nach Modus (entscheiden/klären/umsetzen/prüfen), Filterleiste „Alle / Nur Blocker / Ohne Frist", Owner-Avatar + Frist + Source pro Row | Liste vorhanden, aber ohne Modus-Gruppen, ohne Filterleiste, ohne Owner-Avatare | V + UX + D (mode-Feld, owner) |
| Verlauf | Schmaler Feed rechts (340 px), Timeline mit Dots farbig nach Delta-Typ, Source-Marker pro Eintrag | Liste vorhanden, aber als eigene Section unter Handlungsbedarf, nicht zweispaltig | UX (Layout) + V (Timeline-Linie) |
| Substanz: Themen | Grid 2-spaltig, kleine Cards „Name + E·P·D-Counts" + ChevronRight | 3-spaltig, ohne E·P·D-Counts | V (Counts) |
| Substanz: Dokumente | Schmale Liste rechts mit Typ-Badge, Name, Version, Datum | Hairline-Liste vorhanden | V (Layout grid 1.4fr/1fr) |
| Universal-Overlay (⌘+Space) | Vollbild-Overlay über Projekt mit Entität wieder im Zentrum, Backdrop-Blur, Kontext „über Hafen Nord" | Fehlt komplett | UX + V (Modus-Wechsel global) |

**Composition-Vertrag.** Eine vertikale Lagekarte: oben spürt man die Entität (Aurora), darunter liest man den Stand, dann arbeitet man (Handlungsbedarf links, Chronologie rechts), unten ruht die Substanz. Vier Rollen, vier Schriftgrößen, ein Ablauf.

### B3 · Dialog-Batch

| Block | Soll-Charakter | Ist | Lücke |
|---|---|---|---|
| Session-Header | Pulse-Dot + „Review · {source} · {summary}" + counter + esc-Pille | Vorhanden, mit mode-Variante | V (esc als Pille mit Pseudo-Button) |
| Row Accepted | Dezent, Check-Outline, Type-Chip (88 px Mono), Content, Projektname mono rechts | Vorhanden | klein V |
| Row Conflict (collapsed) | Inhaltliche Chips als Inline-Resolution: `15. Mai` / `1. Juni` / `offen lassen` + „Details ▼" | Generische Buttons `Variante A`/`Variante B` | UX + V (Chip-Inhalt aus Payload) |
| Row Conflict (expanded) | Zwei Quellen-Cards mit großem Datum, Quelle, Metadata, dazwischen `vs`-Mono, darunter „cogni empfiehlt …"-Zeile | Cards vorhanden, aber ohne Datum-Hervorhebung, Metadata, Empfehlungszeile | V + D (Quelle-Metadata, Empfehlung) |
| Row Gap (collapsed) | Nur „Eingeben"-Chip rechts | Zeigt sofort Input-Feld | UX (zwei States kollabiert) |
| Row Gap (expanded) | Input + Suggestion-Pills (`< 100ms / < 200ms / < 500ms`) | Input vorhanden, Suggestions fehlen | V + D (suggestions in payload) |
| Row Ready | Grüne Stripe + Check + Type-Chip Soft-Variante | Vorhanden als Default-After-Confirm | klein V |
| Commitbar | „X offen · Y bereit" + Bulk-Button mit ↵-Icon, Ready-State leuchtet | Vorhanden | klein V (Ready-Glow) |
| „Alle verwerfen" | Sekundär-Button links | Schließen-Button stattdessen | UX |

**Composition-Vertrag.** Ein Git-Diff. Oben woher es kommt, mittig was zu tun ist (meist nichts, weil grün), unten der Hebel. Konflikt und Lücke bleiben **schmal und inline**, bis man sie öffnet.

### B4 · Dialog-Drill

| Block | Soll-Charakter | Ist | Lücke |
|---|---|---|---|
| Drill-Header | „← Handlungsbedarf · {Item-Titel} · {Quelle}" + esc | SessionHeader mit mode=drill, aber kein Back-Button + Item-Titel-Anchor | UX + V |
| Konflikt-Banner | Rote Soft-Bar oben „Zwei Quellen widersprechen sich" + Erläuterungstext | Fehlt | V |
| Display-Cards (Konflikt) | Zwei 38 px Datums-Cards, Quelle als Untercard, Marker „älter · direkter Absender" / „neuer · formelles Protokoll", dazwischen 60 px breite vs-Säule mit Pille | Fehlt — generische Cards | V (komplett neu) |
| Auswahl-Block | 3 vorgeschlagene Optionen mit Hint-Subline, eine vorausgewählt | Inline-Chips wie in Batch | UX (Drill-Variante mit Hints) |
| Footer-Actions | „Als Handlungsbedarf markieren" links + „Verwerfen / Entscheidung speichern →" rechts | Generische Commit-Bar | V + UX |
| Gap-Drill: Kontext-Spalte | Linke Hälfte: Kontext-Card (Title, Beschreibung, Quelle) + Abhängigkeitsliste „Blockiert: …" | Fehlt | V + D (Dependencies) |
| Gap-Drill: Eingabe-Spalte | Rechte Hälfte: Lücke-Card warm + Eingabefeld + Suggestion-Pills | Eingabe vorhanden, Pills fehlen | V + D |

**Composition-Vertrag.** Eine Bühne, kein Listenzettel. Großformat. Räumliche Gegenüberstellung. Der Mensch sieht beide Seiten gleichzeitig und entscheidet visuell, nicht durch Lesen.

### B5 · Entity-Modi

| Modus | Soll | Ist | Lücke |
|---|---|---|---|
| Idle | Aurora-Gradients warm, langsame Atmung (6 s), Halo-Pulse 7 s, leichte Layer-Rotation | Funktioniert, aber Tokens sind alte cold blue (`--entity-glow-1/2/3`), nicht warm `--entity-aurora-*` | V (Tokens) |
| Drag-Over | Magnetische Vergrößerung, Sog-Effekt, Aurora wird heller | Drag-State existiert (border-color), aber kein magnetischer Sog | UX + V |
| Processing | Innere Aktivität steigt, kein Spinner — Layer-Rotation beschleunigt, Halo intensiver | Generischer Loading-Indikator | V + UX |
| Review-Ready | Sammelt sich, klarer Übergang in Dialog | Kein eigener visueller Zustand | UX + V |
| Failed/Unclear | Ruhige Störung, präzise nächste Aktion, kein dramatischer Error | Toast-basiert | UX |

**Composition-Vertrag.** Das Wesen lebt sichtbar. Jeder seiner Zustände ist Teil seiner Persönlichkeit, nicht ein Status-Icon.

---

## Teil C — Querschnitts-Befunde

Drei Muster, die screenübergreifend auftauchen und vor jeder Screen-Arbeit adressiert werden sollten.

### C1 · Stillschweigendes Weglassen statt Skeleton/Platzhalter

Wo ein Block ein ViewModel-Feld bräuchte, das es noch nicht gibt (Outcome, Status-Pills, Key-Facts, Today-Counter, Atmosphere-Aktivität, Mode-Gruppierung in Handlungsbedarf), wurde der Block komplett weggelassen. Konsequenz: die UI wirkt „fertig", aber die eigentliche Soll-Komposition ist unsichtbar runtergeschnitten. **Fix-Prinzip:** Block wird mit Skeleton/„—" gerendert, plus DECISIONS-Eintrag „Feld X folgt". Lücke wird sichtbar, nicht verschluckt.

### C2 · Provenance ist nirgends sichtbare Ebene

Quellen erscheinen nur als Tooltip (`title=`-Attribut) oder Mini-Mono-Text. Im Prototype ist Provenance ein **eigenes Designelement**: Quellen-Cards mit Metadata-Footer, `vs`-Säule, „cogni empfiehlt"-Begründung, Source-Marker im Verlauf, Source-Spalte im Handlungsbedarf, Footer „09.04.2026 · 14:22 · informell". Das ist Produktkern (vgl. `mem://features/produkt-prinzipien` — „jede Erkenntnis hat Quelle + Delta") und muss durchgängig sichtbar sein, nicht hinter Tooltips.

### C3 · „Entität ist immer da"-Botschaft bricht ab

Im Prototype ist die Entität auch im Projekt-Modus präsent: Atmosphäre-Streifen, Mini-Entität in der Sidebar (klickbar als „zurück zum Kern" + Drop-Zone), Universal-Overlay über ⌘+Space das die Entität wieder vollformatig holt. Im Code ist die Entität ein Home-only Element — sobald man im Projekt ist, ist die Intelligenz abwesend. Das bricht die zentrale Produktbotschaft.

### C4 · Hierarchie-Disziplin pro Screen ist unscharf

Die Prototypes definieren je Screen **harte Schriftgrad-Hierarchien** (Home: Entität dominiert, Hero ist 48 px / Project-Detail: Lage 44+24, Handlungsbedarf 28, Verlauf 20, Substanz 18). Im Code wirken Sections gleich gewichtet — alles `text-2xl`-ish. Folge: kein Lese-Sog, kein vertikaler Rhythmus.

### C5 · UX-Logik vs. Visual: zwei Tempi für ein und dieselbe Geste

Beispiel Konflikt: visuell halb da (Cards vorhanden), UX-logisch halb da (Buttons existieren) — aber die **Geste „in 1 Sekunde scannen, in 2 Sekunden entscheiden"** ist nicht da, weil generische Labels statt inhaltlicher Chips, kein Empfehlungstext, keine Hervorhebung der vorausgewählten Option. Visuelle Treue allein reicht nicht — die *Mikro-Choreografie* (was sieht der User zuerst, was klickt er als Default) muss explizit gebaut werden.

---

## Empfehlungsreihenfolge für Stufe 2

Vorschlag, nicht festgelegt — bitte kommentieren.

1. **Querschnitt C3 zuerst.** Atmosphäre-Streifen + Mini-Entität in Sidebar einführen. Damit ist die Produktbotschaft wieder hergestellt, **bevor** wir an Inhalt arbeiten.
2. **Querschnitt C2 als Designprinzip festlegen.** Provenance-Pattern (Quellen-Card + vs + Empfehlung) einmal als wiederverwendbarer Building-Block bauen.
3. **Project-Detail (B2)** vor Home, weil dort die meiste Substanz lebt und die vier Rollen + zweispaltiges Mittelfeld die größte Wirkung haben.
4. **Dialog-Drill (B4)** vor Dialog-Batch-Feinschliff, weil Drill die räumliche Bühne ist, die das Provenance-Pattern voll einlöst.
5. **Home (B1)** mit Bühnen-Komposition + Sidebar-Mini-Entität.
6. **Dialog-Batch (B3)** Feinschliff: collapsed-by-default-Choreografie, inhaltliche Chips, Suggestion-Pills.
7. **Entity-Modi (B5)** Tokens und Drag/Processing/Review-States als Politur am Schluss.

ViewModel-Erweiterungen (Outcome, Phase, Budget, Status-Pills-Counts, Today-Counter, mode-Feld in Handlungsbedarf, Source-Metadata, Empfehlung) werden parallel zur jeweiligen Screen-Arbeit ergänzt — mit Skeleton solange sie fehlen.
