// =============================================================================
//  handlers/promptHub.ts — Prompt-Cache + Live-Probe
// -----------------------------------------------------------------------------
//  prompt-cache-bust, prompt-state
//  Dynamische Imports beibehalten (Cold-Start-Schutz).
// =============================================================================

import { type Handler, jsonResponse } from "../_helpers.ts";

export const handlers: Record<string, Handler> = {
  "prompt-cache-bust": async () => {
    const { bustPromptCache } = await import("../../_shared/promptHub.ts");
    const cleared = bustPromptCache();
    return jsonResponse({ ok: true, ...cleared });
  },

  "prompt-state": async (body) => {
    const { promptCacheState, getPrompt } = await import("../../_shared/promptHub.ts");
    const state = promptCacheState();
    const probes: Record<string, unknown> = {};
    if (body.probe || body.ensure) {
      const { AGENT_SYSTEM_PROMPT_FALLBACK, ASSIGNMENT_SYSTEM_PROMPT_FALLBACK } = await import(
        "../../_shared/agentConfig.ts"
      );
      const fallbacks: Record<string, string> = {
        "extract-facts": AGENT_SYSTEM_PROMPT_FALLBACK,
        "suggest-assignment": ASSIGNMENT_SYSTEM_PROMPT_FALLBACK,
      };
      const names: string[] = Array.isArray(body.probe)
        ? body.probe
        : Array.isArray(body.ensure)
          ? body.ensure
          : ["extract-facts", "suggest-assignment"];
      for (const n of names) {
        const r = await getPrompt(n, {
          fallback: fallbacks[n] ?? "(fallback)",
          autoCreate: !!body.ensure,
        });
        probes[n] = { version: r.version, source: r.source, length: r.system.length };
      }
    }
    return jsonResponse({ ok: true, state, probes });
  },
};
