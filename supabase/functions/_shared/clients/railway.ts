// =============================================================================
//  _shared/clients/railway.ts — Railway Public GraphQL Client
// -----------------------------------------------------------------------------
//  Endpoint: https://backboard.railway.com/graphql/v2
//  Erfordert RAILWAY_API_TOKEN. Wirft RailwayError bei HTTP-/GraphQL-Fehlern.
// =============================================================================

const ENDPOINT = "https://backboard.railway.com/graphql/v2";

export class RailwayError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
}

export interface RailwayClient {
  endpoint: string;
  gql<T>(query: string, variables?: Record<string, unknown>): Promise<T>;
}

export function createRailwayClient(): RailwayClient | null {
  const token = Deno.env.get("RAILWAY_API_TOKEN");
  if (!token) return null;

  return {
    endpoint: ENDPOINT,
    async gql<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ query, variables }),
      });
      const txt = await res.text();
      if (!res.ok) throw new RailwayError(`Railway ${res.status}: ${txt.slice(0, 400)}`, res.status);
      let json: { data?: T; errors?: unknown };
      try {
        json = JSON.parse(txt);
      } catch {
        throw new RailwayError(`Railway non-JSON response: ${txt.slice(0, 400)}`, res.status);
      }
      if (json.errors) {
        throw new RailwayError(
          `Railway GraphQL: ${JSON.stringify(json.errors).slice(0, 400)}`,
          res.status,
        );
      }
      return json.data as T;
    },
  };
}
