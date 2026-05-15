# Plan: Design-Drifts 5/1/2/6/7 + anschließender Layout-Audit

## Phase A — Drifts schließen (in dieser Reihenfolge)

### A1 · Drift 5: Sidebar auf `surface-0` + Hairline

- `src/components/sidebar/AppSidebar.tsx`: Hintergrund von `surface-2` → `surface-0`, rechte Hairline `border-r border-[hsl(var(--hair))]`.
- Day: weiße Pageflucht, Sidebar bleibt unsichtbar bis auf 1-px-Linie. Night: bleibt fast identisch.
- Hover-States der Nav-Items auf `surface-2` ziehen (vorher waren sie `surface-3`), damit Kontrast erhalten bleibt.

### A2 · Drift 1: `--accent` Token-Kollision säubern

- Suche nach `var(--accent)` und `var(--accent-soft)` in `src/components/**` (außer shadcn-`ui/*`).
- Treffer (bekannt): `HomePrompt.tsx` (Highlight-Icon), `DialogOverlay.tsx`-Seam mit `--d-blue`/`--d-blue-soft`.
- Alle Cogni-gemeinten Verwendungen → `var(--c-accent)` / `var(--c-accent-soft)`.
- `--d-blue*` Aliase in `index.css` entweder entfernen oder auf `--c-accent` mappen — Entscheidung: mappen (weniger Risiko).

### A3 · Drift 2: `HandlungsbedarfList` semantische Mode-Farben

- `MODE_META` neu auf semantische Tokens:
  - `entscheiden` → `text-[hsl(var(--sig-action))]` + `bg-[hsl(var(--sig-action))]`
  - `klaeren` → `--sig-review`
  - `umsetzen` → `--sig-calm` (Outcome-/Ruhe-Signal)
  - `pruefen` → `--c-accent-soft` Hintergrund + `--c-accent` Text
- `bar`-Klasse analog mit `/70` Alpha über `bg-[hsl(var(--sig-*)/.7)]`.
- Funktioniert in Day + Night, weil Tokens je Theme shiften.

### A4 · Drift 6: `HomePrompt` Action-Button-Schatten

- Die vier runden Action-Buttons: `boxShadow: "var(--shadow-card)"` → `var(--shadow-card-cogni)`.
- Falls `--shadow-card-cogni` noch nicht existiert: in `index.css` ergänzen (weicher, blauer Hauch, prototype-nah).

### A5 · Drift 7: Echte Mini-Entity in Sidebar

- `AppSidebar.tsx`: statisches Gradient-Circle ersetzen durch `<Entity size={40} interactive={false} />` (oder kleinere Variante, falls Entity-Komponente eine `size`-Prop hat — sonst Wrapper mit `transform: scale`).
- Animation/Hotspot bleiben aktiv, aber gedimmt (CSS `opacity: .9` + reduzierte Aurora-Intensität via Prop falls vorhanden, sonst akzeptiert wie geliefert).
- Click-Verhalten: zurück zur Entity-Home-Route.

### Akzeptanzkriterien Phase A

- Day-Mode: Sidebar weiß, Cards weiß-warm, Cogni-Blau in Highlights sichtbar.
- Night-Mode: Sidebar fast schwarz, Cogni-Blau leuchtet.
- Vitest grün, kein Token-Lookup-Fail im Browser.
- Visuelle Verifikation: Screenshots Mobile (390) + Desktop, Day + Night, Home + Project.

---