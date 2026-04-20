import { useSyncExternalStore } from "react";
import { devlog, type DevLogEntry } from "./devlog";

export function useDevLog(): {
  entries: DevLogEntry[];
  paused: boolean;
  enabled: boolean;
  clear: () => void;
  setPaused: (p: boolean) => void;
} {
  const entries = useSyncExternalStore(
    (cb) => devlog.subscribe(cb),
    () => devlog.getSnapshot(),
    () => [],
  );
  const paused = useSyncExternalStore(
    (cb) => devlog.subscribe(cb),
    () => devlog.isPaused(),
    () => false,
  );
  return {
    entries,
    paused,
    enabled: devlog.isEnabled,
    clear: () => devlog.clear(),
    setPaused: (p) => devlog.setPaused(p),
  };
}
