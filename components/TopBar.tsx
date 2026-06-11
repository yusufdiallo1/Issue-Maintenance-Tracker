"use client";

import { Bell, BellRing, ChevronDown } from "lucide-react";
import { Logo } from "./Logo";
import { useLang } from "@/app/providers";
import { usePush } from "@/lib/usePush";
import { useToast } from "./Toast";

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
  const { subscribed, busy, subscribe, unsubscribe, state } = usePush();
  const { show } = useToast();

  const onBell = async () => {
    if (state === "unsupported") {
      show(t("pushUnsupported"), "info");
      return;
    }
    if (subscribed) {
      await unsubscribe();
      show(t("pushOff"), "info");
    } else {
      await subscribe();
      show(t("pushOn"), "success");
    }
  };

  return (
    <div className="topbar">
      <Logo variant="mark" className="brandmark" />
      <div className="brandtext">
        <span className="n">{t("appName")}</span>
        <span className="r">{role}</span>
      </div>
      <div className="sp" />
      <button
        className="iconbtn bell"
        aria-label={t("notifications")}
        aria-pressed={subscribed}
        disabled={busy}
        onClick={onBell}
      >
        {subscribed ? <BellRing /> : <Bell />}
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
