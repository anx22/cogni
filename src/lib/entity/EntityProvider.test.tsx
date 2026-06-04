// =============================================================================
//  EntityProvider — Mehrfach-Mount-Reuse (Phase 7).
//  Beweist: EIN Provider, mehrere useEntity()-Konsumenten teilen denselben
//  State; ein Signal über den Controller updatet alle Mounts.
//  Supabase-berührende Ränder (Sources/Communication/Character) sind gemockt —
//  Machine + Presets + Interaction laufen echt.
// =============================================================================

import { describe, it, expect, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { EntityProvider } from "./EntityProvider";
import { useEntity } from "./useEntity";
import { entitySignal } from "./signals";
import type { EntityController } from "./entityContext";

vi.mock("./useEntitySources", () => ({
  useEntitySources: () => ({ openPendingSession: vi.fn() }),
}));
vi.mock("./communication/useEntityCommunication", () => ({
  useEntityCommunication: () => ({ utterance: null, pushInput: vi.fn() }),
}));
vi.mock("@/components/entity/useSelectedCharacter", () => ({
  useSelectedCharacter: () => ({ characterId: "siri" }),
}));

function Consumer({ id }: { id: string }) {
  const { state, vm } = useEntity();
  return <div data-testid={id}>{`${state}|${vm.mode}`}</div>;
}

let captured: EntityController | null = null;
function Capture() {
  captured = useEntity().controller;
  return null;
}

describe("EntityProvider — Singleton über mehrere Mounts", () => {
  it("zwei Konsumenten teilen den State; ein Signal updatet beide", () => {
    captured = null;
    render(
      <EntityProvider>
        <Consumer id="a" />
        <Consumer id="b" />
        <Capture />
      </EntityProvider>,
    );

    expect(screen.getByTestId("a").textContent).toBe("idle|resting");
    expect(screen.getByTestId("b").textContent).toBe("idle|resting");

    act(() => captured!.signal(entitySignal.intakeStarted("note")));

    // Beide Mounts sehen denselben neuen State — eine Quelle.
    expect(screen.getByTestId("a").textContent).toBe("processing|resting");
    expect(screen.getByTestId("b").textContent).toBe("processing|resting");
  });

  it("Achse 2: controller.interact treibt den Mode in allen Mounts", () => {
    captured = null;
    render(
      <EntityProvider>
        <Consumer id="x" />
        <Capture />
      </EntityProvider>,
    );

    expect(screen.getByTestId("x").textContent).toBe("idle|resting");
    act(() => captured!.interact({ kind: "pick", mode: "file" }));
    expect(screen.getByTestId("x").textContent).toBe("idle|compose:file");
  });
});
