// =============================================================================
//  OrbLab — Visuelles Test-Panel für die Entity.
//  2-Spalten-Layout: links sticky Live-Vorschau, rechts State-Auswahl + Editor.
//  Charakter-Auswahl als statische Tiles. Editor in Tabs (Farben/Animation/Surface).
// =============================================================================

import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Dices, RotateCcw, X } from "lucide-react";
import EntityRoot from "@/components/entity/EntityRoot";
import { CHARACTER_LIST } from "@/components/entity/characters/registry";
import { useSelectedCharacter } from "@/components/entity/useSelectedCharacter";
import { CharacterTile } from "./OrbLab/CharacterTile";
import { StaticStatePreview } from "./OrbLab/StaticStatePreview";
import {
  useOrbPresets,
  samplePreset,
  ORB_PRESETS_DEFAULT,
  type EntityState,
  type OrbPresetRange,
  type Range,
  type SampledPreset,
  type SurfaceBlend,
  type SurfaceRange,
} from "@/components/entity/presets/orbPresets";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
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

// ---- Helpers ---------------------------------------------------------------

const centerOf = (r: Range): number => (r.min + r.max) / 2;
const rangeAround = (v: number, jitter: number, lo: number, hi: number): Range => ({
  min: Math.max(lo, v - jitter),
  max: Math.min(hi, v + jitter),
});
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
  jitter: number;
  onChange: (v: number, range: Range) => void;
}
const ValueRow = ({
  label,
  value,
  min,
  max,
  step,
  precision = 1,
  jitter,
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
          onChange(v, rangeAround(v, jitter, min, max));
        }}
      />
    </div>
  );
};

interface ColorBlockProps {
  title: string;
  range: { l: Range; c: Range; h: Range };
  onChange: (next: { l: Range; c: Range; h: Range }) => void;
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
          label="Lightness %"
          value={lv}
          min={0}
          max={100}
          step={1}
          jitter={3}
          onChange={(_, l) => onChange({ ...range, l })}
        />
        <ValueRow
          label="Chroma"
          value={cv}
          min={0}
          max={0.4}
          step={0.005}
          precision={3}
          jitter={0.01}
          onChange={(_, c) => onChange({ ...range, c })}
        />
        <ValueRow
          label="Hue °"
          value={hv}
          min={0}
          max={360}
          step={1}
          jitter={6}
          onChange={(_, h) => onChange({ ...range, h })}
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

  const [state, setState] = useState<EntityState>("idle");
  const [size, setSize] = useState(320);
  const [seed, setSeed] = useState(0);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const { characterId, setCharacterId } = useSelectedCharacter();

  const current = presets[state];

  const sample: SampledPreset = useMemo(
    () => samplePreset(current),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [current, state, seed],
  );

  // Esc → zurück zur Hauptapp
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") navigate("/");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);

  const update = (patch: Partial<OrbPresetRange>) => {
    setPreset(state, { ...current, ...patch });
    setSavedAt(Date.now());
    setSeed((s) => s + 1);
  };
  const updateColor = (k: ColorKey, next: { l: Range; c: Range; h: Range }) =>
    update({ [k]: next } as Partial<OrbPresetRange>);
  const updateDuration = (d: Range) => update({ duration: d });
  const updateSurface = (patch: Partial<SurfaceRange>) =>
    update({ surface: { ...current.surface, ...patch } });
  const reset = () => {
    resetPreset(state);
    setSavedAt(Date.now());
    setSeed((s) => s + 1);
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
                Charakter wirkt sofort in der Hauptapp
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
                    setSavedAt(Date.now());
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
                <div className="flex items-center justify-center" style={{ minHeight: size + 40 }}>
                  <EntityRoot
                    state={state}
                    size={`${size}px`}
                    presetOverride={sample}
                    character={characterId}
                    onClick={() => setSeed((s) => s + 1)}
                  />
                </div>

                <div className="flex items-center gap-2 flex-wrap justify-center">
                  <Badge variant="outline" className="font-normal">
                    {state}
                  </Badge>
                  <Badge variant="outline" className="font-normal tabular-nums">
                    {sample.duration.toFixed(2)}s
                  </Badge>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => setSeed((s) => s + 1)}
                        aria-label="Re-Roll"
                      >
                        <Dices className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-[240px]">
                      Re-Roll: würfelt einen neuen Sample aus den Bereichen (Farbe, Dauer …) für
                      diesen State.
                    </TooltipContent>
                  </Tooltip>
                </div>

                <div className="w-full max-w-[280px] space-y-2 pt-2 border-t border-border/30">
                  <div className="flex items-center justify-between">
                    <Label className="text-[11px] text-muted-foreground font-normal">Größe</Label>
                    <span className="text-[11px] text-foreground/70 tabular-nums">{size}px</span>
                  </div>
                  <Slider
                    min={80}
                    max={520}
                    step={8}
                    value={[size]}
                    onValueChange={([v]) => setSize(v)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Rechts: State-Pills + Editor */}
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
                      seed={seed}
                    />
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

                <Tabs defaultValue="colors">
                  <TabsList className="bg-card/40 p-1">
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
                    <TabsTrigger
                      value="surface"
                      className="text-xs data-[state=active]:bg-primary/20"
                    >
                      Surface
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="colors" className="mt-4">
                    <div className="grid gap-3 md:grid-cols-2">
                      {COLOR_KEYS.map((k) => (
                        <ColorBlock
                          key={k}
                          title={k}
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
                          label="Duration s"
                          value={centerOf(current.duration)}
                          min={1}
                          max={60}
                          step={0.5}
                          jitter={1.5}
                          onChange={(_, d) => updateDuration(d)}
                        />
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="surface" className="mt-4">
                    <div className="grid gap-3 md:grid-cols-2">
                      <Card className="bg-card/40 border-border/50">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                            Geometrie
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <ValueRow
                            label="Scale"
                            value={centerOf(surface.scale)}
                            min={1}
                            max={3}
                            step={0.05}
                            precision={2}
                            jitter={0.05}
                            onChange={(_, scale) => updateSurface({ scale })}
                          />
                          <ValueRow
                            label="Dot size px"
                            value={centerOf(surface.dotSize)}
                            min={0.3}
                            max={6}
                            step={0.1}
                            precision={2}
                            jitter={0.15}
                            onChange={(_, dotSize) => updateSurface({ dotSize })}
                          />
                          <ValueRow
                            label="Spacing"
                            value={centerOf(surface.dotSpacing)}
                            min={2}
                            max={12}
                            step={0.1}
                            precision={1}
                            jitter={0.4}
                            onChange={(_, dotSpacing) => updateSurface({ dotSpacing })}
                          />
                        </CardContent>
                      </Card>

                      <Card className="bg-card/40 border-border/50">
                        <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
                          <CardTitle className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                            Punktfarbe
                          </CardTitle>
                          <span
                            className="h-5 w-5 rounded-full border border-white/10 shadow-inner"
                            style={{
                              background: oklchStr(
                                centerOf(surface.dotColor.l),
                                centerOf(surface.dotColor.c),
                                centerOf(surface.dotColor.h),
                              ),
                            }}
                            aria-hidden
                          />
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <ValueRow
                            label="Lightness %"
                            value={centerOf(surface.dotColor.l)}
                            min={0}
                            max={100}
                            step={1}
                            jitter={3}
                            onChange={(_, l) =>
                              updateSurface({
                                dotColor: { ...surface.dotColor, l },
                              })
                            }
                          />
                          <ValueRow
                            label="Chroma"
                            value={centerOf(surface.dotColor.c)}
                            min={0}
                            max={0.4}
                            step={0.005}
                            precision={3}
                            jitter={0.01}
                            onChange={(_, c) =>
                              updateSurface({
                                dotColor: { ...surface.dotColor, c },
                              })
                            }
                          />
                          <ValueRow
                            label="Hue"
                            value={centerOf(surface.dotColor.h)}
                            min={0}
                            max={360}
                            step={1}
                            jitter={6}
                            onChange={(_, h) =>
                              updateSurface({
                                dotColor: { ...surface.dotColor, h },
                              })
                            }
                          />
                        </CardContent>
                      </Card>

                      <Card className="bg-card/40 border-border/50 md:col-span-2">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                            Maske · Mischung
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-3 md:grid-cols-2">
                          <ValueRow
                            label="Inner clearance %"
                            value={centerOf(surface.innerHole)}
                            min={0}
                            max={60}
                            step={1}
                            jitter={2}
                            onChange={(_, innerHole) => updateSurface({ innerHole })}
                          />
                          <ValueRow
                            label="Outer reach %"
                            value={centerOf(surface.outerFade)}
                            min={5}
                            max={100}
                            step={1}
                            jitter={3}
                            onChange={(_, outerFade) => updateSurface({ outerFade })}
                          />
                          <ValueRow
                            label="Opacity"
                            value={centerOf(surface.opacity)}
                            min={0}
                            max={1}
                            step={0.02}
                            precision={2}
                            jitter={0.05}
                            onChange={(_, opacity) => updateSurface({ opacity })}
                          />
                          <ValueRow
                            label="Rotation s (0 = aus)"
                            value={centerOf(surface.rotationDuration)}
                            min={0}
                            max={120}
                            step={1}
                            jitter={0}
                            onChange={(_, rotationDuration) => updateSurface({ rotationDuration })}
                          />
                          <div className="space-y-2 md:col-span-2">
                            <Label className="text-[11px] text-muted-foreground font-normal">
                              Blend mode
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
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default OrbLab;
