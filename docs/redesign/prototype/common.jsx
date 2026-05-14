/* global React */
// Cogni — gemeinsame Helfer: Icons, Signale, Rollen-Mark, kleine Pills
// Wird über window.Cogni.* exportiert für andere Module.

const { useState } = React;

/* =========================================================
   Icons — schlank, 1.6 stroke, currentColor
   ========================================================= */
const Ic = {
  search:   () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>,
  plus:     () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>,
  arrowR:   () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>,
  bolt:     () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2 4 14h8l-1 8 9-12h-8l1-8z"/></svg>,
  clock:    () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>,
  flag:     () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22V4h14l-3 5 3 5H4"/></svg>,
  link:     () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M10 14a4 4 0 0 0 5.7 0l3.5-3.5a4 4 0 0 0-5.7-5.7L11 7"/><path d="M14 10a4 4 0 0 0-5.7 0L4.8 13.5a4 4 0 0 0 5.7 5.7L13 17"/></svg>,
  cmd:      () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M9 6H6.5A2.5 2.5 0 1 0 9 8.5V15a2.5 2.5 0 1 1-2.5-2.5H9M15 18h2.5a2.5 2.5 0 1 0-2.5-2.5V9a2.5 2.5 0 1 1 2.5 2.5H15M9 9h6v6H9z"/></svg>,
  conflict: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3 2 21h20L12 3z"/><path d="M12 10v5M12 18h.01"/></svg>,
  gap:      () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="9" strokeDasharray="3 3"/><path d="M9 12h6"/></svg>,
  doc:      () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2h9l4 4v16H6V2z"/><path d="M14 2v6h5"/></svg>,
  feed:     () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 11a9 9 0 0 1 9 9M4 4a16 16 0 0 1 16 16"/><circle cx="5" cy="19" r="1.4"/></svg>,
  layers:   () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3 9 5-9 5-9-5 9-5z"/><path d="m3 13 9 5 9-5M3 18l9 5 9-5"/></svg>,
  user:     () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/></svg>,
  manuell:  () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m4 20 5-2 11-11-3-3L6 15l-2 5z"/></svg>,
  dotsV:    () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="19" r="1.6"/></svg>,
  chevR:    () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 6 6 6-6 6"/></svg>,
  upload:   () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 16V4m0 0-4 4m4-4 4 4M4 20h16"/></svg>,
  mic:      () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>,
  paste:    () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h3v18H5V4h3"/></svg>,
  spark:    () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/></svg>,
};

/* =========================================================
   SignalStack — bis zu zwei Punkte nebeneinander
   ========================================================= */
function SignalStack({ signals = [], live = false, size = "md" }) {
  const dims = size === "lg" ? 10 : size === "sm" ? 6 : 8;
  return (
    <div style={{ display: "inline-flex", gap: 5, alignItems: "center" }}>
      {signals.map((s, i) => (
        <span
          key={i}
          className={`dot dot--${s}${live && i === 0 ? " dot--live" : ""}`}
          style={{ width: dims, height: dims, position: "relative" }}
        />
      ))}
    </div>
  );
}

/* Rollen-Mark — kleine Buchstabe für Arbeitsmodus */
const MODE_META = {
  entscheiden: { letter: "E", label: "entscheiden", color: "var(--sig-action)",   soft: "var(--sig-action-soft)" },
  klaeren:     { letter: "K", label: "klären",      color: "var(--sig-review)",   soft: "var(--sig-review-soft)" },
  umsetzen:    { letter: "U", label: "umsetzen",    color: "var(--ink)",          soft: "var(--surface-2)" },
  pruefen:     { letter: "P", label: "prüfen",      color: "var(--sig-calm)",     soft: "var(--sig-calm-soft)" },
};
function ModeMark({ mode }) {
  const m = MODE_META[mode] || MODE_META.umsetzen;
  return (
    <span
      title={m.label}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: 22, height: 22, borderRadius: 6,
        background: m.soft, color: m.color,
        fontFamily: "Geist Mono, monospace", fontSize: 11, fontWeight: 600,
        flex: "0 0 auto",
      }}
    >
      {m.letter}
    </span>
  );
}

/* Delta tag — neu / ersetzt / bestätigt / widersprochen */
const DELTA_META = {
  neu:           { label: "neu",         color: "var(--sig-action)",   soft: "var(--sig-action-soft)" },
  ersetzt:       { label: "ersetzt",     color: "var(--sig-review)",   soft: "var(--sig-review-soft)" },
  bestaetigt:    { label: "bestätigt",   color: "var(--sig-calm)",     soft: "var(--sig-calm-soft)" },
  widersprochen: { label: "Konflikt",    color: "var(--sig-conflict)", soft: "var(--sig-conflict-soft)" },
};
function DeltaTag({ delta }) {
  const d = DELTA_META[delta] || DELTA_META.neu;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", height: 18, padding: "0 6px",
      borderRadius: 4, fontSize: 10.5, fontWeight: 600, letterSpacing: ".04em",
      textTransform: "uppercase",
      background: d.soft, color: d.color, fontFamily: "Geist Mono, monospace",
    }}>{d.label}</span>
  );
}

/* Initial badge — Projekt-Monogramm */
function Monogram({ initial, signals = [], size = 56 }) {
  // Hash → eine subtile Hintergrundfarbe aus dem Surface-Stack
  return (
    <div style={{
      width: size, height: size, borderRadius: 14,
      background: "var(--surface-2)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "Geist Mono, monospace", fontSize: size > 50 ? 18 : 14,
      fontWeight: 600, letterSpacing: "-.02em",
      color: "var(--ink)",
      border: "1px solid var(--hair)",
      position: "relative",
      flex: "0 0 auto",
    }}>
      {initial}
      {signals.length > 0 && (
        <div style={{
          position: "absolute", top: -4, right: -4,
          display: "flex", gap: 3,
          padding: 3, borderRadius: 999,
          background: "var(--surface-1)",
          boxShadow: "0 0 0 2px var(--surface-0)",
        }}>
          {signals.map((s, i) => <span key={i} className={`dot dot--${s}`} style={{width:6,height:6,boxShadow:"none"}}/>)}
        </div>
      )}
    </div>
  );
}

window.CogniCommon = { Ic, SignalStack, ModeMark, DeltaTag, Monogram, MODE_META };
