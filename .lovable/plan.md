## Fokus

**Nicht**: Entity, Home, AssetOrbit, Theme-Vehikel, ViewModel-Aufbohrung.
**Doch**: Sidebar, Projekt-Detail (Hero + Mittelfeld + Substanz), BatchReviewOverlay, FaktDrillOverlay — exakt nach `docs/redesign/REVIEW.md`, `docs/redesign/prototype/*` und `docs/redesign/screenshots/*`.

Quellen sind konsistent: wo der Code von Prototype/Screenshot abweicht, gewinnt die Logik des Implementation-Plans (REVIEW.md, Teil A). Kein Eingriff in `src/lib/**` oder `ProjectViewModel`.

---

## Pass 1 — Sidebar (Anker, screen-aware)

Aktuell: zeigt Mini-Entity nur über `showMiniEntity`, sonst Standard-Liste mit Open-Count zwischen Name und Dot. Soll laut Prototype + Tag.png:

- **Home**: nur Projektliste + „+ Neues Projekt"-Ghost. Keine Mini-Entity. ✓ entspricht heute.
- **Projekt-Detail**: oben Mini-Entity-Block (56 px Orb + zwei Zeilen: `cogni` mono 11.5 px / `verstehe · 0:08` mono uppercase 10 px). Hover: Label wechselt zu „öffnen ⌘ ␣" in Accent. Klick = `onEntityClick` (heute schon: `onBack`).
- **Projektliste-Row**: Initials in fester 28 px Mono-Spalte, Name `t-small`, **Open-Count entfernen**, rechts Signal-Stack (1–2 Dots mit 4 px Gap). Aktive Row: `--surface-3` Hintergrund + Ink auf `--ink`.
- **„+ Neues Projekt"**: echtes Plus-Glyph + Mini-Abstand nach oben, Ink-4.
- Tokens nur über `--surface-*`, `--hair`, `--ink-*`, `--accent`, keine Hex.

Tasks:

1. `AppSidebar.tsx` Row-Markup auf Prototype-`ProjectRow`-Komposition (Mono-Initial 28 px / Name / SignalStack rechts), Open-Count raus.
2. Mini-Entity-Block: Spacing/Typo/Hover-Label aus Prototype 1:1.
3. `+ Neues Projekt` mit Lucide `Plus`-Icon (12 px) statt Glyph-Text.

---

## Pass 2 — Projekt-Detail Hero (LageZone)

Aktuelle `LageZone.tsx` hat Atmosphären-Stripe, 44 px Name, 24 px Lagetext und MetaChips — aber Komposition stimmt nicht. Soll laut Prototype + Tag.png:

- **Top-Row Breadcrumb + Header-Actions**: links Monogram (HN, 28 px) · `customer` mono · `phase` · `N Stakeholder` · `budget` mono — rechts „Material" (ghost) + „Review öffnen" (primary). MetaChip-Reihe „Letzte Änderung / Budget" aus Hero **entfernen** (geht in Key-Facts).
- **Eyebrow**: `Lage` `t-micro` + Trenner + `· rekonstruiert vor 2 Min` (regular, kein Caps).
- **Hero-Block**: 44 px Name + 24 px Light-Lagetext (max-w 880 px). Description-Absatz raus (redundant).
- **Status-Chips inline + Key-Facts rechts** in eine Reihe:
  - Chips links: `Konflikt {konflikte.length}` (sig-conflict-soft), `{X} Entscheidungen offen` (sig-review-soft), `Review fällig` falls offen (sig-review-soft). Counts aus VM ableiten — keine neuen Felder.
  - Key-Facts rechts: „Nächster Termin" Label + 18 px Mono-Datum + Topic; „Letzte Änderung" Label + Text + Mono-Relativzeit.
- **Outcome-Bar** unten als ruhige Zeile (`--surface-2`, 10 px Padding, Flag-Icon + `Outcome` micro-Label + Text). NoGos als Mini-Chips rechts neben dem Outcome-Text, nicht als zweite Karte.
- **ConflictBanner aus Hero raus** — verschiebt sich in `HandlungsbedarfList` als Empty-Hint, falls überhaupt nötig (heute redundant zu Konflikt-Rows).
- `variant="shell"` bleibt für Empty-Projekte unverändert.

Atmosphären-Stripe: `.atmosphere-stripe` existiert in `index.css` — prüfen, dass sie als `position: absolute; top:0; left:0; right:0; height:3px` über die volle Seitenbreite läuft (heute steckt sie im LageZone-Section-Padding und ist deshalb nicht über die Sidebar hinweg sichtbar). Fix: in `ProjectScreen` als globales Top-Edge-Element rendern, nicht in LageZone.

---

## Pass 3 — Handlungsbedarf + Verlauf (Mittelfeld)

`ProjectScreen.tsx` Mittelfeld ist bereits zweispaltig (3:2). OK.

**HandlungsbedarfList**:

- Header: `h2` 28 px + Count mono + rechts Filterleiste mit drei Ghost-Buttons `Alle / Nur Blocker / Ohne Frist` (lokaler State, kein VM-Eingriff). Aktive Filter-Button: `--surface-3` + `--ink`.
- Gruppen-Header pro Modus: bereits da. Hairline rechts vom Label bis Container-Rand ergänzen (Prototype zeigt durchgehende Hair-Line).
- **Row-Komposition** auf Prototype-Pattern umbauen:
  - Optional Blocker-Stripe links (3×32 px, conflict).
  - 26 px Type-Icon-Square (`--surface-2` Hintergrund).
  - Titel 14.5 px ink + Subline `t-small` ink-3 (heute nur in Expand-Panel — soll inline sein).
  - Rechts: Owner-Avatar (18 px Mono-Initials in `--surface-3`) + Vorname, Frist Mono, Source `.src`-Klasse als Mini-Mono-Text.
  - Klick → öffnet `openDialog(buildHandlungsbedarfSession(item))` (heute via Expand+Button — Expand entfällt). Kein Inline-Expand mehr in der Liste. Die „Bühne" ist der Drill.
- ChevronRight + Expand-Panel komplett entfernen.

**VerlaufFeed**:

- Schmaler Feed (340 px wie Prototype, heute lg:col-span-2 → ok).
- Vertikale Timeline-Linie (1 px `--hair`) hinter den Dots.
- 13 px Dot mit 2 px farbigem Border je Delta-Typ (neu=action, ersetzt=review, widersprochen=conflict, bestaetigt=ink-3).
- Pro Eintrag: 11 px Mono-Datum + `DeltaTag` + 13.5 px Inhalt + `.src` Source-Marker.

---

## Pass 4 — Substanz

`SubstanzSection` auf Prototype-Grid umstellen:

- Grid `1.4fr 1fr` statt 3-Spalten.
- **Themen** links: 2-spaltiges Sub-Grid, Card mit Name + Mono-Counts `{E}·{P}·{D}` + Chevron rechts.
- **Dokumente** rechts: Hairline-Liste mit Typ-Badge (`.src`-Stil), Name, Version mono, Datum mono.
- H2: 18 px ink-2 (kleinste Skala, ruhig).

---

## Pass 5 — BatchReviewOverlay (10-Sekunden-Diff)

Heutiger `BatchReviewOverlay` + `ReviewRow` haben Modalitäts-Renderer, aber nicht die Prototype-Mikro-Choreografie. Ziel: exakt Prototype `SceneBatchReview` / `SceneBatchConfliktExpanded`.

- **Listen-Container**: 16 px Border-Radius, 1 px Hair, `--surface-1`, margin 28/44 px.
- **Row**: 48 px min-height (Konflikt/Lücke 52), 3 px Status-Stripe links (review/conflict/ok), 88 px breite Type-Chip-Spalte (Mono 9.5 px uppercase mit soft-Background).
- **RowAccepted** (Termin / Entscheidung / Stakeholder / Dokument): grüner Outline-Check, Type-Chip neutral, Content ink-2, rechts Projekt-Name Mono.
- **RowConflict (collapsed)**: amber Stripe + amber Pill-Icon, **3 inhaltliche Chips** aus Konflikt-Payload (`faktA` / `faktB` / „offen lassen") — Vorauswahl amber-aktiv, „Details ▼" rechts.
- **RowConflict (expanded)**: zwei Source-Cards mit 22 px Datum-Anchor + Quelle Mono-Eyebrow + Metadata-Footer `09.04.2026 · 14:22 · informell`, 36 px `vs` mittig, darunter Zeile „cogni empfiehlt 15. Mai — Begründung. Klick zum Überschreiben.".
- **RowGap (collapsed)**: nur „Eingeben"-Chip in amber.
- **RowGap (expanded)**: Input + ✓-Button + Suggestion-Pills aus `box.suggestions[]` falls vorhanden.
- **CommitBar**: links „Alle verwerfen" (sekundär), rechts „{X} offen · {Y} bereit" + `5 übernehmen ↵`. Bei alles-ready: blauer Glow-Ring um Commit-Button.

Begründungstext und Metadata-Footer: aus heute schon vorhandenem Box-Payload mappen (siehe `boxMapping.ts`). Wenn Feld leer → stillschweigend weglassen (REVIEW C1).

---

## Pass 6 — FaktDrillOverlay (Bühne, kein Listenzettel)

`FaktDrillOverlay` heute generische Cards. Ziel: Prototype Drill-Szenen.

**Drill-Header**: „← Handlungsbedarf · {Item-Titel} · {Projekt} · Konflikt #{id}" links, esc rechts.

**Konflikt-Drill**:

- Roter Soft-Banner oben mit `Ic.warn` + „Zwei Quellen widersprechen sich" + Erläuterungssatz.
- Zwei großformatige Display-Cards: 38 px Datums-Anchor, Quelle als Sub-Block (`Mail · Thomas Berger` + `09.04.2026 · 14:22 · informell`), Hint-Zeile darunter (`älter · direkter Absender` / `neuer · formelles Protokoll`).
- 48 px `vs`-Kreis mittig auf der Trennachse.
- „Was stimmt?" mit **drei Tiles** (Quelle A · Quelle B · Offen lassen), eine amber-vorgewählt als cogni-Empfehlung. Subtext pro Tile.
- Footer: links „Als Handlungsbedarf markieren" (ghost), rechts „Verwerfen" + „Entscheidung speichern →" (primary, disabled bis Tile gewählt).

**Gap-Drill**: Split 2/5 | 3/5.

- Links: Kontext-Card („Worum es geht") + **„Blockiert"-Liste** aus `project.dependencies` gefiltert auf diese Gap (was hängt an dieser Lücke).
- Rechts: Lücken-Card amber + Eingabefeld + Suggestion-Pills aus Session-Payload.

---

## Reihenfolge & Review-Punkte

1. **Sidebar** (klein, sofort sichtbarer Sprung in Konsistenz).
2. **Hero / LageZone** (größte visuelle Wirkung im Projekt-Detail).
3. **Handlungsbedarf-Row + Filter** (Liste wird endlich „Lagekarte" statt „Modul-Stapel").
4. **Verlauf-Timeline + Substanz-Grid** (Polish).
5. **BatchReviewOverlay** (Mikro-Choreografie der Diff-Logik).
6. **FaktDrillOverlay** (Bühne).

Nach Pass 2, 5 und 6 jeweils **Screenshot-Vergleich Day**  (Browser-Tool) gegen die Mockups, bevor weiter.

---

## Out of Scope (jetzt nicht)

- Entity-Charakter / AssetOrbit / Home-Komposition (anderer Bereich).
- `ProjectViewModel`-Erweiterungen — fehlende Felder werden stillschweigend weggelassen, kein Skeleton-Hack.
- Universal-Overlay (⌘+Space) mit Entity-Bühne — separater Pass.
- Atmosphären-Streifen Pipeline-aktiv-Variante (`is-active`) — kommt mit Realtime-Hook später.

## Risiken / offene Punkte

- **Konflikt-Payload**: aktuelle `KonfliktVM` hat `faktA`/`faktB` als Strings ohne Source-Metadata-Felder (Datum, Mode, Hint). Für die Source-Cards in Batch + Drill nehme ich, was da ist; Metadata-Footer rendert nur wenn vorhanden — sonst weg (REVIEW C1). in backlog todo markieren
- `**stats.naechsterTermin**` ist ein einzelner String — Aufspaltung in `date` + `topic` machen wir via Splitter, kein VM-Eingriff.
- **„cogni empfiehlt"-Begründung**: kommt heute nicht aus dem Backend. Lasse Zeile leer, wenn kein Empfehlungstext vorhanden — keinen Lorem. in backlog todo markieren

Soll ich so loslegen, oder ist eine der 6 Pässe Punktes zu groß / falsche Reihenfolge?