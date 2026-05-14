// =============================================================================
//  projectViewModel — pure Mapper.
// -----------------------------------------------------------------------------
//  Nimmt rohe DB-Rows (RawProjectData), gibt fertiges ProjectViewModel zurück.
//  Keine Hooks, keine Side-Effects, keine Supabase-Calls. → Unit-testbar.
//
//  `any` ist hier bewusst — DB-Rows sind dynamische JSONB-Strukturen, deren
//  Pflichtfelder durch den DB-Trigger validate_fact_content() (A3.3) garantiert
//  werden. Strikteres Typing kommt mit A3.1 (strictNullChecks).
// =============================================================================
/* eslint-disable @typescript-eslint/no-explicit-any */

import { formatRelative } from "@/lib/format/relativeTime";
import type {
  ProjectViewModel,
  KonfliktVM,
  GapVM,
  DependencyVM,
  HandlungsbedarfVM,
  VerlaufVM,
  ThemaVM,
  DokumentVM,
  StakeholderVM,
  DeltaTyp,
} from "./types";

// ---------------------------------------------------------------------------
// Roh-Daten-Vertrag
// ---------------------------------------------------------------------------
export interface RawProjectData {
  // deno-lint-ignore no-explicit-any
  project: any;
  // deno-lint-ignore no-explicit-any
  snapshot: any | null;
  // deno-lint-ignore no-explicit-any
  outcome: any | null;
  // deno-lint-ignore no-explicit-any
  deadlines: any[];
  // deno-lint-ignore no-explicit-any
  canonical: any[];
  // deno-lint-ignore no-explicit-any
  contradictions: any[];
  // deno-lint-ignore no-explicit-any
  gaps: any[];
  // deno-lint-ignore no-explicit-any
  deps: any[];
  // deno-lint-ignore no-explicit-any
  decisions: any[];
  // deno-lint-ignore no-explicit-any
  tasks: any[];
  // deno-lint-ignore no-explicit-any
  openPoints: any[];
  // deno-lint-ignore no-explicit-any
  feedbackRows: any[];
  // deno-lint-ignore no-explicit-any
  events: any[];
  // deno-lint-ignore no-explicit-any
  topics: any[];
  // deno-lint-ignore no-explicit-any
  assets: any[];
  // deno-lint-ignore no-explicit-any
  stakeholders: any[];
}

// ---------------------------------------------------------------------------
// Format-Helpers
// ---------------------------------------------------------------------------
export const fmtDate = (iso: string | null | undefined) =>
  iso
    ? new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" })
    : "—";

export const fmtShort = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString("de-DE") : "";

export const ageInDays = (iso: string) =>
  Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000));

// Übersetzt Snapshot-Summaries in lesbare Sprache. Alte Datensätze enthalten
// noch Maschinen-Codes wie "Snapshot nach commit:stakeholder:add" — die dürfen
// nie in der UI auftauchen.
const SUBJECT_DE: Record<string, string> = {
  stakeholder: "Stakeholder",
  deadline: "Termin",
  decision: "Entscheidung",
  task: "Aufgabe",
  open_point: "Offener Punkt",
  gap_signal: "Lücke",
  contradiction: "Widerspruch",
  dependency: "Abhängigkeit",
  fact: "Fakt",
};
const VERB_DE: Record<string, string> = {
  add: "ergänzt",
  update: "aktualisiert",
  remove: "entfernt",
  resolve: "geschlossen",
  confirm: "bestätigt",
  reject: "verworfen",
};

export const humanizeSnapshotSummary = (raw: string | undefined): string | undefined => {
  if (!raw) return undefined;
  const m = raw.match(/^Snapshot nach\s+([a-z_]+):([a-z_]+)(?::([a-z_]+))?/i);
  if (!m) return raw;
  const subj = SUBJECT_DE[m[2]] ?? m[2];
  const verb = VERB_DE[m[3] ?? ""] ?? "aktualisiert";
  return `${subj} ${verb}.`;
};

export const titleFromJson = (v: unknown, fallback = "—"): string => {
  if (!v || typeof v !== "object") return fallback;
  const o = v as Record<string, unknown>;
  for (const k of ["title", "name", "label", "summary"]) {
    if (typeof o[k] === "string" && o[k]) return o[k] as string;
  }
  return fallback;
};

export const stringFromJson = (v: unknown, key: string): string | null => {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  return typeof o[key] === "string" ? (o[key] as string) : null;
};

export const numberFromJson = (v: unknown, key: string): number | null => {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  return typeof o[key] === "number" ? (o[key] as number) : null;
};

// ---------------------------------------------------------------------------
// Einzel-Mapper
// ---------------------------------------------------------------------------
// deno-lint-ignore no-explicit-any
export function toKonflikte(contradictions: any[], canonical: any[]): KonfliktVM[] {
  const factById = new Map(canonical.map((f) => [f.id, f]));
  return contradictions.map((c) => {
    const a = c.fact_a_id ? factById.get(c.fact_a_id) : null;
    const b = c.fact_b_id ? factById.get(c.fact_b_id) : null;
    return {
      id: c.id,
      typ: c.contradiction_type,
      title: c.description ?? "Widerspruch",
      beschreibung: c.description ?? "",
      faktA: a ? titleFromJson(a.content, "Fakt A") : "Fakt A",
      faktB: b ? titleFromJson(b.content, "Fakt B") : "Fakt B",
      status: c.resolved ? "geloest" : "offen",
    };
  });
}

// deno-lint-ignore no-explicit-any
export function toGaps(gaps: any[]): GapVM[] {
  return gaps.map((g) => ({
    id: g.id,
    titel: g.title,
    wirkung: g.impact ?? "—",
    betrifft: g.affects ?? "—",
    lebensdauer: `seit ${ageInDays(g.detected_at)} Tagen offen`,
  }));
}

// deno-lint-ignore no-explicit-any
export function toDependencies(deps: any[]): DependencyVM[] {
  return deps.map((d) => ({
    id: d.id,
    typ: d.dependency_type,
    quelle: d.source_type,
    ziel: d.target_type,
    beschreibung: d.description ?? "",
  }));
}

// deno-lint-ignore no-explicit-any
export function toHandlungsbedarf(rows: {
  decisions: any[];
  contradictions: any[];
  gaps: any[];
  openPoints: any[];
  tasks: any[];
  feedbackRows: any[];
  deps: any[];
}): HandlungsbedarfVM[] {
  const out: HandlungsbedarfVM[] = [];

  rows.decisions
    .filter((d) => d.status === "draft")
    .forEach((d) =>
      out.push({
        id: `dec-${d.id}`,
        arbeitsmodus: "entscheiden",
        objektTyp: "entscheidung",
        titel: d.title,
        beschreibung: d.description ?? "",
        verantwortlich: null,
        frist: fmtShort(d.valid_until) || null,
        quelle: "Entscheidung",
        blocker: false,
      }),
    );
  rows.contradictions.forEach((c) =>
    out.push({
      id: `con-${c.id}`,
      arbeitsmodus: "entscheiden",
      objektTyp: "konflikt",
      titel: c.description ?? "Widerspruch klären",
      beschreibung: c.description ?? "",
      verantwortlich: null,
      frist: null,
      quelle: `Konflikt #${c.id.slice(0, 6)}`,
      blocker: true,
    }),
  );
  rows.gaps.forEach((g) =>
    out.push({
      id: `gap-${g.id}`,
      arbeitsmodus: "klaeren",
      objektTyp: "gap",
      titel: g.title,
      beschreibung: g.impact ?? "",
      verantwortlich: null,
      frist: null,
      quelle: `Gap #${g.id.slice(0, 6)}`,
      blocker: false,
    }),
  );
  rows.openPoints.forEach((o) =>
    out.push({
      id: `op-${o.id}`,
      arbeitsmodus: "klaeren",
      objektTyp: "offener_punkt",
      titel: o.title,
      beschreibung: o.description ?? "",
      verantwortlich: null,
      frist: null,
      quelle: "Offener Punkt",
      blocker: false,
    }),
  );
  rows.tasks
    .filter((t) => t.status !== "done" && t.status !== "completed")
    .forEach((t) =>
      out.push({
        id: `task-${t.id}`,
        arbeitsmodus: "umsetzen",
        objektTyp: "aufgabe",
        titel: t.title,
        beschreibung: t.description ?? "",
        verantwortlich: null,
        frist: fmtShort(t.due_date) || null,
        quelle: "Aufgabe",
        blocker: false,
      }),
    );
  rows.feedbackRows.forEach((f) =>
    out.push({
      id: `fb-${f.id}`,
      arbeitsmodus: "pruefen",
      objektTyp: "feedback",
      titel: f.content.slice(0, 80),
      beschreibung: f.content,
      verantwortlich: null,
      frist: null,
      quelle: "Feedback",
      blocker: false,
    }),
  );
  rows.deps.forEach((d) =>
    out.push({
      id: `dep-${d.id}`,
      arbeitsmodus: "klaeren",
      objektTyp: "dependency",
      titel: d.description ?? `${d.source_type} → ${d.target_type}`,
      beschreibung: d.description ?? "",
      verantwortlich: null,
      frist: null,
      quelle: `Dependency #${d.id.slice(0, 6)}`,
      blocker: d.dependency_type === "blockiert_durch",
    }),
  );

  return out;
}

const eventTypeToErlaubnis = (t: string): VerlaufVM["ereignisTyp"] => {
  if (t === "contradict") return "konflikt";
  if (t === "confirm") return "entscheidung";
  return "aenderung";
};
const eventTypeToDelta = (t: string): DeltaTyp => {
  if (t === "confirm") return "bestaetigt";
  if (t === "contradict") return "widersprochen";
  if (t === "replace") return "ersetzt";
  return "neu";
};

// deno-lint-ignore no-explicit-any
export function toVerlauf(events: any[]): VerlaufVM[] {
  return events.map((e) => ({
    id: e.id,
    datum: fmtShort(e.created_at),
    delta: eventTypeToDelta(e.event_type),
    ereignisTyp: eventTypeToErlaubnis(e.event_type),
    inhalt: titleFromJson(e.new_value ?? e.previous_value, "Änderung"),
    objekt: "Fakt",
    quelle: "Verstehens-Loop",
  }));
}

// deno-lint-ignore no-explicit-any
export function toThemen(topics: any[], decisions: any[], openPoints: any[]): ThemaVM[] {
  const decisionsByCanonical = new Map<string, number>();
  decisions.forEach((d) => {
    if (d.canonical_fact_id) {
      decisionsByCanonical.set(
        d.canonical_fact_id,
        (decisionsByCanonical.get(d.canonical_fact_id) ?? 0) + 1,
      );
    }
  });
  const openByCanonical = new Map<string, number>();
  openPoints.forEach((o) => {
    if (o.canonical_fact_id) {
      openByCanonical.set(o.canonical_fact_id, (openByCanonical.get(o.canonical_fact_id) ?? 0) + 1);
    }
  });
  return topics.map((t) => ({
    id: t.id,
    name: t.name,
    beschreibung: t.description ?? "",
    entscheidungen: t.canonical_fact_id ? decisionsByCanonical.get(t.canonical_fact_id) ?? 0 : 0,
    offenePunkte: t.canonical_fact_id ? openByCanonical.get(t.canonical_fact_id) ?? 0 : 0,
    dokumente: 0,
  }));
}

// deno-lint-ignore no-explicit-any
export function toDokumente(assets: any[]): DokumentVM[] {
  return assets.map((a) => ({
    id: a.id,
    name: a.file_name,
    typ: a.file_type,
    version: numberFromJson(a.metadata, "version") ?? 1,
    datum: fmtShort(a.created_at),
    thema: stringFromJson(a.metadata, "thema"),
  }));
}

// deno-lint-ignore no-explicit-any
export function toStakeholder(stakeholders: any[]): StakeholderVM[] {
  return stakeholders.map((s) => {
    const personRow = (s as { persons?: { name?: string; role?: string } | null }).persons ?? null;
    const orgRow = (s as { organizations?: { name?: string } | null }).organizations ?? null;
    return {
      id: s.id,
      name: personRow?.name ?? orgRow?.name ?? "—",
      rolle: s.role ?? personRow?.role ?? "",
      org: orgRow?.name ?? "",
    };
  });
}

// ---------------------------------------------------------------------------
// Composition
// ---------------------------------------------------------------------------
export interface ComposedProjectVM {
  vm: ProjectViewModel;
  isEmpty: boolean;
}

export function buildProjectViewModel(raw: RawProjectData): ComposedProjectVM {
  const {
    project: p,
    snapshot,
    outcome,
    deadlines,
    canonical,
    contradictions,
    gaps,
    deps,
    decisions,
    tasks,
    openPoints,
    feedbackRows,
    events,
    topics,
    assets,
    stakeholders,
  } = raw;

  const konflikte = toKonflikte(contradictions, canonical);
  const gapVMs = toGaps(gaps);
  const depVMs = toDependencies(deps);
  const handlungsbedarf = toHandlungsbedarf({
    decisions,
    contradictions,
    gaps,
    openPoints,
    tasks,
    feedbackRows,
    deps,
  });
  const verlauf = toVerlauf(events);
  const themen = toThemen(topics, decisions, openPoints);
  const dokumente = toDokumente(assets);
  const stakeholderVMs = toStakeholder(stakeholders);

  const nextDeadline = deadlines.find((d) => new Date(d.due_date).getTime() > Date.now());
  const allTimes = [
    p.updated_at,
    ...canonical.map((c) => c.updated_at),
    ...events.map((e) => e.created_at),
    ...assets.map((a) => a.updated_at),
  ].filter(Boolean);
  const lastChange = allTimes.length
    ? allTimes.reduce((max, t) => (new Date(t).getTime() > new Date(max).getTime() ? t : max))
    : p.updated_at;
  const budgetFact = canonical.find((c) => {
    const v = c.content as Record<string, unknown> | null;
    return (
      v &&
      (v.kind === "budget" ||
        (typeof v.label === "string" && v.label.toLowerCase().includes("budget")))
    );
  });

  const rawSummary = snapshot?.summary as string | undefined;
  const snapshotSummary = humanizeSnapshotSummary(rawSummary);
  const fallbackLage =
    konflikte.length || gapVMs.length || handlungsbedarf.length
      ? `${handlungsbedarf.length} offen, ${konflikte.length} Konflikt${
          konflikte.length === 1 ? "" : "e"
        }, ${gapVMs.length} Lücke${gapVMs.length === 1 ? "" : "n"}.`
      : "Noch keine Erkenntnisse — leg etwas ab und ich fange an zu verstehen.";

  const isEmpty =
    canonical.length === 0 &&
    events.length === 0 &&
    assets.length === 0 &&
    decisions.length === 0 &&
    tasks.length === 0;

  const vm: ProjectViewModel = {
    id: p.id,
    name: p.name,
    status: p.status,
    description: p.description ?? "",
    lagetext: snapshotSummary ?? fallbackLage,
    outcome: outcome
      ? {
          erfolgskriterium: outcome.success_criteria,
          nogos: outcome.no_gos ?? [],
        }
      : null,
    stats: {
      letzteAenderung: formatRelative(lastChange) || "—",
      naechsterTermin: nextDeadline ? fmtDate(nextDeadline.due_date) : "—",
      budget: budgetFact ? titleFromJson(budgetFact.content, "—") : "—",
    },
    konflikte,
    gaps: gapVMs,
    dependencies: depVMs,
    handlungsbedarf,
    verlauf,
    themen,
    dokumente,
    stakeholder: stakeholderVMs,
  };

  return { vm, isEmpty };
}
