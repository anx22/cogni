export type IntakeType = "file" | "url" | "text" | "voice";

export interface IntakePayload {
  type: IntakeType;
  files?: File[];
  url?: string;
  text?: string;
  label: string;
}

const URL_RE = /^(https?:\/\/|www\.)\S+$/i;

export function isUrl(value: string): boolean {
  return URL_RE.test(value.trim());
}

export function detectFromText(text: string): IntakePayload {
  const trimmed = text.trim();
  if (isUrl(trimmed)) {
    return { type: "url", url: trimmed, label: "Link" };
  }
  return { type: "text", text: trimmed, label: "Notiz" };
}

export function detectFromPaste(e: React.ClipboardEvent): IntakePayload | null {
  const files = Array.from(e.clipboardData.files);
  if (files.length > 0) {
    return { type: "file", files, label: "Datei" };
  }
  const text = e.clipboardData.getData("text");
  if (text.trim().length > 0) {
    return detectFromText(text);
  }
  return null;
}

export function detectFromDrop(files: File[]): IntakePayload {
  return { type: "file", files, label: "Datei" };
}
