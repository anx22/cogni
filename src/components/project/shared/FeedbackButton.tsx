import { MessageSquarePlus } from "lucide-react";
import { useDialog } from "@/components/dialog/DialogProvider";
import { buildFeedbackSession } from "@/lib/dialog/sessionFactories";

const FeedbackButton = ({
  context,
  projectId,
  className = "",
  label = "Feedback",
}: {
  context: string;
  projectId?: string | null;
  className?: string;
  label?: string;
}) => {
  const { openDialog } = useDialog();
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        openDialog(buildFeedbackSession(context, projectId ?? null));
      }}
      className={`inline-flex items-center gap-1 text-[11px] text-muted-foreground/70 hover:text-foreground transition-colors ${className}`}
      title="Feedback oder Korrektur"
    >
      <MessageSquarePlus className="w-3 h-3" />
      <span>{label}</span>
    </button>
  );
};

export default FeedbackButton;
