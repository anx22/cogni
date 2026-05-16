import { createClient } from "jsr:@supabase/supabase-js@2";
import { withErrorBoundary } from "../_shared/withErrorBoundary.ts";
import { createLogger } from "../_shared/logger.ts";
import { handleOptions, ok, fail } from "../_shared/http.ts";

Deno.serve(
  withErrorBoundary("voice-transcribe", async (req) => {
    const pre = handleOptions(req);
    if (pre) return pre;

    const log = createLogger({ fn: "voice-transcribe" });
    try {
      log.stage("enter", "request received", { method: req.method });
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) return fail("Unauthorized", 401);

      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } },
      );
      const {
        data: { user },
        error: authError,
      } = await supabaseClient.auth.getUser();
      if (authError || !user) return fail("Unauthorized", 401);

      const body = await req.json();
      const audioBase64 = body.audio_base64;
      if (!audioBase64 || typeof audioBase64 !== "string") {
        return fail("audio_base64 required", 400);
      }

      const apiKey = Deno.env.get("LOVABLE_API_KEY");
      if (!apiKey) return fail("LOVABLE_API_KEY not configured", 500);

      const response = await fetch("https://ai-gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content:
                "Du bist ein Transkriptions-Assistent. Transkribiere die folgende Audioaufnahme wortgenau auf Deutsch. Gib NUR den transkribierten Text zurück, keine Erklärungen, keine Anführungszeichen.",
            },
            {
              role: "user",
              content: [
                {
                  type: "input_audio",
                  input_audio: {
                    data: audioBase64,
                    format: "webm",
                  },
                },
                {
                  type: "text",
                  text: "Bitte transkribiere diese Audioaufnahme.",
                },
              ],
            },
          ],
          max_tokens: 4096,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        log.warn("ai_gateway", "transcription request failed", {
          detail: errText.slice(0, 240),
          status: response.status,
        });
        await log.flush();
        return fail("Transkription fehlgeschlagen", 502, { detail: errText });
      }

      const result = await response.json();
      const text = result.choices?.[0]?.message?.content?.trim() ?? "";

      log.stage("exit", "transcription ok", { length: text.length });
      await log.flush();
      return ok({ text });
    } catch (err) {
      log.error("threw", "uncaught", err);
      await log.flush();
      return fail(String(err), 500);
    }
  }),
);
