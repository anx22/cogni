## Ziel

Orb Lab schneller bedienbar machen: alle Doppel-Range-Slider (Min/Max-Thumbs) durch normale Single-Sliders ersetzen. Die Sampling-Range wird im Hintergrund automatisch um den gewählten Wert herum gebildet, sodass der „lebendige" Re-Roll-Charakter erhalten bleibt — aber der User stellt nur noch **einen Wert pro Feld** ein.

## Was sich ändert

### 1. Neuer `ValueRow` ersetzt `RangeRow`

Single-Slider mit großem Thumb, Klick aufs Label/Wert öffnet kein Modal — direkt ziehen. Anzeige: aktueller Wert in tabular-nums rechts.

```
Lightness %                                72
●━━━━━━━━━━━━━━━━━━━━━━━━━━━━○━━━━━━━━━━━
```

Pro Feld definiert die Komponente eine **Jitter-Konstante** (in Slider-Step-Einheiten, z. B. 4 % der Spannweite). Beim Speichern wird die Range geschrieben:
`{ min: clamp(value − jitter), max: clamp(value + jitter) }`. So bleibt das bestehende Sampling und alle gespeicherten DB-Werte kompatibel.

Beim Lesen aus der DB wird der Mittelwert `(min+max)/2` als angezeigter Wert berechnet — alte Daten funktionieren weiter.

### 2. Jitter-Defaults pro Feld

Pro Feld passend gewählt, sodass „Re-Roll" sichtbar variiert, aber der User die Farbe/Größe klar steuert:

- Lightness %: ±3
- Chroma: ±0.01
- Hue °: ±6
- Duration s: ±1.5
- Scale × Orb: ±0.05
- Dot size px: ±0.15
- Spacing × dot: ±0.4
- Inner clearance %: ±2
- Outer reach %: ±3
- Opacity: ±0.05
- Rotation s: 0 (kein Jitter, exakter Wert)

Optional: globaler „Variation"-Toggle pro State (später) — jetzt erst mal fixe Konstanten.

### 3. Colors editierbar

Aktuell sind die Color-Slider zwar da, aber der Doppel-Thumb mit minStepsBetweenThumbs=0 ist auf engen Ranges schwer greifbar. Mit Single-Slider + Live-Swatch reagiert die Vorschau auf jede Bewegung sofort. Zusätzlich: in jedem `ColorBlock` wird der Swatch direkt mit dem aktuell **gespeicherten Mittelwert** gerendert (statt nur dem zufällig gesampleten Wert), damit man beim Schieben den Effekt deutlich sieht — dazu eine kleine Helper-Funktion `oklchFromValues(l,c,h)`.

### 4. Speicher-Performance

Setzen bleibt debounced über `useNamespace`. Beim Slider-Drag werden viele Werte schnell hintereinander gefeuert — der bestehende 300 ms-Debounce schreibt nur die letzte Position in die DB.

Zusätzlich: lokaler State im Editor cached den letzten Wert, damit der Slider während des Drags nicht „springt", falls Realtime einen Echo-Update sendet.

### 5. Layout/UX-Feinheiten

- Editor-Karten kompakter: `pt-3 space-y-3`, kleinere Zeilenhöhe.
- Wert rechts klickbar → Reset auf Default-Mittelwert (kleine RotateCcw-Icon).
- "Default"-Button pro State bleibt.
- Kein Scope-Wechsel, keine neuen DB-Migrationen.

## Betroffene Dateien

- `src/pages/OrbLab.tsx` — `RangeRow` → `ValueRow`, Helper für Mittelwert-Lesen / Range-Schreiben, Color-Swatch aus Mittelwerten.
- (optional) kleine Util in `src/components/entity/orbPresets.ts`: `centerOf(r: Range)` und `rangeAround(v, jitter)` zur Wiederverwendung.

Keine Änderungen an Sampling, EntitySurface, SiriOrb oder DB-Schema.

## Verifikation

- Jeder Slider ist mit einem Klick + Drag in <1 s auf einen Wert bringbar.
- Live-Swatch jeder Farbkarte spiegelt sofort die Slider-Position wider.
- Re-Roll erzeugt sichtbare, kleine Variation um den eingestellten Wert.
- Reload: gespeicherter Wert bleibt erhalten, Slider stehen exakt dort.
- Alte DB-Einträge mit eigener Range werden als Mittelwert angezeigt und beim ersten Speichern auf das neue Jitter-Schema normalisiert.
