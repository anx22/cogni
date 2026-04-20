

## Schlanker Ansatz: Nur eine Kennzeichnung, kein neues Datenmodell

### Prinzip
- **Default:** Alles läuft normal nach Briefing (KI-Extraktion, Dialog-Bestätigung, Konflikte, Delta-Logik).
- **Ausnahme:** Wenn ein Fakt durch **manuellen Eingriff** entstanden ist (Nutzer hat im Dialog selbst Text/Wert eingegeben oder überschrieben), bekommt er **eine kleine visuelle Kennzeichnung**. Mehr nicht.
- **Re-Konflikte:** Brauchen keine Sonderlogik. Ein neues Dokument, das einem manuell gesetzten Fakt widerspricht, erzeugt einen **ganz normalen Konflikt** wie jeder andere auch. Die Kennzeichnung „manuell" ist dann nur Kontext im Konflikt — kein Veto, kein Sonderpfad.

### Was das konkret heißt

**1. Ein neues Flag, sonst nichts**
`SourceMarker` bekommt optional `manuell?: boolean`. Wenn true → kleines Personen-Icon neben dem Quellen-Label. Sonst unverändert.

**2. Demo-Daten minimal erweitern**
Ein, zwei Beispiel-Items in `demoProject` bekommen `manuell: true` an der Quelle (z. B. ein bestätigter Termin, eine geklärte Lücke), damit das Pattern im Prototyp sichtbar wird.

**3. Konflikt-Verhalten unverändert**
Konflikt-Box bleibt wie sie ist. Wenn einer der Fakten manuell entstanden ist, sieht man das durch die Kennzeichnung an der Quelle — keine eigene UI nötig.

**4. Memory + Briefing-Klarstellung**
- Neue Memory-Notiz `mem://features/manueller-eingriff`: „Manuelle Eingaben sind Ausnahme, bekommen Kennzeichnung, sonst keine Sonderbehandlung. Re-Konflikte sind normale Konflikte."
- Kurzer Absatz in `docs/produkt-gesamt.md` analog.

### Was wir explizit NICHT machen
- Kein neues Quellen-Objekt mit `modus`/`autor`/`datum`.
- Kein Re-Konflikt-Sondertyp.
- Keine Author-Tags im Verlauf.
- Keine Gewichtung manueller vs. KI-Quellen.

### Betroffene Dateien
- `src/components/project/shared/SourceMarker.tsx` — optionales `manuell`-Prop + Icon
- `src/data/demoProject.ts` — 1–2 Beispiele markieren
- `docs/produkt-gesamt.md` — kurzer Absatz
- `mem://features/manueller-eingriff` — neue Notiz

