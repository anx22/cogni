/* eslint-disable @typescript-eslint/no-explicit-any */
import type { StakeholderVM } from "../types";

export function toStakeholder(stakeholders: any[]): StakeholderVM[] {
  return stakeholders.map((s) => {
    const personRow = (s as { persons?: { name?: string; role?: string } | null }).persons ?? null;
    const orgRow = (s as { organizations?: { name?: string } | null }).organizations ?? null;
    return {
      id: s.id,
      name: personRow?.name ?? orgRow?.name ?? "—",
      rolle: s.role ?? personRow?.role ?? "",
      org: orgRow?.name ?? "",
    };
  });
}
