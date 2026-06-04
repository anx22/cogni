// =============================================================================
//  OrbLab — Konfigurations-Panel für die Entity (kein interaktiver Screen).
//  2-Spalten: links sticky Vorschau (interaction="self" → kein Click/Overlay),
//  rechts Charakter/State/Modus + Editor (Farben · Palette-Generator · Animation ·
//  Punkt-Halo) + benannte Preset-Bibliothek. Deterministisch (kein Würfeln);
//  Farb-Engine OKLCH, Labels in HSL-Begriffen.
// =============================================================================

import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { RotateCcw, Sparkles, Save, Trash2, X } from "lucide-react";
import EntityRoot from "@/components/entity/EntityRoot";
import { CHARACTER_LIST } from "@/components/entity/characters/registry";
import { useSelectedCharacter } from "@/components/entity/useSelectedCharacter";
import { useOrbSizeTier } from "@/components/entity/useOrbSizeTier";
import {
  ORB_SIZE_TIERS,
  ORB_SIZE_TIER_LABEL,
  ORB_TIER_PREVIEW_SIZE,
} from "@/components/entity/presets/orbSizeTier";
import { useOrbLibrary } from "@/components/entity/presets/useOrbLibrary";
import { CharacterTile } from "./OrbLab/CharacterTile";
import { StaticStatePreview } from "./OrbLab/StaticStatePreview";
import {
  useOrbPresets,
  samplePreset,
  generatePalette,
  ORB_PRESETS_DEFAULT,
  INTERACTION_MODES,
  type EntityState,
  type OrbPresetRange,
  type ColorRange,
  type Range,
  type Harmony,
  type SampledPreset,
  type SurfaceBlend,
  type SurfaceRange,
} from "@/components/entity/presets/orbPresets";
import type { InteractionMode } from "@/lib/entity";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatRelative } from "@/lib/format/relativeTime";
import { cn } from "@/lib/utils";

const STATES: EntityState[] = [
  "idle",
  "hover",
  "processing",
  "review-ready",
  "failed",
  "busy-blocked",
];

type ColorKey = "bg" | "c1" | "c2" | "c3";
const COLOR_KEYS: ColorKey[] = ["bg", "c1", "c2", "c3"];

const HARMONIES: { value: Harmony; label: string }[] = [
  { value: "complementary", label: "Komplementär" },
  { value: "analogous", label: "Analog" },
  { value: "triadic", label: "Triadisch" },
  { value: "tetradic", label: "Tetradisch" },
  { value: "monochrome", label: "Monochrom" },
];

// OKLCH-Chroma (0–0.4) ↔ HSL-„Sättigung" (0–100 %).
const CHROMA_MAX = 0.4;
const chromaToSat = (c: number) => (c / CHROMA_MAX) * 100;
const satToChroma = (s: number) => (s / 100) * CHROMA_MAX;

// ---- Helpers ---------------------------------------------------------------

const centerOf = (r: Range): number => (r.min + r.max) / 2;
const exact = (v: number): Range => ({ min: v, max: v });
const oklchStr = (l: number, c: number, h: number) =>
  `oklch(${l.toFixed(2)}% ${c.toFixed(3)} ${h.toFixed(1)})`;

// ---- UI-Bausteine ------------------------------------------------------------

interface ValueRowProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  precision?: number;
  hint?: string;
  onChange: (v: number) => void;
}
const ValueRow = ({
  label,
  value,
  min,
  max,
  step,
  precision = 1,
  hint,
  onChange,
}: ValueRowProps) => {
  const [local, setLocal] = useState(value);
  useEffect(() => setLocal(value), [value]);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-[11px] text-muted-foreground font-normal tracking-wide">
          {label}
        </Label>
        <span className="text-[11px] text-foreground/80 tabular-nums">
          {local.toFixed(precision)}
        </span>
      </div>
      <Slider
        min={min}
        max={max}
        step={step}
        value={[local]}
        onValueChange={([v]) => {
          setLocal(v);
          onChange(v);
        }}
      />
      {hint && <p className="text-[10px] text-muted-foreground/70 leading-snug">{hint}</p>}
    </div>
  );
};

interface ColorBlockProps {
  title: string;
  range: ColorRange;
  onChange: (next: ColorRange) => void;
}
const ColorBlock = ({ title, range, onChange }: ColorBlockProps) => {
  const lv = centerOf(range.l);
  const cv = centerOf(range.c);
  const hv = centerOf(range.h);
  const swatch = oklchStr(lv, cv, hv);
  return (
    <Card className="bg-card/40 border-border/50">
      <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
        <CardTitle className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
          {title}
        </CardTitle>
        <span
          className="h-5 w-5 rounded-full border border-white/10 shadow-inner"
          style={{ background: swatch }}
          aria-hidden
        />
      </CardHeader>
      <CardContent className="space-y-3">
        <ValueRow
          label="Farbton (Hue)"
          value={hv}
          min={0}
          max={360}
          step={1}
          onChange={(h) => onChange({ ...range, h: exact(h) })}
        />
        <ValueRow
          label="Sättigung"
          value={chromaToSat(cv)}
          min={0}
          max={100}
          step={1}
          precision={0}
          onChange={(s) => onChange({ ...range, c: exact(satToChroma(s)) })}
        />
        <ValueRow
          label="Helligkeit"
          value={lv}
          min={0}
          max={100}
          step={1}
          precision={0}
          onChange={(l) => onChange({ ...range, l: exact(l) })}
        />
      </CardContent>
    </Card>
  );
};

const SavedIndicator = ({ at }: { at: number | null }) => {
  const [, force] = useState(0);
  useEffect(() => {
    const i = window.setInterval(() => force((n) => n + 1), 15_000);
    return () => window.clearInterval(i);
  }, []);
  if (!at) return null;
  return (
    <span className="text-[11px] text-muted-foreground">
      Gespeichert · {formatRelative(new Date(at).toISOString())}
    </span>
  );
};

// ---- Page --------------------------------------------------------------------

const OrbLab = () => {
  const navigate = useNavigate();
  const { presets, loaded, setPreset, resetPreset } = useOrbPresets();
  const { tier, setTier } = useOrbSizeTier();
  const library = useOrbLibrary();

  const [state, setState] = useState<EntityState>("idle");
  const [activeMode, setActiveMode] = useState<InteractionMode>("resting");
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const { characterId, setCharacterId } = useSelectedCharacter();

  // Palette-Generator
  const [baseColor, setBaseColor] = useState<ColorRange>(ORB_PRESETS_DEFAULT.idle.c1);
  const [harmony, setHarmony] = useState<Harmony>("analogous");
  // Bibliothek
  const [presetName, setPresetName] = useState("");

  const current = presets[state];
  const sample: SampledPreset = useMemo(() => samplePreset(current), [current]);
  const previewPx = Number.parseInt(ORB_TIER_PREVIEW_SIZE[tier], 10) || 240;

  // Esc → zurück zur Hauptapp
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") navigate("/");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);

  const touch = () => setSavedAt(Date.now());
  const update = (patch: Partial<OrbPresetRange>) => {
    setPreset(state, { ...current, ...patch });
    touch();
  };
  const updateColor = (k: ColorKey, next: ColorRange) =>
    update({ [k]: next } as Partial<OrbPresetRange>);
  const updateSurface = (patch: Partial<SurfaceRange>) =>
    update({ surface: { ...current.surface, ...patch } });
  const reset = () => {
    resetPreset(state);
    touch();
  };

  const applyGenerated = () => {
    const c = generatePalette(
      { l: centerOf(baseColor.l), c: centerOf(baseColor.c), h: centerOf(baseColor.h) },
      harmony,
    );
    update({ c1: c.c1, c2: c.c2, c3: c.c3 });
  };

  const surface = current.surface;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-screen bg-background text-foreground">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-6 lg:py-8 flex flex-col gap-6">
          {/* Header */}
          <header className="flex items-center justify-between gap-4 border-b border-border/40 pb-4">
            <div className="flex items-baseline gap-3">
              <h1 className="text-2xl tracking-tight font-light">Orb Lab</h1>
              <Badge variant="outline" className="text-[10px] font-normal text-muted-foreground">
                {loaded ? "DB" : "lädt …"}
              </Badge>
              <span className="text-[11px] text-muted-foreground hidden md:inline">
                Konfiguration wirkt sofort in der Hauptapp
              </span>
            </div>
            <div className="flex items-center gap-3">
              <SavedIndicator at={savedAt} />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    asChild
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  >
                    <Link to="/" aria-label="Schließen">
                      <X className="h-4 w-4" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Schließen (Esc)</TooltipContent>
              </Tooltip>
            </div>
          </header>

          {/* Charakter-Auswahl — statische Tiles */}
          <section className="space-y-3">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Charakter
            </div>
            <div className="flex flex-wrap gap-3">
              {CHARACTER_LIST.map((c) => (
                <CharacterTile
                  key={c.id}
                  id={c.id}
                  active={characterId === c.id}
                  onSelect={(id) => {
                    setCharacterId(id);
                    touch();
                  }}
                />
              ))}
            </div>
          </section>

          {/* 2-Spalten: Live-Vorschau (sticky) | States + Editor */}
          <div className="grid gap-6 lg:grid-cols-[420px_1fr] items-start">
            {/* Live-Vorschau */}
            <Card className="bg-card/30 border-border/50 lg:sticky lg:top-6">
              <CardContent className="flex flex-col items-center gap-5 py-8">
                <div
                  className="flex items-center justify-center"
                  style={{ minHeight: previewPx + 40 }}
                >
                  <EntityRoot
                    state={state}
                    mode={activeMode}
                    size={ORB_TIER_PREVIEW_SIZE[tier]}
                    presetOverride={sample}
                    character={characterId}
                    interaction="self"
                  />
                </div>

                <div className="flex items-center gap-2 flex-wrap justify-center">
                  <Badge variant="outline" className="font-normal">
                    {state}
                    {activeMode !== "resting" && (
                      <span className="text-muted-foreground"> × {activeMode}</span>
                    )}
                  </Badge>
                  <Badge variant="outline" className="font-normal tabular-nums">
                    {sample.duration.toFixed(2)}s
                  </Badge>
                </div>

                {/* Größe — Klein / Mittel / Groß (viewport-relativ für Home) */}
                <div className="w-full max-w-[300px] space-y-2 pt-2 border-t border-border/30">
                  <Label className="text-[11px] text-muted-foreground font-normal">
                    Größe auf der Startseite
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {ORB_SIZE_TIERS.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          setTier(t);
                          touch();
                        }}
                        className={cn(
                          "rounded-lg border py-2 text-xs tracking-wide transition-colors",
                          tier === t
                            ? "border-primary/60 bg-primary/20 text-primary"
                            : "border-border/50 bg-card/40 text-muted-foreground hover:text-foreground hover:border-border",
                        )}
                      >
                        {ORB_SIZE_TIER_LABEL[t]}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground/70 leading-snug">
                    Bezieht sich auf die Home-Darstellung relativ zum Viewport. Im Lab nur Vorschau.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Rechts: State + Modus + Editor + Bibliothek */}
            <div className="space-y-6">
              {/* State-Auswahl als Standbild-Tiles */}
              <section className="space-y-3">
                <div className="flex items-baseline justify-between">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    States
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    Wähle einen State, um ihn zu editieren
                  </span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {STATES.map((s) => (
                    <StaticStatePreview
                      key={s}
                      state={s}
                      characterId={characterId}
                      preset={presets[s] ?? ORB_PRESETS_DEFAULT[s]}
                      active={state === s}
                      onSelect={setState}
                    />
                  ))}
                </div>
              </section>

              {/* Modus-Achse — prägt die Bewegungs-Signatur (nur Live-Vorschau) */}
              <section className="space-y-3">
                <div className="flex items-baseline justify-between">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Modus
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    Achse 2 — wirkt auf die Signatur, solange der State ruhig ist
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {INTERACTION_MODES.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setActiveMode(m)}
                      className={cn(
                        "rounded-lg border px-3 py-1.5 text-xs tracking-wide transition-colors",
                        activeMode === m
                          ? "border-primary/60 bg-primary/20 text-primary"
                          : "border-border/50 bg-card/40 text-muted-foreground hover:text-foreground hover:border-border",
                      )}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </section>

              {/* Editor in Tabs */}
              <section className="space-y-3">
                <div className="flex items-baseline justify-between">
                  <h2 className="text-sm tracking-wide text-foreground/90">
                    Editor <span className="text-muted-foreground">— {state}</span>
                  </h2>
                  <Button size="sm" variant="ghost" onClick={reset} className="h-7 text-xs">
                    <RotateCcw className="h-3 w-3 mr-1.5" />
                    Default
                  </Button>
                </div>

                <Tabs defaultValue="palette">
                  <TabsList className="bg-card/40 p-1">
                    <TabsTrigger
                      value="palette"
                      className="text-xs data-[state=active]:bg-primary/20"
                    >
                      Palette
                    </TabsTrigger>
                    <TabsTrigger
                      value="colors"
                      className="text-xs data-[state=active]:bg-primary/20"
                    >
                      Farben
                    </TabsTrigger>
                    <TabsTrigger
                      value="animation"
                      className="text-xs data-[state=active]:bg-primary/20"
                    >
                      Animation
                    </TabsTrigger>
                    <TabsTrigger value="halo" className="text-xs data-[state=active]:bg-primary/20">
                      Punkt-Halo
                    </TabsTrigger>
                  </TabsList>

                  {/* Palette-Generator */}
                  <TabsContent value="palette" className="mt-4">
                    <div className="grid gap-3 md:grid-cols-2">
                      <ColorBlock title="Basisfarbe" range={baseColor} onChange={setBaseColor} />
                      <Card className="bg-card/40 border-border/50">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                            Harmonie
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <Select value={harmony} onValueChange={(v) => setHarmony(v as Harmony)}>
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {HARMONIES.map((h) => (
                                <SelectItem key={h.value} value={h.value}>
                                  {h.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <p className="text-[10px] text-muted-foreground/70 leading-snug">
                            Erzeugt c1/c2/c3 farbmetrisch aus der Basisfarbe (Hue-Rotation). Der
                            Hintergrund (bg) bleibt unberührt.
                          </p>
                          <Button size="sm" className="w-full h-8 text-xs" onClick={applyGenerated}>
                            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                            Palette erzeugen
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  {/* Manuelle Farben */}
                  <TabsContent value="colors" className="mt-4">
                    <div className="grid gap-3 md:grid-cols-2">
                      {COLOR_KEYS.map((k) => (
                        <ColorBlock
                          key={k}
                          title={k === "bg" ? "Hintergrund" : k.toUpperCase()}
                          range={current[k]}
                          onChange={(next) => updateColor(k, next)}
                        />
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="animation" className="mt-4">
                    <Card className="bg-card/40 border-border/50 max-w-md">
                      <CardContent className="pt-4">
                        <ValueRow
                          label="Dauer (s)"
                          value={centerOf(current.duration)}
                          min={1}
                          max={60}
                          step={0.5}
                          onChange={(d) => update({ duration: exact(d) })}
                        />
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Punkt-Halo (EntitySurface) */}
                  <TabsContent value="halo" className="mt-4 space-y-3">
                    <p className="text-[11px] text-muted-foreground leading-snug">
                      Der Punkt-Halo ist ein gepunkteter Dunstring <em>um</em> den Orb (dekorative
                      Bodenfläche). „Ring-Innenrand" hält Abstand zum Orb, „Außenreichweite"
                      bestimmt, wie weit der Ring nach außen reicht, bevor er ausblendet.
                    </p>
                    <div className="grid gap-3 md:grid-cols-2">
                      <Card className="bg-card/40 border-border/50">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                            Geometrie
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <ValueRow
                            label="Größe (× Orb)"
                            value={centerOf(surface.scale)}
                            min={1}
                            max={3}
                            step={0.05}
                            precision={2}
                            onChange={(scale) => updateSurface({ scale: exact(scale) })}
                          />
                          <ValueRow
                            label="Punktgröße (px)"
                            value={centerOf(surface.dotSize)}
                            min={0.3}
                            max={6}
                            step={0.1}
                            precision={2}
                            onChange={(dotSize) => updateSurface({ dotSize: exact(dotSize) })}
                          />
                          <ValueRow
                            label="Punktabstand"
                            value={centerOf(surface.dotSpacing)}
                            min={2}
                            max={12}
                            step={0.1}
                            onChange={(dotSpacing) =>
                              updateSurface({ dotSpacing: exact(dotSpacing) })
                            }
                          />
                        </CardContent>
                      </Card>

                      <ColorBlock
                        title="Punktfarbe"
                        range={surface.dotColor}
                        onChange={(dotColor) => updateSurface({ dotColor })}
                      />

                      <Card className="bg-card/40 border-border/50 md:col-span-2">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                            Ring &amp; Mischung
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-3 md:grid-cols-2">
                          <ValueRow
                            label="Ring-Innenrand (Abstand zum Orb) %"
                            value={centerOf(surface.innerHole)}
                            min={0}
                            max={60}
                            step={1}
                            onChange={(innerHole) => updateSurface({ innerHole: exact(innerHole) })}
                          />
                          <ValueRow
                            label="Ring-Außenreichweite %"
                            value={centerOf(surface.outerFade)}
                            min={5}
                            max={100}
                            step={1}
                            onChange={(outerFade) => updateSurface({ outerFade: exact(outerFade) })}
                          />
                          <ValueRow
                            label="Deckkraft"
                            value={centerOf(surface.opacity)}
                            min={0}
                            max={1}
                            step={0.02}
                            precision={2}
                            onChange={(opacity) => updateSurface({ opacity: exact(opacity) })}
                          />
                          <ValueRow
                            label="Rotation (s · 0 = aus)"
                            value={centerOf(surface.rotationDuration)}
                            min={0}
                            max={120}
                            step={1}
                            onChange={(rotationDuration) =>
                              updateSurface({ rotationDuration: exact(rotationDuration) })
                            }
                          />
                          <div className="space-y-2 md:col-span-2">
                            <Label className="text-[11px] text-muted-foreground font-normal">
                              Mischmodus
                            </Label>
                            <Select
                              value={surface.blendMode}
                              onValueChange={(v) => updateSurface({ blendMode: v as SurfaceBlend })}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="normal">normal</SelectItem>
                                <SelectItem value="screen">screen</SelectItem>
                                <SelectItem value="overlay">overlay</SelectItem>
                                <SelectItem value="soft-light">soft-light</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                </Tabs>
              </section>

              {/* Bibliothek — benannte Presets speichern/anwenden */}
              <section className="space-y-3">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Bibliothek
                </div>
                <div className="flex gap-2">
                  <Input
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                    placeholder={`Aktuellen „${state}"-Look speichern als…`}
                    className="h-8 text-xs"
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-8 text-xs shrink-0"
                    disabled={!presetName.trim()}
                    onClick={() => {
                      library.save(presetName.trim(), current);
                      setPresetName("");
                      touch();
                    }}
                  >
                    <Save className="h-3.5 w-3.5 mr-1.5" />
                    Speichern
                  </Button>
                </div>
                {library.presets.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    {library.presets.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center gap-2 rounded-lg border border-border/40 bg-card/40 px-3 py-1.5"
                      >
                        <span className="text-xs text-foreground/90 flex-1 truncate">{p.name}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs"
                          onClick={() => {
                            setPreset(state, p.preset);
                            touch();
                          }}
                        >
                          Auf „{state}" anwenden
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          aria-label="Löschen"
                          onClick={() => library.remove(p.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default OrbLab;
