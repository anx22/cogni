// =============================================================================
//  deriveSignal — abstrahiert die UI-Signal-Logik aus dem ViewModel.
//  Wird im ProjectScreen-Header und in der Sidebar verwendet, damit der Status-
//  Dot überall konsistent vom selben Zustand abgeleitet wird.
// =============================================================================

import type { ProjectViewModel } from "./types";

export type ProjectSignalKind = "conflict" | "review" | "action" | "calm";

export const deriveSignal = (vm: ProjectViewModel): ProjectSignalKind => {
  const hasConflict = vm.konflikte.length > 0;
  if (hasConflict) return "conflict";
  const hasBlocker = vm.handlungsbedarf.some((h) => h.blocker);
  if (hasBlocker) return "review";
  const hasOpen = vm.handlungsbedarf.length > 0 || vm.gaps.length > 0;
  if (hasOpen) return "action";
  return "calm";
};

export const SIGNAL_DOT_CLASS: Record<ProjectSignalKind, string> = {
  conflict: "dot--conflict",
  review: "dot--review",
  action: "dot--action",
  calm: "dot--calm",
};

export const SIGNAL_LABEL: Record<ProjectSignalKind, string> = {
  conflict: "Konflikt",
  review: "Review fällig",
  action: "Offen",
  calm: "Ruhig",
};
