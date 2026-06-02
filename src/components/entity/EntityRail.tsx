// =============================================================================
//  EntityRail — persistente rechte Schiene.
//  Trägt Entity (oben, kompakt) + optionalen Content-Slot (scrollbar darunter).
//  Sichtbar ab lg (≥1024px). Auf Home: mit ImpactPipelinePanel als children.
//  Auf Projekt: Entity allein — Drop-Target, Review-Signal, Intake-Eingang.
// =============================================================================
import type { ReactNode } from "react";
import Entity from "./Entity";
import AccountDrawer from "./AccountDrawer";
import { useSelectedCharacter } from "./useSelectedCharacter";
import type { EntityState } from "./orbPresets";

interface EntityRailProps {
  entityState: EntityState;
  onCoreClick: () => void;
  onDrop: (files: File[]) => void;
  onReviewClick?: () => void;
  onPickInputMode?: () => void;
  busy?: boolean;
  showAccount?: boolean;
  children?: ReactNode;
}

const EntityRail = ({
  entityState,
  onCoreClick,
  onDrop,
  onReviewClick,
  onPickInputMode,
  busy = false,
  showAccount = false,
  children,
}: EntityRailProps) => {
  const { characterId } = useSelectedCharacter();

  return (
    <aside
      className="hidden lg:flex flex-col shrink-0 overflow-hidden"
      style={{
        width: 220,
        minWidth: 220,
        height: "100vh",
        borderLeft: "1px solid var(--hair)",
        background: "var(--surface-0)",
      }}
    >
      {/* Account-Slot — optional, oben rechts */}
      {showAccount && (
        <div className="flex justify-end px-3 pt-3 pb-0 shrink-0">
          <AccountDrawer />
        </div>
      )}

      {/* Entity-Zone */}
      <div
        className="relative flex items-center justify-center shrink-0"
        style={{
          height: showAccount ? 164 : 196,
          borderBottom: children ? "1px solid var(--hair)" : undefined,
        }}
      >
        <Entity
          state={entityState}
          onDrop={onDrop}
          onReviewClick={onReviewClick ?? (() => {})}
          onClick={onCoreClick}
          busy={busy}
          character={characterId}
          onPickInputMode={onPickInputMode}
          size="96px"
        />
      </div>

      {/* Content-Slot */}
      {children && <div className="flex-1 min-h-0 overflow-y-auto">{children}</div>}
    </aside>
  );
};

export default EntityRail;
