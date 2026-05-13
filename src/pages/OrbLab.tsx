// =============================================================================
//  OrbLab — Visuelles Test-Panel für die Entity.
//  Granularer Editor: Range-Sliders (L/C/H + Duration) pro State,
//  Re-Roll, Live-Matrix, kopierbarer Preset-JSON-Snippet.
// =============================================================================

import { useEffect, useMemo, useState } from "react";
import Entity from "@/components/entity/Entity";
import SiriOrb from "@/components/entity/SiriOrb";
import {
  ORB_PRESETS,
  samplePreset,
  type EntityState,
  type OrbPresetRange,
  type Range,
  type SampledPreset,
} from "@/components/entity/orbPresets";
import { Slider } from "@/components/ui/slider";

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

// ---- kleine UI-Bausteine -----------------------------------------------------

interface RangeRowProps {
  label: string;
  value: Range;
  min: number;
  max: number;
  step: number;
  onChange: (r: Range) => void;
}
const RangeRow = ({ label, value, min, max, step, onChange }: RangeRowProps) => (
  <div className="space-y-1.5">
    <div className="flex items-center justify-between text-[11px]">
      <span className="text-muted-foreground tracking-wide">{label}</span>
      <span className="text-foreground/70 tabular-nums">
        {value.min.toFixed(step < 1 ? 3 : 1)} – {value.max.toFixed(step < 1 ? 3 : 1)}
      </span>
    </div>
    <Slider
      min={min}
      max={max}
      step={step}
      value={[value.min, value.max]}
      onValueChange={([mn, mx]) => onChange({ min: mn, max: mx })}
    />
  </div>
);

interface ColorBlockProps {
  title: string;
  range: { l: Range; c: Range; h: Range };
  onChange: (next: { l: Range; c: Range; h: Range }) => void;
}
const ColorBlock = ({ title, range, onChange }: ColorBlockProps) => (
  <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3 space-y-3">
    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{title}</div>
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
  </div>
);

// ---- Page --------------------------------------------------------------------

const OrbLab = () => {
  const [presets, setPresets] = useState<Record<EntityState, OrbPresetRange>>(ORB_PRESETS);
  const [state, setState] = useState<EntityState>("idle");
  const [size, setSize] = useState(320);
  const [seed, setSeed] = useState(0);
  const [autoRoll, setAutoRoll] = useState(false);

  // Sampling: re-roll bei seed/state/preset-Änderung
  const sample: SampledPreset = useMemo(
    () => samplePreset(presets[state]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [presets, state, seed],
  );

  // Auto-Re-Roll alle 4s
  useEffect(() => {
    if (!autoRoll) return;
    const i = window.setInterval(() => setSeed((s) => s + 1), 4000);
    return () => window.clearInterval(i);
  }, [autoRoll]);

  const updateColor = (k: ColorKey, next: { l: Range; c: Range; h: Range }) => {
    setPresets((p) => ({ ...p, [state]: { ...p[state], [k]: next } }));
    setSeed((s) => s + 1);
  };
  const updateDuration = (d: Range) => {
    setPresets((p) => ({ ...p, [state]: { ...p[state], duration: d } }));
    setSeed((s) => s + 1);
  };
  const reset = () => {
    setPresets((p) => ({ ...p, [state]: ORB_PRESETS[state] }));
    setSeed((s) => s + 1);
  };

  const current = presets[state];

  return (
    <div className="min-h-screen bg-background text-foreground p-6 lg:p-8 flex flex-col gap-8">
      <header className="flex items-baseline justify-between gap-4">
        <h1 className="text-2xl tracking-tight font-light">Orb Lab</h1>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          Range-basierte States · jeder Roll ist leicht anders
        </p>
      </header>

      {/* Live-Orb */}
      <section className="flex flex-col items-center gap-5 py-10 rounded-2xl bg-white/[0.02] border border-white/5">
        <Entity
          state={state}
          size={`${size}px`}
          presetOverride={sample}
          onClick={() => setSeed((s) => s + 1)}
        />
        <div className="flex items-center gap-3 text-xs">
          <button
            onClick={() => setSeed((s) => s + 1)}
            className="px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] transition-colors"
          >
            Re-Roll
          </button>
          <button
            onClick={() => setAutoRoll((v) => !v)}
            className={`px-3 py-1.5 rounded-full border transition-colors ${
              autoRoll
                ? "border-primary/40 bg-primary/20 text-foreground"
                : "border-white/10 bg-white/[0.04] text-muted-foreground hover:text-foreground"
            }`}
          >
            Auto-Roll {autoRoll ? "an" : "aus"}
          </button>
          <span className="text-muted-foreground tabular-nums">
            duration: <span className="text-foreground">{sample.duration.toFixed(2)}s</span>
          </span>
        </div>
      </section>

      {/* State + Size Picker */}
      <section className="grid gap-6 lg:grid-cols-[1fr_auto] items-center">
        <div className="flex flex-wrap gap-2">
          {STATES.map((s) => (
            <button
              key={s}
              onClick={() => setState(s)}
              className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                state === s
                  ? "bg-primary/20 border-primary/40 text-foreground"
                  : "bg-white/[0.02] border-white/10 text-muted-foreground hover:text-foreground"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="w-64">
          <div className="text-[11px] text-muted-foreground mb-2">Size — {size}px</div>
          <Slider
            min={80}
            max={520}
            step={8}
            value={[size]}
            onValueChange={([v]) => setSize(v)}
          />
        </div>
      </section>

      {/* Editor */}
      <section className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm tracking-wide">
            Editor — <span className="text-muted-foreground">{state}</span>
          </h2>
          <button
            onClick={reset}
            className="text-[11px] text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
          >
            Auf Default zurücksetzen
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {COLOR_KEYS.map((k) => (
            <ColorBlock
              key={k}
              title={k}
              range={current[k]}
              onChange={(next) => updateColor(k, next)}
            />
          ))}
        </div>

        <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3 max-w-md">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
            Animation
          </div>
          <RangeRow
            label="Duration s"
            value={current.duration}
            min={1}
            max={60}
            step={0.5}
            onChange={updateDuration}
          />
        </div>
      </section>

      {/* Matrix */}
      <section className="space-y-3">
        <h2 className="text-xs uppercase tracking-widest text-muted-foreground">
          Alle States — frischer Sample pro Re-Roll
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {STATES.map((s) => {
            const sm = samplePreset(presets[s]);
            return (
              <button
                key={`${s}-${seed}`}
                onClick={() => setState(s)}
                className={`flex flex-col items-center gap-3 p-4 rounded-xl border transition-colors ${
                  state === s
                    ? "border-primary/40 bg-white/[0.04]"
                    : "border-white/5 bg-white/[0.02] hover:border-white/10"
                }`}
              >
                <SiriOrb size="120px" colors={sm.colors} animationDuration={sm.duration} />
                <div className="text-xs text-foreground">{s}</div>
                <div className="text-[10px] text-muted-foreground tabular-nums">
                  {sm.duration.toFixed(1)}s
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* JSON-Snippet */}
      <section className="space-y-3">
        <h2 className="text-xs uppercase tracking-widest text-muted-foreground">
          Snippet — kopiere in <code>orbPresets.ts</code>
        </h2>
        <pre className="text-[11px] leading-relaxed p-4 rounded-lg border border-white/5 bg-black/40 overflow-x-auto text-foreground/80">
{JSON.stringify({ [state]: current }, null, 2)}
        </pre>
      </section>
    </div>
  );
};

export default OrbLab;
