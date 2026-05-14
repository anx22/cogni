// =============================================================================
//  intake-understand / helpers — kleine pure utils.
// =============================================================================

export async function deterministicRunId(asset_id: string, attempt: number): Promise<string> {
  // SHA-256(asset_id|attempt) → die ersten 16 Bytes als UUID v4-ähnlich formatiert.
  const data = new TextEncoder().encode(`${asset_id}|${attempt}`);
  const hash = new Uint8Array(await crypto.subtle.digest("SHA-256", data));
  const b = hash.slice(0, 16);
  b[6] = (b[6] & 0x0f) | 0x40; // version 4
  b[8] = (b[8] & 0x3f) | 0x80; // variant 10
  const hex = Array.from(b).map((x) => x.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}
