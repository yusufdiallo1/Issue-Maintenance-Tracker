"use client";

/**
 * Floating centered modal (at ALL sizes) + scrim. Click-outside closes.
 * Entry animation is gated by `enter` so it only plays on first open.
 * (Formerly a bottom sheet on mobile — now centered everywhere per design.)
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
  if (!open) return null;
  return (
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
  );
}
