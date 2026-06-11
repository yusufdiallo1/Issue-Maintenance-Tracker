"use client";

import { useScrollLock } from "@/lib/useScrollLock";
import { useLang } from "@/app/providers";

/**
 * Small centered confirmation modal (solid frosted, click-outside cancels).
 * Reused for sign-out, reset-demo, and destructive confirms.
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  danger = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message?: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { t } = useLang();
  useScrollLock(open);
  if (!open) return null;
  return (
    <div className="scrim modal-scrim enter" onClick={onCancel} style={{ zIndex: 90 }}>
      <div
        className="modal enter"
        role="alertdialog"
        aria-modal="true"
        style={{ maxWidth: 360 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2>{title}</h2>
        {message && <p style={{ color: "var(--dim)", marginTop: 6, lineHeight: 1.5 }}>{message}</p>}
        <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
          <button className="btn ghost" onClick={onCancel} style={{ flex: 1 }}>
            {t("cancel")}
          </button>
          <button
            className="btn gold"
            onClick={onConfirm}
            style={{ flex: 1, ...(danger ? { background: "var(--u-urgent)", color: "#fff" } : {}) }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
