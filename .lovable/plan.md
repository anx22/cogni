
## Befund — wo der Riss wirklich liegt

Ich habe die vier Säulen gegen den Code geprüft. Die Pipeline ist solide, die Sprache ist 80% bereinigt, das Routing nach Objekttyp existiert. Die Lücke ist nicht „kaputt", sie ist **eine Dimension tiefer**:

**1. Empfehlung wird berechnet, aber nicht geführt.**
`konflikte.ts → deriveEmpfehlung()` produziert bereits `{gewinner, begruendung, konfidenz, tier}` aus Confidence + Recency. `FaktDrillOverlay` zeigt sie aber als Fußnote unter der A/B-Gegenüberstellung: _„cogni empfiehlt …"_ in 12.5px grau. Die Bühne behandelt A und B als gleichwertig. Default-Selection ist nur `A` (nie `B`), auch wenn `B` empfohlen ist. → **Das System hat entschieden, aber tut so, als hätte es nicht.**

**2. Empfehlungs-Text ist heuristik-roh, nicht cogni-Stimme.**
„Höhere Zuverlässigkeit (87 %) — cogni bevorzugt diese Version." Das ist Maschinen-Output, kein Berater. Was fehlt: konkreter Bezug („neuer", „direkte Quelle", „Mail von Thomas Berger statt Kickoff-Protokoll").

**3. Das Muster fehlt für alle anderen Objekttypen.**
Gap, Dependency, Decision haben heute keinen Empfehlungsslot. Sie sind reine Eingabefelder. Sobald M1 sitzt, gibt es ein Vokabular, das auf alle Sessions übertragbar ist — heute gibt es keins.

**4. Die vier Rollen sind Sections, keine Perspektiven.**
Korrekt erkannt im User-Brief. Das ist aber ein M2-Thema und kein M1-Thema — Spatial Continuity / Universal-Overlay ist bereits als M2 dokumentiert. **Nicht jetzt anpacken.**

**5. Sprach-Restposten existieren noch** (NOW.md zählt drei: `useIntake.ts`, `IntakeSessionsPanel`, `ImpactPipelinePanel`). Mitnehmen, weil 5-Minuten-Aufwand.

## Was dieser Sprint ist

**Ein Muster, an einer Stelle, vollständig.** Dann Replikation. Kein UX-Overhaul.

### Schritt 1 — Empfehlungs-Block wird primär (Konflikt)

`FaktDrillOverlay → renderConflict` umbauen. Statt „A | vs | B → Tile-Reihe → Fußnoten-Hint":

```text
┌─────────────────────────────────────────────────────┐
│  cogni empfiehlt: 14. April 2026                    │   ← groß, primär
│  Quelle B (Mail von Thomas Berger, 09.04. · 14:22)  │   ← konkret
│  Begründung: 5 Tage neuer · direkter Absender       │   ← human
│                                                     │
│  [ Übernehmen ]      [ Korrigieren ▾ ]              │
└─────────────────────────────────────────────────────┘

  Im Vergleich: 21. März 2026 (Kickoff-Protokoll)        ← klein, sekundär
```

- Empfehlung dominiert visuell. A/B-Gegenüberstellung kollabiert in Sekundärzeile.
- „Korrigieren" expandiert in die A/B-Wahl + offen-lassen (heutige Tile-Reihe als Sub-State).
- Bei `empfehlung.gewinner === null` (beide ähnlich): kein Empfehlungs-Block, sondern direkt heutige neutrale A/B-Bühne — das ist der einzige Fall, in dem User wirklich entscheiden muss.

### Schritt 2 — Empfehlungs-Text human machen

`konflikte.ts → deriveEmpfehlung` schreibt heute „Höhere Zuverlässigkeit (X%)". Stattdessen Begründungs-Bausteine kombinieren:

- Recency-Differenz → „N Tage neuer"
- Confidence-Differenz → „direktere Quelle" / „aus erster Hand"
- Quellen-Typ (Mode `direkt` vs `abgeleitet`) → „direkt aus Mail" / „aus Protokoll abgeleitet"

Plus: `KonfliktFactRef.quelle` mit konkretem Absender/Dokumenttitel auflösen (steht in `canonical_facts.provenance.source_label` falls vorhanden — sonst Fallback auf heutiges „Direktquelle"/„Abgeleitet"). Kein neuer DB-Call, nur Mapper-Erweiterung in `toKonflikte`.

### Schritt 3 — Empfehlungs-Slot in Session-Vertrag aufnehmen

`DialogBox.payload` bekommt optional:
```ts
empfehlung?: {
  text: string;        // "14. April 2026"
  begruendung: string; // "5 Tage neuer · direkter Absender"
  quelle: string;      // "Mail von Thomas Berger · 09.04."
  primary: "A" | "B" | "submit"; // welcher Button = Übernehmen
}
```

Damit ist der Slot da, sobald Gap-/Dependency-/Decision-Sessions ihn füllen wollen. **In diesem Sprint nur Konflikt füllt — die anderen Sessions bleiben unverändert.** Der Slot signalisiert aber das neue Muster für Wave 3.

### Schritt 4 — Sprach-Restposten

Drei Strings aus NOW.md mitnehmen (Toasts in `useIntake.ts:36-40`, `IntakeSessionsPanel.tsx:156`, EVENT_LABELS-Fallback in `ImpactPipelinePanel.tsx:35-37`). Keine eigene Recherche, NOW.md sagt wo.

### Schritt 5 — KonfliktPopover (Tier-1-Schnellentscheidung) ausrichten

`KonfliktPopover` heute zeigt Empfehlung schon kompakt, aber nur Tier-1. Mit dem neuen Empfehlungs-Block ist der Drilldown selbst auch 2-Sekunden-Bestätigung — Popover bleibt als noch schnellere Variante. **Beide Pfade müssen dieselbe Sprache sprechen.** Popover-Texte an neue `begruendung`-Bausteine angleichen, sonst nichts.

## Was bewusst NICHT in diesem Sprint ist

- **Gap/Dependency/Decision-Empfehlungen** — Slot ist da, Befüllung kommt wenn Detektor-Heuristik existiert (heute gibt es keine echte Recommendation-Logik dafür; nur Pattern dafür anlegen wäre Augenwischerei).
- **Vier Rollen als Perspektiven statt Sections** — das ist M2 (Spatial Continuity). Würde das Layout-Skelett umwerfen.
- **Universal-Overlay (⌘+Space), Atmosphären-Stripe-Realtime, AssetOrbit-Retry** — bleibt M2.
- **note-create / feedback-create Edge Functions** — bleibt M3.
- **Build-Fehler aus Lovable-Hand-Off** (`useProjectData`, `submitNote`, `VerlaufFeed`) — separater Block, NOW.md führt sie schon. Nicht hier mit reinmischen.

## Technische Details

- **Dateien angefasst:** `src/components/dialog/FaktDrillOverlay.tsx` (renderConflict-Umbau), `src/lib/project/mappers/konflikte.ts` (deriveEmpfehlung-Text + Quellen-Auflösung), `src/lib/dialog/sessionFactories.ts` (Empfehlungs-Payload), `src/lib/dialog/types.ts` (optional empfehlung-Slot), `src/components/project/KonfliktPopover.tsx` (Sprach-Angleich), `src/lib/intake/useIntake.ts`, `src/components/entity/IntakeSessionsPanel.tsx`, `src/components/home/ImpactPipelinePanel.tsx` (drei Strings).
- **Tests:** `konflikte.test.ts` (falls existiert — sonst neu), Snapshot von `deriveEmpfehlung` mit drei Szenarien (gewinner A / gewinner B / kein gewinner). Vitest-Suite muss 89/89+ bleiben.
- **Keine Migration, keine Edge-Function-Änderung, keine Backend-Touches.** Reines Frontend + Mapper.
- **Doku:** NOW.md M1-Eintrag von „Provenance & Empfehlung schließen (vorbereitet, backend-leer)" auf „Empfehlung-First-Drilldown live, Slot für Wave 3 offen" updaten. DECISIONS-Eintrag: „Drilldown-Muster = Empfehlung dominiert, Vergleich sekundär — Konflikt zuerst, andere Objekttypen wenn Recommendation-Logik existiert."

## Erfolgsmaß

Wenn ich auf einen Konflikt klicke: Ich sehe in 1 Sekunde, was cogni empfiehlt und warum. Ich drücke „Übernehmen". Fertig. Bei Tier-1 nicht mal das Overlay nötig (Popover). Das ist der Sprung von Verwaltungs- zu Intelligenz-Tool — an einer Stelle, sauber, übertragbar.
