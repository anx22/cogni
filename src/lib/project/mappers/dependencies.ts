/* eslint-disable @typescript-eslint/no-explicit-any */
import type { DependencyVM } from "../types";

export function toDependencies(deps: any[]): DependencyVM[] {
  return deps.map((d) => ({
    id: d.id,
    typ: d.dependency_type,
    quelle: d.source_type,
    ziel: d.target_type,
    beschreibung: d.description ?? "",
  }));
}
