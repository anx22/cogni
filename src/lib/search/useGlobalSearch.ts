import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type SearchKind = "decision" | "topic" | "task" | "open_point";

export interface SearchHit {
  id: string;
  kind: SearchKind;
  title: string;
  projectId: string;
  projectName: string;
}

const MIN_QUERY = 2;
const PER_KIND = 6;
const DEBOUNCE_MS = 200;

/**
 * Projektübergreifende Volltext-Suche über die vier Substanz-Tabellen
 * (decisions/topics/tasks/open_points) auf ihren Klartext-Spalten.
 * Läuft nur wenn `enabled` (Menü offen) und Query ≥ 2 Zeichen.
 * canonical_facts (JSONB) bleibt vorerst außen vor — die vier Tabellen
 * spiegeln die Substanz bereits über `canonical_fact_id`.
 */
export function useGlobalSearch(
  query: string,
  enabled: boolean,
): { results: SearchHit[]; loading: boolean } {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const [results, setResults] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const projectNames = useRef<Map<string, string>>(new Map());

  // Projektnamen einmal pro geöffnetem Menü laden (für die Zuordnung der Treffer).
  useEffect(() => {
    if (!enabled || !userId) return;
    let cancelled = false;
    supabase
      .from("projects")
      .select("id, name")
      .eq("user_id", userId)
      .then(({ data }) => {
        if (cancelled) return;
        const m = new Map<string, string>();
        data?.forEach((r) => m.set(r.id, r.name));
        projectNames.current = m;
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, userId]);

  useEffect(() => {
    const q = query.trim();
    if (!enabled || !userId || q.length < MIN_QUERY) {
      setResults([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const handle = setTimeout(async () => {
      const pattern = `%${q}%`;
      const [dec, top, tsk, op] = await Promise.all([
        supabase
          .from("decisions")
          .select("id, title, project_id")
          .eq("user_id", userId)
          .ilike("title", pattern)
          .limit(PER_KIND),
        supabase
          .from("topics")
          .select("id, name, project_id")
          .eq("user_id", userId)
          .is("merged_into", null)
          .ilike("name", pattern)
          .limit(PER_KIND),
        supabase
          .from("tasks")
          .select("id, title, project_id")
          .eq("user_id", userId)
          .ilike("title", pattern)
          .limit(PER_KIND),
        supabase
          .from("open_points")
          .select("id, title, project_id")
          .eq("user_id", userId)
          .ilike("title", pattern)
          .limit(PER_KIND),
      ]);
      if (cancelled) return;

      const names = projectNames.current;
      const resolve = (pid: string) => names.get(pid) ?? "—";
      const hits: SearchHit[] = [];
      dec.data?.forEach((r) => {
        if (r.project_id)
          hits.push({
            id: r.id,
            kind: "decision",
            title: r.title,
            projectId: r.project_id,
            projectName: resolve(r.project_id),
          });
      });
      top.data?.forEach((r) => {
        if (r.project_id)
          hits.push({
            id: r.id,
            kind: "topic",
            title: r.name,
            projectId: r.project_id,
            projectName: resolve(r.project_id),
          });
      });
      tsk.data?.forEach((r) => {
        if (r.project_id)
          hits.push({
            id: r.id,
            kind: "task",
            title: r.title,
            projectId: r.project_id,
            projectName: resolve(r.project_id),
          });
      });
      op.data?.forEach((r) => {
        if (r.project_id)
          hits.push({
            id: r.id,
            kind: "open_point",
            title: r.title,
            projectId: r.project_id,
            projectName: resolve(r.project_id),
          });
      });

      setResults(hits);
      setLoading(false);
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [query, enabled, userId]);

  return { results, loading };
}
