// =============================================================================
//  OrbLab — Visuelles Test-Panel für die Entity.
//  Granularer Editor: Range-Sliders pro State für Farben, Animation und
//  die Punktraster-Surface. Persistiert direkt in die DB (app_settings).
// =============================================================================

import { useEffect, useMemo, useRef, useState } from "react";
import { Dices, RotateCcw } from "lucide-react";
import Entity from "@/components/entity/Entity";
import SiriOrb from "@/components/entity/SiriOrb";
import EntitySurface from "@/components/entity/EntitySurface";
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
} from "@/components/entity/orbPresets";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toggle } from "@/components/ui/toggle";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

// ---- UI-Bausteine ------------------------------------------------------------

interface RangeRowProps {
  label: string;
  value: Range;
  min: number;
  max: number;
  step: number;
  precision?: number;
  onChange: (r: Range) => void;
}
const RangeRow = ({ label, value, min, max, step, precision = 1, onChange }: RangeRowProps) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between">
      <Label className="text-[11px] text-muted-foreground font-normal tracking-wide">
        {label}
      </Label>
      <span className="text-[11px] text-foreground/70 tabular-nums">
        {value.min.toFixed(precision)} – {value.max.toFixed(precision)}
      </span>
    </div>
    <Slider
      min={min}
      max={max}
      step={step}
      value={[value.min, value.max]}
      onValueChange={([mn, mx]) => onChange({ min: mn, max: mx })}
      minStepsBetweenThumbs={0}
    />
  </div>
);

interface ColorBlockProps {
  title: string;
  range: { l: Range; c: Range; h: Range };
  swatch: string;
  onChange: (next: { l: Range; c: Range; h: Range }) => void;
}
const ColorBlock = ({ title, range, swatch, onChange }: ColorBlockProps) => (
  <Card className="bg-card/40 border-border/50">
    <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
      <CardTitle className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
        {title}
      </CardTitle>
      <span
        className="h-4 w-4 rounded-full border border-white/10 shadow-inner"
        style={{ background: swatch }}
        aria-hidden
      />
    </CardHeader>
    <CardContent className="space-y-4">
      <RangeRow
        label="Lightness %"
        value={range.l}
        min={0}
        max={100}
        step={1}
        onChange={(l) => onChange({ ...range, l })}
      />
      <RangeRow
        label="Chroma"
        value={range.c}
        min={0}
        max={0.4}
        step={0.005}
        precision={3}
        onChange={(c) => onChange({ ...range, c })}
      />
      <RangeRow
        label="Hue °"
        value={range.h}
        min={0}
        max={360}
        step={1}
        onChange={(h) => onChange({ ...range, h })}
      />
    </CardContent>
  </Card>
);

// ---- Saved indicator -------------------------------------------------------

const SavedIndicator = ({ at }: { at: number | null }) => {
  const rel = useRelativeTime(at ? new Date(at).toISOString() : null);
  if (!at) return null;
  return (
    <span className="text-[11px] text-muted-foreground">
      Gespeichert · {rel}
    </span>
  );
};

// ---- Page --------------------------------------------------------------------

const OrbLab = () => {
  const { presets, loaded, setPreset, resetPreset } = useOrbPresets();

  const [state, setState] = useState<EntityState>("idle");
  const [size, setSize] = useState(320);
  const [seed, setSeed] = useState(0);
  const [autoRoll, setAutoRoll] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const skipNextSave = useRef(true);

  const current = presets[state];

  const sample: SampledPreset = useMemo(
    () => samplePreset(current),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [current, state, seed],
  );

  useEffect(() => {
    if (!autoRoll) return;
    const i = window.setInterval(() => setSeed((s) => s + 1), 4000);
    return () => window.clearInterval(i);
  }, [autoRoll]);

  // Track when DB sees an updated preset for the active state → "Saved · …"
  useEffect(() => {
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    setSavedAt(Date.now());
  }, [current]);

  const update = (patch: Partial<OrbPresetRange>) => {
    setPreset(state, { ...current, ...patch });
    setSeed((s) => s + 1);
  };
  const updateColor = (k: ColorKey, next: { l: Range; c: Range; h: Range }) =>
    update({ [k]: next } as Partial<OrbPresetRange>);
  const updateDuration = (d: Range) => update({ duration: d });
  const updateSurface = (patch: Partial<SurfaceRange>) =>
    update({ surface: { ...current.surface, ...patch } });
  const reset = () => {
    resetPreset(state);
    setSeed((s) => s + 1);
  };

  const surface = current.surface;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto p-6 lg:p-10 flex flex-col gap-8">
        {/* Header */}
        <header className="flex items-baseline justify-between gap-4 border-b border-border/40 pb-5">
          <div className="flex items-baseline gap-3">
            <h1 className="text-2xl tracking-tight font-light">Orb Lab</h1>
            <Badge variant="outline" className="text-[10px] font-normal text-muted-foreground">
              {loaded ? "DB" : "lädt …"}
            </Badge>
          </div>
          <SavedIndicator at={savedAt} />
        </header>

        {/* Live-Orb */}
        <Card className="bg-card/30 border-border/50">
          <CardContent className="flex flex-col items-center gap-6 py-12">
            <Entity
              state={state}
              size={`${size}px`}
              presetOverride={sample}
              onClick={() => setSeed((s) => s + 1)}
            />
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <Button size="sm" variant="secondary" onClick={() => setSeed((s) => s + 1)}>
                <Dices className="h-3.5 w-3.5 mr-1.5" />
                Re-Roll
              </Button>
              <Toggle
                size="sm"
                pressed={autoRoll}
                onPressedChange={setAutoRoll}
                aria-label="Auto-Roll"
              >
                Auto-Roll
              </Toggle>
              <Badge variant="outline" className="font-normal tabular-nums">
                {sample.duration.toFixed(2)}s
              </Badge>
              <Badge variant="outline" className="font-normal">
                {state}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* State Tabs + Size */}
        <div className="grid gap-6 lg:grid-cols-[1fr_280px] items-start">
          <Tabs value={state} onValueChange={(v) => setState(v as EntityState)}>
            <TabsList className="bg-card/40 h-auto flex-wrap p-1">
              {STATES.map((s) => (
                <TabsTrigger key={s} value={s} className="text-xs data-[state=active]:bg-primary/20">
                  {s}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <Card className="bg-card/40 border-border/50">
            <CardContent className="pt-4 space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-[11px] text-muted-foreground font-normal">Size</Label>
                <span className="text-[11px] text-foreground/70 tabular-nums">{size}px</span>
              </div>
              <Slider
                min={80}
                max={520}
                step={8}
                value={[size]}
                onValueChange={([v]) => setSize(v)}
              />
            </CardContent>
          </Card>
        </div>

        {/* Editor */}
        <section className="space-y-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm tracking-wide text-foreground/90">
              Editor <span className="text-muted-foreground">— {state}</span>
            </h2>
            <Button size="sm" variant="ghost" onClick={reset} className="h-7 text-xs">
              <RotateCcw className="h-3 w-3 mr-1.5" />
              Default
            </Button>
          </div>

          {/* Block 1 — Orb-Farben */}
          <div className="space-y-3">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Orb · Farben
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {COLOR_KEYS.map((k) => (
                <ColorBlock
                  key={k}
                  title={k}
                  range={current[k]}
                  swatch={sample.colors[k]}
                  onChange={(next) => updateColor(k, next)}
                />
              ))}
            </div>
          </div>

          {/* Block 2 — Animation */}
          <div className="space-y-3">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Orb · Animation
            </div>
            <Card className="bg-card/40 border-border/50 max-w-md">
              <CardContent className="pt-4">
                <RangeRow
                  label="Duration s"
                  value={current.duration}
                  min={1}
                  max={60}
                  step={0.5}
                  onChange={updateDuration}
                />
              </CardContent>
            </Card>
          </div>

          {/* Block 3 — Surface (Punktraster) */}
          <div className="space-y-3">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Surface · Punktraster hinter dem Orb
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Card className="bg-card/40 border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                    Geometrie
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <RangeRow
                    label="Scale (× Orb)"
                    value={surface.scale}
                    min={1}
                    max={3}
                    step={0.05}
                    precision={2}
                    onChange={(scale) => updateSurface({ scale })}
                  />
                  <RangeRow
                    label="Dot size px"
                    value={surface.dotSize}
                    min={0.3}
                    max={6}
                    step={0.1}
                    precision={2}
                    onChange={(dotSize) => updateSurface({ dotSize })}
                  />
                  <RangeRow
                    label="Spacing × dot"
                    value={surface.dotSpacing}
                    min={2}
                    max={12}
                    step={0.1}
                    precision={1}
                    onChange={(dotSpacing) => updateSurface({ dotSpacing })}
                  />
                </CardContent>
              </Card>

              <Card className="bg-card/40 border-border/50">
                <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                    Punktfarbe
                  </CardTitle>
                  <span
                    className="h-4 w-4 rounded-full border border-white/10 shadow-inner"
                    style={{ background: sample.surface.dotColor }}
                    aria-hidden
                  />
                </CardHeader>
                <CardContent className="space-y-4">
                  <RangeRow
                    label="Lightness %"
                    value={surface.dotColor.l}
                    min={0}
                    max={100}
                    step={1}
                    onChange={(l) =>
                      updateSurface({ dotColor: { ...surface.dotColor, l } })
                    }
                  />
                  <RangeRow
                    label="Chroma"
                    value={surface.dotColor.c}
                    min={0}
                    max={0.4}
                    step={0.005}
                    precision={3}
                    onChange={(c) =>
                      updateSurface({ dotColor: { ...surface.dotColor, c } })
                    }
                  />
                  <RangeRow
                    label="Hue °"
                    value={surface.dotColor.h}
                    min={0}
                    max={360}
                    step={1}
                    onChange={(h) =>
                      updateSurface({ dotColor: { ...surface.dotColor, h } })
                    }
                  />
                </CardContent>
              </Card>

              <Card className="bg-card/40 border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                    Maske · Mischung
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <RangeRow
                    label="Inner hole %"
                    value={surface.innerHole}
                    min={0}
                    max={60}
                    step={1}
                    onChange={(innerHole) => updateSurface({ innerHole })}
                  />
                  <RangeRow
                    label="Outer fade %"
                    value={surface.outerFade}
                    min={50}
                    max={100}
                    step={1}
                    onChange={(outerFade) => updateSurface({ outerFade })}
                  />
                  <RangeRow
                    label="Opacity"
                    value={surface.opacity}
                    min={0}
                    max={1}
                    step={0.02}
                    precision={2}
                    onChange={(opacity) => updateSurface({ opacity })}
                  />
                  <RangeRow
                    label="Rotation s (0 = aus)"
                    value={surface.rotationDuration}
                    min={0}
                    max={120}
                    step={1}
                    onChange={(rotationDuration) =>
                      updateSurface({ rotationDuration })
                    }
                  />
                  <div className="space-y-2">
                    <Label className="text-[11px] text-muted-foreground font-normal">
                      Blend mode
                    </Label>
                    <Select
                      value={surface.blendMode}
                      onValueChange={(v) =>
                        updateSurface({ blendMode: v as SurfaceBlend })
                      }
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
          </div>
        </section>

        {/* Matrix */}
        <section className="space-y-3">
          <h2 className="text-xs uppercase tracking-widest text-muted-foreground">
            Alle States — frischer Sample pro Re-Roll
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {STATES.map((s) => {
              const sm = samplePreset(presets[s] ?? ORB_PRESETS_DEFAULT[s]);
              return (
                <Card
                  key={`${s}-${seed}`}
                  onClick={() => setState(s)}
                  className={`cursor-pointer transition-colors bg-card/30 ${
                    state === s
                      ? "border-primary/50 bg-card/60"
                      : "border-border/40 hover:border-border"
                  }`}
                >
                  <CardContent className="flex flex-col items-center gap-3 p-4">
                    <div className="relative h-[130px] w-[130px] flex items-center justify-center">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <EntitySurface orbSize={110} surface={sm.surface} />
                      </div>
                      <SiriOrb
                        size="110px"
                        colors={sm.colors}
                        animationDuration={sm.duration}
                      />
                    </div>
                    <div className="text-xs text-foreground">{s}</div>
                    <div className="text-[10px] text-muted-foreground tabular-nums">
                      {sm.duration.toFixed(1)}s
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};

export default OrbLab;
