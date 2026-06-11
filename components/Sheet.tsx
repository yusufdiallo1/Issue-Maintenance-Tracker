"use client";

import { useScrollLock } from "@/lib/useScrollLock";
import { ModalPortal } from "./ModalPortal";

/**
 * Floating modal (centered on desktop, bottom sheet on mobile) + scrim.
 * Click-outside closes. Portaled to <body> so its `position: fixed` anchors to
 * the viewport — NOT to the transformed/animated scroll container (which would
 * otherwise push it off-screen). Locks page scroll while open.
 */
export function Sheet({
  open,
  onClose,
  enter,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  enter: boolean;
  title?: string;
  children: React.ReactNode;
}) {
  useScrollLock(open);
  if (!open) return null;

  return (
    <ModalPortal>
      <div className={enter ? "scrim modal-scrim enter" : "scrim modal-scrim"} onClick={onClose}>
        <div
          className={enter ? "modal enter" : "modal"}
          role="dialog"
          aria-modal="true"
          onClick={(e) => e.stopPropagation()}
        >
          {title && <h2>{title}</h2>}
          {children}
        </div>
      </div>
    </ModalPortal>
  );
}
