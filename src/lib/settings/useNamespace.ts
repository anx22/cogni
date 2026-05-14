// =============================================================================
//  useNamespace — Loads all settings under a namespace and keeps them
//  in sync via Supabase Realtime. Also returns a setter for upserts.
// =============================================================================

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeTables, type RealtimeListener } from "@/lib/realtime/useRealtimeTables";
import type { SettingScope } from "./types";

interface Options {
  scope?: SettingScope;
}

export function useNamespace<T = unknown>(
  namespace: string,
  options: Options = {},
) {
  const scope: SettingScope = options.scope ?? "global";
  const [values, setValues] = useState<Record<string, T>>({});
  const [loaded, setLoaded] = useState(false);
  const debouncers = useRef<Record<string, number>>({});

  // Initial load
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("key,value")
        .eq("namespace", namespace)
        .eq("scope", scope);
      if (!mounted) return;
      if (!error && data) {
        const next: Record<string, T> = {};
        for (const row of data) next[row.key] = row.value as T;
        setValues(next);
      }
      setLoaded(true);
    })();
    return () => {
      mounted = false;
    };
  }, [namespace, scope]);

  const channelName = useMemo(
    () => `app_settings:${namespace}:${scope}`,
    [namespace, scope],
  );

  const listeners = useMemo<RealtimeListener[]>(
    () => [
      {
        table: "app_settings",
        filter: `namespace=eq.${namespace}`,
        handler: (payload) => {
          const row = (payload.new ?? payload.old) as
            | { key: string; value: T; scope: SettingScope }
            | undefined;
          if (!row || row.scope !== scope) return;
          if (payload.eventType === "DELETE") {
            setValues((prev) => {
              const next = { ...prev };
              delete next[row.key];
              return next;
            });
          } else {
            const newRow = payload.new as { key: string; value: T };
            setValues((prev) => ({ ...prev, [newRow.key]: newRow.value }));
          }
        },
      },
    ],
    [namespace, scope],
  );

  useRealtimeTables(channelName, listeners);

  const setValue = useCallback(
    async (key: string, value: T) => {
      // Optimistic update
      setValues((prev) => ({ ...prev, [key]: value }));

      // Debounce per-key writes to DB (300ms)
      const existing = debouncers.current[key];
      if (existing) window.clearTimeout(existing);
      debouncers.current[key] = window.setTimeout(async () => {
        const { data: auth } = await supabase.auth.getUser();
        const uid = auth.user?.id ?? null;
        const { error } = await supabase.from("app_settings").upsert(
          {
            namespace,
            key,
            value: value as never,
            scope,
            user_id: scope === "user" ? uid : null,
            updated_by: uid,
          },
          { onConflict: "namespace,key,user_id" },
        );
        if (error) {
          console.error("[useNamespace] upsert failed", { namespace, key, scope, error });
        }
      }, 300);
    },
    [namespace, scope],
  );

  return { values, setValue, loaded };
}
