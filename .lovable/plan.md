## Befund (visuell verifiziert)

Im Screenshot von `/orb-lab` sieht man zwei klare Defekte am Punktraster:

1. **Form ist oval** — das Punktfeld ist sichtbar höher als breit.
   Ursache: `EntitySurface` wird in `<div class="absolute inset-0 flex items-center justify-center">` gerendert und hat eine Pixel-Breite (z. B. 480 px), aber der Flex-Container ist nur 320 px breit. Mit Default `flex-shrink: 1` wird die Breite auf 320 px geschrumpft, während die Höhe (Cross-Axis) auf 480 px bleibt → Rechteck/Oval.

2. **Dots liegen auf dem Orb** — am oberen Rand sieht man die Punktstruktur über der türkisen Orb-Fläche.
   Ursache: Die Maske `radial-gradient(circle, transparent 0%, transparent 30%, black …)` benutzt Default-Endform `farthest-corner`. 30 % davon ergeben für ein 480 px Surface ca. 102 px Radius — der Orb hat aber 160 px Radius. Der Punktring (Radien 102–264) überlappt also einen Großteil des Orbs. Da der Orb intern `transparent`-Stops in seinen conic-gradients hat, scheinen die Dots durch.

## Fix-Plan

### 1. `EntitySurface.tsx` — echte quadratische Form, mathematisch korrekte Maske

- Eigene absolute Positionierung statt im Flex-Wrapper hängen lassen:
  `position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);`
  Damit gibt es keine Flex-Shrink-Klemme mehr, das Element bleibt quadratisch.
- Maske auf `radial-gradient(circle closest-side, …)` umstellen, damit `100%` exakt der Surface-Radius ist (intuitiv).
- Inner-Hole automatisch so groß rechnen, dass er den Orb mindestens abdeckt:
  `holeRatio = (orbRadius / surfaceRadius) + clearance`
  also `100 / scale + clearance` in Prozent. So sitzt der Orb immer sauber im Loch, egal welche Scale gerollt wurde.
- Outer-Fade analog automatisch ans Surface-Ende relativ zum Orb hängen.

### 2. Semantik der Surface-Slider angleichen

Die Range-Felder `innerHole` und `outerFade` werden umgedeutet von „% des Surfaces" zu **„extra Clearance jenseits des Orb-Rands, in % des Surface-Radius"**:

- `innerHole`: 0 = Punktring beginnt direkt am Orb-Rand. 5–15 = etwas Luft.
- `outerFade`: wie weit über den Orb hinaus die Punkte ausfaden (z. B. 35–55 %).

Defaults entsprechend anpassen, sodass beim ersten Render eine ruhige, deutliche Punktscheibe **um** den Orb sitzt (kein Überlappen, kleiner heller Ring).

OrbLab-Labels: „Inner clearance %" und „Outer fade %".

### 3. `Entity.tsx` aufräumen

- Inneren Flex-Wrapper um `<EntitySurface/>` entfernen, da Surface sich jetzt selbst zentriert.
- Reihenfolge bleibt: Surface zuerst (hinten), Orb-Button danach (vorn).

### 4. Visuelle Verifikation

Nach den Edits per Browser-Screenshot in `/orb-lab` prüfen:
- Bei Default-Idle: Punktring exakt um den Orb, kein Dot auf der Orb-Fläche.
- Form quadratisch / kreisrund, nicht oval (gleiche Breite wie Höhe messen).
- Re-Roll mehrfach + State-Wechsel (idle → processing → failed): Loch bleibt immer korrekt am Orb-Rand.
- Auch bei kleiner Size (z. B. 160 px) und großer Size (z. B. 460 px) prüfen.

Falls noch Artefakte sichtbar sind, iterativ nachjustieren bis sauber.
