// =============================================================================
//  useBoxSubmit — kleines Pattern für Box-Confirm-Logik
// -----------------------------------------------------------------------------
//  Bisheriges Muster in Auswahl/Gap/Konflikt-Box:
//    updateBoxPayload(box.id, patch)
//    commitBox(box.id, "confirm", patch)
//    if (session?.context) markManual(session.context)
//
//  Hook kapselt genau diese drei Zeilen + Readonly/Gate-Schutz, damit Boxen
//  nur noch ihre eigene Validation/Payload definieren müssen.
//
//  Bewusst klein gehalten: keine Generic-„Renderer", keine Konfig-Map.
// =============================================================================

import { useCallback } from "react";
import { useDialog } from "@/components/dialog/dialogContext";
import { useManualOverrides } from "@/lib/dialog/manualOverrides";
import type { DialogBox } from "@/lib/dialog/types";

interface UseBoxSubmitOptions {
  /** Standard true: trägt Box-Context in manual_overrides ein. */
  markManualOnSubmit?: boolean;
  /** Standard true: respektiert globales gateReason. Zuordnungsbox setzt false. */
  respectGate?: boolean;
}

export interface BoxSubmitApi {
  /** True wenn Submit aktuell erlaubt ist (nicht readonly, nicht gated). */
  enabled: boolean;
  /** Payload mergen, committen, optional manual markieren. */
  submit: (payload: Record<string, unknown>) => void;
  /** Reject ohne Payload. */
  reject: () => void;
}

export function useBoxSubmit(box: DialogBox, opts: UseBoxSubmitOptions = {}): BoxSubmitApi {
  const { markManualOnSubmit = true, respectGate = true } = opts;
  const { session, updateBoxPayload, commitBox, readonly, gateReason } = useDialog();
  const { markManual } = useManualOverrides();

  const gated = respectGate && !!gateReason;
  const enabled = !readonly && !gated;

  const submit = useCallback(
    (payload: Record<string, unknown>) => {
      if (!enabled) return;
      updateBoxPayload(box.id, payload);
      commitBox(box.id, "confirm", payload);
      if (markManualOnSubmit && session?.context) markManual(session.context);
    },
    [
      enabled,
      box.id,
      updateBoxPayload,
      commitBox,
      markManualOnSubmit,
      session?.context,
      markManual,
    ],
  );

  const reject = useCallback(() => {
    if (!enabled) return;
    commitBox(box.id, "reject");
  }, [enabled, box.id, commitBox]);

  return { enabled, submit, reject };
}
