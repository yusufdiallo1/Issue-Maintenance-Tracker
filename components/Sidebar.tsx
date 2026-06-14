"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Plus, Bell } from "lucide-react";
import { Logo } from "./Logo";
import type { NavItem } from "./nav-items";
import { useLang } from "@/app/providers";

/** Desktop left sidebar (>=860px). Mark + wordmark, nav, new-report, profile. */
export function Sidebar({
  items,
  active,
  role,
  userName,
  userInitial,
  unread = false,
  onNavigate,
  onAdd,
  onProfile,
  onNotifications,
}: {
  items: NavItem[];
  active: string;
  role: string;
  userName: string;
  userInitial: string;
  unread?: boolean;
  onNavigate: (id: string) => void;
  onAdd: () => void;
  onProfile: () => void;
  onNotifications?: () => void;
}) {
  const { t, dir } = useLang();

  // Vertical liquid-glass thumb that slides to the active nav item.
  const navRef = useRef<HTMLElement | null>(null);
  const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [thumb, setThumb] = useState<{ y: number; h: number } | null>(null);

  const measure = () => {
    const nav = navRef.current;
    const btn = btnRefs.current[active];
    if (!nav || !btn) return;
    setThumb({ y: btn.offsetTop, h: btn.offsetHeight });
  };
  useLayoutEffect(measure, [active, dir, items.length]);
  useEffect(() => {
    const nav = navRef.current;
    if (!nav || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(nav);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  return (
    <aside className="sidebar">
      <div className="sbrand">
        <Logo variant="mark" className="brandmark" />
        <div className="brandtext">
          <span className="n">{t("appName")}</span>
          <span className="r">{role}</span>
        </div>
      </div>

      <button className="sbnew" onClick={onAdd}>
        <Plus />
        <span>{t("newReport")}</span>
      </button>

      <nav className="snav" ref={navRef}>
        {thumb && (
          <span
            className="snav-thumb"
            aria-hidden
            style={{ transform: `translateY(${thumb.y}px)`, height: thumb.h }}
          />
        )}
        {items.map(({ id, labelKey, Icon }) => (
          <button
            key={id}
            ref={(el) => {
              btnRefs.current[id] = el;
            }}
            className={active === id ? "snav-item on" : "snav-item"}
            onClick={() => onNavigate(id)}
            aria-current={active === id ? "page" : undefined}
          >
            <Icon />
            <span>{t(labelKey)}</span>
          </button>
        ))}
      </nav>

      <div className="sfoot">
        <button className="sprofile" onClick={onProfile}>
          <span className="avatar">{userInitial}</span>
          <span className="spi">
            <span className="spn">{userName}</span>
            <span className="spr">{role}</span>
          </span>
        </button>
        {onNotifications && (
          <button
            className="sbell"
            onClick={onNotifications}
            aria-label={t("notifications")}
            title={t("notifications")}
          >
            <Bell />
            {unread && <span className="notif-dot" aria-hidden />}
          </button>
        )}
      </div>
    </aside>
  );
}
