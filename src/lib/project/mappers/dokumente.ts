/* eslint-disable @typescript-eslint/no-explicit-any */
import { fmtShort } from "@/lib/format/dateFormatters";
import type { DokumentVM } from "../types";
import { numberFromJson, stringFromJson } from "./humanize";

export function toDokumente(assets: any[]): DokumentVM[] {
  return assets.map((a) => ({
    id: a.id,
    name: a.file_name,
    typ: a.file_type,
    version: numberFromJson(a.metadata, "version") ?? 1,
    datum: fmtShort(a.created_at),
    thema: stringFromJson(a.metadata, "thema"),
  }));
}
