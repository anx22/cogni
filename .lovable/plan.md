

## Phase 3.5 — Sweeping Rebuild Projekt-Screen

### Strategie: Tabula rasa

Komplettes Löschen aller bisherigen Projekt-Screen-Komponenten. Neuaufbau strikt nach Vier-Rollen-Modell. Keine Bento-Logik, keine Tabs, keine gleichrangigen Facetten.

### Lösch-Liste

```
src/components/project/BentoCard.tsx
src/components/project/ProjectHeader.tsx
src/components/project/ProjectScreen.tsx
src/components/project/facets/  (gesamter Ordner)
```

### Neue Struktur

```
src/components/project/
  ProjectScreen.tsx          ← Orchestrator, vertikaler Flow
  LageZone.tsx               ← Header-Region (immer sichtbar)
  HandlungsbedarfList.tsx    ← Operatives Zentrum
  VerlaufFeed.tsx            ← Ereignis-Chronologie
  SubstanzSection.tsx        ← Themen + Dokumente

  shared/
    ConflictBanner.tsx       ← in LageZone eingebettet
    ActionItem.tsx           ← Zeile in HandlungsbedarfList
    EventEntry.tsx           ← Zeile in VerlaufFeed
    SourceMarker.tsx         ← einheitlicher Provenance-Token
    DeltaTag.tsx             ← neu/ersetzt/bestätigt/widersprochen
    ObjectToken.tsx          ← Termin/Entscheidung/Konflikt/Dok/Thema/Gap/Blocker
```

### Layout-Hierarchie (vertikal, kein Grid-Gleichgewicht)

```text
┌─────────────────────────────────────────────┐
│ LAGE                                         │  ← visuell dominant, ruhig
│ Name + Lagetext + Chips + Konflikt-Banner    │
│ + nächster Termin + letzte Änderung +        │
│ Stakeholder-Zahl + Zielbild                  │
├─────────────────────────────────────────────┤
│ HANDLUNGSBEDARF                              │  ← stärkste Statusmarker
│ Gruppen: entscheiden / klären / umsetzen /   │
│ prüfen — priorisierte Liste, expandierbar    │
├─────────────────────────────────────────────┤
│ VERLAUF                                      │  ← ruhiger, gefiltert
│ Ereignisfeed mit Typfiltern + Delta-Tags     │
├─────────────────────────────────────────────┤
│ SUBSTANZ                                     │  ← tieferer Drilldown
│ Themencluster + Dokumentlisten               │
└─────────────────────────────────────────────┘
```

Keine gleichlauten Bento-Kacheln. Jede Rolle hat eigene visuelle Sprache:
- **Lage**: dichte Headerfläche, minimal Border, größere Typo
- **Handlungsbedarf**: priorisierte Liste mit Statusmarkern, Quick-Actions, expandierbare Detailzeilen
- **Verlauf**: Feed mit linker Zeitlinie, kleinere Typo, Filter-Chips oben
- **Substanz**: Themencluster als große Drilldown-Karten + saubere Dokumentliste

### Demo-Daten erweitern (`demoProject.ts`)

Hinzufügen:
- `gaps`: 2-3 Gap Signals (z.B. "Performance-Anforderung fehlt", "Migrations-Cutoff unklar") mit `wirkung`, `betrifft`, `lebensdauer`
- `dependencies`: 2-3 Abhängigkeiten (`typ`: blockiert_durch | wartet_auf | hängt_ab_von, `quelle`, `ziel`)
- `outcome`: ein Zielbild-Objekt (`erfolgskriterium`, `nogos[]`)
- Entscheidungen aufteilen: nur offene/kritische bleiben in Handlungsbedarf-Quelle, bestätigte fließen in Verlauf
- Handlungsbedarf-Items bekommen `arbeitsmodus`-Feld (entscheiden/klären/umsetzen/prüfen) und optional `blocker`-Marker

### HandlungsbedarfList — Detail

- Vereinheitlichte Item-Struktur: alle Quellen (offene Punkte, Aufgaben, offene Entscheidungen, Konflikte, Gaps, Blocker, Arbeits-Feedback) werden zu einem `ActionItem` normalisiert
- Gruppierung nach Arbeitsmodus mit kleinen Section-Headern
- Pro Item: Titel, Objekt-Token (Typ-Indikator), Verantwortlich/Frist/Quelle, Status-Marker, Quick-Actions (entscheiden/klären/inline-antworten/öffnen)
- Expandierbare Detailzeile statt Vollpanel
- Konflikte erscheinen hier als Marker-Items (nicht als eigenes Panel) — Banner bleibt nur in Lage

### VerlaufFeed — Detail

- Chronologisch absteigend, gruppiert nach Woche
- Typfilter-Chips: Alle / Änderungen / Entscheidungen / Konflikte / Uploads / Milestones
- Pro Eintrag: Datum, Delta-Tag, Inhalt, Quelle (SourceMarker), betroffenes Objekt
- Vertikale Zeitlinie links als visueller Anker

### SubstanzSection — Detail

- Themen als echte Drilldown-Einstiege (nicht Karten-Wand): pro Thema Headline + Kurzbeschreibung + Counts + Hover-Detail
- Darunter Dokumentliste mit Versions-Hinweisen, optional nach Thema gruppiert

### Shared-Komponenten — einheitliche Tokens (Spec 5.7)

- **SourceMarker**: kleines Quellen-Pill, klickbar, einheitlich überall
- **DeltaTag**: farbcodierte Mini-Tags für neu/ersetzt/bestätigt/widersprochen
- **ObjectToken**: Mini-Icon+Label für Objekttypen (Termin, Entscheidung, Konflikt, Dok, Thema, Gap, Blocker)

### Designhaltung

- Vertikaler Lese-Flow, viel Ruhefläche zwischen den vier Zonen
- Lage: backdrop-blur + dezenter Gradient
- Handlungsbedarf: stärkster Kontrast (operativ)
- Verlauf: gedämpfter
- Substanz: zurückhaltend, mehr Whitespace
- Konsistente Inneneinheiten, Typo, Border-Sprache

### Was bleibt

- `ProjectScreen` als Top-Level mit `onBack`-Prop
- `demoProject.ts` als Datenquelle (erweitert)
- Index.tsx Navigation unverändert
- Index.tsx Designhaltung (dunkel, glasartig)

### Was nicht in dieser Phase

- Datenmodell-Migration (Phase 2.5, separat)
- Echte Backend-Anbindung
- Overlay-Trigger (Phase 4)

### Reihenfolge der Umsetzung

1. Demo-Daten erweitern (Gaps, Dependencies, Outcome, Arbeitsmodus)
2. Shared-Tokens bauen (SourceMarker, DeltaTag, ObjectToken)
3. LageZone
4. HandlungsbedarfList
5. VerlaufFeed
6. SubstanzSection
7. ProjectScreen-Orchestrator
8. Alte Dateien löschen
9. `docs/implementierung-aktuell.md` aktualisieren

