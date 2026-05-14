// =============================================================================
//  _shared/withLogging.ts
// -----------------------------------------------------------------------------
//  Komfort-Wrapper über `withErrorBoundary`, der zusätzlich:
//    - einen `Logger` für die Function erzeugt,
//    - CORS-Preflight via `handleOptions` bedient,
//    - im `finally` `log.flush()` ausführt.
//
//  Verwendung:
//    Deno.serve(withLogging("asset-delete", async (req, log) => {
//      log.stage("enter", "request received");
//      ...
//      return ok({ ok: true });
//    }));
//
//  WICHTIG: Wrapper ist nur für Functions geeignet, die UNCAUGHT Errors gerne
//  vom `withErrorBoundary` einheitlich (500 + correlation_id) abfedern lassen.
//  Functions mit eigenem catch-Pfad (z. B. `intake-trigger` aktualisiert
//  `aol_runs.status='failed'`, `aol-callback` gibt explizit 400 zurück,
//  `voice-transcribe`/`commit-fact` setzen abweichende Error-Bodies) MÜSSEN
//  weiterhin manuell loggen — siehe `docs/DECISIONS.md` (B4.2).
// =============================================================================

import { withErrorBoundary, type Handler } from "./withErrorBoundary.ts";
import { createLogger, type Logger } from "./logger.ts";
import { handleOptions } from "./http.ts";

export type LoggingHandler = (req: Request, log: Logger) => Promise<Response> | Response;

export function withLogging(fn: string, handler: LoggingHandler): Handler {
  return withErrorBoundary(fn, async (req: Request) => {
    const pre = handleOptions(req);
    if (pre) return pre;

    const log = createLogger({ fn });
    try {
      return await handler(req, log);
    } finally {
      await log.flush().catch(() => {});
    }
  });
}
