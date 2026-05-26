// =============================================================================
//  HomePrompt — Hero-Prompt unter der Entity. "Was gibt es neues?" + 4
//  kreisförmige Action-Buttons. Reine UI, alle Aktionen kommen von außen.
// =============================================================================

import { Upload, Clipboard, Link as LinkIcon, Mic } from "lucide-react";

export interface HomePromptProps {
  onNote?: () => void;
  onUpload?: () => void;
  onPaste?: () => void;
  onLink?: () => void;
  onVoice?: () => void;
}

interface ActionDef {
  label: string;
  icon: JSX.Element;
  action?: () => void;
  highlight?: boolean;
}

const HomePrompt = ({ onNote, onUpload, onPaste, onLink, onVoice }: HomePromptProps) => {
  const actions: ActionDef[] = [
    { label: "Datei", icon: <Upload size={20} strokeWidth={1.5} />, action: onUpload },
    {
      label: "Einfügen",
      icon: <Clipboard size={20} strokeWidth={1.5} />,
      action: onPaste,
      highlight: true,
    },
    { label: "Link", icon: <LinkIcon size={20} strokeWidth={1.5} />, action: onLink },
    { label: "Sprache", icon: <Mic size={20} strokeWidth={1.5} />, action: onVoice },
  ];

  return (
    <div className="flex flex-col items-center" style={{ marginTop: 28 }}>
      <h1
        onClick={onNote}
        className="t-display"
        style={{
          margin: 0,
          color: "var(--ink)",
          textAlign: "center",
          cursor: onNote ? "text" : "default",
          maxWidth: 720,
        }}
      >
        Was gibt es neues?
      </h1>
      <p
        className="t-body"
        style={{
          margin: "10px 0 0",
          color: "var(--ink-3)",
          textAlign: "center",
        }}
      >
        Gebe mir Daten, tippe oder sprich. Ich ordne es ein.
      </p>

      <div style={{ display: "flex", gap: 24, marginTop: 32 }}>
        {actions.map(({ label, icon, action, highlight }) => (
          <button
            key={label}
            type="button"
            onClick={action}
            className="group flex flex-col items-center"
            style={{
              gap: 10,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            <span
              className="flex items-center justify-center transition-all"
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "var(--surface-1)",
                border: "1px solid var(--hair-2)",
                color: highlight ? "var(--c-accent)" : "var(--ink-2)",
                boxShadow: "var(--shadow-card-cogni)",
              }}
            >
              {icon}
            </span>
            <span className="t-small" style={{ color: "var(--ink-3)", fontWeight: 500 }}>
              {label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default HomePrompt;
