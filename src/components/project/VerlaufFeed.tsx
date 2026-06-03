import { useState } from "react";
import { toast } from "sonner";
import DeltaTag from "./shared/DeltaTag";
import FeedbackButton from "./shared/FeedbackButton";
import { useDialog } from "@/components/dialog/DialogProvider";
import { buildVerlaufSession } from "@/lib/dialog/sessionFactories";
import { submitNote } from "@/lib/intake/submitNote";
import type { DeltaTyp, VerlaufVM } from "@/lib/project/types";

const DOT_COLOR: Record<DeltaTyp, string> = {
  neu: "var(--sig-action)",
  ersetzt: "var(--sig-review)",
  bestaetigt: "var(--ink-3)",
  widersprochen: "var(--sig-conflict)",
  unclear: "var(--sig-review)",
};

interface VerlaufFeedProps {
  verlauf: VerlaufVM[];
  projectId?: string | null;
}

const VerlaufFeed = ({ verlauf, projectId }: VerlaufFeedProps) => {
  const { openDialog } = useDialog();
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitNote = async () => {
    const text = noteText.trim();
    if (!text || submitting) return;
    setSubmitting(true);
    const result = await submitNote(text, {
      projectId: projectId ?? null,
      contextHint: "Notiz im Verlauf",
      sourceRef: { type: "verlauf" },
    });
    setSubmitting(false);
    if (result) {
      toast.success("Notiz aufgenommen", {
        description: "Erscheint nach der Analyse im Verlauf.",
      });
      setNoteText("");
      setNoteOpen(false);
    } else {
      toast.error("Notiz konnte nicht abgelegt werden");
    }
  };

  return (
    <section
      style={{
        padding: "0 0 0 32px",
        borderLeft: "1px solid var(--hair)",
      }}
    >
      <header className="flex items-baseline" style={{ gap: 10, marginBottom: 22 }}>
        <h2
          style={{
            margin: 0,
            fontSize: 20,
            fontWeight: 500,
            letterSpacing: "-.018em",
            color: "var(--ink)",
          }}
        >
          Verlauf
        </h2>
        <span className="mono tabular" style={{ fontSize: 12, color: "var(--ink-3)" }}>
          {verlauf.length}
        </span>
      </header>

      <div className="flex flex-col relative" style={{ gap: 16 }}>
        <div
          aria-hidden
          style={{
            position: "absolute",
            left: 6,
            top: 4,
            bottom: 4,
            width: 1,
            background: "var(--hair)",
          }}
        />

        {/* Inline-Notiz: schließt die Antwort-Loop direkt im Verlauf */}
        <div className="flex relative" style={{ gap: 14 }}>
          <span
            aria-hidden
            style={{
              width: 13,
              height: 13,
              borderRadius: 999,
              marginTop: 4,
              background: "var(--surface-1)",
              border: "2px dashed var(--ink-4)",
              flex: "0 0 auto",
              position: "relative",
              zIndex: 1,
            }}
          />
          <div className="flex-1 min-w-0">
            {!noteOpen ? (
              <button
                type="button"
                onClick={() => setNoteOpen(true)}
                style={{
                  background: "transparent",
                  border: "none",
                  padding: 0,
                  fontSize: 13,
                  color: "var(--ink-3)",
                  cursor: "pointer",
                  fontStyle: "italic",
                }}
                className="hover:text-foreground transition-colors"
              >
                Notiz hinzufügen …
              </button>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <textarea
                  value={noteText}
                  onChange={(ev) => setNoteText(ev.target.value)}
                  placeholder="Was ist passiert, was hast du beschlossen?"
                  autoFocus
                  rows={3}
                  onKeyDown={(ev) => {
                    if (ev.key === "Escape") {
                      setNoteOpen(false);
                      setNoteText("");
                    }
                    if (ev.key === "Enter" && (ev.metaKey || ev.ctrlKey)) {
                      ev.preventDefault();
                      handleSubmitNote();
                    }
                  }}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: "1px solid var(--hair)",
                    background: "var(--surface-1)",
                    color: "var(--ink)",
                    fontFamily: "inherit",
                    fontSize: 13.5,
                    lineHeight: 1.4,
                    outline: "none",
                    resize: "vertical",
                  }}
                />
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <button
                    type="button"
                    onClick={handleSubmitNote}
                    disabled={!noteText.trim() || submitting}
                    style={{
                      padding: "6px 14px",
                      borderRadius: 6,
                      fontSize: 12,
                      background: noteText.trim() ? "var(--ink)" : "var(--ink-4)",
                      color: "var(--surface-0)",
                      border: "none",
                      cursor: noteText.trim() && !submitting ? "pointer" : "not-allowed",
                    }}
                  >
                    {submitting ? "Speichere …" : "Notiz ablegen"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNoteOpen(false);
                      setNoteText("");
                    }}
                    style={{
                      padding: "6px 10px",
                      borderRadius: 6,
                      fontSize: 12,
                      background: "transparent",
                      color: "var(--ink-3)",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    Abbrechen
                  </button>
                  <span style={{ fontSize: 11, color: "var(--ink-4)", marginLeft: "auto" }}>
                    ⌘ + Enter
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {verlauf.map((e) => (
          <div key={e.id} className="flex relative group" style={{ gap: 14 }}>
            <span
              aria-hidden
              style={{
                width: 13,
                height: 13,
                borderRadius: 999,
                marginTop: 4,
                background: "var(--surface-1)",
                border: `2px solid ${DOT_COLOR[e.delta]}`,
                flex: "0 0 auto",
                position: "relative",
                zIndex: 1,
              }}
            />
            <button
              type="button"
              onClick={() => openDialog(buildVerlaufSession(e))}
              className="flex-1 min-w-0 text-left"
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: 0,
              }}
            >
              <div className="flex items-center" style={{ gap: 8 }}>
                <span className="mono tabular" style={{ fontSize: 11, color: "var(--ink-3)" }}>
                  {e.datum}
                </span>
                <DeltaTag delta={e.delta} />
              </div>
              <div
                className="group-hover:text-foreground transition-colors"
                style={{ marginTop: 4, fontSize: 13.5, color: "var(--ink)", lineHeight: 1.4 }}
              >
                {e.inhalt}
              </div>
            </button>
            <span className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity shrink-0">
              <FeedbackButton context={`Verlauf: ${e.inhalt}`} projectId={projectId} label="" />
            </span>
          </div>
        ))}
        {verlauf.length === 0 && (
          <p style={{ fontSize: 13, color: "var(--ink-3)", fontStyle: "italic" }}>
            Noch kein Verlauf.
          </p>
        )}
      </div>
    </section>
  );
};

export default VerlaufFeed;
