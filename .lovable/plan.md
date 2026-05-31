## Ziel

Das Konflikt-Muster („cogni empfiehlt X — Übernehmen / Korrigieren / Offen lassen") wird zum **einheitlichen Drill-Vertrag** für alle Handlungsbedarf-Objekte. Anschließend zwei substanzielle Schritte aus M2/M3.

## Säule A — Empfehlungs-Vertrag verallgemeinern (M1 Stufe 2)

### A1. Empfehlungs-Slot ins Domänen-Modell heben

Heute lebt `empfehlungBlock` nur im Konflikt-Payload. Ich hebe ihn eine Ebene hoch:

```ts
// src/lib/project/types.ts
export interface Empfehlung {
  kind: "konflikt" | "gap" | "dependency" | "entscheidung";
  vorschlag: string;        // "14. April 2026" / "Thomas Berger" / "nicht mehr blockiert"
  begruendung: string;      // "5 Tage neuer · direkte Quelle"
  quelle?: string;          // "Mail · Thomas Berger · 09.04."
  konfidenz: "hoch" | "mittel" | "niedrig";
  aktion: { label: string; intent: "accept" | "submit_value" };
}
```

`GapVM`, `DependencyVM` und `HandlungsbedarfVM` (für `entscheidung`) bekommen optional `empfehlung?: Empfehlung | null`.

### A2. Heuristiken aus existierenden Feldern — kein Backend-Touch

Wichtig: keine erfundene KI. Empfehlung **nur** wenn vorhandene Felder einen ehrlichen Schluss erlauben. Sonst `null` → Drilldown zeigt heutigen neutralen Zustand.

- **Gap** (`gaps.ts`): wenn `g.affects` einen klar nennbaren Objekttyp adressiert (z. B. „Frist Vertrag X"), schlage Eingabe-Template vor: `vorschlag = "Wert für {affects} ergänzen"`, `begruendung = "{lebensdauer}, blockiert {wirkung}"`. Konfidenz aus `age`: <3d hoch, <14d mittel, sonst niedrig. Sonst `null`.
- **Dependency** (`dependencies.ts`): Heuristik aus `typ` + Lebensdauer: bei `blockiert_durch` → `vorschlag = "Als 'nicht mehr blockiert' markieren"` mit `begruendung` aus Quelle→Ziel. Konfidenz niedrig (User soll bewusst bestätigen).
- **Entscheidung** (`handlungsbedarf.ts`, `objektTyp = entscheidung`): keine Auto-Wahl ohne Optionen-Daten. Empfehlung bleibt `null` außer der Punkt hat einen verknüpften Konflikt (`konfliktRef`) — dann Empfehlung aus dessen `KonfliktEmpfehlung` weiterreichen.

Jede Heuristik liegt rein in `src/lib/project/mappers/*.ts`, ist unit-testbar, deterministisch.

### A3. Session-Factories füllen den Slot

`buildGapSession`, `buildDependencySession`, `buildHandlungsbedarfSession` bekommen je einen `empfehlungBlock` analog zum Konflikt — gleiche Form, damit Overlay einen Renderer hat:

```ts
empfehlungBlock?: {
  kind: "gap" | "dependency" | "entscheidung";
  vorschlag: string;
  begruendung: string;
  quelle?: string;
  primaryAction: { label: string; intent: "accept" | "submit_value" };
}
```

Bei `intent = "accept"` → `commitBox(box.id, "confirm", { ...vorschlag })`.
Bei `intent = "submit_value"` → Vorschlag wird **vorbefüllt** ins Eingabefeld geschrieben, Submit-Button heißt „Übernehmen". User kann editieren = „Korrigieren" ist implizit.

### A4. `FaktDrillOverlay` — generischer Empfehlungs-Renderer

`renderConflict` ist heute Konflikt-spezifisch (A/B-Vergleich). Ich extrahiere die Empfehlungs-Bühne in eine eigene Funktion `renderEmpfehlungBuehne(empBlock, onAccept, onCorrect, onOpen)` — gleiche Komposition (36px Vorschlag, Quelle, Begründung, drei Buttons). 

- Konflikt: `onCorrect` → klassische A/B-Wahl (heutige Sub-State-Logik).
- Gap/Dependency/Entscheidung: `onCorrect` → bestehendes Eingabefeld der Session mit vorbefülltem Wert.
- `onOpen` überall: `commitBox(box.id, "reject", { escalate: true })`.

Resultat: ein visueller Vertrag, vier Objekttypen, kein neues Layout.

### A5. KonfliktPopover-Analog für Tier-1 in Gap/Dep?

**Bewusst NICHT in diesem Sprint.** Popover existiert nur, wenn Konfidenz so hoch ist, dass kein Drill nötig ist — bei Gap/Dep ist diese Schwelle ohne Backend-Signal nicht ehrlich erreichbar. Wir bleiben beim Drill mit Empfehlungs-Block.

## Säule B — M2 Einstieg: Atmosphären-Stripe (Spatial Continuity)

Heute bricht Entity-Präsenz im Projekt-Screen ab. Ein dünner Streifen oben (`ProjectScreen` Top-Edge), der den aktuellen Pipeline-Zustand spiegelt:

- Idle: dezentes Grau, keine Animation.
- Pipeline aktiv (asset/parsed/proposed-Tabellen via Realtime): warmer Verlauf, sanfte Pulsation.
- Review-Warm (offene `review_cases > 0`): wärmere Farbe, statisch.

Realtime-Hook existiert bereits (`useRealtimeTables`). Neue Komponente `AtmosphereStripe.tsx` in `src/components/project/`, eingehängt in `ProjectScreen` als 4px-Top-Border. Keine Logik-Verschiebung, nur Anzeige.

## Säule C — M3 Auftakt: Verlauf-Notiz End-to-End

Eine konkrete Antwort-Loop schließen, statt drei halb. `VerlaufFeed` bekommt einen Inline-„Notiz hinzufügen"-Eintrag, der `submitNote` mit `sourceRef.type = "verlauf"` aufruft. Edge Function `note-create` schlanke Version: nimmt Note, schreibt `proposed_facts` mit `source = "user_note"`, läuft danach durch reguläre Verstehens-Pipeline.

Feedback-Button und Impact-Pfeile bleiben für einen separaten M3-Sprint — sonst zerfasert es.

## Bewusst NICHT in diesem Sprint

- Universal-Overlay (⌘+Space), AssetOrbit-Retry → M2 Folge-Sprint.
- Feedback-Button + Impact-Pfeile → M3 Folge-Sprint.
- LLM-Empfehlungen für Gap/Dep (L1) → wenn deterministische Heuristik aus A2 sich als zu dünn erweist.
- Vier Rollen als Perspektiven statt Sections → eigenes M2-Layout-Thema.
- Pre-existing Build-Drift (`useProjectData`, `submitNote`, `VerlaufFeed`-Typen) → braucht eigene Backend-Entscheidung.

## Technische Anhänge

**Dateien angefasst:**
- `src/lib/project/types.ts` (Empfehlung-Interface, optional an Gap/Dep/Handlungsbedarf)
- `src/lib/project/mappers/gaps.ts`, `dependencies.ts`, `handlungsbedarf.ts` (Heuristik)
- `src/lib/dialog/sessionFactories.ts` (empfehlungBlock in Gap/Dep/Handlungsbedarf-Sessions)
- `src/components/dialog/FaktDrillOverlay.tsx` (Renderer extrahieren + neue Bühnen)
- neu: `src/components/project/AtmosphereStripe.tsx`
- `src/components/project/ProjectScreen.tsx` (Stripe einhängen)
- `src/components/project/VerlaufFeed.tsx` (Notiz-Inline)
- neu: `supabase/functions/note-create/index.ts` (mit `withErrorBoundary` + `createLogger`)
- Tests: `gaps.test.ts`, `dependencies.test.ts` (Heuristik), `sessionFactories.test.ts` Erweiterung, Snapshot des Empfehlungs-Renderers.

**Doku:** NOW.md M1 von „Stufe 2 offen" auf „Stufe 2 live (deterministische Heuristik, LLM-Hebung als L1)" updaten. DECISIONS-Eintrag: „Empfehlungs-Vertrag = einheitlicher Slot über alle Drilldown-Objekte; Heuristik aus vorhandenen Feldern, kein erfundenes KI-Signal."

## Erfolgsmaß

- Jeder Klick auf Gap/Dependency/Entscheidung zeigt entweder eine ehrliche Empfehlung mit `Übernehmen`, oder den heutigen neutralen Drill — kein Mischzustand.
- Atmosphären-Stripe zeigt im Projekt-Screen Pipeline-Aktivität, ohne dass User zur Entity zurück muss.
- Verlauf-Notiz ist ein abgeschlossener Loop: schreiben → erscheint nach Pipeline-Lauf als kanonischer Fakt.
