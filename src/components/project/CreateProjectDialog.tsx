// =============================================================================
//  CreateProjectDialog — geführter Anlage-Flow.
//  Pflicht: Name. Optional: kurzes Outcome (success_criteria).
//  Erst nach Bestätigung wird das Projekt angelegt.
// =============================================================================
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onCreated?: (projectId: string) => void;
}

const CreateProjectDialog = ({ open, onOpenChange, userId, onCreated }: Props) => {
  const [name, setName] = useState("");
  const [outcome, setOutcome] = useState("");
  const [pending, setPending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName("");
      setOutcome("");
      setPending(false);
      window.setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [open]);

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed || pending) return;
    setPending(true);
    const { data, error } = await supabase
      .from("projects")
      .insert({ user_id: userId, name: trimmed })
      .select("id")
      .single();
    if (error || !data) {
      setPending(false);
      toast.error("Projekt konnte nicht angelegt werden", {
        description: error?.message ?? "Unbekannter Fehler",
      });
      return;
    }
    if (outcome.trim()) {
      await supabase.from("outcome_signals").insert({
        user_id: userId,
        project_id: data.id,
        success_criteria: outcome.trim(),
      });
    }
    setPending(false);
    onOpenChange(false);
    toast.success("Projekt angelegt");
    onCreated?.(data.id);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (
      e.key === "Enter" &&
      (e.metaKey || e.ctrlKey || (e.target as HTMLElement).tagName !== "TEXTAREA")
    ) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !pending && onOpenChange(v)}>
      <DialogContent
        className="bg-[hsl(var(--surface-1))] border-border-subtle backdrop-blur-xl max-w-lg"
        onKeyDown={onKey}
      >
        <DialogHeader>
          <DialogTitle className="font-light text-foreground">Neues Projekt</DialogTitle>
          <DialogDescription className="text-muted-foreground/80 leading-relaxed">
            Gib dem Projekt einen klaren Namen. Optional kannst du ein kurzes Zielbild ergänzen.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <label className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground/70">
              Projektname
            </label>
            <Input
              ref={inputRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z. B. Markteinführung Q4"
              className="bg-background/40 border-border/40"
              disabled={pending}
              maxLength={120}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground/70">
              Zielbild (optional)
            </label>
            <Textarea
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
              placeholder="Was wäre ein Erfolg?"
              rows={3}
              className="bg-background/40 border-border/40 resize-none"
              disabled={pending}
              maxLength={400}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={pending}
            className="text-muted-foreground"
          >
            Abbrechen
          </Button>
          <Button
            onClick={submit}
            disabled={!name.trim() || pending}
            className="bg-primary/90 text-primary-foreground hover:bg-primary"
          >
            {pending ? "Lege an…" : "Anlegen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateProjectDialog;
