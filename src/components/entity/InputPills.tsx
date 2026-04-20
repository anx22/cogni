import { FileText, Link as LinkIcon, Paperclip, Mic } from "lucide-react";
import { cn } from "@/lib/utils";

export type InputMode = "note" | "link" | "file" | "voice";

interface InputPillsProps {
  active: InputMode;
  onChange: (mode: InputMode) => void;
}

const PILLS: { id: InputMode; label: string; Icon: typeof FileText; disabled?: boolean }[] = [
  { id: "note", label: "Notiz", Icon: FileText },
  { id: "link", label: "Link", Icon: LinkIcon },
  { id: "file", label: "Datei", Icon: Paperclip },
  { id: "voice", label: "Sprache", Icon: Mic },
];

const InputPills = ({ active, onChange }: InputPillsProps) => {
  return (
    <div className="flex items-center gap-2">
      {PILLS.map(({ id, label, Icon, disabled }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs tracking-wide transition-colors",
              isActive
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border/40 bg-background/40 text-muted-foreground hover:text-foreground hover:border-border/70",
              disabled && "opacity-50",
            )}
          >
            <Icon className="size-3.5" />
            {label}
          </button>
        );
      })}
    </div>
  );
};

export default InputPills;
