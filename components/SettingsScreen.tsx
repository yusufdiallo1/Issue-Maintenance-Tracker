"use client";

import { useState } from "react";
import { LogOut, Bell, Volume2 } from "lucide-react";
import { useLang } from "@/app/providers";
import { ConfirmDialog } from "./ConfirmDialog";
import { usePush } from "@/lib/usePush";
import { useToast } from "./Toast";
import { setNotifPrefs } from "@/app/actions/push";
import { signOutAction } from "@/app/login/actions";

/**
 * Settings: account + notifications + sign out. Language/Appearance live in the
 * profile menu; Team/Audit/Analytics live in the admin Manage area.
 */
export function SettingsScreen({
  userName,
  role,
  notifEnabled = true,
  notifSound = true,
}: {
  userName: string;
  role: "admin" | "staff";
  notifEnabled?: boolean;
  notifSound?: boolean;
}) {
  const { t } = useLang();
  const { subscribe, unsubscribe, subscribed, state, busy } = usePush();
  const { show } = useToast();
  const [confirmOut, setConfirmOut] = useState(false);
  const [pushOn, setPushOn] = useState(notifEnabled);
  const [soundOn, setSoundOn] = useState(notifSound);

  const togglePush = async () => {
    if (state === "unsupported") {
      show(t("pushUnsupported"), "info");
      return;
    }
    const next = !pushOn;
    setPushOn(next);
    await setNotifPrefs({ enabled: next });
    if (next) {
      if (!subscribed) await subscribe();
      show(t("pushOn"), "success");
    } else {
      if (subscribed) await unsubscribe();
      show(t("pushOff"), "info");
    }
  };

  const toggleSound = async () => {
    const next = !soundOn;
    setSoundOn(next);
    await setNotifPrefs({ sound: next });
  };

  return (
    <div className="screen">
      <h1 className="title">{t("navSettings")}</h1>

      <div className="section-h">{t("account")}</div>
      <div className="slist glass">
        <div className="emp">
          <span className="eav">{(userName[0] || "?").toUpperCase()}</span>
          <div className="ei">
            <div className="en">{userName}</div>
            <div className="eu">{role === "admin" ? t("admin") : t("staff")}</div>
          </div>
        </div>
      </div>

      <div className="section-h">{t("notifications")}</div>
      <div className="slist glass">
        <button className="setrow" onClick={togglePush} disabled={busy} type="button">
          <Bell />
          <span className="setrow-label">{t("notifications")}</span>
          <span className={pushOn ? "toggle on" : "toggle"} aria-pressed={pushOn}>
            <span className="knob" />
          </span>
        </button>
        <button className="setrow" onClick={toggleSound} type="button">
          <Volume2 />
          <span className="setrow-label">{t("notifSound")}</span>
          <span className={soundOn ? "toggle on" : "toggle"} aria-pressed={soundOn}>
            <span className="knob" />
          </span>
        </button>
      </div>

      <button
        className="btn ghost"
        type="button"
        onClick={() => setConfirmOut(true)}
        style={{ marginTop: 18, color: "var(--u-urgent)" }}
      >
        <LogOut />
        {t("signout")}
      </button>

      <ConfirmDialog
        open={confirmOut}
        title={t("signoutQ")}
        message={t("signoutMsg")}
        confirmLabel={t("signout")}
        danger
        onCancel={() => setConfirmOut(false)}
        onConfirm={() => {
          setConfirmOut(false);
          void signOutAction();
        }}
      />
    </div>
  );
}
