// =============================================================================
//  projectViewModel — Composer + Barrel.
// -----------------------------------------------------------------------------
//  Mapper liegen in ./mappers/*. Hier nur RawProjectData, Composer und Re-Exports.
// =============================================================================
/* eslint-disable @typescript-eslint/no-explicit-any */

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
// Stakeholder-Links kommen mit Joins (persons/organizations) — leichter Typ.
type StakeholderLinkRow = Tables<"project_stakeholder_links"> & {
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
export { humanizeSnapshotSummary, titleFromJson, stringFromJson, numberFromJson } from "./mappers/humanize";
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
