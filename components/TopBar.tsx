"use client";

import { Logo } from "./Logo";
import { useLang } from "@/app/providers";

/** Mobile top bar: brand mark + name + role + avatar (opens profile menu). */
export function TopBar({
  role,
  userInitial,
  onProfile,
}: {
  role: string;
  userInitial: string;
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
      <button className="avatar" onClick={onProfile} aria-label={t("account")}>
        {userInitial}
      </button>
    </div>
  );
}
