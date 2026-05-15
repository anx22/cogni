// =============================================================================
//  supportedFileTypes — Client-seitige Whitelist + Blocklist für Datei-Drops.
// -----------------------------------------------------------------------------
//  Server bleibt Source of Truth. Diese Liste erspart dem User die spätere
//  Pipeline-Fehlermeldung bei offensichtlichen Mismatches.
//  - SUPPORTED → kein Hinweis, einfach übernehmen.
//  - UNKNOWN   → toast.warning, aber akzeptieren ("Versuch wird gestartet").
//  - BLOCKED   → toast.error, Datei verwerfen.
// =============================================================================

const SUPPORTED = new Set([
  "pdf", "docx", "doc", "pptx", "ppt", "txt", "md", "rtf",
  "eml", "msg",
  "png", "jpg", "jpeg", "webp", "gif", "heic", "heif", "tiff", "bmp",
  "csv", "json",
]);

const BLOCKED = new Set([
  "zip", "rar", "7z", "tar", "gz", "bz2",
  "exe", "msi", "dmg", "app", "apk", "ipa",
  "mp4", "mov", "mkv", "avi", "webm",
  "mp3", "wav", "flac", "ogg",
  "iso", "bin",
]);

export type FileCheck = "supported" | "unknown" | "blocked";

const extOf = (name: string): string => {
  const m = name.toLowerCase().match(/\.([a-z0-9]+)$/);
  return m ? m[1] : "";
};

export function checkFile(file: File): FileCheck {
  const ext = extOf(file.name);
  if (!ext) return "unknown";
  if (BLOCKED.has(ext)) return "blocked";
  if (SUPPORTED.has(ext)) return "supported";
  return "unknown";
}

export interface PartitionedFiles {
  accepted: File[];
  blocked: File[];
  unknown: File[];
}

export function partitionFiles(files: File[]): PartitionedFiles {
  const accepted: File[] = [];
  const blocked: File[] = [];
  const unknown: File[] = [];
  for (const f of files) {
    const c = checkFile(f);
    if (c === "blocked") blocked.push(f);
    else if (c === "unknown") { accepted.push(f); unknown.push(f); }
    else accepted.push(f);
  }
  return { accepted, blocked, unknown };
}
