# PLAN — Was kommt

> Vorwärts-Sicht (Zukunft). Gegenwart: `NOW.md` · Begründungen: `DECISIONS.md` · M4-Detail: `m4-spec.md` · Entity-Core-Detail: `entity-core.md`.

**Sequenz:** M1 ✅ → M2 ✅ → M3 ✅ → **Entity-Core ✅** → **UI-Politur (aktiv)** → **M4 (priorisiert)** → **Wave 3** → Langfrist-Backlog (L1–L15).

---

## Erledigte Milestones

- ✅ **M1 — Provenance & Empfehlung** (2026-05-30/06-01) — Empfehlung-First-Drilldown, Empfehlungs-Vertrag über Konflikt/Gap/Dependency/Entscheidung. Details: `DECISIONS.md`.
- ✅ **M2 — Entität bleibt präsent** (2026-06-03) — `EntityRail` persistent, `AtmosphereStripe`, Retry, Realtime-Pipeline. Details: `DECISIONS.md`.
  - ✅ **Home-Center-Rückbau erledigt** (2026-06-04): Entität wieder zentral (`EntityRoot`), `EntityRail` nur noch auf ProjectScreen, `ImpactPipelinePanel` als rechtes Aside.
- ✅ **M3 — Antwort-Loops** (2026-06-03) — Feedback flächendeckend (Lage+Verlauf+Substanz), Verlauf-Notiz, Impact-Pfeile. Details: `DECISIONS.md`.

---

## Entity-Core (Kernmodul-Refactor) — Fundament für M2-Präsenz + M4-Identität

Die Entität (Gesicht der App) wird zum in sich geschlossenen Modul: reines Gehirn, Signal-Interface, Singleton-Provider, Hybrid-Composer. Macht „Ein Eingang" (Säule 1) sauber und die persistente Entität (`EntityRail`) zu einem `useEntity()`-Konsumenten. Phasen einzeln auslieferbar, visuell zunächst identisch. **Volle Spec: `docs/entity-core.md`.**

- **A** Ordner-Hygiene (7 Fremd-Dateien raus aus `components/entity/`, `RecentAssets` gelöscht) — ✅ 2026-06-02
- **0** Gehirn-Gerüst (`src/lib/entity/` machine/signals/interaction/signalMapping/deriveExpression/capabilities + Barrel + 36 Tests) — ✅ 2026-06-02
- **1–4** Provider+Sources · Orchestrator/Visuals · Capability-Vertrag+A11y · Ausdrucks-Engine — ✅ 2026-06-04
- **5–7** Unified Composer · Kommunikation (ein Signal-Stream) · Mehrfach-Mount-Reuse — ✅ 2026-06-04. Kein ⌘+Space-Overlay (gestrichen).

**→ Entity-Core vollständig abgeschlossen.**

---

## Entity-UI & Review-Flow — Politur (aktiv)

> Quelle: Live-Test-Feedback (Composer-Morph, Orb, Voice, Drop, Verarbeitung, Review/Zuordnung). **Grounding-Pflicht — Originale studieren, nicht improvisieren:**
>
> - **`../ui_design/shell/`** — Home/Composer-Ziel (`Tag _ Text eingef_gt.png` = Karte + Inline-Entity-Highlights + „ERKANNT"-Streifen + Aktionen _Offen lassen · Erst speichern · Review öffnen →_ + AssetOrbit-Ring + rechtes PIPELINE-Panel).
> - **`../ui_design/Overlays/`** — Drill-Ziel (`A_Batch`, `B_Konflikt expanded`, `F_Gap` als .html+.png): Größenhierarchie, Führung, Kontrast.
> - **`../entitaet/Orby/Orby.css`** — Morph-**Technik**: explizite `width`/`height`+`border-radius` `transition: all .6s` (kein `max-height`!), Glas `blur(50px)`.
> - **`docs/redesign/prototype/dialog-overlay.jsx`** + `tokens.css` — Drill-CSS/Token-Referenz.

**Erledigt:** Zuordnung-Render+editierbarer Titel · Voice auf ProjectScreen · escalate-Session-Progress · **Zuordnung select→confirm** (kein Sofort-Commit beim Klick).

**P0 — kaputt / Daten-Integrität**

- ✅ Sofort-Commit bei Zuordnung → select→confirm
- ✅ **Busy-Lock-Bug** (`354eec8`, dev) — `review_ready` mappte auf `null` → kein idle-Signal. Neues `intake.done` (nur `processing→idle`, lässt `review-ready`/`failed`), via 1500 ms-Grace. Reorder-Edge (spätes `running` nach `review_ready`) → gehört zur Queue/activeCount (Batch 3).
- ☐ **Voice verifizieren** — Diagnose: **kein Frontend-Defekt** (Mount+Trigger-Kette intakt), Ursache vermutl. Realtime-upstream → Ops-/Backend-Prüfung, nicht blind coden.

**P1 — Kern-Gefühl & Führung**

- ✅ **Morph neu (Orby-Technik)** (`47194bb`, dev) — Shell ist die morphende Box (explizite `height` 3.1↔17rem + `radius` + `max-width` auf einer Kurve); Ruheleiste/Panel absolut + Opacity-Crossfade; `max-height` raus. Reines CSS. _Optik live prüfen._
- ☐ **Drill-Führung & Hierarchie** — systemisch über `renderGeneric()` (alle Box-Typen), Größenkontraste + führende Frage + Banner (Vorlage `dialog-overlay.jsx`/Overlays).
- ☐ **„Was wurde verstanden" zeigen** — Quelle + Delta + Beleg vor/bei Entscheidung (PRODUCT-Versprechen); Drill-Header erweitern (`loadSession` liefert `deltaType`).
- ☐ **Verarbeitung = echte Queue** — Busy-Hard-Lock raus, weiter droppen, AssetOrbit-Ring zeigt Queue (`Index.tsx`/`satellites/AssetOrbit.tsx`).
- _Abgrenzung:_ „ERKANNT"-Streifen braucht Pipeline-Daten (nach Intake) → spätere Stufe.

**P2 — visuelle Politur**

- ☐ Kontrast/Farben durchgängig (`--d-hair`→`--d-hair-2`+; blasse Flächen) · ☐ Orb-Idle-Atmung dämpfen (`expression/signatures.ts`) · ☐ Drop-Hinweis-Position (`HomeDropOverlay` relativ zur Orb-Bühne).

**Infra:** CI rot (`bun --frozen-lockfile` vs `bun-version:latest` — `qa.yml` pinnen/Lockfile neu) · Vercel dev-Preview aktivieren · Deploy je Batch per `dev → main`.

---

## M4 — Bedeutungs-Integrität & Entity-Identität

Macht das Cross-Project-Versprechen (Säule 2) erst echt. **Volle Detailspec mit Code-Pfaden: `docs/m4-spec.md`.** Begründungen: `DECISIONS.md` (2026-06-03).

**Build-Reihenfolge:** S0 → S1 → S2 → **S8** → S3 → S4 → S5 → S6 → S7 (später) → S9 (später).

| Stufe  | Kurz                                                                                                          | Status    |
| :----- | :------------------------------------------------------------------------------------------------------------ | :-------- |
| **S0** | Beleg-Verankerung (Zitat→Segment-Referenz, Modell+Prompt-Version in `provenance`, Beleg an jeder Review-Card) | aktiv     |
| **S1** | Risk-Gate im Silent-Commit (`isRisky()` — nie still bei decision/risk/replace/Impact)                         | geplant   |
| **S2** | „Anders"/Related-not-same (Identitäts-Aktion: nicht dieselbe Entität)                                         | geplant   |
| **S8** | Aktions-Set: Needs-source + **Escalate** (escalate-Flag verdrahtet ✅ 2026-06-04)                             | teilweise |
| **S3** | Entity-Identitäts-Schicht (`entities` + `entity_aliases`, der Kern)                                           | Spec      |
| **S4** | Entity-Resolver ersetzt `linker.ts` (Graphiti-primär + lokaler Guard)                                         | Spec      |
| **S5** | Feedback-Schleife (Resolver liest `entity_link_rejections`, Reject-Taxonomie)                                 | Spec      |
| **S6** | Cross-Project-Identitäts-Signal UI („erscheint in 3 Projekten") — der Magic-Moment                            | Spec      |
| **S7** | Einheitlicher Fakt-Status (`factStatus()`-Ableitung) — später                                                 | Spec      |
| **S9** | Pre-commit Supersede/Contradict-Emission — später                                                             | Spec      |

---

## Wave 3 — Lebendiges System (nach M4)

> Quelle: 10x-Analyse (2026-05-18, aufgelöst). Diese drei machen den Projektzustand **lebendig** und holen den Nutzer zurück — auf bestehenden Flächen (EntityVoice, AtmosphereStripe, EntityRail), **kein Dashboard**. Build-Reihenfolge: LS-1 → LS-3 → LS-2 (billig zuerst, Pulse zuletzt wegen Noise-Design).

- **LS-1 — Wissen altert (Confidence Decay).** _Was:_ Fakten, die lange nicht revalidiert wurden, markiert das System selbst als „prüfen". _Auftritt:_ sanftes Prüf-Item im **Handlungsbedarf** („Diese Entscheidung ist 8 Monate alt — noch gültig?"); dezentes Alters-Zeichen in **Substanz** (gedämpfte Opazität, kein Rot). _Ansatz:_ `pg_cron` auf `canonical_facts` (Alter + letzter Review-Timestamp) → `gap_signal` Typ `stale_fact`; nährt M4-S7 (`needs_review`). _Default:_ Fakt > 120 Tage ohne Revalidierung (pro `fact_type` justierbar), nur decision/deadline (Anti-Noise). _Aufwand:_ niedrig.
  - _Später-Erweiterung:_ **periodischer Projekt-Lint** — ein ganzprojekt-Health-Pass (verwaiste Entities, stale Facts, fehlende Cross-Refs), nicht nur event-getrieben beim Commit. Andockend an LS-1 + M4-S7-Status. Quelle: Inbox/„LLM-Wiki-Pattern" (Lint als first-class Operation).
- **LS-2 — Project Pulse (das System kommt zu dir).** _Was:_ cogni meldet sich von selbst, wenn ein Projekt verrottet. _Auftritt:_ **Entität + EntityVoice** beim App-Open — ruhige Eigen-Aussage („In Projekt Y wartet seit 14 Tagen eine Entscheidung"), kein Toast/Banner. _Ansatz:_ täglicher `pg_cron` pro Projekt: Gap ohne Aktivität > 14 T · Konflikt ohne Commit > 7 T · letzte Nutzeraktion > 21 T → Push-Event in die EntityVoice-Realtime-Queue. _Harte Schranke:_ **max. 1 Alert / Projekt / Woche.** _Aufwand:_ mittel; Design-Kern = Noise-Management. _Abhängigkeit:_ stabiler Projektzustand.
  -->dazu UI Idee - cogni meldet sich wird spielerisch im ui gelöst über "GEdanken" überlegte Gedanken ploppen aus Entität schwebend in den raum (runde Sprech bubbles) , wenn sie angeklickt werden öffnet sich der Gesprächs Drill mit dem Gedanken (frage, aussage, whatever..), kann skipped (bubble bleibt) oder beantwortet werden (bubble platzt verschwindet) - das ganze > NUR home
- **LS-3 — Cross-Project Review-Badge.** _Was:_ immer sichtbar, wie viele Erkenntnisse projektübergreifend auf Review warten. _Auftritt:_ ruhige Zahl an der **EntityRail/Sidebar** oder als Entitäts-Zustand („3 offene Erkenntnisse warten") — **kein** lautes rotes Badge. _Ansatz:_ Cross-Project-Query auf `review_cases` (`box_state = 'proposed'`) + 1 dezente Komponente. _Aufwand:_ sehr niedrig. _Vorsicht:_ leise Intelligenz, nicht Notification-Ästhetik.

---

## Langfristig (bewusst zurückgestellt)

| #   | Aufgabe                                                                     | Trigger                                                                                                                                                                                                                                                                                                                     |
| --- | --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| L1  | LLM-Heuristiken in Detektoren                                               | Wenn deterministischer Recall zu niedrig wird                                                                                                                                                                                                                                                                               |
| L2  | React Query (Caching + Mutations)                                           | Wenn Realtime + manuelle Re-Fetches racen                                                                                                                                                                                                                                                                                   |
| L3  | Reference-Token-Auflösung                                                   | Wenn Dependency-Detector zu viele False Positives                                                                                                                                                                                                                                                                           |
| L4  | Voice/Mail-Sync (V2) — inkl. Email-Direct-Connect (10x #4, Adoptions-Wette) | Nach Prototyp-Freigabe; stärkster Adoptions-Hebel, senkt Intake-Hemmschwelle                                                                                                                                                                                                                                                |
| L5  | Dokument-/Quellen-Preview + Versionshistorie                                | `buildDokumentSession`/`buildSourceSession` „folgt"-Versprechen einlösen                                                                                                                                                                                                                                                    |
| L6  | AOL-Lernring: `/aol/confirm` → Graphiti (TODO D4)                           | Wenn die Reasoning-Schicht aus Reviews lernen soll (Invalidation bei Reject + Decision-Kontext). Mirror schreibt Fakten bereits — offen ist der LangGraph-Ring. 10x #1                                                                                                                                                      |
| L7  | Export „Project Briefing" (Markdown/PDF)                                    | Wenn externer Output / ROI-Nachweis gebraucht wird; liest bestehendes ViewModel. 10x #6                                                                                                                                                                                                                                     |
| L8  | Projekt-Gesundheits-Score                                                   | Wenn Multi-Projekt-Triage akut wird; baut auf `AtmosphereStripe`/`deriveSignal`. 10x #10                                                                                                                                                                                                                                    |
| L9  | Async AOL-Run + PostgresSaver (TODO D2)                                     | Wenn große Dokumente / parallele Uploads Timeouts erzeugen. 10x #2                                                                                                                                                                                                                                                          |
| L10 | Dokument-Diff / Version-Delta                                               | Bei iterativen Versions-Uploads (Angebote/Specs/Protokolle). 10x #9                                                                                                                                                                                                                                                         |
| L11 | Keyboard-Nav J/K im BatchReview                                             | Bei Review-Volumen / Power-Usern (~20 Z.). 10x #7                                                                                                                                                                                                                                                                           |
| L12 | AOL `/health` echte Reachability-Checks                                     | Beim nächsten AOL-Debugging (kein User-Value). 10x #14                                                                                                                                                                                                                                                                      |
| L13 | Wöchentlicher Digest (cron + Email)                                         | Nach 3+ Monaten echter Nutzung. 10x #15                                                                                                                                                                                                                                                                                     |
| L14 | Demo-Daten entfernen + sauberer Leer-State                                  | Vor erstem echten User-Test (`demoProject(s).ts` noch aktiv). 10x #12                                                                                                                                                                                                                                                       |
| L15 | **Query-Layer („Frag dein Projekt")**                                       | Strategischer Horizont: konversationelle, **belegte** Antworten aus kompiliertem Projektwissen (Provenance S0 + M4-Entities + temporaler Graph). cogni ingestiert heute exzellent, kann aber nichts gefragt werden — die fehlende dritte Operation. Erst nach M4 (Identität + Beleg stehen). Quelle: Inbox/LLM-Wiki-Pattern |
