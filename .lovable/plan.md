

## Entity-Screen-Erweiterung — Schwebende Side-Grids

### Konzept

Der Entity-Core bleibt absoluter Mittelpunkt. Links und rechts davon schweben zwei dezente Grid-Flächen — wie zwei stille Beiboote neben dem Hauptobjekt. Keine Cards, keine harten Container, nur gepunktete Hintergrundfläche mit Icon-Kacheln.

### Layout

```text
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│  ┌─────────────┐         ●●●●         ┌─────────────┐       │
│  │ · · · · · · │       ENTITY-CORE     │ · · · · · · │       │
│  │ □ □ □ □     │      (zentriert)      │ · · · · · · │       │
│  │ □ □ □ □     │                       │ · · · · · · │       │
│  │ □ □ □ □     │                       │ · · · · · · │       │
│  │ □ □ □ □     │                       │ · · · · · · │       │
│  │ □ □ □ □     │                       │ · · · · · · │       │
│  │   • • •     │  Pagination dots      │             │       │
│  └─────────────┘                       └─────────────┘       │
│   PROJEKTE                              [Platzhalter]        │
│                                                              │
│  Drop-Hint                          Bottom-Status            │
└─────────────────────────────────────────────────────────────┘
```

### Linkes Grid — Projekt-Launcher

**Visuelle Anmutung:**
- Hintergrund: `radial-gradient` aus winzigen Punkten (~1px, `foreground/8`, Abstand ~16px) — dezenter Dotted-Pattern
- Keine Border, kein Container-Rand, nur die Punkt-Fläche definiert das Grid
- Padding innen ~24px, leicht abgerundete Ecken (`rounded-3xl`) für die Hintergrundfläche
- Sehr leichter Backdrop-Blur, damit es schwebt aber nicht aufdringlich ist

**Kacheln:**
- 4 Spalten × 5 Zeilen = 20 Projekte sichtbar pro Seite
- Kachel: ~56×56px, `rounded-2xl` (iOS-App-Icon-Anmutung), Hintergrund auf `surface-2` mit dezentem Glow
- Inhalt der Kachel: 1-2 Buchstaben Initial des Projekts (oder Symbol später) in primary-Farbe, mittig
- Direkt unter Kachel: einzeiliger Projektname, `text-[10px]`, `text-muted-foreground/70`, max. 1 Zeile mit `truncate`
- Hover: Kachel wird `surface-3`, leichte Skalierung (`scale-105`), Name wird heller
- Klick: navigiert zu `view: "project"` (später mit Projekt-ID)

**Pagination:**
- Erscheint nur wenn >20 Projekte
- Drei kleine Dots unten mittig (`w-1.5 h-1.5 rounded-full`), aktive Seite `bg-foreground/60`, inaktive `bg-foreground/15`
- Keine Pfeile, keine Nummern — Apple-Stil
- Klick auf Dot oder horizontales Wischen wechselt Seite (Wisch optional in Phase 2)

**Header-Label:**
- Kleines uppercase-Label `PROJEKTE` unter dem Grid, `text-[10px]`, `tracking-widest`, `text-muted-foreground/40`

### Rechtes Grid — Platzhalter

- Identische Struktur: gleiche Größe, gleicher Dotted-Background, gleiches Padding
- Inhalt leer — nur die Punkte sichtbar
- Mini-Label unten: `BALD VERFÜGBAR` oder einfach kein Label (entscheide ich für „kein Label" — maximale Ruhe, Funktion enthüllt sich später)
- Gleicher Render-Code, nur ohne Items → später drop-in austauschbar

### Positionierung & Responsive

- Grids absolut positioniert, vertikal mittig zur Entity (`top-1/2 -translate-y-1/2`)
- Horizontaler Abstand zur Entity: ausreichend, dass Entity-Glow nicht in Grid läuft (~10-12% der Viewportbreite vom Zentrum)
- **Breakpoints:**
  - `xl` (≥1280px): beide Grids sichtbar links und rechts
  - `lg` (≥1024px): nur linkes Grid sichtbar, rechtes ausgeblendet
  - `<lg`: beide Grids ausgeblendet, Entity bleibt allein (Mobile-Reinheit)

### Ergänzungen, die du nicht erwähnt hast

1. **Empty-State linkes Grid**: wenn 0 Projekte existieren → eine einzelne dezente Kachel mit `+` als Aufforderung „Erstes Projekt anlegen"
2. **Aktiv-Indikator**: das zuletzt geöffnete Projekt bekommt einen winzigen Punkt unter dem Namen (wie iOS „App geöffnet"-Indikator)
3. **Tooltip on hover**: voller Projektname als Tooltip, falls truncated
4. **Tastaturzugriff**: Pfeiltasten navigieren durch Kacheln, Enter öffnet — barrierefrei und Apple-typisch elegant
5. **Drop-Zone-Schutz**: wenn der User Files über die Entity zieht, dürfen die Grids nicht den Drop abfangen → `pointer-events-none` während Drag-State auf den Grids
6. **Animation beim Erscheinen**: Grids faden mit kleinem `translate-x` (Links: von links, Rechts: von rechts) ein, ~400ms, gestaffelt nach der Entity

### Datenquelle

- Demo-Liste in `src/data/demoProjects.ts` (Plural, neue Datei) mit ~6-12 Demo-Projekten: `{ id, name, initial, lastOpenedAt? }`
- Später durch Supabase-Query ersetzbar — Komponente bleibt unverändert
- Klick auf Kachel ruft existierenden `setView("project")` auf (Phase 4: mit ID-Parameter)

### Komponenten-Struktur

- `src/components/entity/SideGrid.tsx` — generischer Grid-Container mit Dotted-Background, Pagination, Slots für Items
- `src/components/entity/ProjectTile.tsx` — einzelne Kachel mit Initial + Name + Hover/Active-States
- `src/data/demoProjects.ts` — Demo-Datenquelle

### Betroffene Dateien

- `src/pages/Index.tsx` — beide Grids links/rechts der Entity einbinden, Click-Handler für Projekt-Navigation
- **Neu:** `src/components/entity/SideGrid.tsx`
- **Neu:** `src/components/entity/ProjectTile.tsx`
- **Neu:** `src/data/demoProjects.ts`
- `src/index.css` — ggf. Utility für Dotted-Pattern-Background (oder via Tailwind `bg-[radial-gradient(...)]` inline)

### Out of Scope

- Echte Backend-Anbindung (kommt mit Phase 2.5/Backend)
- Drag-and-Drop zwischen Kacheln, Reordering, Favoriten
- Kontextmenü auf Kacheln
- Inhalt des rechten Grids
- Wisch-Gesten für Pagination (Click auf Dots reicht in Phase 1)

### Erwartetes Ergebnis

Der Entity-Screen wirkt nicht mehr leer, behält aber seine ruhige Zentrierung. Du erkennst auf einen Blick alle aktuellen Projekte als Icon-Wand links neben der Entity und kannst direkt einsteigen — ohne Menü, ohne Sidebar, ohne Bruch der Designhaltung.

