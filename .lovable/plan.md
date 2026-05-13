# Face Pill — 1:1 Port der Quelle, voll lebendig

Ziel: **kein** abgespeckter Nachbau. Jede Animation, jedes Mikrodetail aus `Cobp/serious-mule-50` wird übernommen. Kein `prefers-reduced-motion`-Bremsen, keine vereinfachte Geometrie. Der Charakter soll atmen, blinzeln, lächeln, kippen.

## Original-Inventar (alles, was wir replizieren)

### Geometrie
- Card: **12rem × 12rem**, `border-radius: 3rem` (Squircle).
- Padding-Trick: `.container-wrap` hat `padding: 4px`, beim `:hover` `padding: 0` → Card "atmet" 4 px breiter beim Hover.
- `:active` → `scale(0.95)`.
- `:after`-Pad: graue Backdrop 12 × 11 rem, `border-radius: 3.2rem`, beim Hover wird er auf 12 × 12 rem.
- Open-State (Checkbox checked): Card-Innenfläche `260 × 160 px`, Bälle-Container bekommt `border-radius: 20px`.

### Bälle
- 4 Stück (rosa #ec4899, violet #9147ff, green #34d399, cyan #05e0f5).
- Je 6rem × 6rem, `filter: blur(30px)`, kreisförmig angeordnet (top, right, bottom, left).
- Container rotiert per `@keyframes rotate-background-balls 10s linear infinite` von 360° → 0° (rückwärts).
- **Hover** auf der Pill → `animation-play-state: paused`.
- Bälle-Layer hat `background-color: rgba(255,255,255,0.8)` als Milchglas-Schicht und `overflow: hidden`.

### Augen (idle)
- 26 × 52 px, `background: #fff`, `border-radius: 16px`, gap `2rem`.
- Animation `animate-eyes 10s infinite linear`:
  - 0–46 % höhe 52 px
  - 48 % höhe 20 px (blinzeln 1)
  - 50 % höhe 52 px
  - 96 % höhe 52 px
  - 98 % höhe 20 px (blinzeln 2)
  - 100 % höhe 52 px
  → zwei Doppel-Blinzler pro Zyklus.

### Augen (hover → happy)
- Augen verschwinden, **zwei SVG-Smileys** (`width: 60px`, color `#fff`) erscheinen.
- SVG-Pfad genau aus der Quelle (curved closed-eye smile).

### Maus-Tracking (3D Kipp-Effekt)
Original: 15 unsichtbare `:hover`-Zonen über dem ganzen Container (5 Spalten × 3 Reihen). Je nach Zone wird die Card per `perspective(1000px) rotateX rotateY translateZ(45px)` gekippt.

Tabelle aus dem Quellcode (Spalte/Zeile → rotateX/rotateY):
```text
Zeile oben    : rotateX = +15°
Zeile mitte   : rotateX =   0°
Zeile unten   : rotateX = -15°
Spalte 1 links: rotateY = -15°
Spalte 2      : rotateY =  -7°
Spalte 3 mitte: rotateY =   0°
Spalte 4      : rotateY =  +7°
Spalte 5 rechts: rotateY = +15°
```
+ `translateZ(45px)` immer.

**Unsere Umsetzung:** kein 15-Div-Hack. Wir hören `onPointerMove` auf dem Container ab und mappen Position → Rotation **stetig** (nicht in 5×3 Buckets), das fühlt sich besser an als das Original und verbraucht weniger Knoten:

```ts
const rx = clamp(-(y - 0.5) * 30, -15, 15);
const ry = clamp( (x - 0.5) * 30, -15, 15);
card.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(45px) scale(${active ? 0.95 : 1})`;
```
- Beim Verlassen → zurück auf 0/0/0 mit `transition: transform 600ms ease` (Original-Wert für `.card`).
- Während des Movens setzen wir die Transform direkt (keine Transition für sofortige Reaktion).
- Open-State (Checkbox-Pendant): identische Tilt-Transforms gelten auch für die inneren Buttons (im Original: jede Button-Zelle bekommt eigenen Transform). Wir wenden den Tilt einfach auf den Inhalts-Container mit an.

### Smiley-SVG (1:1 aus Quelle)
```svg
<svg fill="none" viewBox="0 0 24 24">
  <path fill="currentColor" d="M8.28386 16.2843C8.9917 15.7665 9.8765 14.731 12 14.731C14.1235 14.731 15.0083 15.7665 15.7161 16.2843C17.8397 17.8376 18.7542 16.4845 18.9014 15.7665C19.4323 13.1777 17.6627 11.1066 17.3088 10.5888C16.3844 9.23666 14.1235 8 12 8C9.87648 8 7.61556 9.23666 6.69122 10.5888C6.33728 11.1066 4.56771 13.1777 5.09858 15.7665C5.24582 16.4845 6.16034 17.8376 8.28386 16.2843Z"/>
</svg>
```

### State → Emotionsvariation (zusätzlich zur Quelle)
Quelle hat nur idle/hover/checked. Wir mappen unsere Entity-States darauf:
- `idle` → Default-Animation, 10 s Eyes-Cycle, 10 s Bälle.
- `hover` (Drag-over) → Smiley dauerhaft + Bälle pausiert + Glow stärker.
- `processing` → Augen halb-geschlossen (höhe `28px` permanent), Bälle schneller (4 s), Card pulsiert leicht (`scale 0.98 ↔ 1.0`, 1.2 s).
- `review-ready` → Smiley + 1× kurzer „Glow-Burst" beim State-Wechsel (CSS-Animation, 800 ms).
- `failed` → Augen verkleinert auf 14 px Höhe konstant (traurig), Bälle stark entsättigt (`filter: saturate(0.4) brightness(0.7)`), 26 s langsam.
- `busy-blocked` → Augen geschlossen-Strich (`height: 4px`), Card entsättigt, Bälle 22 s.

Diese Variationen ändern **nicht** den Original-Look von idle/hover — sie addieren sich nur in den anderen States.

### Open-State (Toggle → Input-Mode-Buttons)
Genau wie Original: Augen werden ausgeblendet (`opacity: 0`), Card-Innenfläche wächst von 12×12 rem auf 260×160 px (proportional zur `size`-Prop), Inhalt fadet ein.
**Unser Inhalt** sind die 4 Pill-Buttons (Notiz/Link/Datei/Sprache), kein Textarea. Sie werden im Tilt-Container mitgekippt, exakt wie im Original die Chat-Elemente.

## Skalierung an `size`-Prop
Original ist auf 192 px (12 rem) ausgelegt. Alles wird mit Faktor `k = size / 192` skaliert:
- Card: `12rem * k`, Border-radius `3rem * k`.
- Augen: `26px * k` × `52px * k`, gap `2rem * k`.
- Smiley: `60px * k`.
- Bälle: `6rem * k`, blur `30px * k`.
- TranslateZ: `45px * k`.

So bleibt die Komposition identisch, egal welche Größe der Lab-Slider gibt.

## **KEIN** `prefers-reduced-motion`
Bewusst rausgelassen. Der Charakter lebt von Bewegung; das ist Produktentscheidung, nicht Bug.

## Theming-Adapter
Bälle-Farben werden pro State aus `sample.colors` gemappt, aber wir behalten die **Original-Sättigung**: kein Multiplizieren mit niedriger Opacity, sondern volle Hex-Farben aus dem Sample. Falls Preset zu blass ist, sieht man das Problem — gut, dann kann man es im Editor anpassen.

Hintergrund-Pad (`:after` der Quelle) wird im Dark-Theme zu einem subtilen `bg-card/30` Glow hinter der Card (statt Original-Grau `#dedfe0`), damit es im dunklen Layout nicht hart wirkt.

## Datei
- **edit** `src/components/entity/characters/FacePillCharacter.tsx` — vollständiger Rewrite (~280 Zeilen, mit allen Original-Animationen, Pointer-Tilt, Smiley-Hover, State-Variationen).

Keine anderen Dateien.

## Verifikation nach Implementation
Browser auf `/orb-lab`, Charakter „Face Pill" wählen:
1. Maus über die Card → kippt sanft in 3D (Squircle wandert mit dem Cursor mit).
2. Maus drauf halten → Augen werden Smileys, Bälle pausieren.
3. Maus weg → Augen blinzeln (zwei kurze Doppelblinzler im 10-s-Zyklus).
4. Klick → expandiert auf Pill-Form, 4 Input-Buttons sichtbar, Augen weg.
5. State auf `processing` wechseln → Augen halb-zu, Bälle deutlich schneller.
6. State auf `failed` → traurige kleine Augen, entsättigte Bälle.

Erst wenn alle 6 Punkte stimmen, melde ich „fertig".