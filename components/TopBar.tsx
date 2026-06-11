"use client";

import { Bell, ChevronDown } from "lucide-react";
import { Logo } from "./Logo";
import { useLang } from "@/app/providers";

/** Mobile top bar: brand mark + name + role + notifications + avatar (menu). */
export function TopBar({
  role,
  userInitial,
  unread = false,
  onProfile,
}: {
  role: string;
  userInitial: string;
  unread?: boolean;
  onProfile: () => void;
}) {
  const { t } = useLang();
  return (
    <div className="topbar">
      <Logo variant="mark" className="brandmark" />
      <div className="brandtext">
        <span className="n">{t("appName")}</span>
        <span className="r">{role}</span>
      </div>
      <div className="sp" />
      <button className="iconbtn bell" aria-label={t("notifications")}>
        <Bell />
        {unread && <span className="notif-dot" aria-hidden />}
      </button>
      {/* Avatar reads as a menu trigger: ring + caret affordance. */}
      <button className="avatar avatar-trigger" onClick={onProfile} aria-label={t("account")}>
        <span className="avatar-initial">{userInitial}</span>
        <span className="avatar-caret" aria-hidden>
          <ChevronDown />
        </span>
      </button>
    </div>
  );
}
