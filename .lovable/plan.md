

## Phase 7.7.2 — Inline statt Overlay, persistente Session-Liste, ehrliche Stimme

Vier eigenständige Korrekturen. Keine neuen Konzepte, nur Aufräumen dort, wo der Bildschirm noch fälschlich blockiert oder Texte hängen bleiben.

---

### 1. Stimme räumt sich nach Intake-Ende selbst ab

**Bug:** Nach Auto-Close des Dialogs steht der „Bereit. N Sachen für dich"-Satz (oder die Agent-Reason) ewig unter dem Kern, weil nichts ihn löscht.

**Fix in `useEntityVoice.ts`:**
- Neuen Trigger einbauen: `dialog_sessions UPDATE` mit `status='completed'` oder `'cancelled'` → `enqueue({ text: null, tone: 'calm' })`.
- Zusätzlich: nach jedem `ready`-Satz einen impliziten Auto-Clear nach 8 s, falls **kein** weiterer Event kommt (Fallback bei verlorener Session-Update-Subscription).
- `EntityVoice.tsx` rendert bei `text === null` schon `null` — keine Änderung nötig.

### 2. Rechtes Panel: gleiches Vokabular wie linkes Projekte-Panel, aber **eine** Spalte mit Inline-Scroll

**Heute:** Grid 4×5, kleine quadratische Kacheln mit Layers-Icon, separates Vokabular.

**Neu — `IntakeSessionsPanel.tsx` wird auf das `ProjectTile`-Format umgebaut:**

- **Layout:** 1 Spalte, feste Tile-Breite (140 px wie `ProjectTile`), Höhe 72 px. Container ist eine `ScrollArea` mit `max-h: ~480px` (etwa 6 sichtbare Tiles), darüber/darunter dezenter Fade.
- **Tile-Anatomie** (parallel zu `ProjectTile`):
  - Links: kleines Icon-Chip 28 px (statt Initial-Buchstabe). Icon richtet sich nach **Intake-Typ** des ersten Assets:
    - `note` → `StickyNote`
    - `url` → `Link`
    - `image` → `Image`
    - `audio` → `Mic`
    - `email/eml` → `Mail`
    - `pdf/doc/docx` → `FileText`
    - `pptx` → `Presentation`
    - sonst → `File`
  - Multi-Drop: das Icon wird durch die **Anzahl** ersetzt (z. B. „3"), wie heute schon — bleibt.
  - Mitte: Titel + Meta-Zeile (12/10 px) — Titel = `firstName` gekürzt, Meta = relative Zeit + „N offen" oder „abgeschlossen".
  - Rechts oben: 1–2 Status-Punkte exakt nach `ProjectTile`-Logik:
    - `pending` → amber, pulsierend
    - `open` → primary/blau
    - `closed` → emerald
    - `empty` → grau
- **Klick-Verhalten** unverändert (pending = no-op, open = edit, closed = readonly).
- **Pagination-Dots** entfallen, weil Inline-Scroll. Label „Intake" bleibt unter dem Container (klein, uppercase, wie heute).
- **Container-Styling:** identisch zu `SideGrid` (rounded-3xl, Punktraster-Background, `bg-surface-1/0.3`, Padding 7) — nur Inhalt = vertikale Liste.

### 3. Drop-Overlay: kein Blocker mehr, nur ein schwebender Hinweis

**Bug:** `HomeDropOverlay` hat `bg-background/60 backdrop-blur-sm` über `inset-0` — das verdunkelt und verschleiert die ganze Oberfläche, auch wenn `pointer-events-none` gesetzt ist.

**Fix:**
- `HomeDropOverlay` komplett **ohne Hintergrund, ohne Blur, ohne Vollflächen-Container**. Stattdessen:
  - Ein einzelner schwebender Hinweistext oben mittig (z. B. fixed `top-12 left-1/2 -translate-x-1/2`), groß und leicht (`text-3xl font-light`), mit weichem Text-Shadow gegen den Background.
  - Bei `idle`: „Lass los — ich höre zu." (eine Zeile, optional Subline klein darunter).
  - Bei `busy`-Drop-Versuch: „Noch beschäftigt — gleich wieder."
  - `pointer-events-none` bleibt, damit nichts geklickt wird.
- Kein `inset-0`, kein `bg-*`, kein `backdrop-blur-*`. Der Rest des Screens (SideGrid links, Sessions rechts, Kern, Top-Buttons) bleibt **vollständig sichtbar und unverändert**.
- `EntityCore` darf während `dragActive` zusätzlich seinen vorhandenen Glow verstärken (das macht es heute schon via `state==='hover'`-Pfad). Keine weitere Maskierung.
- `SideGrid`/`IntakeSessionsPanel` verlieren das `opacity-30 pointer-events-none`-Styling beim Drag — sie sollen **nicht** mehr ausgeblendet werden. Das `isDragActive`-Prop bleibt im Interface, wird aber zur No-Op (rückwärtskompatibel).

### 4. Manuelles Input-UI inline statt Fullscreen-Overlay

**Heute:** Klick auf den Kern → `InputOverlay` mit `fixed inset-0 bg-background/70 backdrop-blur-2xl` legt sich über alles.

**Neu — Inline-Composer direkt im Home-Screen:**

- `InputOverlay` wird zu **`InlineComposer`** (Datei umbenannt oder neue Komponente, alte behalten als ungenutzt/entfernen am Ende).
- Position: **unter** dem Kern, da wo heute die kleine Hint-Zeile „Klick auf den Kern oder lege etwas hier ab" steht. Diese Hint-Zeile entfällt, sobald Composer offen.
- Keine `fixed`-Positionierung, kein Backdrop, keine Maskierung. Der Composer ist Teil des normalen Layouts und wird via `animate-float-in` eingeblendet.
- Optisches Format passt zum Screen:
  - `max-w-xl`, zentriert.
  - Container: `rounded-2xl bg-surface-1/30 backdrop-blur-sm border border-border/20 p-5`.
  - Pills (`InputPills`) oben.
  - Eingabefeld (Note/Link/File) darunter, kompakt (`min-h-[140px]` für Note, `h-12` für Link).
  - Footer: linker Hinweis-Text + rechter „Übernehmen"-Button.
  - X-Schließen-Button oben rechts im Container, **nicht** mehr screenfüllend.
- Klick außerhalb des Composers schließt ihn **nicht** (kein Overlay-Pattern); nur ESC oder X schließen.
- `SideGrid` und `IntakeSessionsPanel` bleiben sichtbar und **bedienbar**, während der Composer offen ist — der Nutzer kann während des Tippens parallel ein Projekt öffnen oder eine alte Session ansehen.
- Submit-Verhalten unverändert (`onSubmit(payload)` → `intake()` → schließt Composer).

### Zusammenspiel mit dem zentrierten Layout

`Index.tsx` ist heute via Flex zentriert. Der Composer würde unter dem Kern den Kern verschieben. Lösung:
- Composer rendert in einem **eigenen absolut positionierten Container** unter dem Kern (`absolute top-[58%] left-1/2 -translate-x-1/2`, ähnlich wie heute `EntityVoice`/Hinweis).
- Der Kern bleibt seine zentrale Verankerung; der Composer schwebt darunter und überlagert nichts außer der ursprünglichen Hint-Zeile.

---

### Betroffene Dateien

**Geändert:**
- `src/lib/voice/useEntityVoice.ts` — Auto-Clear bei `dialog_sessions UPDATE status=completed/cancelled` + 8 s-Fallback nach `ready`-Satz
- `src/components/entity/IntakeSessionsPanel.tsx` — Layout auf 1-Spalten-Liste mit `ScrollArea`, Tile-Anatomie wie `ProjectTile`, Typ-Icon-Mapping
- `src/components/entity/HomeDropOverlay.tsx` — Hintergrund/Blur/inset-0 raus, nur schwebender Text oben
- `src/components/entity/InputOverlay.tsx` → wird zu `InlineComposer.tsx` (oder umgebaut): keine `fixed`-Position, kein Backdrop, keine Außenklick-Schließen
- `src/pages/Index.tsx` — Composer absolut positioniert unter dem Kern, `isDragActive`-Maskierung von SideGrid/Sessions raus, Hint-Text bei offenem Composer ausblenden
- `src/components/entity/SideGrid.tsx` — `isDragActive`-Opacity-Block entfernen (Prop bleibt für Rückwärtskompatibilität, ohne Effekt)

**Nicht angefasst:**
- `EntityCore`, `EntityVoice` (Stimme bleibt visuell wie sie ist, wird nur korrekt geräumt)
- DialogProvider/Overlay/Boxen
- Edge-Functions

### Akzeptanzkriterien

- Nach Abschluss eines Intakes verschwindet der Hinweistext unter dem Kern selbständig.
- Rechts: vertikale Session-Liste mit `ProjectTile`-Look, eigene Icons je Intake-Typ, inline scrollbar.
- Drop irgendwo auf dem Screen funktioniert; während des Drags erscheint **nur** ein schwebender Text — der Rest des Screens bleibt vollständig sichtbar und unverdunkelt.
- Klick auf den Kern öffnet einen Inline-Composer unter dem Kern; SideGrid und Sessions bleiben sichtbar und klickbar.
- Während Verarbeitung (`busy`) ist nichts geblockt; nur ein neuer Drop wird abgewiesen.

### Bewusst draußen

- Composer-Animationen über mehr als ein Fade-In.
- Persistenz von Composer-Entwürfen über Reload.
- Filter/Suche in der Session-Liste.

