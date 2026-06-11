"use client";

import { useState, useTransition } from "react";
import { LogOut, Bell, Volume2, KeyRound } from "lucide-react";
import { useLang, useTheme } from "@/app/providers";
import { ConfirmDialog } from "./ConfirmDialog";
import { usePush } from "@/lib/usePush";
import { useToast } from "./Toast";
import { setNotifPrefs } from "@/app/actions/push";
import { changeOwnPassword } from "@/app/actions/employees";
import { signOutAction } from "@/app/login/actions";
import { LANGS } from "@/lib/i18n/dictionary";
import type { Theme } from "@/lib/prefs";

/**
 * Settings: account + language + appearance + notifications + sign out.
 * Team/Audit/Analytics live in the admin Manage area.
 */
export function SettingsScreen({
  userName,
  username,
  role,
  notifEnabled = true,
  notifSound = true,
}: {
  userName: string;
  username: string;
  role: "admin" | "staff";
  notifEnabled?: boolean;
  notifSound?: boolean;
}) {
  const { t, lang, setLang } = useLang();
  const { theme, setTheme } = useTheme();
  const { subscribe, unsubscribe, subscribed, state, busy } = usePush();
  const themes: { id: Theme; label: string }[] = [
    { id: "auto", label: t("system") },
    { id: "light", label: t("light") },
    { id: "dark", label: t("dark") },
  ];
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

  const [newPass, setNewPass] = useState("");
  const [pwPending, startPw] = useTransition();
  const changePass = () => {
    if (newPass.trim().length < 6) {
      show(t("weakPassword"), "error");
      return;
    }
    startPw(async () => {
      const res = await changeOwnPassword(newPass.trim());
      if (res.ok) {
        show(t("passcodeChanged"), "success");
        setNewPass("");
      } else {
        show(res.error === "weak_password" ? t("weakPassword") : t("loadError"), "error");
      }
    });
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
            <div className="eu">
              @{username} · {role === "admin" ? t("admin") : t("staff")}
            </div>
          </div>
        </div>
      </div>

      <div className="section-h">{t("language")}</div>
      <div className="seg seg-lang set-seg">
        {LANGS.map((l) => (
          <button
            key={l.id}
            className={lang === l.id ? "on" : ""}
            onClick={() => setLang(l.id)}
            type="button"
          >
            {l.label}
          </button>
        ))}
      </div>

      <div className="section-h">{t("appearance")}</div>
      <div className="seg set-seg">
        {themes.map((th) => (
          <button
            key={th.id}
            className={theme === th.id ? "on" : ""}
            onClick={() => setTheme(th.id)}
            type="button"
          >
            {th.label}
          </button>
        ))}
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

      <div className="section-h">{t("changePasscode")}</div>
      <div className="slist glass" style={{ padding: 14 }}>
        <div className="pwrow">
          <KeyRound />
          <input
            className="input"
            type="password"
            value={newPass}
            onChange={(e) => setNewPass(e.target.value)}
            placeholder={t("newPasscode")}
            autoComplete="new-password"
          />
        </div>
        <button
          className="btn gold"
          type="button"
          disabled={pwPending || newPass.trim().length < 6}
          onClick={changePass}
          style={{ marginTop: 10 }}
        >
          {t("updatePasscode")}
        </button>
        <p className="pwhint">{t("passcodeAdminNote")}</p>
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
