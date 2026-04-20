## Phase 7.6 — Intake als eine einzige Bewegung

Fünf zusammenhängende Eingriffe, damit Drop → Stimme → Dialog sich wie **ein** Fluss anfühlt, nicht wie drei getrennte Bildschirme. Kein neues Feature, nur Politur da wo der Fluss heute bricht.

---

### 1. Drop-Guard & heiße Denk-Farbe

**Problem heute:** Man kann während der Verarbeitung munter weiter droppen — neue Inserts überschreiben die laufende Stimme, neue Sessions stapeln sich. Außerdem bleibt der Kern kühl-blau, während er „denkt".

**Fix:**

- `EntityCore` und globaler Drop lehnen neue Drops ab, solange `entityState ∈ {processing, review-ready}`. Visuell: Cursor wird `not-allowed`, ein kurzer „Ich bin noch beschäftigt." Stimm-Puls erscheint als Voice (tone `calm`, 1.8s), danach kehrt die eigentliche Stimme zurück.
- Processing-Gradient wechselt auf **warmes Bernstein/Gold** (amber → rose → gold konisch, leicht pulsierend), nicht blau. Innerer Kern bekommt dezenten warmen Glühkern. Review-ready bleibt grünlich-gold, idle bleibt blau. So gibt die Farbe unmissverständlich Rückmeldung: blau=ruhend, heiß=denkt, grün=fertig.
- Voice `tone='working'` bekommt dezenten warmen Tint (amber/200), passend zum heißen Kern.

### 2. Overlay öffnet sich selbst

**Problem heute:** Spec sagt „bei review-ready öffnet sich das Gesprächsoverlay". Real: Kern wird golden, Nutzer muss klicken. Zwei Mal Arbeit für einen Gedanken.

**Fix:**

- In `Index.tsx`, Listener auf `dialog_sessions INSERT`: nach Stimm-Beat „Bereit. N Sachen für dich." (ca. 1.6s Verzögerung, damit der Satz gelesen wird) ruft er `openSessionFromDB(row.id)` selbst auf, setzt `pendingSessionId=null`, `entityState='idle'`.
- `handleCoreClick` und `handleReviewClick` bleiben als manueller Fallback (falls Nutzer das Overlay zwischendurch schließt und wieder rein will).

### 3. Overlay im Entity-Voice-Stil

**Problem heute:** Modal wirkt wie Panel-Wüste — Header-Chip, Trennlinien, State-Bars, Badges, Uppercase-Mini-Buttons, kleine Boxen mit Rändern. Kollidiert mit der Ruhe der Stimme.

**Fix — `DialogOverlay` + `BoxFrame` neu aufziehen:**

- **Keine Modal-Karte mehr.** Stattdessen: volle Fläche, `bg-background/92 backdrop-blur-xl`, mittig zentriert. Header schrumpft auf eine einzige Zeile: linke Seite in `text-[10px] tracking-[0.3em]` Muted (z.B. „VERSTEHENS-LAUF ZU TESTDATEI.TXT"), rechts ein dezentes X. Kein Border, kein Chip.
- **Boxen werden Schwebekarten mit gradient Rahmen.** `BoxFrame` verliert /Shadow/State-Bar-Streifen/Badges. Stattdessen:
  - Box-Titel in `text-2xl font-light tracking-wide text-foreground/90`, Hierarchie via Größe, nicht via Rahmen.
  - Inhalt drunter in `text-base text-muted-foreground/80 font-light`.
  - Trennung zwischen Boxen: großzügiger vertikaler Abstand (48–64px) + optionaler 1px Hairline `border-border-subtle/20`, nicht umschlossene Karte.
  - State-Rückmeldung: bestätigte Boxen fahren in 200ms auf Opacity 40% + kleines ✓ links vom Titel (kein Badge). Verworfene: Opacity 30% + durchgestrichener Titel. Geänderte: dezenter Amber-Punkt vor dem Titel.
- **Aktionen minimal & leise.** Statt `ActionBtn` in Uppercase-Kapsel: zwei Text-Links unter dem Inhalt, `text-sm text-muted-foreground/60 hover:text-foreground`, Abstand 6 zueinander. „Übernehmen" (hover: primary), „Verwerfen" (hover: muted). Kein Icon, kein Uppercase, kein Rahmen.
- **Animation:** Boxen faden mit 80ms-Staffel und leichtem `translateY(8px)` ein, genau wie EntityVoice.

Alles in allem: der Dialog sieht aus wie die Stimme, nur länger.

### 4. Zuordnungsbox endlich richtig vorausgewählt

**Befund aus dem Screenshot:** „Lisa Müller" wird korrekt vom Agent interpretiert („Die explizite Nennung … legt Zuordnung zu 'Lisas Projekt' nahe"), aber die Box zeigt nur „Neues Projekt" ohne vorbelegten Namen. Das liegt an zwei Dingen:

1. **Keine Kandidaten-Liste gerendert**, weil lexikalisches Scoring ohne echte DB-Projekte 0 Treffer liefert. Korrekt — aber dann ist der Modus `new`, und der Vorschlagsname bleibt leer weil `suggested_new_name` nicht vom Agent belegt wurde (Agent gab nur `reason_short`).
2. **Frage + Reason stehen doppelt**: Titel = „Welches Projekt passt?" (aus `description` gesetzt? nein — aus `c.description` wird ctx.reason, und die Box zeigt zusätzlich `box.payload.frage`).

**Fix in `intake-understand`:**

- Wenn `mode='new'` und der Agent einen `reason_short` liefert, der „Lisas Projekt"/„Aurora-Angebot" o. ä. explizit als Wunschnamen nennt, fällt der `suggested_new_name` auf einen deterministisch extrahierten Namen aus dem Reason zurück (Regex auf `'…'` oder `„…"`). Falls nichts greift: Fallback auf den dominanten Entitätsnamen aus den extrahierten Fakten (z.B. Topic-Titel „Aurora-Angebot"). So bekommt das Textfeld einen sinnvollen Default und ist **vorausgewählt** (radio `__new__` ist heute schon default — das stimmt).
- Wenn `mode='uncertain'`/`auto` UND Kandidaten existieren: kein zusätzlicher expliziter Default nötig, ZuordnungsBox wählt bereits Top-Kandidat.

**Fix in `ZuordnungsBox.tsx`:**

- Titel-Zeile oben: nur **eine** Zeile. Wenn `agent_reason` existiert, ist sie der Titel (groß, leicht, wie Voice-Stil). Die Frage „Welches Projekt passt?" fällt weg, weil die Reason den Kontext selbst beantwortet. Ohne Reason: „Welches Projekt passt?"
- Radio-Liste ohne Karten-Hintergrund: einfache Zeilen mit Radio, Projektname, optional ein sehr kleiner grauer Grund („Lisa Müller · 2 Treffer"). Hover nur Textfarbe, kein Border-Wechsel.
- Textfeld für neuen Namen: grenzlos, nur `border-b border-border-subtle focus:border-primary`, großer `text-xl font-light`, Platzhalter = suggested_new_name in Muted.
- Buttons in neuer, leiser Aktionsschreibweise (siehe Punkt 3).

### 5. Kleiner Verlauf-Check

- `WissensBox`, `GapBox`, `KonfliktBox`, `AuswahlBox`, `EingabeBox`, `AktionsBox` erben automatisch den neuen `BoxFrame`-Stil — sie benutzen ihn alle. Nur interne Abstände und Typografie müssen in jedem Sub-File leicht angehoben werden (Titel von `text-sm` auf die neue Größe passiert via BoxFrame; Body von `text-sm` auf `text-base`).
- Der „vorgeschlagen · task"-Chip in WissensBox wird zu einer dünnen, nicht umrandeten Zeile `text-xs text-muted-foreground/50` unter dem Sachverhalt. Kein Pill-Look mehr.

---

### Betroffene Dateien

- `src/pages/Index.tsx` — Drop-Guard während processing/review-ready; Auto-Open des Overlays nach Session-Insert (mit 1.6s Delay für Voice-Beat)
- `src/components/EntityCore.tsx` — Drop während processing ablehnen; heißer Gradient für `processing`
- `src/components/entity/EntityVoice.tsx` — warmer Tint für `tone='working'`
- `src/components/dialog/DialogOverlay.tsx` — Full-Bleed statt Modal-Karte, minimaler Header, großzügige vertikale Rhythmik
- `src/components/dialog/BoxFrame.tsx` — Rahmen/Bars/Badges raus; Typo groß & dünn; State nur via Opacity/Icon; Actions als Textlinks
- `src/components/dialog/boxes/ZuordnungsBox.tsx` — einzeilige Überschrift (Reason ersetzt Frage), rahmenlose Radios, unterstrichenes Input, Default-Name-Logik
- `src/components/dialog/boxes/WissensBox.tsx` — Quelle als dünne Zeile statt Pill
- `supabase/functions/intake-understand/index.ts` — `suggested_new_name` aus Reason/Entität ableiten wenn leer

### Was bewusst draußen bleibt

- Keyboard-Navigation durch Boxen (Pfeiltasten, Enter=Übernehmen)
- Undo nach einer Entscheidung
- Drag-Reorder der Boxen
- Preview der extrahierten Entität im Overlay-Header  
  
  
BITTE die textgrößen alle etwas anheben, wir wollen hier keine microcopy keine supersmall texts, alles im dialog overlay muss plakativ sein