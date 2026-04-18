

## Anpassung: Verlauf prominenter, Handlungsbedarf rechts kompakt

### Begründung
Verlauf bekommt 60% Breite, weil chronologische Substanz und Begründungstiefe mehr Platz brauchen. Handlungsbedarf bleibt scannbar in 40% — die Liste ist ohnehin auf knappe Zeilen + Expand optimiert.

### Neue Gesamtaufteilung

```text
┌─────────────────────────────────────────────────────────────┐
│ HEADER-LEISTE (volle Breite)                                │
├──────────────────────────────────────┬──────────────────────┤
│ ▌ LAGEBILD (Hero, 60%)               │ KONFLIKTE (40%)      │
│                                      │ ZIELBILD (gestapelt) │
├──────────────────────────────────────┼──────────────────────┤
│ VERLAUF (60%)                        │ HANDLUNGSBEDARF (40%)│
│ Chronologie, breit, scrollbar        │ Liste, kompakt       │
├──────────────────────────────────────┼──────────────────────┤
│ THEMEN (60%)                         │ DOKUMENTE (40%)      │
└──────────────────────────────────────┴──────────────────────┘
```

Konsistenter 60/40-Rhythmus über alle drei Zonen bleibt erhalten — nur die Position von Verlauf und Handlungsbedarf ist getauscht.

### Auswirkungen auf Komponenten
- **VerlaufFeed**: bekommt mehr horizontale Atemluft → längere Eintragstexte ohne Umbruch, Verlaufslinie wirkt ruhiger. `max-h` für Scroll bleibt.
- **HandlungsbedarfList**: rückt in schmalere Spalte → Akzentbalken + Modus-Headline + Row-Titel passen, Expand-Body wird etwas schmaler aber bleibt lesbar.

### Betroffene Dateien
- `src/components/project/ProjectScreen.tsx` — Spaltenreihenfolge in der mittleren Zone tauschen (Verlauf links `col-span-3`, Handlungsbedarf rechts `col-span-2`)
- ggf. minimale Padding-/Layout-Anpassungen in `HandlungsbedarfList.tsx` für die schmalere Spalte

### Out of Scope
- Header und Substanz-Zone unverändert
- Surface-/Akzent-System unverändert
- Kein Inhaltsumbau

