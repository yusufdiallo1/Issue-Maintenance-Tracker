"use client";

import { useState } from "react";
import { User, LogOut } from "lucide-react";
import { useLang, useTheme } from "@/app/providers";
import { ConfirmDialog } from "./ConfirmDialog";
import type { Lang } from "@/lib/i18n/dictionary";
import type { Theme } from "@/lib/prefs";

/**
 * Profile dropdown: Language + Appearance (theme) + Sign out.
 * Repositions bottom-left on desktop via the `.menu` CSS rules.
 */
export function ProfileMenu({
  userName,
  role,
  open,
  onClose,
  enter,
  signOutAction,
}: {
  userName: string;
  role: string;
  open: boolean;
  onClose: () => void;
  enter: boolean;
  signOutAction: () => Promise<void>;
}) {
  const { lang, setLang, t } = useLang();
  const { theme, setTheme } = useTheme();
  const [confirmOut, setConfirmOut] = useState(false);
  if (!open) return null;

  const langs: { id: Lang; label: string }[] = [
    { id: "ar", label: "العربية" },
    { id: "en", label: "English" },
  ];
  const themes: { id: Theme; label: string }[] = [
    { id: "auto", label: t("system") },
    { id: "light", label: t("light") },
    { id: "dark", label: t("dark") },
  ];

  return (
    <>
      <div className="menu-scrim" onClick={onClose} />
      <div
        className={enter ? "menu enter" : "menu"}
        role="menu"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mhead">
          <span className="av">
            <User />
          </span>
          <div>
            <div className="nm">{userName}</div>
            <div className="rl">{role}</div>
          </div>
        </div>

        <div className="mrow">
          <div className="ml">{t("language")}</div>
          <div className="seg">
            {langs.map((l) => (
              <button
                key={l.id}
                className={lang === l.id ? "on" : ""}
                onClick={() => {
                  setLang(l.id);
                  onClose();
                }}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mrow">
          <div className="ml">{t("appearance")}</div>
          <div className="seg">
            {themes.map((th) => (
              <button
                key={th.id}
                className={theme === th.id ? "on" : ""}
                onClick={() => setTheme(th.id)}
              >
                {th.label}
              </button>
            ))}
          </div>
        </div>

        <button
          className="signout-row"
          type="button"
          role="menuitem"
          onClick={() => setConfirmOut(true)}
        >
          <LogOut />
          {t("signout")}
        </button>
      </div>

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
    </>
  );
}
