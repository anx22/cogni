import { createContext, useCallback, useContext, useState, ReactNode } from "react";

interface ManualOverridesValue {
  isManual: (quelle: string) => boolean;
  markManual: (quelle: string) => void;
}

const ManualOverridesContext = createContext<ManualOverridesValue | null>(null);

export const ManualOverridesProvider = ({ children }: { children: ReactNode }) => {
  const [sources, setSources] = useState<Set<string>>(new Set());

  const markManual = useCallback((quelle: string) => {
    if (!quelle) return;
    setSources((prev) => {
      if (prev.has(quelle)) return prev;
      const next = new Set(prev);
      next.add(quelle);
      return next;
    });
  }, []);

  const isManual = useCallback((quelle: string) => sources.has(quelle), [sources]);

  return (
    <ManualOverridesContext.Provider value={{ isManual, markManual }}>
      {children}
    </ManualOverridesContext.Provider>
  );
};

export const useManualOverrides = () => {
  const ctx = useContext(ManualOverridesContext);
  if (!ctx) {
    return { isManual: () => false, markManual: () => {} } as ManualOverridesValue;
  }
  return ctx;
};
