import { useCallback, useState, useRef, useEffect } from "react";

type EntityState = "idle" | "hover" | "processing" | "review-ready" | "failed" | "busy-blocked";

interface EntityCoreProps {
  state?: EntityState;
  onDrop?: (files: File[]) => void;
  onReviewClick?: () => void;
  onClick?: () => void;
  /** Wenn true: keine neuen Drops annehmen, optisch heißer Stillstand. */
  busy?: boolean;
}

const EntityCore = ({ state = "idle", onDrop, onReviewClick, onClick, busy }: EntityCoreProps) => {
  const [currentState, setCurrentState] = useState<EntityState>(state);
  const [isDragOver, setIsDragOver] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentState(state);
  }, [state]);

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (busy) {
        e.dataTransfer.dropEffect = "none";
        return;
      }
      setIsDragOver(true);
      setCurrentState("hover");
    },
    [busy],
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      setCurrentState(state === "hover" ? "idle" : state);
    },
    [state],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      if (busy) return;
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        onDrop?.(files);
      }
    },
    [onDrop, busy],
  );

  const handleClick = useCallback(() => {
    if (currentState === "review-ready") {
      onReviewClick?.();
      return;
    }
    onClick?.();
  }, [currentState, onReviewClick, onClick]);

  const getGradientStyle = () => {
    const base = {
      idle: "radial-gradient(ellipse at 30% 40%, hsl(210 80% 60% / 0.15), hsl(240 70% 55% / 0.1), hsl(190 75% 50% / 0.05), transparent 70%)",
      hover:
        "radial-gradient(ellipse at 40% 45%, hsl(210 80% 60% / 0.3), hsl(240 70% 55% / 0.2), hsl(190 75% 50% / 0.1), transparent 65%)",
      // heiß / amber / rose
      processing:
        "radial-gradient(ellipse at 50% 50%, hsl(28 95% 58% / 0.45), hsl(14 85% 55% / 0.3), hsl(45 90% 60% / 0.2), transparent 60%)",
      "review-ready":
        "radial-gradient(ellipse at 45% 45%, hsl(160 70% 50% / 0.3), hsl(180 70% 50% / 0.18), transparent 65%)",
      failed:
        "radial-gradient(ellipse at 50% 50%, hsl(0 65% 50% / 0.15), hsl(220 15% 12% / 0.3), transparent 70%)",
      "busy-blocked":
        "radial-gradient(ellipse at 50% 50%, hsl(28 95% 58% / 0.45), hsl(14 85% 55% / 0.3), hsl(45 90% 60% / 0.2), transparent 60%)",
    };
    return base[currentState];
  };

  const getAnimationClass = () => {
    switch (currentState) {
      case "idle":
        return "animate-[entity-breathe_6s_ease-in-out_infinite]";
      case "hover":
        return "animate-[entity-sog_1.5s_ease-in-out_infinite]";
      case "processing":
        return "animate-[entity-process_2s_ease-in-out_infinite]";
      case "review-ready":
        return "animate-[entity-breathe_3s_ease-in-out_infinite]";
      case "failed":
        return "animate-[entity-breathe_8s_ease-in-out_infinite]";
      case "busy-blocked":
        return "animate-[entity-process_2s_ease-in-out_infinite]";
    }
  };

  const getBlur = () => {
    switch (currentState) {
      case "idle":
        return "blur(60px)";
      case "hover":
        return "blur(45px)";
      case "processing":
        return "blur(35px)";
      case "review-ready":
        return "blur(50px)";
      case "failed":
        return "blur(70px)";
      case "busy-blocked":
        return "blur(35px)";
    }
  };

  const isHot = currentState === "processing" || currentState === "busy-blocked";

  return (
    <div
      ref={containerRef}
      className={`relative flex items-center justify-center w-full h-full select-none ${
        busy ? "cursor-not-allowed" : "cursor-pointer"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      {/* Outer pulse ring */}
      <div
        className={`absolute w-[420px] h-[420px] rounded-full border animate-[entity-pulse-ring_4s_ease-in-out_infinite] ${
          isHot ? "border-amber-400/30" : "border-primary/10"
        }`}
      />

      {/* Slow rotating secondary gradient — kippt im heißen Zustand */}
      <div
        className="absolute w-[340px] h-[340px] rounded-full animate-[entity-rotate_30s_linear_infinite] opacity-40"
        style={{
          background: isHot
            ? "conic-gradient(from 0deg, hsl(28 95% 58% / 0.18), hsl(14 85% 55% / 0.1), hsl(45 90% 60% / 0.14), hsl(28 95% 58% / 0.18))"
            : "conic-gradient(from 0deg, hsl(210 80% 60% / 0.1), hsl(240 70% 55% / 0.05), hsl(190 75% 50% / 0.08), hsl(210 80% 60% / 0.1))",
          filter: "blur(30px)",
        }}
      />

      {/* Main gradient core */}
      <div
        className={`absolute w-[300px] h-[300px] rounded-full transition-all duration-1000 ${getAnimationClass()}`}
        style={{
          background: getGradientStyle(),
          filter: getBlur(),
        }}
      />

      {/* Inner bright center — warm im Processing */}
      <div
        className="absolute w-[120px] h-[120px] rounded-full transition-all duration-700"
        style={{
          background:
            currentState === "review-ready"
              ? "radial-gradient(circle, hsl(160 70% 50% / 0.25), transparent 70%)"
              : currentState === "failed"
                ? "radial-gradient(circle, hsl(0 65% 50% / 0.1), transparent 70%)"
                : isHot
                  ? "radial-gradient(circle, hsl(35 95% 65% / 0.35), hsl(20 90% 55% / 0.18), transparent 70%)"
                  : "radial-gradient(circle, hsl(210 80% 60% / 0.12), transparent 70%)",
          filter: "blur(20px)",
        }}
      />

      {/* Drag over indicator */}
      {isDragOver && !busy && (
        <div className="absolute w-[350px] h-[350px] rounded-full border-2 border-dashed border-primary/30 animate-[entity-sog_1s_ease-in-out_infinite]" />
      )}
    </div>
  );
};

export default EntityCore;
