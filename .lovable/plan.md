## Befund

Es gibt **zwei parallele Theme-Systeme**, die nicht miteinander reden:

1. **shadcn HSL-Tokens** (`--background`, `--card`, `--primary`, `--muted`, `--secondary`, `--input`, `--border`, `--ring`, `--accent` …) — nur in `:root` definiert, **nie** unter `[data-theme="day"]` oder `[data-theme="night"]` überschrieben.
2. **Cogni-Hex-Tokens** (`--surface-0..3`, `--ink`, `--ink-2..4`, `--hair*`, `--sig-*`, `--c-accent*`, `--shadow-card-cogni`) — wechseln korrekt mit `data-theme`.

Konsequenz: Jede Komponente, die shadcn-Tokens nutzt (alle `ui/*` plus alle Composer-/Project-Komponenten mit `bg-secondary`, `bg-muted`, `bg-card`, `bg-background/40` usw.), bleibt **immer dunkel**, egal ob Tag oder Nacht aktiv ist. Genau das ist im Screenshot zu sehen — dunkelgrauer Composer auf cremefarbenem Papier.

Außerdem ein paar harte Farben:
- `bg-white`, `bg-white/5`, `text-white` in `FacePillCharacter`, `ConfirmDestructive`
- `bg-black/80` als Overlay-Tint in shadcn `dialog`, `alert-dialog`, `sheet`, `drawer`

## Plan — Phase 7c · Theme-Vereinigung

### 1. Theme-Brücke in `src/index.css`

Innerhalb von `[data-theme="day"]` und `[data-theme="night"]` **alle shadcn-HSL-Tokens** auf die jeweiligen Cogni-Werte mappen. Damit erbt jede shadcn-Komponente automatisch das aktive Theme — kein Komponenten-Rewrite nötig.

Mapping-Schema (HSL-Tripel aus den Hex-Werten ableiten):

```text
--background          ← surface-0
--foreground          ← ink
--card / --popover    ← surface-1
--card-foreground     ← ink
--muted               ← surface-2
--muted-foreground    ← ink-3
--secondary           ← surface-2
--secondary-foreground← ink-2
--accent              ← surface-3
--accent-foreground   ← ink
--primary             ← c-accent
--primary-foreground  ← surface-1 (day) / surface-0 (night)
--border / --input    ← hair-2
--ring                ← c-accent
--destructive         ← sig-conflict
--sidebar-*           ← surface-1 / ink-2 / hair / c-accent
```

Day und Night bekommen je einen eigenen Block — gleiche Struktur, andere Quellen.

### 2. Overlay-Tints entdunkeln

In `ui/dialog.tsx`, `ui/alert-dialog.tsx`, `ui/sheet.tsx`, `ui/drawer.tsx` `bg-black/80` ersetzen durch `bg-[hsl(var(--surface-0)/0.78)] backdrop-blur-xl` — nutzt damit dieselbe Klasse wie `.dialog-backdrop` und sieht im Tag wie Apfel-Glas aus, in der Nacht wie Linear-Tint.

### 3. Hartcodierte Farben säubern

- `ConfirmDestructive`: `bg-rose-500/80 text-white` → `bg-destructive text-destructive-foreground`.
- `FacePillCharacter`: `bg-white/5` → `bg-[hsl(var(--ink)/0.05)]`; das andere `bg-white` (Mask-Layer) bleibt funktional korrekt (es ist ein SVG-Mask-Hintergrund, kein UI).
- Sonst keine Klassen-Edits — der Mapping-Schritt erledigt 95 % automatisch.

### 4. Verifikation

- `bunx vitest run` — Snapshot-/Token-Tests grün halten.
- Preview Mobile (390 × 701) auf `/index` im Day-Theme: Composer, „Notiz/Link/Datei/Sprache"-Pills, Textarea, „Übernehmen"-Button erscheinen hell auf cremefarbenem Hintergrund.
- AccountDrawer-Toggle Day↔Night: alle Surfaces wechseln mit, kein dunkler Rest-Block.
- Spot-Check: Projekt-Screen (`LageZone`, `ProjectHeaderActions`, `VerlaufFeed`), Auth-Screen, Dialog V2.

### 5. Doku

- `docs/NOW.md` Phase 7c eintragen („Theme-Bridge shadcn↔Cogni").
- `docs/DECISIONS.md` Eintrag: „shadcn-Tokens werden in `[data-theme]` neu zugewiesen statt Komponenten umzuschreiben — ein Single Source of Truth bleibt Cogni-Hex."

## Was NICHT Teil dieser Phase ist

- Keine Layout- oder Funktions-Änderungen.
- Kein neuer Dialog-V3, kein neues Composer-Design — nur Themen-Korrektheit.
- Auth-Screen (`/auth`) bleibt unverändert, sofern Mapping ihn nicht visuell bricht; Korrektur dann in 7d.

## Offene Frage

Eine bewusste Vereinfachung: Soll der **Auth-Screen** ebenfalls dem Day/Night-Toggle folgen, oder bleibt er fest auf Day (wie eine Marketing-Landing)? Default-Vorschlag: **fest auf Day**, weil unauthentifizierte Nutzer noch keine Theme-Präferenz gewählt haben.
