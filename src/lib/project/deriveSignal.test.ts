import { describe, it, expect } from "vitest";
import { deriveSignal } from "./deriveSignal";
import type { ProjectViewModel } from "./types";

const base = (): ProjectViewModel =>
  ({
    konflikte: [],
    handlungsbedarf: [],
    gaps: [],
    themen: [],
    verlauf: [],
    dokumente: [],
    stakeholder: [],
    dependencies: [],
    lagetext: "",
    stats: { naechsterTermin: "—", entscheidungen: 0, offenePunkte: 0, aufgaben: 0 },
    coverage: { knownFacts: 0, openGaps: 0, conflictsActive: 0, lastIntakeAge: "—" },
  }) as unknown as ProjectViewModel;

describe("deriveSignal", () => {
  it("conflict: Konflikt vorhanden → conflict", () => {
    const vm = base();
    vm.konflikte = [{ id: "k1" } as never];
    expect(deriveSignal(vm)).toBe("conflict");
  });

  it("review: kein Konflikt, aber blocker in handlungsbedarf → review", () => {
    const vm = base();
    vm.handlungsbedarf = [{ id: "h1", blocker: true } as never];
    expect(deriveSignal(vm)).toBe("review");
  });

  it("action: kein Konflikt, kein blocker, aber handlungsbedarf vorhanden → action", () => {
    const vm = base();
    vm.handlungsbedarf = [{ id: "h1", blocker: false } as never];
    expect(deriveSignal(vm)).toBe("action");
  });

  it("action: kein Konflikt, kein blocker, aber gaps vorhanden → action", () => {
    const vm = base();
    vm.gaps = [{ id: "g1" } as never];
    expect(deriveSignal(vm)).toBe("action");
  });

  it("calm: nichts offen → calm", () => {
    expect(deriveSignal(base())).toBe("calm");
  });

  it("conflict hat höchste Priorität (auch bei blocker+gaps)", () => {
    const vm = base();
    vm.konflikte = [{ id: "k1" } as never];
    vm.handlungsbedarf = [{ id: "h1", blocker: true } as never];
    vm.gaps = [{ id: "g1" } as never];
    expect(deriveSignal(vm)).toBe("conflict");
  });
});
