# ENTITY-CORE — Architektur, Interaktion, Ausdruck & Kommunikation

> Kanonische Spezifikation des Kernmoduls „Entität" (Orb/Avatar = Gesicht der App).
> Eintritt: `NOW.md` (Workstream) · Begründung: `DECISIONS.md` (2026-06-02) · Layer-Regeln: `ARCHITECTURE.md`.
> Verbindliche Bewegungs-/Look-Vorlage: lokale Codebeispiele `../entitaet/` (s. Referenzwerte).

## Warum

Die Entität ist gewachsen statt entworfen (Platzhalter → Fremdcode → Charakterauswahl → 2 Coach-Schnipsel
→ verstecktes OrbLab). Zwei Problemkreise: **(A) Architektur** — die Entität besitzt ihren Zustand nicht
(`entityState` als `useState` in `Index.tsx`, von außen via `useIntake`/3 Realtime-Listener/Dialog-Effekt
gesetzt); keine State-Machine, keine Priorität; Verhalten verteilt; `Character` zu dünn; Voice/Orbit sind
Geschwister; null Tests. **(B) Interaktion/Ausdruck** — Eingebot dreifach (FacePill-2×2, InputOverlay,
HomePrompt); Orb→Box-Übergang krude; „weiches" Aussehen der Vorbilder nicht erreicht; Zustände nur per
Farbe unterschieden, keine eigenen Bewegungen.

**Ziel:** in sich geschlossenes Modul mit reinem testbarem Gehirn, Signal-Interface nach außen, formalem
Verhaltensvertrag und erstklassiger Interaktions-/Ausdrucks-Schicht. Ein Hook-Aufruf, überall mountbar
(zahlt direkt auf Vision-Säule 1 „Ein Eingang" + M2 „Entity überall präsent" ein).

## Entscheidungen (mit User abgestimmt)

- **Garantiertes Standardset** (jeder Charakter): State-Expression, Input-Affordanz (Composer + Auto-Detect,
  inkl. Drop), Speak (Voice), A11y-Shell. **Pointer-Follow NICHT garantiert** (optionale Bewegung).
- **Beide Charaktere bleiben** (Siri, FacePill), per `manifest` deklariert. 6 EntityStates unverändert
  → Presets/OrbLab/DB-Rows gültig.
- **A11y zentralisiert**; **Voice & State-Machine teilen einen Signal-Stream**.
- **Einstieg = Hybrid**: ruhende, immer sichtbare Composer-Leiste, die bei Fokus morpht; Orb = gleichwertiger
  Zweit-Einstieg. **Auto-Detect**: Text↔Link automatisch (via `detectInputType`); Datei/Sprache explizite
  Affordanzen. **Eine** Eingabefläche ersetzt HomePrompt + InputOverlay + FacePill-2×2.
- **Composer-Choreografie**: Orb bleibt + Panel morpht (FacePill darf Orb→Box); Mehrkanal-Feedback ruhig
  (Chip + Orb-Signatur + Label + `aria-live`); Zuklappen Blur-bei-leer, sonst offen, kein Timeout;
  Submit nur per Senden-Button (Enter = Umbruch).
- **Zwei-Achsen-Ausdruck**: Lifecycle-State (System) × Interaction-Mode (User) → drei Kanäle (Bewegung,
  Farbe, Sprache), alle aus einem Signal-Stream.
- **Bewegungs-Signaturen** je State UND Modus; **adaptive Intensität** (ruhig außen, lebendig beim Tun).
- **Eigene OKLCH-Palette je Modus** (`preset.mode.<mode>`, global). Voice vorerst fester Rhythmus
  (`amplitudeSource`-Haken für später).
- **Kommunikation** = dritte Säule: Hybrid-Vokabular (Anti-Repeat-Bank + `agent_reason`-LLM-Override),
  einstellbare Chattiness (`chattiness`, user-scope, Default ausgewogen), Proaktivität als reservierter Slot,
  `voiceProfile` je Charakter + Präsentations-Override.

## Verbindliche Referenzwerte — lokale Codebeispiele `../entitaet/`

Eleganz, smoothe Bewegung und Look sind **präzise** zu übernehmen (nicht neu erfinden, sondern in
`MOTION_SIGNATURES`/Tokens/Charakter-Render übersetzen).

**`Button_Orb/`** (Multi-State-Orb, uiverse `hot-turkey-65`) — Vorlage für Bewegungs-Signaturen & Orb-Aufbau:

- Geschichteter Orb: `core` (Glüh-Kern) · `glow`+`glow-secondary` (Blur-Halos) · `mesh` (conic, `mix-blend:overlay`,
  Spin 30/20/15 s) · `rings`+`rings--b` · `wave`×3 (Ripple) · `particles`. Eine `--tone`-Var treibt Farbe +
  `color-mix(in oklab,…)`-Schatten. Orb-Transition `transform/box-shadow 0.5s cubic-bezier(0.34,1.26,0.64,1)`,
  `background 0.6s ease`; Hover `scale(1.08)`, active `scale(0.96)` 0.12 s.
- Keyframes: **idle** `va-core-idle` 3.8–4 s `scale 1↔1.12`, `opacity 1↔0.95` · **listen** `va-core-listen` 1 s
  `scale 1↔1.22` + `va-ripple` 1.8 s (`scale 0.92→1.9`, `opacity 0.85→0`; 3 Wellen Delays 0/0.7/1.4 s) ·
  **process** `va-core-process` 1.3 s `scale 1.15 rotate 180°` + `va-tilt` 5 s (`rotateX/Y ±10°`) + Ringe
  `va-orbit` 7 s & 9 s reverse + Spinner 1.3 s `rotate 720°` · **speak** `va-core-speak` 0.38 s `scale 1→1.32`
  alternate + `va-bounce` 1.1 s `translateY -0.5em`.
- Referenz-Tones: idle `#06b6d4`, listen `#10b981`, process `#8b5cf6`, speak `#f59e0b` (bei uns aus OKLCH-Presets;
  Helligkeit/Sättigung dieser Vorlage treffen). Chip-Dock = unser State-/Mode-Switcher (aktiver Chip Gradient + Glow).

**`Orby/`** (FacePill-Quelle, uiverse `serious-mule-50`) — Vorlage für Morph & Weichheit:

- Morph: `content-card 12rem² → 260×160px`; Hülle `border-radius 3rem → 20px`; `card { transition: all 0.6s ease }`,
  `content-card/balls 0.3s ease`; Augen `opacity→0`, Chat `opacity 0→1`.
- Weichheit: `backdrop-filter: blur(50px)`; 4 Bälle je `6rem` `blur(30px)`, Farben `#9147ff`/`#34d399`/`#ec4899`/`#05e0f5`,
  Rotation 10 s (Hover pausiert). Augen `26×52px` `radius 16px`, Blink 10 s (`height 52→20→52`); Hover→Happy-SVG.
- Tilt: 5×3 Hot-Area, `perspective 1000px`, `rotateX/Y ±15°`, `translateZ 45px`. Submit-Gradient
  `linear-gradient(to top,#ff4141,#9147ff,#3b82f6)`.

**`Siri Orb/`** = aktueller `SiriOrb` (smoothui-Port, 6 Conic-Gradients, `@property --angle`, Dot-Mask). Bleibt „siri".

## Modulstruktur (gespiegelt an `src/lib/project/`)

`src/lib/entity/` = Gehirn/Vertrag (rein, testbar) · `src/components/entity/` = Präsentation.

```
src/lib/entity/
  types.ts · machine.ts(+test) · interaction.ts(+test) · signals.ts · signalMapping.ts(+test)
  deriveExpression.ts(+test) · capabilities.ts(+test)
  useEntityMachine.ts · useEntitySources.ts · useEntityPresets.ts
  EntityProvider.tsx · useEntity.ts (+ useEntityDetached)
  communication/ { types, utterances(+test), vocabulary(+test), policy(+test), useEntityCommunication, proactive(later) }
  index.ts  ← ÖFFENTLICHE OBERFLÄCHE (Barrel)

src/components/entity/
  EntityRoot.tsx (war Entity.tsx)
  behaviors/ { usePointerFollow, useA11yShell }
  input/ { EntityComposer, useComposer, composerTokens.css }
  expression/ { signatures (MOTION_SIGNATURES), useMotionSignature }
  presets/ { orbPresets(+test) }
  characters/ { types(+manifest/voiceProfile), registry, SiriCharacter, FacePillCharacter }
  visuals/ { SiriOrb, EntitySurface }
  satellites/ { AssetOrbit }
  EntityVoiceLine.tsx (war EntityVoice.tsx) · useSelectedCharacter.ts
```

### Achse 1 — Lifecycle-Machine

`EntityState = idle|hover|processing|review-ready|failed|busy-blocked` (unverändert). Reiner
`transition(state, signal) → state`: `intake.started→processing` (nicht aus failed); `intake.progress→processing`;
`intake.failed→failed` (höchste Priorität, von progress nicht stombar); `intake.empty→settle→idle` (1500 ms,
Timer in Sources); `review.ready→review-ready` (+1400 ms→`review.opened`, mit Auto-Open-Dedup `autoOpenedRef`);
`review.opened/dismissed→idle`; `drag.enter→hover` (ignoriert wenn busy); `drag.leave/drop→Basis`;
`user.acknowledge→idle` (aus failed); `system.blocked→busy-blocked`. Timer NICHT in der reinen Machine.

### Achse 2 — Interaction-Mode & Composer

`InteractionMode = resting|open|compose:note|compose:link|compose:file|compose:voice`. Hybrid-Composer:
ruhende Leiste → Morph bei Fokus; aggressives Auto-Detect (Text↔Link via `detectInputType`); Orb = Zweit-Einstieg.
Reine Mode-Logik in `interaction.ts`. **Composer ist orb-optional** (Home mit Orb-Feedback, ProjectScreen ohne).
**Migriert ALLE InputOverlay-Features**: 4 Modi, Paste-Preview (≥100 Z.), `useVoiceRecorder` (idle/recording/
levels/transcribing/done/error), `partitionFiles` (accepted/blocked/unknown + Toasts), `isUrl`, akzeptierte
Formate (PDF/DOCX/PPTX/Bilder/EML), `contextHint`.

### Ausdruck — `deriveExpression(state, mode) → ExpressionVM`

`{ state, mode, signature, palette, intensity, tone }`. Signaturen: States `pulse|rotate|burst|tremor|dim`,
Modi `listen|focus|scan|intake`. Lifecycle liefert Basis; bei `compose:*` + System idle/hover übernimmt
Modus-Signatur+Palette; processing/failed/review-ready dominieren. Intensität (Single-Source-Map):
`subtle: pulse,dim,focus` · `medium: rotate` · `strong: burst,tremor,listen,scan,intake`. `MotionSpec` je
Signatur (transform/filter/duration/easing/loop/amplitude/reducedMotion), charakter-überschreibbar; `useMotionSignature`
ist Single-Source für Bewegung + reduced-motion + `amplitudeSource`-Haken. Tokens: `--entity-ease-morph:
cubic-bezier(0.175,0.885,0.32,1.1)`, `--entity-ease-snap: cubic-bezier(0.34,1.56,0.64,1)`, Blur-Reveal,
Backdrop-Blur, Schatten-Halos. Modus-Paletten: `preset.mode.<mode>` (global), OrbLab States↔Modi-Achse.

### Kommunikation — dritte Säule

`deriveUtterance(trigger, context, profile, policy) → Utterance|null` (rein). Vokabular-Bank `intent→Varianten[]`
mit Slots, Anti-Repeat (geseedet, testbar); `agent_reason`-LLM-Override = höchste Priorität. Policy:
Priorität (`alert>ready>working>ambient`), Coalesce/Rate-Limit, Chattiness-Gating. `chattiness` (user, Default
balanced). `voiceProfile` je Charakter (Register, Vokabular-Bias, Präsentations-Override). Ersetzt `useEntityVoice`,
gespeist vom EINEN Signal-Stream. Modalität `text|text+voice` + `speak()`-Sink; TTS/Locale später.

### Verhaltensvertrag

`CharacterManifest { id, label, motion?, suppressCore?, expressionTune?, signatures?, voiceProfile? }`.
`composeCapabilities` = Standardset + Default-Motion − suppressCore + Manifest-Motion. Siri = leeres Manifest;
FacePill = `suppressCore:[pointer-follow]`, `motion:[tilt-3d,eyes,custom-morph]`, STATE_TUNE→`expressionTune`. 3. Charakter: neue Datei + eine Registry-Zeile + `CharacterId`-Erweiterung.

### EIN Gehirn (Singleton-Provider)

`EntityProvider` mountet Machine+Sources+Presets+Kommunikation EINMAL (eine Subscription). `useEntity()` liest
Context → `{ vm, controller }`. Mehrere `<EntityRoot>` (Home, Sidebar-Mini, Overlay) teilen den State. OrbLab
nutzt `useEntityDetached` (lokal, keine Sources). Andere Module reden via `controller.signal(entitySignal.…())`
(Input) und `vm`/`controller` (Output) — **nie** `setEntityState` o.ä.

## Modulgrenze & Ordner-Hygiene

1. **Nur Entity-Kern im Ordner.** 7 Fremd-Komponenten verlassen `components/entity/` (s. u.).
2. **Öffentliche API nur via Barrel** `src/lib/entity/index.ts` (EntityProvider, useEntity, useEntityDetached,
   EntityRoot, EntityComposer, Typen EntityState/InteractionMode/EntitySignal+Factory/EntityViewModel/
   EntityController/CharacterId). Alles andere modul-intern; **keine Tiefimporte** von außen.
3. **Input/Output statt Hardcoding.** Input = Signale (oder Provider zieht selbst aus Realtime). Output = `vm`/
   `controller`. Verboten: externes `setEntityState`/Preset-Setzen/DOM-Reingreifen; quer durchgereichte Callbacks.
4. Optional ESLint `no-restricted-imports` auf `@/lib/entity/*` & `@/components/entity/*` (außer Barrel).

## Bestandsaufnahme — Datei-Schicksale (Stand HEAD `0762049`)

| Datei                                                                                                                                                                                                                                                                  | Schicksal                                                                       |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `Entity.tsx`                                                                                                                                                                                                                                                           | → `EntityRoot.tsx`; Pointer-Follow→`behaviors/`, State→Provider                 |
| `EntityVoice.tsx`                                                                                                                                                                                                                                                      | → `EntityVoiceLine.tsx`                                                         |
| `lib/voice/useEntityVoice.ts`                                                                                                                                                                                                                                          | ersetzt durch `lib/entity/communication/`                                       |
| `EntitySurface.tsx`, `SiriOrb.tsx`                                                                                                                                                                                                                                     | → `visuals/`                                                                    |
| `orbPresets.ts`                                                                                                                                                                                                                                                        | → `presets/` (+ Modus-Paletten, + Tests); Hook → `lib/entity/useEntityPresets`  |
| `characters/*`                                                                                                                                                                                                                                                         | bleiben; `types`/`Character` + `manifest`/`voiceProfile`                        |
| `InputPills.tsx`/`INPUT_MODES`                                                                                                                                                                                                                                         | Modus-Def bleibt; 2×2-Render entfällt                                           |
| `InputOverlay.tsx`                                                                                                                                                                                                                                                     | ersetzt durch `input/EntityComposer.tsx` (Funktionalität vollständig migrieren) |
| `AssetOrbit.tsx`                                                                                                                                                                                                                                                       | → `satellites/`                                                                 |
| `HomeDropOverlay.tsx`                                                                                                                                                                                                                                                  | bleibt                                                                          |
| `home/HomePrompt.tsx`                                                                                                                                                                                                                                                  | gelöscht (im Composer aufgegangen)                                              |
| `OrbLab.tsx` (+CharacterTile, StaticStatePreview)                                                                                                                                                                                                                      | bleiben; Barrel-Importe; `useEntityDetached`; States↔Modi                       |
| **RAUS aus `entity/`** → `home/`: `AccountDrawer`, `MobileNavSheet`, `SideGrid`, `IntakeSessionsPanel` · → `project/`: `ProjectTile`, `CreateProjectDialog`. `RecentAssets` = abgelöster Altcode (ersetzt durch `IntakeSessionsPanel`, kein Importeur) → **gelöscht**. |

**Call-Sites:** `Index.tsx` (entfernt State/Listener/Effekt/Voice/HomePrompt/InputOverlay/AssetOrbit-Geschwister →
`useEntity()`+`<EntityRoot>`; `EntityProvider` um Routen) · `OrbLab.tsx`+Tiles (Barrel, `useEntityDetached`) ·
`AppSidebar.tsx` (`<Entity size=56/>` → `<EntityRoot variant=mini>`) · `ProjectScreen.tsx` (Composer orb-abwesend,
`useIntake({projectId})`) · `useIntake.ts` (`setEntityState`-Param raus).

**Persistenz-Scopes** (`useNamespace("orb")`): `preset.*` + `preset.mode.*` = global; `character` + `chattiness` = user.

## Phasen (je einzeln auslieferbar)

- **A — Ordner-Hygiene** (mechanisch): 7 Fremd-Dateien raus; Importpfade; CI grün. ✅ 2026-06-02 (auf dev)
- **0 — Gehirn-Gerüst** (additiv): `lib/entity/{types,machine,interaction,signals,signalMapping,deriveExpression,
capabilities}` + Tests + Barrel. ✅ 2026-06-02 (auf dev)
- **1 — Provider + Sources** (Home): Realtime/Intake/Dialog → `useEntitySources` (eine Subscription, Dedup+Timer);
  Index adoptiert `useEntity()`. **`EntityRail` (M2) wird erster `useEntity()`-Konsument** — nicht daran vorbeibauen.
- **2 — Orchestrator umbenennen + Visuals verschieben** (visuell identisch).
- **3 — Capability-Vertrag + A11y** (visuell identisch).
- **4 — Ausdrucks-Engine** (visuelles Upgrade): Signaturen, Intensität, Modus-Paletten, OrbLab-Achse.
- **5 — Unified Composer** (eine Eingabefläche; Index + ProjectScreen; alle InputOverlay-Features).
- **6 — Kommunikation + Orbit + ein Signal-Stream**.
- **7 — Mehrfach-Mount-Reuse**: dieselbe `useEntity()`-Quelle an weiteren Mount-Punkten (z.B. `EntityRail` auf
  jedem Screen) — beweist die Architektur. **Kein ⌘+Space-Overlay** (vom Treiber gestrichen; M2 = persistente `EntityRail`).

## Tests (Vitest, Vorbild `src/lib/project/`)

`machine` (Matrix/Priorität), `interaction` (Auto-Detect-Mapping), `signalMapping`, `deriveExpression`
(state×mode→Signatur/Palette/Intensität), `capabilities`, `orbPresets` (in-range + Modus-Paletten-Merge),
`utterances/vocabulary` (Anti-Repeat geseedet + agent_reason-Override), `policy` (Priorität/Chattiness).

## Risiken (Kurzform)

Resample-on-transition-Flicker (presets-Ref-Disziplin); rAF-Feedback-Loop (pointer-follow vs. FacePill-restRect,
durch `suppressCore` getrennt); reduced-motion Single-Source; A11y-Regression FacePill-Picker; One-Shot-Signaturen
müssen neu zünden (key-Bump); Singleton-Provider genau einmal (OrbLab detached); ProjectScreen-Composer ohne Orb;
Composer↔Ausdruck-Echtzeit-Kopplung (+`aria-live`); Vokabular-Anti-Repeat seedbar; Chattiness/Proaktivität Nerv-Risiko.
