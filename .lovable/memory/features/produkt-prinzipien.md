---
name: Produktprinzipien
description: Vier Rollen, Review-First, Provenance, Delta-Logik, Konflikte/Gaps/Dependencies/Outcome als Kernobjekte, universeller Input
type: feature
---

## Vier-Rollen-Modell (Projekt-Screen)

Jeder Inhalt erfüllt genau eine Rolle: **Lage**, **Handlungsbedarf**, **Verlauf**, **Substanz**. Diese vier dürfen nie gleichrangig dargestellt werden.

## Review-First

Kein Auto-Commit. Jede Erkenntnis durchläuft Review-Cases im Dialog-Overlay (8 Box-Typen, 6 Zustände).

## Provenance & Delta

Jede kanonische Tatsache trägt Quelle + Delta-Typ (confirm/add/replace/contradict/merge/discard).

## Kernsignale — alle vier müssen IM UI sichtbar sein, nicht nur im Datenmodell

- **Konflikte** — Widersprüche zwischen Fakten, Banner in Lage, Marker in Handlungsbedarf, Ereignis in Verlauf (rote Markierung)
- **Gap Signals** — explizite Wissenslücken mit Lebensdauer, sichtbar im SignalStrip (Lage-Zone) + als Handlungsbedarf-Item, eigene Gap-Box im Dialog
- **Dependency Signals** — blockiert durch / wartet auf / hängt ab von, sichtbar im SignalStrip + als Handlungsbedarf-Item mit `ObjektTyp: "dependency"`
- **Outcome Signal** — minimales Zielbild pro Projekt (Erfolgskriterium, No-Go), sichtbar in Lage-Zone

## Stakeholder-Kontext

Stakeholder sind Lage-Bestandteil. Im UI als Popover mit Name/Rolle/Org erschließbar — nicht nur als Zähler.

## Universeller Input

Ein Eingangsmodul für: Datei, Freitext, Paste, Link, Sprache, Dialog-Antworten.

## Feedback und Korrektur

Allgegenwärtig auf jedem Objekt. Im Projekt-Screen mindestens auf Lagebild und Verlauf-Einträgen sichtbar (hover-revealed FeedbackButton).

## Interaktions-Konsistenz

Keine toten Buttons. Jede klickbare Fläche reagiert mindestens mit Toast-Brücke, bis das Dialog-Overlay (Phase 4) die echte Funktion liefert.
