"use client";

import { useEffect } from "react";

/**
 * Locks page (body) scroll while `locked` is true — so an open modal floats
 * over a frozen page and the page never scrolls behind it. The modal's own
 * content scrolls internally (overflow-y: auto on .modal/.sheet).
 */
export function useScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [locked]);
}
