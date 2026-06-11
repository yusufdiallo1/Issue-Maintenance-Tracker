"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { useLang } from "@/app/providers";
import { ConfirmDialog } from "./ConfirmDialog";
import { signOutAction } from "@/app/login/actions";

/**
 * Settings: account + sign out. Language/Appearance live in the profile menu;
 * Team/Audit/Analytics live in the admin Manage area.
 */
export function SettingsScreen({ userName, role }: { userName: string; role: "admin" | "staff" }) {
  const { t } = useLang();
  const [confirmOut, setConfirmOut] = useState(false);

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
