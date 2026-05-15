// =============================================================================
//  useBodyScrollLock — globaler Scroll-Lock mit Owner-Set.
//  Mehrere Komponenten dürfen gleichzeitig locken. Body-Style wird erst
//  freigegeben, wenn der letzte Owner unmountet — Originalwerte werden
//  einmalig vor dem ersten Lock gesichert und am Ende restauriert.
// =============================================================================
import { useEffect, useId } from "react";

const owners = new Set<string>();
let prev: { bodyOverflow: string; htmlOverflow: string; bodyOverscroll: string } | null = null;

const apply = () => {
  const { body, documentElement: html } = document;
  prev = {
    bodyOverflow: body.style.overflow,
    htmlOverflow: html.style.overflow,
    bodyOverscroll: body.style.overscrollBehavior,
  };
  body.style.overflow = "hidden";
  html.style.overflow = "hidden";
  body.style.overscrollBehavior = "none";
};

const release = () => {
  if (!prev) return;
  const { body, documentElement: html } = document;
  body.style.overflow = prev.bodyOverflow;
  html.style.overflow = prev.htmlOverflow;
  body.style.overscrollBehavior = prev.bodyOverscroll;
  prev = null;
};

export const useBodyScrollLock = (active: boolean = true): void => {
  const id = useId();
  useEffect(() => {
    if (!active) return;
    if (owners.size === 0) apply();
    owners.add(id);
    return () => {
      owners.delete(id);
      if (owners.size === 0) release();
    };
  }, [active, id]);
};
