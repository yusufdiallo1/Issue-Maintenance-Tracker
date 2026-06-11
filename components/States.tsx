"use client";

import { RotateCw, type LucideIcon } from "lucide-react";
import { useLang } from "@/app/providers";

/** Empty placeholder: icon + line, matching the prototype's `.empty`. */
export function EmptyState({ icon: Icon, message }: { icon: LucideIcon; message: string }) {
  return (
    <div className="empty">
      <Icon />
      <div>{message}</div>
    </div>
  );
}

/** Inline error with a Retry action — never a blank screen. */
export function ErrorState({ onRetry }: { onRetry: () => void }) {
  const { t } = useLang();
  return (
    <div className="empty">
      <div style={{ marginBottom: 12 }}>{t("loadError")}</div>
      <button className="btn ghost" style={{ maxWidth: 180 }} onClick={onRetry}>
        <RotateCw />
        {t("retry")}
      </button>
    </div>
  );
}

/** Quiet shimmer skeleton block. */
export function SkeletonBlock({
  h = 16,
  w = "100%",
  radius = 8,
  style,
}: {
  h?: number | string;
  w?: number | string;
  radius?: number;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className="skeleton"
      style={{ height: h, width: w, borderRadius: radius, ...style }}
      aria-hidden
    />
  );
}

/** Skeleton list shaped like issue cards (no layout shift). */
export function IssueListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div aria-busy="true" aria-label="Loading">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="issue glass" style={{ pointerEvents: "none" }}>
          <SkeletonBlock w={54} h={54} radius={13} />
          <div className="body" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <SkeletonBlock w="60%" h={16} />
            <SkeletonBlock w="90%" h={13} />
            <SkeletonBlock w="40%" h={20} radius={980} />
          </div>
        </div>
      ))}
    </div>
  );
}
