

## Problem

Der Screen wirkt wie eine flache schwarze Wand. Container, Karten und Sektionen sind kaum unterscheidbar, weil:

1. `bg-card/40`, `bg-card/30`, `bg-background/40`, `bg-card/20` liegen alle extrem nah beieinander auf fast schwarzem Grund
2. `border-border/40` und `border-border/50` sind quasi unsichtbar
3. Keine echte Tiefenhierarchie — alles schwebt auf derselben Ebene
4. Keine Trennung zwischen den vier Rollen-Zonen außer einer dünnen Linie

## Design-Revise — Surface- & Depth-System

### 1. Surface-Hierarchie einführen (3 Ebenen + Akzent)

Statt zufälliger Opacity-Werte ein klares System mit echtem Kontrast:

```text
Ebene 0  Page Background      sehr dunkel, neutral kühl
Ebene 1  Zone Background      +4-6% Helligkeit, leichte Tönung
Ebene 2  Card / Container     +8-10% Helligkeit, sichtbarer Border
Ebene 3  Inner Element        +12% Helligkeit für Hover/Active/Inset
```

Konkret in `index.css` neue Tokens ergänzen:
- `--surface-0` (Page)
- `--surface-1` (Zone) 
- `--surface-2` (Card)
- `--surface-3` (Inner/Hover)
- `--border-subtle` (sichtbar, ~14-16% L)
- `--border-strong` (Trennlinien zwischen Zonen, ~20% L)

Helligkeitssprünge mindestens 4-5% L im HSL — sonst nicht wahrnehmbar auf OLED/dunklen Screens.

### 2. Zonen klarer trennen

Statt `border-b border-border/40` zwischen den vier Rollen:
- **Lage**: `surface-1` mit dezentem Top-Gradient
- **Handlungsbedarf**: `surface-0` (zurückgesetzt) — die Karten darin liegen auf `surface-2` und stechen hervor
- **Verlauf**: `surface-1` wieder leicht angehoben
- **Substanz**: `surface-0`

Wechsel zwischen `surface-0` und `surface-1` erzeugt Rhythmus ohne harte Linien. Plus eine ~1px `border-strong`-Linie als sauberer Schnitt.

### 3. Karten endlich sichtbar machen

Aktuell: `bg-card/40 border-border/50` → praktisch unsichtbar.
Neu: 
- Hintergrund: `surface-2` (echte Fläche, kein Alpha-Trick)
- Border: `border-subtle` (1px, sichtbar)
- Optional: leichter innerer Glow oben (1px `inset 0 1px 0 rgba(255,255,255,0.04)`) → gibt Karten die typische "schwebende" Glas-Anmutung
- Schatten weiter unten: `shadow-[0_1px_0_rgba(0,0,0,0.4),0_8px_24px_-12px_rgba(0,0,0,0.6)]`

Betroffen: Lagebild-Box, Zielbild-Box, Konflikt-Banner, Handlungsbedarf-Gruppen-Container, Verlauf-Einträge, Substanz-Karten.

### 4. Inner Rows in Handlungsbedarf

Die Liste wirkt aktuell wie ein Block. Lösung:
- Container auf `surface-2`
- `divide-y divide-border-subtle` (sichtbar)
- Hover-Row: `surface-3`
- Expandierter Body: leicht eingerückter `surface-1`-Streifen mit linkem Akzentbalken in der Modus-Farbe (violet/amber/emerald/cyan)

### 5. Akzentfarben dezent, aber präsent

- Modus-Headlines (Entscheiden/Klären/Umsetzen/Prüfen): aktueller Farbcode bleibt, aber +kleines farbiges Quadrat/Dot davor für visuelle Verankerung
- Konflikt-Banner: Border kräftiger (`border-destructive/50`), Hintergrund mit echtem rötlichem Tint statt nur 5% Alpha
- No-Go-Tags: gleiche Behandlung

### 6. Typo-Kontrast feinjustieren

- Body-Text aktuell `text-foreground/85` und `text-foreground/75` → Karten-Body auf `text-foreground/90` anheben, weil die neuen Surfaces dunkler bleiben
- Labels (`text-muted-foreground/50`) auf `/65` — sie verschwinden sonst

## Umfang & Dateien

- `src/index.css` — neue CSS-Variablen für Surface- und Border-System (Dark Mode Block)
- `tailwind.config.ts` — Tokens als Tailwind-Farben verfügbar machen (`surface-0/1/2/3`, `border-subtle/strong`)
- `src/components/project/LageZone.tsx` — Lagebild-Box, Zielbild-Box, Meta-Strip-Hintergrund
- `src/components/project/HandlungsbedarfList.tsx` — Section, Gruppen-Container, Rows, Hover, Expanded-Body mit Akzentbalken
- `src/components/project/VerlaufFeed.tsx` — Zonen-Hintergrund, Eintragskarten
- `src/components/project/SubstanzSection.tsx` — Themen-Karten, Dokumentliste
- `src/components/project/shared/ConflictBanner.tsx` — kräftigerer Tint + Border
- `src/components/project/ProjectScreen.tsx` — Zonen-Wechsel `surface-0` ↔ `surface-1`, stärkere Trennlinie

## Out of Scope

- Keine Layout-Änderungen, keine neuen Inhalte
- Keine Funktionsänderungen
- Akzentfarben-System (violet/amber/emerald/cyan/destructive) bleibt wie es ist

## Erwartetes Ergebnis

Klare visuelle Hierarchie: Du siehst auf den ersten Blick wo eine Zone aufhört und die nächste anfängt, welche Container existieren und welche Elemente klickbar/interaktiv sind — ohne dass das Design seine ruhige, dunkle, glasartige Haltung verliert.

