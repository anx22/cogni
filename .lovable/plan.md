## Ziel

1. **Generischer App-Settings-Store in der DB** — nicht nur Orb-Presets, sondern ein Fundament für alle App-weiten Konfig-/Preset-Werte (jetzt und später).
2. **Punktraster aus dem Orb extrahieren** und als eigene Schicht **hinter** dem Orb rendern — etwas größer als der Orb, wie eine abstrakte digitale Fläche, auf der der Orb sitzt.
3. **Lab steuert wirklich alles**, was Orb + neue Punktfläche visuell hergeben.

---

## Teil A — Generischer Settings-Store

### Tabelle `app_settings`

Eine flache Key-Value-Tabelle mit JSON-Payload und einem groben Namespace. Reicht für Orb-Presets heute und für alles kommende (z.B. `voice.thresholds`, `intake.defaults`, `theme.tokens`) ohne weiteres Schema-Wachstum.

```text
app_settings
  namespace   text         -- z.B. 'orb', 'voice', 'theme'
  key         text         -- z.B. 'preset.idle', 'preset.hover', 'thresholds'
  value       jsonb        -- frei definiertes Payload
  scope       text         -- 'global' | 'user'  (für später)
  user_id     uuid null    -- nur gefüllt wenn scope='user'
  updated_by  uuid         -- letzter Editor
  updated_at  timestamptz default now()
  PRIMARY KEY (namespace, key, scope, coalesce(user_id, '00000000-…'))
```

Index: `(namespace, scope)` für schnelles Bulk-Laden eines ganzen Namespaces.

Realtime auf `app_settings` an → Lab-Edits propagieren live in offene Tabs.

### RLS

- **scope='global'**: jeder eingeloggte User darf SELECT/INSERT/UPDATE. Kein DELETE (Reset = Upsert mit Default).
- **scope='user'**: nur eigener User (`auth.uid() = user_id`) darf alles.

(Heute nutzen wir nur `global` für Orb-Presets. `user` ist vorgesehen, aber unbenutzt.)

### Helper-Layer im Frontend

Neuer kleiner Modul-Block:
```
src/lib/settings/
  types.ts        -- generische Typen: Setting<T>, Scope
  useSetting.ts   -- useSetting<T>(namespace, key, defaultValue) → [value, setValue]
  useNamespace.ts -- useNamespace<T>(namespace) → Record<key, T>, lädt + Realtime
```

- `useSetting` = generischer Hook mit Realtime-Subscription, debounced upsert (300 ms).
- Nichts orb-spezifisch. Orb ist nur erster Konsument.

### Orb-Anbindung

`src/components/entity/orbPresets.ts`
- `ORB_PRESETS_DEFAULT` bleibt als Seed im Code.
- Neuer Hook `useOrbPresets()` baut auf `useNamespace('orb')` auf, mappt `preset.<state>` → `OrbPresetRange`, mergt über Defaults.
- localStorage-Code raus. Proxy-Konstruktion raus.

`Entity.tsx` und `OrbLab.tsx`:
- `Entity` liest Presets per `useOrbPresets()`.
- `OrbLab` ruft `setSetting('orb', 'preset.<state>', range)` bei jedem Slider-Change.
- Snippet-Box raus, dezenter "Saved · vor 3s"-Indikator rein.

---

## Teil B — Punktraster aus dem Orb extrahieren

### Status quo (woher das Raster heute kommt)

In `SiriOrb.tsx` ist das `::after`-Pseudo-Element das Punktraster:
```css
background-image: radial-gradient(circle at center, var(--bg) var(--dot-size), transparent var(--dot-size));
background-size: calc(var(--dot-size) * 2) calc(var(--dot-size) * 2);
mask-image: radial-gradient(black var(--mask-radius), transparent 75%);
mix-blend-mode: overlay;
```
Das gibt dem Orb seine innere Körnung. Du willst das nicht im Orb, sondern als **Fläche dahinter**.

### Neue Architektur

Das Raster wird **eigene Komponente** und sitzt im `Entity`-Wrapper hinter dem Orb:

```
src/components/entity/
  EntitySurface.tsx   ← neuer Punktraster-Hintergrund
  SiriOrb.tsx         ← bleibt, aber ::after-Punktraster RAUS
  Entity.tsx          ← rendert <EntitySurface/> + <SiriOrb/> übereinander
```

`EntitySurface.tsx`:
- Quadratisches/rundes Element, Größe = `orbSize * surfaceScale` (z.B. 1.6×).
- Position: `absolute`, zentriert hinter dem Orb (`Entity` wird zu `relative`-Container).
- Punktraster identisch zur bisherigen `::after`-Logik:
  ```css
  background-image: radial-gradient(circle, var(--surface-dot-color) var(--dot-size), transparent var(--dot-size));
  background-size: calc(var(--dot-size) * 2) calc(var(--dot-size) * 2);
  ```
- **Maske invers** zur bisherigen — der Orb verdeckt die Mitte, also blenden wir die Mitte des Rasters etwas aus, damit es nicht hinter dem Orb hervorblitzt:
  ```css
  mask-image: radial-gradient(circle, transparent 0%, transparent 30%, black 55%, transparent 100%);
  ```
  Effekt: Ring aus Punkten **um** den Orb, weicher Innen- und Außenrand. Wie eine digitale Standfläche.
- Optional `mix-blend-mode: screen` oder `overlay` gegen den App-Hintergrund — wird Lab-steuerbar.

`SiriOrb.tsx`:
- Das `::after`-Element entfällt **nicht komplett**, denn es bringt aktuell auch Glow + Halbton in den Orb selbst. Sauberster Schnitt: das Punktraster aus `::after` raus, `::after` behält nur einen weichen Inneren Glow (oder fällt weg, falls überflüssig). Entscheidung beim Bauen je nach Optik — wenn der Orb ohne `::after` bereits gut aussieht, fliegt es raus.
- `dotSize`, `maskRadius` werden aus `SiriOrbProps` entfernt (sie gehören jetzt zu `EntitySurface`).

### Neue Props auf `EntitySurface`

Alle über das Lab steuerbar (mit Range):

| Prop | Wirkung |
|---|---|
| `surfaceScale` | Größe relativ zum Orb (1.2–2.5) |
| `dotSize` | Punktdurchmesser in px |
| `dotSpacing` | Tile-Größe relativ zu `dotSize` (heute fix `*2`) |
| `dotColor` | Farbe der Punkte (OKLCH range) |
| `innerHole` | Wie weit die Mitte ausgespart wird (% des Surface-Radius) |
| `outerFade` | Wo die Punkte nach außen verblassen (% des Surface-Radius) |
| `blendMode` | `normal` / `screen` / `overlay` / `soft-light` |
| `opacity` | Gesamtdeckkraft 0–1 |
| `rotationDuration` | Optionale ganz langsame Rotation der Fläche (oder `none`) für „lebendige Tiefe" |

### Datenmodell-Erweiterung für Orb-Presets

`OrbPresetRange` bekommt optional einen `surface`-Block (pro State unterschiedlich, z.B. failed = Fläche dunkler/dichter):
```ts
interface OrbPresetRange {
  // bisher
  bg, c1, c2, c3, duration

  surface?: {
    scale:       Range
    dotSize:     Range
    dotSpacing:  Range
    dotColor:    ColorRange
    innerHole:   Range   // %
    outerFade:   Range   // %
    opacity:     Range
    blendMode:   'normal' | 'screen' | 'overlay' | 'soft-light'
  }
}
```
Default: jeder State erbt eine ruhige Surface-Konfiguration; Lab erlaubt pro State Override.

### Lab-Erweiterung

`OrbLab.tsx` bekommt einen zweiten Block **„Surface"** mit allen Surface-Slidern. Live-Vorschau zeigt Orb + Surface zusammen, sodass die räumliche Wirkung beurteilbar ist.

---

## Teil C — Audit der Steuerbarkeit

Heute steuert das Lab: `bg/c1/c2/c3` (alle als L/C/H-Range) + `duration`. Das deckt alle offiziellen `SiriOrb`-Props ab. Mit der Umbau-Runde:

| Bereich | War im Lab? | Nach Umbau |
|---|---|---|
| Orb-Farben (bg, c1–c3) | ja | ja |
| Orb-Animation-Duration | ja | ja |
| Orb interne Blur/Contrast/Shadow | nein (size-derived) | bleibt size-derived (gehört zur Komponentensignatur, nicht zum Preset) |
| Punktraster / Surface | nein | **ja, vollständig** (Teil B) |

Damit fehlt nichts mehr, was die sichtbare Wirkung des Orbs ausmacht.

---

## Reihenfolge der Umsetzung

1. Migration `app_settings` + RLS + Realtime aktivieren.
2. `src/lib/settings/` Helpers (`useSetting`, `useNamespace`).
3. `EntitySurface.tsx` neu, Punktraster-Logik aus `SiriOrb::after` herausziehen.
4. `Entity.tsx` umstellen: `relative`-Container, Surface hinter Orb.
5. `orbPresets.ts` um `surface`-Block + `useOrbPresets()` erweitern, localStorage-Code raus.
6. `OrbLab.tsx`: zweiter Block „Surface", Snippet-Box durch Saved-Indikator ersetzen, Persistenz über `useSetting`.

---

## Antwort zur Punktraster-Frage (kurz, falls nicht oben gelesen)

Das Punktraster kommt aktuell aus `SiriOrb`s `::after`: ein einzelner radialer Gradient (`var(--bg)` als Punkt, transparent außenrum) wird in einem `dot-size * 2`-Quadrat gekachelt — das ergibt das gleichmäßige Halbton-Punktraster. Eine zusätzliche `mask-image` blendet die Mitte aus, damit das Raster nur im Außenbereich des Orbs sichtbar wird. `mix-blend-mode: overlay` mischt es in die Farbschlieren des `::before`-Gradients. Genau diese Mechanik ziehen wir in `EntitySurface` und drehen die Maske um, sodass das Raster **um** den Orb sitzt statt **in** ihm.
