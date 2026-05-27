// =============================================================================
//  projectViewModel — Composer + Barrel.
// -----------------------------------------------------------------------------
//  Mapper liegen in ./mappers/*. Hier nur RawProjectData, Composer und Re-Exports.
// =============================================================================

import { formatRelative } from "@/lib/format/relativeTime";
import { fmtLong, fmtShort, ageInDays } from "@/lib/format/dateFormatters";
import type { Tables } from "@/integrations/supabase/types";
import type { ProjectViewModel } from "./types";

// Geteilte Row-Types — abgeleitet aus generierten Supabase-Types.
// Schema-Drift fällt jetzt zur Compile-Zeit auf, nicht erst zur Render-Zeit.
type ProjectRow = Tables<"projects">;
type SnapshotRow = Pick<Tables<"project_state_snapshots">, "summary" | "created_at" | "snapshot">;
type OutcomeRow = Tables<"outcome_signals">;
type DeadlineRow = Tables<"deadlines">;
type CanonicalFactRow = Tables<"canonical_facts">;
type ContradictionRow = Tables<"contradictions">;
type GapSignalRow = Tables<"gap_signals">;
type DependencyRow = Tables<"dependencies">;
type DecisionRow = Tables<"decisions">;
type TaskRow = Tables<"tasks">;
type OpenPointRow = Tables<"open_points">;
type FeedbackRow = Tables<"feedback">;
type ChangeEventRow = Tables<"change_events">;
type TopicRow = Tables<"topics">;
type AssetRow = Tables<"assets">;
// Stakeholder-Links kommen mit Joins (persons/organizations) — nur die in
// useProjectData selektierten Spalten + Joins.
type StakeholderLinkRow = Pick<
  Tables<"project_stakeholder_links">,
  "id" | "role" | "person_id" | "organization_id"
> & {
  persons?: { name: string | null; role: string | null } | null;
  organizations?: { name: string | null } | null;
};

import { humanizeSnapshotSummary, titleFromJson } from "./mappers/humanize";
import { toKonflikte } from "./mappers/konflikte";
import { toGaps } from "./mappers/gaps";
import { toDependencies } from "./mappers/dependencies";
import { toHandlungsbedarf } from "./mappers/handlungsbedarf";
import { toVerlauf } from "./mappers/verlauf";
import { toThemen } from "./mappers/themen";
import { toDokumente } from "./mappers/dokumente";
import { toStakeholder } from "./mappers/stakeholder";

// Re-Exports für bestehende Importe
export {
  humanizeSnapshotSummary,
  titleFromJson,
  stringFromJson,
  numberFromJson,
} from "./mappers/humanize";
export { toKonflikte } from "./mappers/konflikte";
export { toGaps } from "./mappers/gaps";
export { toDependencies } from "./mappers/dependencies";
export { toHandlungsbedarf } from "./mappers/handlungsbedarf";
export { toVerlauf } from "./mappers/verlauf";
export { toThemen } from "./mappers/themen";
export { toDokumente } from "./mappers/dokumente";
export { toStakeholder } from "./mappers/stakeholder";
export { fmtLong as fmtDate, fmtShort, ageInDays };

const fmtDate = fmtLong;

export interface RawProjectData {
  project: ProjectRow;
  snapshot: SnapshotRow | null;
  outcome: OutcomeRow | null;
  deadlines: DeadlineRow[];
  canonical: CanonicalFactRow[];
  contradictions: ContradictionRow[];
  gaps: GapSignalRow[];
  deps: DependencyRow[];
  decisions: DecisionRow[];
  tasks: TaskRow[];
  openPoints: OpenPointRow[];
  feedbackRows: FeedbackRow[];
  events: ChangeEventRow[];
  topics: TopicRow[];
  assets: AssetRow[];
  stakeholders: StakeholderLinkRow[];
  /** P1-B4: vom commit-fact-Detector erkannte Merge-Kandidaten. Optional
   *  (älterer Code/Test-Fixtures setzen das Feld evtl. nicht). */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  topicMergeCandidates?: any[];
}

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
    topicMergeCandidates,
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
    topicMergeCandidates: topicMergeCandidates ?? [],
  });
  const verlauf = toVerlauf(events);

  // Wire konfliktRef into matching handlungsbedarf items so HandlungsbedarfList
  // can route Tier-1 conflicts to the quick Popover without a full drilldown.
  const konflikteById = new Map(konflikte.map((k) => [k.id, k]));
  for (const h of handlungsbedarf) {
    if (h.objektTyp === "konflikt") {
      const rawId = h.id.replace(/^con-/, "");
      const ref = konflikteById.get(rawId);
      if (ref) h.konfliktRef = ref;
    }
  }

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

  // Lage wird aus aktuellem Zustand zusammengesetzt, nicht aus dem letzten
  // Commit-Log-Satz. Snapshot-Summary kommt nur durch, wenn sie wirklich
  // eine Zustandsbeschreibung ist (sonst null aus humanizeSnapshotSummary).
  const lageFromState = (() => {
    if (konflikte.length === 0 && gapVMs.length === 0 && handlungsbedarf.length === 0) {
      if (canonical.length === 0) {
        return "Projekt ist angelegt. Leg Material ab — eine Datei, einen Link, eine Notiz — damit Lage und offene Punkte sichtbar werden.";
      }
      return "Keine offenen Punkte. Material liegt vor, der Stand ist konsistent.";
    }
    const parts: string[] = [];
    if (konflikte.length)
      parts.push(`${konflikte.length} Widerspr${konflikte.length === 1 ? "uch" : "üche"}`);
    const blocker = handlungsbedarf.filter((h) => h.blocker).length;
    if (blocker) parts.push(`${blocker} Blocker`);
    if (gapVMs.length) parts.push(`${gapVMs.length} offene Frage${gapVMs.length === 1 ? "" : "n"}`);
    const rest = handlungsbedarf.length - blocker;
    if (rest > 0)
      parts.push(`${rest} weitere${rest === 1 ? "r" : ""} Punkt${rest === 1 ? "" : "e"}`);
    return parts.length ? `Aktuell: ${parts.join(", ")}.` : "Der Stand ist konsistent.";
  })();
  const fallbackLage = lageFromState;

  const isEmpty =
    canonical.length === 0 &&
    events.length === 0 &&
    assets.length === 0 &&
    decisions.length === 0 &&
    tasks.length === 0;

  // Most recent canonical fact creation as proxy for "last intake".
  const intakeTimes = canonical.map((c) => c.created_at).filter(Boolean);
  const lastIntake = intakeTimes.length
    ? intakeTimes.reduce((max, t) => (new Date(t).getTime() > new Date(max).getTime() ? t : max))
    : lastChange;

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
    coverage: {
      knownFacts: canonical.length,
      openGaps: gaps.length,
      conflictsActive: konflikte.length,
      lastIntakeAge: formatRelative(lastIntake) || "—",
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
