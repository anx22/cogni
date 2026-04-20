## Projekt-Panel Redesign

### Aktuell vs. Neu

**Heute:** 4×5 Grid mit 56×56 Tiles, nur Initialen + Mini-Name darunter. Wirkt wie Icon-Wand, Information dünn.

**Neu:** 2×4 Grid mit großzügigen, horizontalen Karten (~140×72). Jede Kachel atmet, zeigt echten Inhalt: Titel, letzte Änderung, dezenter Status-Hinweis.

### Kachel-Anatomie

Inspiriert vom Referenzbild (Kontaktkarte mit Portrait + Name + Untertitel + Zeit), übersetzt in unsere dunkle, glasartige Sprache:

```text
┌──────────────────────────────────────┐
│ ◆  Aurora Rebrand               •    │   ← Initial-Chip + Titel + Status-Dot
│    vor 3 Std · 2 offen               │   ← Zeit + Signal-Zähler
└──────────────────────────────────────┘
```

**Elemente, von wichtig nach beiläufig:**

1. **Initial-Chip** (28×28, links, gerundet, surface-2)
  Zwei Buchstaben, Primärton. Visueller Anker, ersetzt das Icon.
2. **Projekt-Titel** (eine Zeile, `truncate`, `text-sm font-medium`)
  Lange Namen bekommen `…` am Ende. Voller Name im `title`-Tooltip.
3. **Status-Punkt** (rechts oben, 6px)
  - Grau: ruhig
  - Bernstein: offene Handlungsbedarfe
  - Rot: Konflikt
  - Smaragd: Review bereit
   Maximal **ein** Dot. Priorität: Konflikt > Review > Handlungsbedarf > ruhig.
4. **Meta-Zeile** (klein, `text-[10px] text-muted-foreground/60`)
  Format: `vor 3 Std · 2 offen` — nur das, was nicht null ist. Nur Zeit, wenn nichts offen: `vor 3 Std`. Relative Zeit (`vor X Min/Std/Tagen`), nach 7 Tagen Datum.
5. **Aktiv-Indikator**
  Aktive Karte: Outline `ring-1 ring-primary/40` + leicht hellerer Surface. Kein zusätzlicher Dot — der Ring ersetzt ihn.

### Layout & Verhalten

- **Grid:** 2 Spalten × 4 Reihen = 8 sichtbar, Pagination-Dots wie heute
- **Kachelmaß:** ca. `140px × 72px`, Spalten-Gap 10px, Zeilen-Gap 12px
- **Container:** Hintergrund-Pattern bleibt (Punkte-Raster), Padding leicht erhöht
- **Hover:** Surface heller, Übersetzung +2px hoch, Status-Dot kurz pulsiert wenn nicht-grau
- **Empty state:** Eine breite „Erstes Projekt anlegen"-Karte über volle Breite, Plus-Icon zentral
- **Keyboard:** Pfeile bewegen wie heute (jetzt 2 Spalten), Enter öffnet

### Datenmodell-Erweiterung

`DemoProject` bekommt neue optionale Felder, damit echte Daten später nahtlos einsteigen:

```ts
interface DemoProject {
  id: string;
  name: string;
  initial: string;
  lastChangedAt?: string;       // ISO — für „vor X"
  openCount?: number;           // Handlungsbedarfe
  signal?: "calm" | "review" | "conflict" | "action";
}
```

Demo-Daten bekommen realistische Werte (Mischung aus alt/neu, mit/ohne offene Punkte).

Später (Phase 7+): `lastChangedAt` aus `change_events.created_at MAX`, `openCount` aus `review_cases WHERE box_state='proposed'`, `signal` abgeleitet aus `contradictions` + offenen Sessions.

### Betroffene Dateien

**Geändert:**

- `src/components/entity/SideGrid.tsx` — Grid-Werte (`COLS=2, ROWS=4`), Spalten-Template auf flexible Breite
- `src/components/entity/ProjectTile.tsx` — komplettes Redesign zur horizontalen Karte
- `src/data/demoProjects.ts` — neue Felder + realistische Beispieldaten
- `src/pages/Index.tsx` — eventuell Container-Position leicht justieren wegen breiterer Spalte

**Neu:**

- `src/lib/format/relativeTime.ts` — kleine Helper-Funktion `formatRelative(iso)` → `"vor 3 Std"`

### Was bewusst nicht in dieser Runde

- Echte Anbindung an `change_events` / `review_cases` (kommt in Phase 7.5 / 8 — Felder sind aber vorbereitet)
- Drag-to-reorder
- Filter / Sortierung (nach letzter Änderung als Default reicht)
- Rechte Seite (`RecentAssets`) — ist eigene Diskussion, lassen wir wie sie ist

### Offene Mini-Entscheidungen (kannst du im selben Bauauftrag mitgeben)

1. **Sortierung Default:** zuletzt geändert zuerst,
2. **Status-Dot:** ein einziger (priorisiert) oder bis zu zwei nebeneinander? Bis zu zwei!
3. **Pagination bei ≤8 Projekten:** Dots ganz weglassen, oder grau angedeutet anzeigen? Angedeutet anzeigen!

&nbsp;