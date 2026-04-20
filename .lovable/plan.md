

## Bugfix: „Invalid key" beim Upload von Dateien mit Umlauten/Sonderzeichen

### Problem

Supabase Storage akzeptiert in Object-Keys nur ein eingeschränktes ASCII-Zeichenset. Dateien wie `Re_ Termin Erklärfilm.msg` (mit `ä`, Leerzeichen, Doppelpunkt, etc.) führen beim `storage.upload(path, file)` in `useIntake.ts` zu `Invalid key: …`. Der Intake bricht ab, das Asset wird nie angelegt.

### Fix

Eine kleine Helferfunktion `sanitizeStorageName(name)` einführen und beim Bauen des Storage-Pfads anwenden — der **originale Dateiname** bleibt unverändert in der DB (`assets.file_name`), nur der **Storage-Key** wird normalisiert.

#### Regeln für `sanitizeStorageName`

1. Unicode-Normalisierung NFKD und Diakritika strippen (`ä` → `a`, `ö` → `o`, `ß` → `ss` separat).
2. Alle Zeichen außerhalb `[A-Za-z0-9._-]` durch `_` ersetzen.
3. Mehrfach-`_` zu einem zusammenfassen, führende/nachfolgende `_`/`.` entfernen.
4. Wenn Ergebnis leer (z. B. nur asiatische Zeichen) → Fallback `file`.
5. Extension separat behandeln, damit sie erhalten bleibt (`name.split('.').pop()`).
6. Länge auf ~120 Zeichen begrenzen.

Ergebnis für das Beispiel: `Re_Termin_Erklarfilm.msg`.

#### Änderung in `src/lib/intake/useIntake.ts`

- Neue lokale Funktion `sanitizeStorageName` direkt in der Datei (oder in `src/lib/intake/sanitizeStorageName.ts`, mit Test).
- `path = ${user.id}/${assetId}/${sanitizeStorageName(file.name)}`.
- `file_name` in der DB bleibt `file.name` (Originaltitel mit Umlauten — das ist UI-Anzeige).
- `metadata.original_name = file.name` zusätzlich speichern, damit später nachvollziehbar.

#### Bonus: defensiver Fehlerpfad

In `useIntake.ts` beim `upErr` zusätzlich den **Pfad** und den ersten Konflikt-Hinweis ins Toast schreiben (`Upload abgelehnt: Dateiname enthält Sonderzeichen`), statt nur den Roh-Fehler. Verhindert, dass der Nutzer nochmal mit identischem Namen versucht.

### Mini-Test

`src/lib/intake/sanitizeStorageName.test.ts` mit drei Cases:
- `Re_ Termin Erklärfilm.msg` → `Re_Termin_Erklarfilm.msg`
- `Präsentation: Q3.pptx` → `Prasentation_Q3.pptx`
- `日本語.pdf` → `file.pdf`

### Betroffene Dateien

- `src/lib/intake/useIntake.ts` — sanitize beim Pfadbau, freundlichere Fehlermeldung
- `src/lib/intake/sanitizeStorageName.ts` — neu, reine Funktion
- `src/lib/intake/sanitizeStorageName.test.ts` — neu, Vitest

### Bewusst draußen

- Migration bestehender Assets mit kaputten Keys (es gibt aktuell keine — der fehlerhafte Upload ist gar nicht erst durchgekommen).
- Server-seitige Validierung in der Edge-Function (Storage selbst lehnt es ja schon korrekt ab; wir korrigieren nur clientseitig).

### Akzeptanzkriterium

Dateien mit Umlauten, Leerzeichen und Sonderzeichen im Namen können abgelegt werden. In der UI erscheint weiterhin der Originalname, im Storage liegt eine ASCII-saubere Variante.

