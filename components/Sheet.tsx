"use client";

/**
 * Bottom sheet + scrim. On desktop the CSS centers it and swaps the
 * slide-up for a pop-in. Entry animation is gated by `enter` so it only
 * plays when the sheet first opens, not on incidental re-renders.
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
    <div className={enter ? "scrim enter" : "scrim"} onClick={onClose}>
      <div
        className={enter ? "sheet enter" : "sheet"}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="grab" />
        {title && <h2>{title}</h2>}
        {children}
      </div>
    </div>
  );
}
