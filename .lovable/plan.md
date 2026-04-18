

## Layout-Revise — Mehrspaltigkeit + Header-Hierarchie

### Teil 1 — Header-Reorganisation (LageZone)

**Problem:** Meta-Strip (Termin/Änderung/Stakeholder/Budget) sitzt zu weit unten. Lagebild, Konflikt, Zielbild wirken als drei gleichwertige Streifen.

**Neue Hierarchie:**

```text
┌─────────────────────────────────────────────────┐
│ PROJEKT                                          │
│ Kundenname (groß)                                │
│ Subline-Beschreibung                             │
│ ─ Termin · Änderung · Stakeholder · Budget ─    │ ← direkt unter Subline
├─────────────────────────────────────────────────┤
│                                                  │
│   ▌ LAGEBILD (dominant, groß, eigene Fläche)   │ ← Hero-Element
│     Volltext, größere Typo, mehr Padding         │
│                                                  │
├─────────────────────────────────────────────────┤
│ [Konflikt-Banner schmal]  [Zielbild kompakt]    │ ← zweispaltig, sekundär
└─────────────────────────────────────────────────┘
```

- Meta-Chips wandern hoch direkt unter die Subline (kompakte Inline-Zeile)
- Lagebild wird visuell dominant: größere Typo (text-lg), mehr Padding, eigener Akzent (linker Border-Bar in primary/40 oder dezenter Glow)
- Konflikt + Zielbild rücken in eine zweispaltige Zeile darunter — beide kompakter, gleichrangig untereinander aber sekundär zum Lagebild
- Zielbild-Box bekommt knappere Darstellung (Erfolgskriterium einzeilig + No-Gos als Inline-Tags)

### Teil 2 — Mehrspalten-System für die vier Zonen

**Empfehlung: 60/40 zweispaltig** statt 40/40/20, weil:
- Drei schmale Spalten zerreißen den Lesefluss bei dichten Listen
- Handlungsbedarf braucht Platz für expandierbare Rows + Akzentbalken
- Verlauf/Substanz funktionieren gut nebeneinander
- Auf 1585px Viewport (aktuell) sind 60/40 noch atmungsaktiv

**Zonenverteilung:**

```text
┌─────────────────────────────────────────────────────┐
│ LAGE (volle Breite — Kontext für alles)             │
├──────────────────────────────┬──────────────────────┤
│                              │                      │
│  HANDLUNGSBEDARF (60%)       │  VERLAUF (40%)      │
│  operatives Zentrum          │  Chronologie        │
│  bleibt prominent            │  scrollbar          │
│                              │                      │
├──────────────────────────────┴──────────────────────┤
│ SUBSTANZ (volle Breite)                             │
│ Themen-Drilldown + Dokumente — braucht horizontale │
│ Fläche für Themen-Cluster                           │
└─────────────────────────────────────────────────────┘
```

**Begründung pro Zone:**
- **Lage**: volle Breite — orientiert das gesamte Bild, darf nicht zerteilt werden
- **Handlungsbedarf + Verlauf nebeneinander**: natürliches Paar (Was ist zu tun? + Was ist passiert?), beide scroll-intensiv, profitieren von Side-by-Side
- **Substanz**: volle Breite — Themen-Cluster + Dokumentliste brauchen horizontalen Platz, sind ohnehin tiefer Drilldown

**Responsive:**
- ab `lg` (1024px): zweispaltig 60/40
- darunter: untereinander (aktuelles Verhalten)

### Teil 3 — Visuelle Abgrenzung nebeneinanderliegender Panels

Damit Handlungsbedarf und Verlauf nebeneinander nicht verschwimmen:
- Beide bekommen eigene Container auf `surface-2` mit `border-subtle` + `shadow-card-glow`
- Spaltenabstand: `gap-6` (24px) — genug Luft, kein Riss
- Zonen-Hintergrund bleibt `surface-0` zwischen den Containern sichtbar
- Sektion-Header (HANDLUNGSBEDARF / VERLAUF) bleiben als kleine uppercase-Labels über jedem Container

### Betroffene Dateien

- `src/components/project/LageZone.tsx` — Meta-Chips hochziehen, Lagebild als Hero, Konflikt+Zielbild zweispaltig
- `src/components/project/ProjectScreen.tsx` — Grid-Layout für Handlungsbedarf+Verlauf-Zone
- `src/components/project/HandlungsbedarfList.tsx` — Outer-Padding/Container-Wrapping anpassen für Spalte
- `src/components/project/VerlaufFeed.tsx` — dito, plus ggf. max-height + scroll für lange Feeds
- `src/components/project/SubstanzSection.tsx` — bleibt full-width, evtl. innere Themen 2-spaltig

### Out of Scope

- Keine inhaltlichen Änderungen
- Keine neuen Komponenten
- Surface-System bleibt unverändert

