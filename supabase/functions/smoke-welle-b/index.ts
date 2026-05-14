// =============================================================================
//  smoke-welle-b — Sandbox-Smoke. Mintet eine User-Session via admin
//  generateLink+verifyOtp und ruft die deployte `commit-fact`-Function als
//  dieser User auf. Nur Sandbox.
// =============================================================================
// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { withErrorBoundary } from "../_shared/withErrorBoundary.ts";
import { ok, fail, handleOptions } from "../_shared/http.ts";

const handler = withErrorBoundary("smoke-welle-b", async (req: Request) => {
  const opt = handleOptions(req);
  if (opt) return opt;

  const body = await req.json().catch(() => ({}));
  const { email, review_case_id, decision = "confirm", user_decision } = body ?? {};
  if (!email || !review_case_id) {
    return fail("email + review_case_id required", 400);
  }

  const url = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(url, serviceKey);

  // 1. Magiclink für User minten
  const link = await admin.auth.admin.generateLink({ type: "magiclink", email });
  if (link.error || !link.data?.properties?.hashed_token) {
    return fail(`generateLink failed: ${link.error?.message}`, 500);
  }
  const token_hash = link.data.properties.hashed_token;

  // 2. OTP einlösen → access_token
  const anonClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!);
  const otp = await anonClient.auth.verifyOtp({ token_hash, type: "magiclink" });
  if (otp.error || !otp.data?.session?.access_token) {
    return fail(`verifyOtp failed: ${otp.error?.message}`, 500);
  }
  const access_token = otp.data.session.access_token;

  // 3. commit-fact als User aufrufen
  const cf = await fetch(`${url}/functions/v1/commit-fact`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      review_case_id,
      decision,
      user_decision: user_decision ?? { decision },
    }),
  });
  const cfBody = await cf.json().catch(() => ({}));
  return ok({ status: cf.status, result: cfBody });
});

Deno.serve(handler);
