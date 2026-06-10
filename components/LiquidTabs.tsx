"use client";

// ============================================================
// LiquidTabs — a segmented control with a frosted-glass thumb that
// SLIDES between segments with spring physics and REFRACTS the
// content behind it (via the #liquidGlass SVG filter in the root).
//
// The thumb position/width are measured from the live DOM (so it
// works regardless of label length, padding, gaps, or RTL) and
// animated with Framer Motion. It stays hidden until first measured
// to avoid a hydration jump.
// ============================================================
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useLang } from "@/app/providers";

export type LiquidSegment = { id: string; label: string };

type Box = { x: number; width: number };

export function LiquidTabs({
  segments,
  value,
  onChange,
  className,
  "aria-label": ariaLabel,
}: {
  segments: LiquidSegment[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
  "aria-label"?: string;
}) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const segRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [box, setBox] = useState<Box | null>(null);
  // `dir` changes on language switch (RTL ↔ LTR) — re-measure when it does.
  const { dir } = useLang();

  const measure = useCallback(() => {
    const track = trackRef.current;
    const active = segRefs.current.get(value);
    if (!track || !active) return;
    // offsetLeft is relative to the track's padding box in both LTR and RTL,
    // and Framer's `x` is px-from-the-left edge — so this drives the thumb
    // correctly in RTL with no sign flip. We re-measure on dir change because
    // the segments' physical positions move when direction flips.
    setBox({ x: active.offsetLeft, width: active.offsetWidth });
  }, [value]);

  // Measure synchronously before paint to avoid a visible jump.
  useLayoutEffect(() => {
    measure();
  }, [measure, dir, segments.length]);

  // Re-measure on track resize (responsive / font load / container changes).
  useEffect(() => {
    const track = trackRef.current;
    if (!track || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(track);
    return () => ro.disconnect();
  }, [measure]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const idx = segments.findIndex((s) => s.id === value);
    if (idx < 0) return;
    // In RTL, ArrowLeft/Right are visually mirrored; map by physical key but
    // honor reading direction so arrows feel natural.
    const forward = dir === "rtl" ? ["ArrowLeft"] : ["ArrowRight"];
    const backward = dir === "rtl" ? ["ArrowRight"] : ["ArrowLeft"];
    let next = idx;
    if (forward.includes(e.key)) next = Math.min(segments.length - 1, idx + 1);
    else if (backward.includes(e.key)) next = Math.max(0, idx - 1);
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = segments.length - 1;
    else return;
    e.preventDefault();
    const target = segments[next];
    onChange(target.id);
    segRefs.current.get(target.id)?.focus();
  };

  return (
    <div
      ref={trackRef}
      role="tablist"
      aria-label={ariaLabel}
      className={`lg-track ${className ?? ""}`}
      onKeyDown={onKeyDown}
    >
      {box && (
        <motion.div
          className="lg-thumb"
          aria-hidden
          initial={false}
          animate={{ x: box.x, width: box.width, opacity: 1 }}
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
        />
      )}
      {segments.map((s) => {
        const on = s.id === value;
        return (
          <button
            key={s.id}
            ref={(el) => {
              if (el) segRefs.current.set(s.id, el);
              else segRefs.current.delete(s.id);
            }}
            role="tab"
            aria-selected={on}
            tabIndex={on ? 0 : -1}
            data-on={on}
            className="lg-seg"
            onClick={() => onChange(s.id)}
          >
            {s.label}
          </button>
        );
      })}
    </div>
  );
}
