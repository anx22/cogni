## Das eigentliche Problem ist nicht „open_point"

Der konkrete Fall — eine Bedingung wird als Lücke gerendert — ist nur ein Symptom. Das generalistische Problem dahinter:

> Die Pipeline modelliert jede Aussage als einen typisierten Fakt. Die UI hat genau eine Default-Reaktion auf alles, was nicht ins Schema passt: „Wert eingeben". Daher entsteht für jede neue Sprechhandlung, die das Schema nicht kennt, ein eigener Bug.

Mit anderen Worten: zwischen „was die KI verstanden hat" und „was die UI dem User vorlegt" fehlt eine semantische Zwischenschicht. Das Schema kennt Fact-Types (`decision`, `task`, `deadline`, `topic`, `stakeholder`, `open_point`, `reference`), aber keine Sprechhandlungs-Modalität.

## Die drei Achsen, die heute kollabiert sind

Jede Aussage hat in Wahrheit drei unabhängige Eigenschaften, die das System aktuell in einen einzigen `fact_type` zusammenfaltet:

1. **Modalität** — was für eine Sprechhandlung ist das?
2. **Bezug** — steht sie alleine oder hängt sie an etwas?
3. **Erwartung** — was braucht sie vom User?

Solange diese drei Achsen nicht getrennt sind, wird jeder neue Aussagentyp zu einem neuen Symptom-Bug — wie heute mit „Voraussetzung".

## Modalitäten, die in PM-Inputs real vorkommen

Nicht erschöpfend, aber so dass die Klassen-Lücke greifbar wird:


| Modalität    | Beispiel                                               | Heute falsch behandelt als                                       |
| ------------ | ------------------------------------------------------ | ---------------------------------------------------------------- |
| `assertion`  | „Liefertermin ist 12.06."                              | ok                                                               |
| `condition`  | „Angebot gilt nur, wenn Bildrecherche durch LMWA"      | `open_point` → Lücke (heutiger Fall)                             |
| `exclusion`  | „Nicht enthalten: Postproduktion"                      | `open_point` oder ignoriert                                      |
| `assumption` | „Wir gehen davon aus, dass der Kunde freigibt"         | `open_point` → Lücke                                             |
| `suggestion` | „Wir könnten auch 16:9 statt 9:16 liefern"             | `open_point` → Lücke                                             |
| `question`   | „Kannst du bis Freitag liefern?" (echte Frage an mich) | `open_point` → korrekt, aber ohne Frage-Text                     |
| `note`       | „Zur Info: Kunde ist im Urlaub bis 03.06."             | erzeugt Box ohne Sinn                                            |
| `relation`   | „LMWA ist die Agentur von Teinacher"                   | `topic` oder verschluckt                                         |
| `attribute`  | „Preis: 7.820 €" (gehört an bestehendes Angebot)       | erzeugt eigenständigen `open_point` statt Update am Bezugsobjekt |
| `risk`       | „Falls Freigabe zu spät, Verschiebung um 2 Wochen"     | `open_point` → Lücke                                             |
| `dedup`      | Wiederholung eines bereits bekannten Fakts             | erzeugt neue Box                                                 |


Heute landen mindestens 7 dieser 11 Klassen im Mülleimer `open_point` und werden mit dem Lücken-Renderer („Wert eingeben") angezeigt. Das ist der gemeinsame Nenner deiner Verwirrung.

## Generalistischer Plan

### 1. Modell-Vertrag um Modalität, Bezug und Erwartung erweitern

Jedes Item, das die Verstehens-Pipeline ausliefert, trägt verpflichtend:

- `modality` (siehe Tabelle oben; `unclear` ist erlaubt)
- `attaches_to`: optional, Verweis (ID oder Beschreibung) auf das Bezugsobjekt
- `asks`: optional, exakter Satz, was vom User gewünscht ist. `**null` = nichts gewünscht.**
- `understood`: 1 Satz Klartext, was die KI verstanden hat
- `evidence`: das wörtliche Quellfragment + Position

Wenn `modality=unclear` oder `asks` gefordert wäre aber leer ist, wird die Box als **„Verstehe ich das richtig?"** gerendert — niemals als blindes Eingabefeld. Das ist die Verallgemeinerung des heutigen Symptoms.

### 2. Box-Renderer-Matrix statt einheitlicher Box

Eine Tabelle, keine Sonderfälle:


| Modalität  | Default-Aktion          | Eingabefeld? | Sekundäraktionen                                |
| ---------- | ----------------------- | ------------ | ----------------------------------------------- |
| assertion  | Übernehmen              | nein         | Korrigieren · Verwerfen                         |
| condition  | Übernehmen              | nein         | Bezug ändern · Verwerfen                        |
| exclusion  | Übernehmen              | nein         | Bezug ändern · Verwerfen                        |
| assumption | Markieren als Annahme   | nein         | Bestätigen · Verwerfen                          |
| suggestion | In Vorschlagsliste      | nein         | Entscheidung erzwingen · Verwerfen              |
| question   | Antworten               | **ja**       | Später · Ablehnen                               |
| note       | Stillschweigend ablegen | nein         | (keine Box, nur Verlauf)                        |
| relation   | Kante übernehmen        | nein         | Knoten wählen · Verwerfen                       |
| attribute  | Ziel-Fakt aktualisieren | nein         | Bezug ändern · Verwerfen                        |
| risk       | Risiko aufnehmen        | nein         | Frist setzen · Verwerfen                        |
| dedup      | (keine Box)             | nein         | (verschluckt + an existierender Quelle ergänzt) |


Eingabefelder existieren nur dort, wo es semantisch eine Antwort gibt. Das eliminiert die heutige Sackgasse vollständig.

### 3. Bezug ist ein eigenes Box-Konzept, kein Anhang

Wann immer `attaches_to` gesetzt ist und das Ziel nicht eindeutig auflösbar, ist die Frage an den User **nicht** „Wert eingeben", sondern eine Auswahl: zeige 1–3 wahrscheinliche Bezugsobjekte als Chips, plus „Keines davon". Damit verschwinden auch die Fälle, in denen z. B. ein Preis als freier `open_point` erscheint statt am Angebot zu hängen.

### 4. Stille Substanz als Default

Items mit `confidence ≥ 0.9`, `asks=null`, kein Konflikt → wandern ohne Box direkt in den Projektzustand. Im Review erscheint nur eine **Sammelzeile** („23 Punkte übernommen — anschauen?"). Damit fällt die heutige Flut wegloser Boxen weg.

### 5. Drift-Telemetrie statt Einzel-Diskussionen

Jedes Item mit `modality=unclear` oder mit User-Korrektur „falsch klassifiziert" wird geloggt. Wenn ein Muster Schwellwert X überschreitet (z. B. >5 ähnliche unclear-Fälle/Woche), generiert das System einen **Schema-Vorschlag** statt eines Hotfixes — z. B. „Neue Modalität `delivery_constraint` erkannt, willst du sie aufnehmen?". So wird aus „immer wieder neue Diskussion" ein Lernprozess.

### 6. Korrektur als Lern-Signal

Verwerfen, „in Notiz verschieben", „Bezug ändern" werden in `corrections` mit Modalität + Originalsatz gespeichert. Diese Daten fließen in den Klassifier zurück. Was du heute manuell korrigierst, wird morgen automatisch richtig einsortiert.

### 7. Zwei Datenbankfelder, die das tragen können

Vorhanden: `proposed_facts.content` (jsonb), `review_cases.context` (jsonb), `review_cases.box_type` (enum).

Reicht aus, wenn:

- `content` zusätzlich `modality`, `attaches_to`, `asks`, `understood`, `evidence` führt
- `box_type` um Werte wie `condition`, `assumption`, `suggestion`, `relation`, `attribute`, `risk`, `note`, `unclear` erweitert wird
- Der Renderer auf `box_type` und das Vorhandensein von `asks` schaut, nicht mehr auf `fact_type`

Keine zerstörerische Migration nötig.

## Was wir damit konkret verhindern

- Bedingungen, die als Lücken erscheinen (heutiger Fall)
- Annahmen, die der User fälschlich „beantworten" soll
- Ausschlüsse („nicht enthalten"), die untergehen
- Preise/Mengen, die als eigene Boxen erscheinen statt am Angebot
- Notizen, die zur Klick-Arbeit werden
- Beziehungen, die zu Topics zerfallen statt als Kante in den Graphen zu gehen
- Wiederholungen, die als neue Items erscheinen
- Jeden zukünftigen Fall, bei dem wir heute eine neue Diskussion bräuchten

## Ergebnis für den konkreten Fall

Die Bedingung „Voraussetzung: Bildrecherche und Kauf durch LMWA" erscheint dann als Box mit:

- Chip **BEDINGUNG**, klar abgegrenzt von Lücken
- „Verstanden: Angebot B gilt nur, wenn LMWA Bildrecherche und Kauf übernimmt."
- Bezug-Chip → „Angebot B · 7.820 € · 12 Reels"
- Aktionen: ✓ Übernehmen · Bezug ändern · Verwerfen
- Kein Eingabefeld, keine erzwungene Antwort

Und das Gleiche gilt automatisch für jede der oben gelisteten Modalitäten — ohne neue Diskussion pro Fall.

&nbsp;

Finde ich gut, bitte so umsetzen. Punkt. Dies ist ein extrem wichtige Erkenntnis, die wir nicht nur im Code und in der App umsetzen sollten, sondern vor allem in der Dokumentation überall, wo wichtig ergänzen oder verändern sollten. Ich vermute, dass unser Ansatz dennoch nicht der Weisheit letzter Schluss ist, aber eine sehr wichtige Richtungsentscheidung. Daher nach Code-Umsetzung bitte gut dokumentieren. Und auch vorhandene Punkte, die das adressieren, umändern