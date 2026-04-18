import { MessageSquarePlus } from "lucide-react";
import { toast } from "sonner";

const FeedbackButton = ({
  context,
  className = "",
  label = "Feedback",
}: {
  context: string;
  className?: string;
  label?: string;
}) => (
  <button
    type="button"
    onClick={(e) => {
      e.stopPropagation();
      toast(`Feedback zu: ${context}`, {
        description: "Korrektur-Dialog kommt mit Phase 4 (Dialog-Overlay).",
      });
    }}
    className={`inline-flex items-center gap-1 text-[11px] text-muted-foreground/70 hover:text-foreground transition-colors ${className}`}
    title="Feedback oder Korrektur"
  >
    <MessageSquarePlus className="w-3 h-3" />
    <span>{label}</span>
  </button>
);

export default FeedbackButton;
