## Block B3 + Block C — Projekt anlegen & UX-Sweep

### B3: Projekt anlegen vom Side-Grid

Aktuell kann ein Projekt nur implizit über die ZuordnungsBox im Verstehens-Loop entstehen. Es fehlt ein direkter Weg vom Side-Grid aus.

**Änderungen:**

1. **SideGrid.tsx** — den bestehenden „Erstes Projekt anlegen"-Button (Zeile 99–114, wird nur bei `isEmpty` gezeigt) um einen generellen „+ Neues Projekt"-Button erweitern, der als letzte Kachel im Grid erscheint, wenn Platz vorhanden ist (weniger als `PAGE_SIZE` Items auf der aktuellen Seite). sowie über dezenten text link, links aligned in der paginierungs zeile
2. **Index.tsx** — neuer Callback `handleCreateProject`:
  - Ruft `supabase.from("projects").insert({ user_id, name: "Neues Projekt" }).select("id").single()` auf.
  - Navigiert sofort zu `/projekt/${id}`.
  - Wird als `onCreateProject` an SideGrid übergeben.
3. **ProjectScreen.tsx** — beim `empty`-Status den Projektnamen inline editierbar machen (einfaches `contentEditable` oder `input`-Feld), damit der User den Auto-Namen „Neues Projekt" sofort umbenennen kann. Speichert per `onBlur` via `supabase.from("projects").update({ name }).eq("id", projectId)`.

---

### C1: Voice-Aufnahme echt machen

Die Pill „Sprache" ist aktuell disabled mit Platzhalter-Text. Wird zu einer echten `MediaRecorder`-Aufnahme.

**Neue Datei: `src/lib/voice/useVoiceRecorder.ts**`

- Hook mit States: `idle | recording | transcribing | done | error`.
- `start()`: `navigator.mediaDevices.getUserMedia({ audio: true })`, `MediaRecorder` mit `audio/webm`.
- `stop()`: Stoppt Recorder, sammelt Blob aus Chunks.
- `transcribe(blob)`: Ruft eine neue Edge Function `voice-transcribe` auf, die den Audio-Blob an Lovable AI (Whisper-kompatibles Modell) sendet und den Text zurückgibt.
- Gibt `{ status, transcript, start, stop, cancel }` zurück.

**Neue Edge Function: `supabase/functions/voice-transcribe/index.ts**`

- Nimmt `multipart/form-data` mit dem Audio-Blob entgegen.
- Sendet an Lovable AI Gateway (Whisper/STT-Modell) zur Transkription.
- Gibt `{ text: string }` zurück.
- Hinweis: Prüfen ob Lovable AI ein STT-Modell unterstützt. Falls nicht, wird die Transkription über ein Text-LLM simuliert (Audio-Base64 an Gemini Flash, der Audio-Input versteht) oder die Voice-Pill bleibt als „coming soon" mit einem klaren Hinweis.

**InputOverlay.tsx** — Voice-Modus (Zeile 216–220):

- Ersetzt Platzhalter durch: Aufnahme-Button (Mikrofon-Icon, pulsierend wenn aktiv), Stopp-Button, Wellenform-Visualisierung (optional, einfacher Puls reicht), Transkript-Preview nach Stopp, „Übernehmen"-Button der den transkribierten Text als Notiz-Asset via `onSubmit` weitergibt.

**InputPills.tsx** — `disabled: true` bei Voice entfernen (Zeile 15).

---

### C2: Retry-Button im Session-Panel

Der Retry-Pfad existiert bereits in `EntityVoice` + `Index.tsx` (`handleRetry`), aber nur für den aktuell sprechenden Fehler. Im IntakeSessionsPanel fehlt er.

**IntakeSessionsPanel.tsx:**

- Assets mit `understanding_status` in `['failed', 'rate_limited', 'payment_required']` die keine Session haben, als eigene Tiles mit Status `"failed"` anzeigen (neuer TileStatus).
- Badge: `"fehlgeschlagen"` mit `bg-destructive/15 text-destructive ring-destructive/30`.
- Klick auf eine failed-Tile: `supabase.functions.invoke("intake-understand", { body: { asset_id, retry: true } })` + Toast „Wird nochmal versucht".
- Bestehende `pending`-Logik filtert diese raus, damit kein Duplikat entsteht.

---

### C3: Asset-Detail Inline-Card

Klick auf einen abgeschlossenen Session-Eintrag öffnet bereits den Dialog. Was fehlt: ein Quick-Preview ohne den ganzen Dialog.

**Änderung in IntakeSessionsPanel.tsx:**

- Long-Press oder Hover auf eine Tile zeigt einen Popover/Tooltip mit:
  - Originalname (`file_name`)
  - Typ + Größe
  - Erstelldatum
  - Link zum Dialog (bestehender Klick-Handler)
  - Projekt-Zuordnung (aus `assets.project_id` → Projektname)
- Implementierung: `HoverCard` aus shadcn/ui (bereits installiert).
- Daten: Die `Asset`-Daten sind bereits geladen (`assets`-State). Projektname per Lookup aus `useProjects` oder einem kleinen Map aus den geladenen Projekte.

---

### Dokumentation

- `docs/implementierung-aktuell.md` — B2 als erledigt markieren (Routing ist implementiert), B3 als erledigt, Block C als erledigt.
- `docs/geplant.md` — Phase 8 und Phase 9 als ✓ markieren.

---

### Betroffene Dateien


| Datei                                           | Aktion                           |
| ----------------------------------------------- | -------------------------------- |
| `src/components/entity/SideGrid.tsx`            | + Neues-Projekt-Kachel           |
| `src/pages/Index.tsx`                           | + `handleCreateProject`          |
| `src/components/project/ProjectScreen.tsx`      | Inline-Name-Edit bei empty       |
| `src/lib/voice/useVoiceRecorder.ts`             | Neu                              |
| `supabase/functions/voice-transcribe/index.ts`  | Neu (falls STT verfügbar)        |
| `src/components/entity/InputOverlay.tsx`        | Voice-Modus echt                 |
| `src/components/entity/InputPills.tsx`          | Voice enabled                    |
| `src/components/entity/IntakeSessionsPanel.tsx` | Failed-Tiles + Retry + HoverCard |
| `docs/implementierung-aktuell.md`               | Status-Update                    |
| `docs/geplant.md`                               | Status-Update                    |
