// =============================================================================
//  smoke-welle-b — einmaliger Sandbox-Smoke für Welle-B-Detektoren.
//  Akzeptiert {user_id, review_case_id, decision="confirm"}, ruft commitFact()
//  direkt mit Service-Role auf. Umgeht Auth bewusst (nur Sandbox).
// =============================================================================
// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { commitFact } from "../commit-fact/kernel.ts";
import { createLogger } from "../_shared/logger.ts";
import { withErrorBoundary } from "../_shared/withErrorBoundary.ts";
import { ok, fail, handleOptions } from "../_shared/http.ts";

export default withErrorBoundary("smoke-welle-b", async (req: Request) => {
  const opt = handleOptions(req);
  if (opt) return opt;

  const body = await req.json().catch(() => ({}));
  const { user_id, review_case_id, decision = "confirm" } = body ?? {};
  if (!user_id || !review_case_id) {
    return fail("user_id + review_case_id required", 400);
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const log = createLogger({ fn: "smoke-welle-b", userId: user_id, client: admin as any });

  const result = await commitFact({
    admin,
    user: { id: user_id },
    payload: { review_case_id, decision, user_decision: { decision } },
    log,
  });

  await log.flush();
  return ok(result);
});

Deno.serve(await import("./index.ts").then((m) => m.default));
