// =============================================================================
//  Entity-Core — Signal-Factory. Ergonomische Konstruktoren für EntitySignal.
// =============================================================================

import type { EntitySignal, IntakeFailReason } from "./types";

export const entitySignal = {
  intakeStarted: (inputType?: string): EntitySignal => ({ kind: "intake.started", inputType }),
  intakeProgress: (): EntitySignal => ({ kind: "intake.progress" }),
  intakeFailed: (reason?: IntakeFailReason, assetId?: string): EntitySignal => ({
    kind: "intake.failed",
    reason,
    assetId,
  }),
  intakeEmpty: (): EntitySignal => ({ kind: "intake.empty" }),
  intakeSettle: (): EntitySignal => ({ kind: "intake.settle" }),
  reviewReady: (sessionId: string): EntitySignal => ({ kind: "review.ready", sessionId }),
  reviewOpened: (sessionId?: string): EntitySignal => ({ kind: "review.opened", sessionId }),
  reviewDismissed: (): EntitySignal => ({ kind: "review.dismissed" }),
  dragEnter: (): EntitySignal => ({ kind: "drag.enter" }),
  dragLeave: (): EntitySignal => ({ kind: "drag.leave" }),
  drop: (): EntitySignal => ({ kind: "drop" }),
  systemBlocked: (): EntitySignal => ({ kind: "system.blocked" }),
  systemUnblocked: (): EntitySignal => ({ kind: "system.unblocked" }),
  userAcknowledge: (): EntitySignal => ({ kind: "user.acknowledge" }),
  proactive: (intent?: string): EntitySignal => ({ kind: "proactive", intent }),
} as const;
