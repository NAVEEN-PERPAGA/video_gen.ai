"use client";

import { type RefObject, useEffect } from "react";

type Refs = RefObject<HTMLElement | null> | RefObject<HTMLElement | null>[];

/**
 * Calls `onDismiss` on a pointer-down outside every element in `refs` (e.g. a
 * trigger and its portaled menu) or on Escape, while `active`.
 */
export function useDismiss(refs: Refs, active: boolean, onDismiss: () => void) {
  useEffect(() => {
    if (!active) return;
    const list = Array.isArray(refs) ? refs : [refs];
    const onPointerDown = (e: PointerEvent) => {
      if (!list.some((r) => r.current?.contains(e.target as Node))) onDismiss();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDismiss();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
    // `refs` is usually a fresh array literal; the refs inside it are stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, onDismiss]);
}
