"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Portals modal/scrim content to <body> so `position: fixed` anchors to the
 * viewport, not a transformed ancestor (the animated scroll container would
 * otherwise push fixed children off-screen). Render-safe during SSR.
 */
export function ModalPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(id);
  }, []);
  if (!mounted) return null;
  return createPortal(children, document.body);
}
