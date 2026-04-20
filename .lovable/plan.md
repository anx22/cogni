

## Phase 7.7 — Home als geführter Intake-Hub

Drei zusammenhängende UX-Verbesserungen, zusätzlich zu Phase 7.6.1, damit der Home-Screen Intake-Sessions als persistente, wiederaufrufbare Einheiten behandelt — nicht als lose Files.

---

### 1. Rechtes Home-Panel: von Files zu Intake-Sessions

**Heute:** `RecentAssets` zeigt einzelne Files als Kacheln. Multi-Drops wirken wie unverbundene Einzelteile, abgebrochene Sessions sind unsichtbar, ein Klick auf ein File öffnet nur einen Toast.

**Neu:** Das Panel rechts wird zu **„Intake-Sessions"**. Jede Kachel = eine `dialog_session`, gruppiert die Assets, die zusammen verarbeitet wurden, und ist klickbar.

Visuelles Modell pro Kachel:
- Großes Icon mit der Anzahl der Assets in der Session (z.B. „1", „3").
- Status-Punkt:
  - **amber/pulsierend** → Session läuft noch (Assets parsen/verstehen, oder Status `open` mit unentschiedenen Boxen).
  - **blau** → `open`/`in_progress`, Boxen warten auf Entscheidung.
  - **grün** → `closed`/alle Boxen entschieden → Read-Only.
  - **grau** → leer/abgebrochen.
- Hover: Tooltip mit erstem Asset-Namen + „N Sachen, M offen".

Quelle:
- `dialog_sessions` (für offene/geschlossene Sessions) **+** „Sessions in Entstehung": Assets ohne `session_id`, die gerade parsen/verstehen — als virtuelle Pending-Kachel pro Asset-Bündel (gruppiert nach engem Zeitfenster, z.B. innerhalb von 5s).
- Limit: letzte 20 Sessions, gemischt mit pending Bündeln.
- Realtime: Subscription auf `dialog_sessions` und `assets` (für Pending-Bündel).

Klick-Verhalten:
- **Pending-Bündel** (noch keine Session) → kein Klick möglich, nur visueller Status.
- **Offene Session** → `openSessionFromDB(id)`, Overlay öffnet sich im **Edit-Modus** (heutiges Verhalten).
- **Geschlossene Session** → `openSessionFromDB(id)`, Overlay öffnet sich im **Read-Only-Modus** (siehe Punkt 2).

### 2. Read-Only-Modus für abgeschlossene Sessions

**Wozu:** Der Nutzer soll vergangene Verstehens-Läufe nachvollziehen können — was vorgeschlagen, was bestätigt, was verworfen wurde — ohne etwas versehentlich zu ändern.

**Wie:**
- `DialogSession` bekommt Feld `mode: "edit" | "readonly"`, abgeleitet aus `dialog_sessions.status`:
  - `closed`, `committed`, oder „alle Boxen final" → `readonly`.
  - sonst → `edit`.
- `DialogProvider.openSessionFromDB` setzt den Modus beim Laden.
- `BoxFrame` blendet im Read-Only-Modus den Aktions-Footer komplett aus.
- Boxen zeigen ihren Endzustand:
  - bestätigt: Opacity 60% + ✓.
  - verworfen: Opacity 40% + durchgestrichener Titel.
  - geändert: Amber-Punkt + finale Userwerte sichtbar.
- Header bekommt einen leisen Hinweis: „Abgeschlossen am …" rechts neben dem Titel-Eyebrow.
- ESC oder X schließt wie gewohnt — keine commit-fact-Calls möglich.

Datenmodell:
- Keine Schema-Änderung nötig. `dialog_sessions.status` reicht: wir behandeln `closed` und Sessions, in denen `resolved_boxes >= total_boxes`, als read-only.
- Optional: `closeDialogSession` Edge-Hilfsfunktion oder einfacher Update-Call, der `status='closed'` setzt, sobald die letzte Box im Overlay entschieden wurde. Realtime-Update sorgt dafür, dass das Panel rechts grün wird.

### 3. Fullscreen-Drop-Mechanik auf dem Home-Screen

**Heute:** Drops landen nur, wenn man genau auf dem `EntityCore` (kleiner Kreis) loslässt. Außerhalb verschluckt der Browser die Datei und öffnet sie als Tab.

**Neu:** Wie auf `ProjectScreen`:
- `Index.tsx` bekommt einen vollflächigen `onDragOver/Leave/Drop` Handler.
- Während eines aktiven Drags (mit `Files`) erscheint ein **Fullscreen-Overlay** mit großem leichtem Text:
  - Idle: „Lass los — ich höre zu." + Untertitel „Datei, Link oder Notiz."
  - Busy (`processing`/`review-ready`): „Noch beschäftigt." + „Warte kurz, dann gerne." — Drop wird abgewiesen (kein Intake-Call), Voice-Hinweis spielt kurz ab.
- Overlay nutzt `bg-background/70 backdrop-blur-md`, dasselbe „schwebende" Design wie der Dialog.
- `EntityCore` behält seine eigene Drop-Zone als visuellen Anker (zentriert, Glow), aber der gesamte Viewport nimmt jetzt Drops an.
- `SideGrid` und `RecentAssets` sind während des Drags via `pointer-events-none opacity-30` ruhiggestellt (heute schon halb implementiert über `isDragActive`).

Counter-Verhalten:
- DragEnter/Leave-Counter (Browser-typisches Problem mit verschachtelten Kindern) sauber lösen via Counter-Increment statt boolean — verhindert, dass das Overlay flackert, wenn man über ein Kind-Element zieht.

---

### Betroffene Dateien

**Neu:**
- `src/components/entity/IntakeSessionsPanel.tsx` — ersetzt `RecentAssets` rechts; lädt Sessions + Pending-Asset-Bündel, rendert Kacheln, öffnet Session via `openSessionFromDB`.
- `src/components/entity/HomeDropOverlay.tsx` — Fullscreen-Drop-Layer mit busy/idle-Texten.
- `src/lib/dialog/sessionMode.ts` — kleine Helper-Funktion `deriveSessionMode(session, cases)`.

**Geändert:**
- `src/pages/Index.tsx` — Fullscreen-Drop-Handler + DropOverlay einhängen; rechts `IntakeSessionsPanel` statt `RecentAssets`; Drop-Guard greift auch hier.
- `src/lib/dialog/types.ts` — `DialogSession` erhält `mode: "edit" | "readonly"` und optional `closedAt`.
- `src/lib/dialog/loadSession.ts` — Modus aus `status` + `resolved_boxes/total_boxes` ableiten; `closedAt` mitgeben.
- `src/components/dialog/DialogProvider.tsx` — Modus durch Context, `commitBox` no-op im Read-Only.
- `src/components/dialog/DialogOverlay.tsx` — „Abgeschlossen am …" wenn read-only; ESC/Close arbeiten gleich.
- `src/components/dialog/BoxFrame.tsx` — Aktionen unterdrücken wenn `session.mode === "readonly"`; visuelle End-Zustände konsistent.
- `src/components/entity/RecentAssets.tsx` — bleibt vorerst als Komponente bestehen, wird aber im Home nicht mehr eingebunden (Aufräumen optional in späterer Phase).

**Edge / DB:**
- Keine Schema-Migration zwingend nötig.
- Optional: kleine SQL-Migration, die `dialog_sessions.status` auf `'closed'` setzt, sobald `resolved_boxes >= total_boxes` (per Trigger). **Bewusst draußen** in diesem Schnitt — wir leiten den Modus zunächst clientseitig ab, das reicht für die UX.

### Akzeptanzkriterien

- Rechtes Home-Panel zeigt Intake-Sessions, nicht mehr einzelne Files.
- Multi-Drops erscheinen als **eine** Kachel.
- Tab-Reload während laufendem Intake → die Session ist weiter sichtbar und kann fortgesetzt werden.
- Klick auf eine geschlossene Session öffnet das Overlay **nur lesend** — keine Buttons, keine Commits.
- Klick auf eine offene Session öffnet das Overlay normal.
- Drop irgendwo auf dem Home-Screen funktioniert; Drop während Verarbeitung wird sichtbar abgewiesen.
- Pending-Bündel (Assets ohne Session) zeigen amber-pulsierenden Status, schalten automatisch auf die echte Session um, sobald `dialog_session` entsteht.

### Bewusst nicht in diesem Schnitt

- Löschen / Archivieren von Sessions.
- Multi-Session-Verlaufsansicht („alle Sessions zu Projekt X").
- Echte Trigger-basierte Auto-Close-Logik in der DB.
- Reorder/Pinning von Session-Kacheln.

