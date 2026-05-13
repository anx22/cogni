import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Entity from "@/components/entity/Entity";
import { useSelectedCharacter } from "@/components/entity/useSelectedCharacter";
import EntityVoice from "@/components/entity/EntityVoice";
import SideGrid from "@/components/entity/SideGrid";
import IntakeSessionsPanel from "@/components/entity/IntakeSessionsPanel";
import HomeDropOverlay from "@/components/entity/HomeDropOverlay";
import InputOverlay from "@/components/entity/InputOverlay";
import { useProjects } from "@/lib/project/useProjects";
import { useIntake } from "@/lib/intake/useIntake";
import { detectFromDrop } from "@/lib/intake/detectInputType";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { devlog } from "@/lib/devlog/devlog";
import { useDialog } from "@/components/dialog/DialogProvider";
import { useEntityVoice } from "@/lib/voice/useEntityVoice";
import { toast } from "sonner";

type EntityState = "idle" | "hover" | "processing" | "review-ready" | "failed";

const Index = () => {
  const navigate = useNavigate();
  const { session, loading, signOut } = useAuth();
  const [entityState, setEntityState] = useState<EntityState>("idle");
  const [overlayOpen, setOverlayOpen] = useState(false);
  const { openSessionFromDB, session: dialogSession } = useDialog();
  const pendingSessionId = useRef<string | null>(null);
  const autoOpenedRef = useRef<Set<string>>(new Set());
  const [dragActive, setDragActive] = useState(false);
  const dragCounter = useRef(0);

  const { intake } = useIntake({ setEntityState });
  const { characterId } = useSelectedCharacter();
  const voice = useEntityVoice(session?.user?.id);
  const { projects: liveProjects } = useProjects();

  const busy = entityState === "processing" || entityState === "review-ready";
  const isDragActive = dragActive || entityState === "hover";

  const resetDragState = useCallback(() => {
    dragCounter.current = 0;
    setDragActive(false);
  }, []);

  useEffect(() => {
    if (!loading && !session) navigate("/auth", { replace: true });
  }, [loading, session, navigate]);

  // Busy darf NIE einen hängen gebliebenen Fullscreen-Drag-Layer stehen lassen.
  useEffect(() => {
    if (busy) {
      resetDragState();
    }
  }, [busy, resetDragState]);

  // Sicherheitsnetz für Browser, die nach Drop/Tab-Wechsel keinen sauberen dragleave senden.
  useEffect(() => {
    const reset = () => resetDragState();
    const onVisibility = () => {
      if (document.visibilityState !== "visible") resetDragState();
    };

    window.addEventListener("drop", reset);
    window.addEventListener("dragend", reset);
    window.addEventListener("blur", reset);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("drop", reset);
      window.removeEventListener("dragend", reset);
      window.removeEventListener("blur", reset);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [resetDragState]);

  // Realtime: Asset-Status spiegelt sich auf den Kern
  useEffect(() => {
    if (!session?.user) return;
    const channel = supabase
      .channel("assets-understanding")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "assets",
          filter: `user_id=eq.${session.user.id}`,
        },
        (payload) => {
          const row = payload.new as { id?: string; file_type?: string };
          devlog.realtime(`assets INSERT → ${row.file_type}`, { id: row.id });
          setEntityState("processing");
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "assets",
          filter: `user_id=eq.${session.user.id}`,
        },
        (payload) => {
          const row = payload.new as {
            id?: string;
            understanding_status?: string;
            processing_status?: string;
          };
          if (row.processing_status === "processing" || row.understanding_status === "running") {
            setEntityState("processing");
          } else if (
            row.understanding_status === "failed" ||
            row.understanding_status === "rate_limited" ||
            row.understanding_status === "payment_required"
          ) {
            setEntityState("failed");
          } else if (row.understanding_status === "empty") {
            setTimeout(() => setEntityState("idle"), 1500);
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user]);

  // Realtime: neue Dialog-Session → Auto-Open nach kurzem Delay
  useEffect(() => {
    if (!session?.user) return;
    const channel = supabase
      .channel("dialog-sessions-new")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "dialog_sessions",
          filter: `user_id=eq.${session.user.id}`,
        },
        (payload) => {
          const row = payload.new as { id?: string; status?: string; trigger_type?: string };
          devlog.realtime(`dialog_session INSERT → ${row.status}`, { id: row.id });
          if (row.status === "open" && row.id && row.trigger_type === "intake") {
            if (autoOpenedRef.current.has(row.id)) return;
            autoOpenedRef.current.add(row.id);
            pendingSessionId.current = row.id;
            setEntityState("review-ready");
            setTimeout(() => {
              if (pendingSessionId.current === row.id) {
                openSessionFromDB(row.id);
                pendingSessionId.current = null;
                setEntityState("idle");
              }
            }, 1400);
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user, openSessionFromDB]);

  // Wenn Dialog manuell geschlossen wird → Kern beruhigen.
  useEffect(() => {
    if (!dialogSession && entityState === "review-ready") {
      setEntityState("idle");
    }
  }, [dialogSession, entityState]);

  const handleDrop = useCallback(
    (files: File[]) => {
      if (busy) {
        toast.message("Noch beschäftigt", { description: "Ich bin gleich wieder bei dir." });
        return;
      }
      intake(detectFromDrop(files));
    },
    [intake, busy],
  );

  const handleWindowDragEnter = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!e.dataTransfer.types.includes("Files") || busy) {
        resetDragState();
        return;
      }
      dragCounter.current += 1;
      setDragActive(true);
    },
    [busy, resetDragState],
  );

  const handleWindowDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!e.dataTransfer.types.includes("Files") || busy) {
        e.dataTransfer.dropEffect = "none";
        resetDragState();
        return;
      }
      e.dataTransfer.dropEffect = "copy";
      if (!dragActive) setDragActive(true);
    },
    [busy, dragActive, resetDragState],
  );

  const handleWindowDragLeave = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (busy) {
        resetDragState();
        return;
      }
      dragCounter.current = Math.max(0, dragCounter.current - 1);
      if (dragCounter.current === 0) setDragActive(false);
    },
    [busy, resetDragState],
  );

  const handleWindowDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      resetDragState();
      const files = Array.from(e.dataTransfer.files ?? []);
      if (files.length === 0) return;
      handleDrop(files);
    },
    [handleDrop, resetDragState],
  );

  const handleProjectClick = useCallback((id: string) => {
    navigate(`/projekt/${id}`);
  }, [navigate]);

  const handleCreateProject = useCallback(async () => {
    if (!session?.user) return;
    const { data, error } = await supabase
      .from("projects")
      .insert({ user_id: session.user.id, name: "Neues Projekt" })
      .select("id")
      .single();
    if (error || !data) {
      toast.error("Projekt konnte nicht angelegt werden");
      return;
    }
    navigate(`/projekt/${data.id}`);
  }, [session?.user, navigate]);

  const handleReviewClick = useCallback(async () => {
    if (pendingSessionId.current) {
      await openSessionFromDB(pendingSessionId.current);
      pendingSessionId.current = null;
      setEntityState("idle");
    }
  }, [openSessionFromDB]);

  const handleCoreClick = useCallback(() => {
    if (busy && entityState !== "review-ready") return;
    if (pendingSessionId.current) {
      handleReviewClick();
    } else {
      setOverlayOpen(true);
    }
  }, [entityState, handleReviewClick, busy]);

  const handleRetry = useCallback(async (assetId: string) => {
    devlog.edge("retry intake-understand", { assetId });
    setEntityState("processing");
    await supabase.functions.invoke("intake-understand", {
      body: { asset_id: assetId, retry: true },
    });
  }, []);

  if (loading || !session) return null;

  return (
    <div
      className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden bg-background"
      onDragEnter={handleWindowDragEnter}
      onDragOver={handleWindowDragOver}
      onDragLeave={handleWindowDragLeave}
      onDrop={handleWindowDrop}
    >
      <div className="relative w-full flex-1 flex items-center justify-center">
        <div className="hidden lg:block absolute left-[6%] top-1/2 -translate-y-1/2 z-10">
          <SideGrid
            side="left"
            label="Projekte"
            projects={liveProjects}
            activeId={undefined}
            onProjectClick={handleProjectClick}
            onCreateProject={handleCreateProject}
            isDragActive={isDragActive}
          />
        </div>

        <div className="hidden xl:block absolute right-[6%] top-1/2 -translate-y-1/2 z-10">
          <IntakeSessionsPanel isDragActive={isDragActive} />
        </div>

        <Entity
          state={entityState}
          onDrop={handleDrop}
          onReviewClick={handleReviewClick}
          onClick={handleCoreClick}
          busy={busy}
          character={characterId}
          onPickInputMode={() => setOverlayOpen(true)}
        />

        <div className="absolute bottom-[22%] z-20 pointer-events-auto">
          <EntityVoice voice={voice} onRetry={handleRetry} />
        </div>

        {overlayOpen ? (
          <div className="absolute top-[58%] left-1/2 -translate-x-1/2 z-30 w-full max-w-xl px-4">
            <InputOverlay open={overlayOpen} onClose={() => setOverlayOpen(false)} onSubmit={intake} />
          </div>
        ) : (
          !voice.text && (
            <p className="absolute bottom-[14%] text-muted-foreground text-sm tracking-wide opacity-50 animate-float-in">
              Klick auf den Kern oder lege etwas hier ab — Datei, Link, Notiz
            </p>
          )
        )}
      </div>

      <div className="absolute top-6 right-6 flex items-center gap-4">
        <button
          className="text-xs text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors tracking-widest uppercase"
          onClick={() => navigate("/projekt/" + (liveProjects?.[0]?.id ?? ""))}
        >
          Projekte
        </button>
        <button
          className="text-xs text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors tracking-widest uppercase"
          onClick={signOut}
        >
          Abmelden
        </button>
      </div>

      <HomeDropOverlay active={dragActive} busy={busy} />
    </div>
  );
};

export default Index;
