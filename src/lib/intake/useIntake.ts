import { useCallback } from "react";
import { toast } from "sonner";
import type { IntakePayload } from "./detectInputType";

type EntityState = "idle" | "hover" | "processing" | "review-ready" | "failed";

interface UseIntakeOptions {
  setEntityState?: (s: EntityState) => void;
  setLastImpact?: (s: string) => void;
  onIntake?: (payload: IntakePayload) => void;
}

export function useIntake(options: UseIntakeOptions = {}) {
  const { setEntityState, setLastImpact, onIntake } = options;

  const intake = useCallback(
    (payload: IntakePayload) => {
      const detail =
        payload.type === "file"
          ? `${payload.files?.length ?? 0} ${(payload.files?.length ?? 0) === 1 ? "Datei" : "Dateien"}`
          : payload.label;

      toast(`${detail} aufgenommen`, {
        description: "wird verarbeitet",
      });

      setLastImpact?.(`${detail} aufgenommen`);
      setEntityState?.("processing");

      // Mock-Verarbeitung
      window.setTimeout(() => {
        setEntityState?.("idle");
      }, 1800);

      onIntake?.(payload);
    },
    [setEntityState, setLastImpact, onIntake],
  );

  return { intake };
}
