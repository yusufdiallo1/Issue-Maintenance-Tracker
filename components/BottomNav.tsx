"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import type { NavItem } from "./nav-items";
import { useLang } from "@/app/providers";
import { tap } from "@/lib/haptics";

/**
 * Floating frosted bottom pill nav (mobile). One continuous glass pill with a
 * liquid-glass THUMB that slides to the active target (the "+" add-report is
 * one of the slide targets). Labels hide below 500px (icons-only) via CSS.
 * Hidden at >=860px (the sidebar takes over).
 */
type Slot = { kind: "tab"; item: NavItem } | { kind: "add" };

export function BottomNav({
  items,
  active,
  unread = false,
  onNavigate,
  onAdd,
}: {
  items: NavItem[];
  active: string;
  unread?: boolean;
  onNavigate: (id: string) => void;
  onAdd: () => void;
}) {
  const { t, dir } = useLang();
  // Order: first item, then "+", then the rest — like the prototype.
  const [first, ...rest] = items;
  const slots: Slot[] = [
    { kind: "tab", item: first },
    { kind: "add" },
    ...rest.map((item) => ({ kind: "tab" as const, item })),
  ];

  const navRef = useRef<HTMLDivElement | null>(null);
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [thumb, setThumb] = useState<{ x: number; w: number } | null>(null);

  // The active slot index. "+" is a real target too (active === "add").
  const activeIndex = slots.findIndex((s) =>
    s.kind === "add" ? active === "add" : s.item.id === active,
  );

  useLayoutEffect(() => {
    const nav = navRef.current;
    const btn = btnRefs.current[activeIndex];
    if (!nav || !btn) return;
    const navBox = nav.getBoundingClientRect();
    const b = btn.getBoundingClientRect();
    setThumb({ x: b.left - navBox.left, w: b.width });
    // re-measure on dir change (RTL) and resize
  }, [activeIndex, dir, items.length]);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      const btn = btnRefs.current[activeIndex];
      if (!btn) return;
      const navBox = nav.getBoundingClientRect();
      const b = btn.getBoundingClientRect();
      setThumb({ x: b.left - navBox.left, w: b.width });
    });
    ro.observe(nav);
    return () => ro.disconnect();
  }, [activeIndex]);

  return (
    <div className="nav glass" ref={navRef}>
      {thumb && (
        <span
          className="nav-thumb"
          aria-hidden
          style={{ transform: `translateX(${thumb.x}px)`, width: thumb.w }}
        />
      )}
      {slots.map((slot, i) => {
        if (slot.kind === "add") {
          return (
            <button
              key="add"
              ref={(el) => {
                btnRefs.current[i] = el;
              }}
              className="tab addtab"
              onClick={() => {
                tap();
                onAdd();
              }}
              aria-label={t("newReport")}
            >
              <span className="plusbtn">
                <Plus />
              </span>
            </button>
          );
        }
        const { item } = slot;
        const { Icon } = item;
        const on = active === item.id;
        const showDot = item.id === "reports" && unread && !on;
        return (
          <button
            key={item.id}
            ref={(el) => {
              btnRefs.current[i] = el;
            }}
            className={on ? "tab on" : "tab"}
            onClick={() => {
              tap();
              onNavigate(item.id);
            }}
            aria-current={on ? "page" : undefined}
          >
            <span className="tab-ico">
              <Icon />
              {showDot && <span className="notif-dot" aria-hidden />}
            </span>
            <span className="lbl">{t(item.labelKey)}</span>
          </button>
        );
      })}
    </div>
  );
}
