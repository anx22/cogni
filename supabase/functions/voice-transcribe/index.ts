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

      const apiKey = Deno.env.get("OPENAI_API_KEY");
      if (!apiKey) return fail("OPENAI_API_KEY not configured", 500);

      // base64 (webm) -> Bytes -> multipart/form-data für OpenAI Whisper STT.
      const audioBytes = Uint8Array.from(atob(audioBase64), (c) => c.charCodeAt(0));
      const form = new FormData();
      form.append("file", new Blob([audioBytes], { type: "audio/webm" }), "audio.webm");
      form.append("model", "whisper-1");
      form.append("language", "de");

      const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: form,
      });

      if (!response.ok) {
        const errText = await response.text();
        log.warn("openai_stt", "transcription request failed", {
          detail: errText.slice(0, 240),
          status: response.status,
        });
        await log.flush();
        return fail("Transkription fehlgeschlagen", 502, { detail: errText });
      }

      const result = await response.json();
      const text = typeof result.text === "string" ? result.text.trim() : "";

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
