// =============================================================================
//  OrbLab — Demo-Panel: alle 6 Entity-States + Voice-Tones live durchschalten.
//  Erreichbar unter /orb-lab. Reines Frontend, keine Backend-Calls.
// =============================================================================

import { useState } from "react";
import Entity from "@/components/entity/Entity";
import SiriOrb from "@/components/entity/SiriOrb";
import { ORB_PRESETS, modulateDuration, type EntityState } from "@/components/entity/orbPresets";
import { Slider } from "@/components/ui/slider";

const STATES: EntityState[] = [
  "idle",
  "hover",
  "processing",
  "review-ready",
  "failed",
  "busy-blocked",
];

const TONES = ["calm", "working", "ready", "alert"] as const;
type Tone = (typeof TONES)[number];

const OrbLab = () => {
  const [state, setState] = useState<EntityState>("idle");
  const [tone, setTone] = useState<Tone>("calm");
  const [size, setSize] = useState(320);

  const preset = ORB_PRESETS[state];
  const duration = modulateDuration(preset.duration, tone);

  return (
    <div className="min-h-screen bg-background text-foreground p-8 flex flex-col gap-8">
      <header className="flex items-baseline justify-between">
        <h1 className="text-2xl tracking-tight font-light">Orb Lab</h1>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          Visuelles Test-Panel — alle States · alle Tones
        </p>
      </header>

      {/* Großer Live-Orb */}
      <section className="flex flex-col items-center justify-center gap-6 py-8 rounded-2xl bg-white/[0.02] border border-white/5">
        <Entity
          state={state}
          voiceTone={tone}
          size={`${size}px`}
          onClick={() => console.log("orb click", state, tone)}
          onReviewClick={() => console.log("review click")}
          onDrop={(f) => console.log("drop", f)}
        />
        <div className="text-xs text-muted-foreground tabular-nums">
          state: <span className="text-foreground">{state}</span> · tone:{" "}
          <span className="text-foreground">{tone}</span> · duration:{" "}
          <span className="text-foreground">{duration.toFixed(2)}s</span> · size:{" "}
          <span className="text-foreground">{size}px</span>
        </div>
      </section>

      {/* Controls */}
      <section className="grid gap-6 md:grid-cols-3">
        <div className="space-y-3">
          <h2 className="text-xs uppercase tracking-widest text-muted-foreground">State</h2>
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
        </div>

        <div className="space-y-3">
          <h2 className="text-xs uppercase tracking-widest text-muted-foreground">Voice Tone</h2>
          <div className="flex flex-wrap gap-2">
            {TONES.map((t) => (
              <button
                key={t}
                onClick={() => setTone(t)}
                className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                  tone === t
                    ? "bg-primary/20 border-primary/40 text-foreground"
                    : "bg-white/[0.02] border-white/10 text-muted-foreground hover:text-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-xs uppercase tracking-widest text-muted-foreground">
            Size — {size}px
          </h2>
          <Slider
            min={80}
            max={520}
            step={8}
            value={[size]}
            onValueChange={([v]) => setSize(v)}
          />
        </div>
      </section>

      {/* Matrix: alle States nebeneinander */}
      <section className="space-y-3">
        <h2 className="text-xs uppercase tracking-widest text-muted-foreground">
          Alle States (mit aktuellem Tone: {tone})
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {STATES.map((s) => {
            const p = ORB_PRESETS[s];
            return (
              <button
                key={s}
                onClick={() => setState(s)}
                className={`flex flex-col items-center gap-3 p-4 rounded-xl border transition-colors ${
                  state === s
                    ? "border-primary/40 bg-white/[0.04]"
                    : "border-white/5 bg-white/[0.02] hover:border-white/10"
                }`}
              >
                <SiriOrb
                  size="120px"
                  colors={p.colors}
                  animationDuration={modulateDuration(p.duration, tone)}
                />
                <div className="text-xs text-foreground">{s}</div>
                <div className="text-[10px] text-muted-foreground tabular-nums">
                  {modulateDuration(p.duration, tone).toFixed(1)}s
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Matrix: alle Tones für aktuellen State */}
      <section className="space-y-3">
        <h2 className="text-xs uppercase tracking-widest text-muted-foreground">
          Alle Tones (mit aktuellem State: {state})
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {TONES.map((t) => (
            <button
              key={t}
              onClick={() => setTone(t)}
              className={`flex flex-col items-center gap-3 p-4 rounded-xl border transition-colors ${
                tone === t
                  ? "border-primary/40 bg-white/[0.04]"
                  : "border-white/5 bg-white/[0.02] hover:border-white/10"
              }`}
            >
              <SiriOrb
                size="120px"
                colors={preset.colors}
                animationDuration={modulateDuration(preset.duration, t)}
              />
              <div className="text-xs text-foreground">{t}</div>
              <div className="text-[10px] text-muted-foreground tabular-nums">
                {modulateDuration(preset.duration, t).toFixed(1)}s
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};

export default OrbLab;
