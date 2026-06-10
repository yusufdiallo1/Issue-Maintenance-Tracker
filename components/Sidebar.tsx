"use client";

import { Plus } from "lucide-react";
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
  onNavigate,
  onAdd,
  onProfile,
}: {
  items: NavItem[];
  active: string;
  role: string;
  userName: string;
  userInitial: string;
  onNavigate: (id: string) => void;
  onAdd: () => void;
  onProfile: () => void;
}) {
  const { t } = useLang();
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

      <nav className="snav">
        {items.map(({ id, labelKey, Icon }) => (
          <button
            key={id}
            className={active === id ? "snav-item on" : "snav-item"}
            onClick={() => onNavigate(id)}
            aria-current={active === id ? "page" : undefined}
          >
            <Icon />
            <span>{t(labelKey)}</span>
          </button>
        ))}
      </nav>

      <div style={{ flex: 1 }} />

      <button className="sprofile" onClick={onProfile}>
        <span className="avatar">{userInitial}</span>
        <span className="spi">
          <span className="spn">{userName}</span>
          <span className="spr">{role}</span>
        </span>
      </button>
    </aside>
  );
}
