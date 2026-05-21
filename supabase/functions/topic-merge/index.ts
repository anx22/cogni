// =============================================================================
//  topic-merge — P1-B4 Action.
// -----------------------------------------------------------------------------
//  Eingang vom Frontend nach User-Entscheidung in `buildThemaMergeSession`.
//  Body: { candidate_id: UUID, decision: "merge" | "reject" }
//
//  merge:  setzt topics.merged_into = target_topic_id auf source_topic_id;
//          markiert candidate als 'merged'.
//  reject: markiert candidate als 'rejected'; topics unverändert.
//
//  Fail-fast bei fehlender Auth, fehlendem candidate oder ownership-Mismatch.
//  Keine Detektor-Side-Effects — die finden in commit-fact statt.
// =============================================================================
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { withLogging } from "../_shared/withLogging.ts";
import { ok, fail } from "../_shared/http.ts";
import { getAuthenticatedUser } from "../_shared/auth.ts";

Deno.serve(
  withLogging("topic-merge", async (req, log) => {
    if (req.method !== "POST") return fail("method", 405);

    const auth = await getAuthenticatedUser(req);
    if (!auth.ok) return fail(auth.error, auth.status);
    const userId = auth.userId;
    log.bind({ userId });

    let candidate_id = "";
    let decision: "merge" | "reject" = "merge";
    try {
      const body = await req.json();
      candidate_id = String(body?.candidate_id ?? "");
      const d = String(body?.decision ?? "");
      if (d !== "merge" && d !== "reject") return fail("decision", 400);
      decision = d;
    } catch {
      return fail("body", 400);
    }
    if (!candidate_id) return fail("candidate_id", 400);

    const url = Deno.env.get("SUPABASE_URL")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    // deno-lint-ignore no-explicit-any
    const admin: any = createClient(url, service);
    log.stage("enter", "processing topic-merge", { candidate_id, decision });

    const { data: cand, error: candErr } = await admin
      .from("topic_merge_candidates")
      .select("id, user_id, project_id, source_topic_id, target_topic_id, status")
      .eq("id", candidate_id)
      .maybeSingle();
    if (candErr || !cand) {
      log.warn("not_found", "candidate not found", { error: candErr?.message });
      return fail("not_found", 404);
    }
    if (cand.user_id !== userId) {
      log.warn("forbidden", "candidate not owned", { candidate_id });
      return fail("forbidden", 403);
    }
    if (cand.status !== "open") {
      log.warn("already_decided", "candidate already decided", { status: cand.status });
      return ok({ ok: true, status: cand.status });
    }
    log.bind({ projectId: cand.project_id });

    if (decision === "reject") {
      const { error: upErr } = await admin
        .from("topic_merge_candidates")
        .update({ status: "rejected" })
        .eq("id", candidate_id);
      if (upErr) {
        log.error("reject_update_failed", "could not mark rejected", upErr);
        return fail(upErr.message, 500);
      }
      log.stage("exit", "rejected", { candidate_id });
      return ok({ ok: true, status: "rejected" });
    }

    // merge: source.merged_into = target.id. Beide topics müssen existieren und
    // dem User gehören.
    const { data: pair } = await admin
      .from("topics")
      .select("id, user_id, merged_into")
      .in("id", [cand.source_topic_id, cand.target_topic_id]);
    if (!pair || pair.length !== 2) {
      log.warn("topics_missing", "source or target topic missing", {
        pair: (pair ?? []).map((p: { id: string }) => p.id),
      });
      return fail("topics_missing", 400);
    }
    const owned = pair.every((p: { user_id: string }) => p.user_id === userId);
    if (!owned) {
      log.warn("forbidden", "topic ownership mismatch");
      return fail("forbidden", 403);
    }
    const source = pair.find((p: { id: string }) => p.id === cand.source_topic_id);
    if (source?.merged_into) {
      log.warn("already_merged", "source already merged", {
        source: cand.source_topic_id,
        into: source.merged_into,
      });
      // Trotzdem candidate auf 'merged' setzen für Aufräum-Idempotenz.
    } else {
      const { error: mErr } = await admin
        .from("topics")
        .update({ merged_into: cand.target_topic_id })
        .eq("id", cand.source_topic_id);
      if (mErr) {
        log.error("merge_update_failed", "could not set merged_into", mErr);
        return fail(mErr.message, 500);
      }
    }

    const { error: cUpErr } = await admin
      .from("topic_merge_candidates")
      .update({ status: "merged" })
      .eq("id", candidate_id);
    if (cUpErr) {
      log.warn("candidate_update_failed", "candidate mark failed", {
        error: cUpErr.message,
      });
    }
    log.stage("exit", "merged", {
      source: cand.source_topic_id,
      target: cand.target_topic_id,
    });
    return ok({
      ok: true,
      status: "merged",
      source_topic_id: cand.source_topic_id,
      target_topic_id: cand.target_topic_id,
    });
  }),
);
