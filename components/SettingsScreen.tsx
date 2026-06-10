"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { AddEmployeeSheet } from "./AddEmployeeSheet";
import { useLang, useTheme } from "@/app/providers";
import { fmtDateTime } from "@/lib/issues";
import { auditText } from "@/lib/audit";
import { removeEmployee } from "@/app/actions/employees";
import type { ProfileFull, AuditRow } from "@/lib/data";
import type { Lang } from "@/lib/i18n/dictionary";
import type { Theme } from "@/lib/prefs";
import { signOutAction } from "@/app/login/actions";

function initial(name: string) {
  return (name?.[0] ?? "?").toUpperCase();
}

export function SettingsScreen({
  role,
  currentUserId,
  team,
  audit,
}: {
  role: "admin" | "staff";
  currentUserId: string;
  team: ProfileFull[];
  audit: AuditRow[];
}) {
  const { lang, setLang, t } = useLang();
  const { theme, setTheme } = useTheme();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetEnter, setSheetEnter] = useState(false);
  const [, startTransition] = useTransition();

  const langs: { id: Lang; label: string }[] = [
    { id: "ar", label: "العربية" },
    { id: "en", label: "English" },
  ];
  const themes: { id: Theme; label: string }[] = [
    { id: "auto", label: t("system") },
    { id: "light", label: t("light") },
    { id: "dark", label: t("dark") },
  ];

  const prefs = (
    <>
      <div className="section-h">{t("language")}</div>
      <div className="slist glass">
        <div className="prow">
          <div className="seg" style={{ width: "100%" }}>
            {langs.map((l) => (
              <button
                key={l.id}
                className={lang === l.id ? "on" : ""}
                onClick={() => setLang(l.id)}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="section-h">{t("appearance")}</div>
      <div className="slist glass">
        <div className="prow">
          <div className="seg" style={{ width: "100%" }}>
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
      </div>
    </>
  );

  function remove(id: string) {
    startTransition(async () => {
      await removeEmployee(id);
    });
  }

  return (
    <div className="screen">
      <h1 className="title">{t("navSettings")}</h1>

      {role === "admin" && (
        <>
          <div className="section-h">{t("team")}</div>
          <div className="slist glass">
            {team.map((m) => {
              const isSelf = m.id === currentUserId;
              return (
                <div className="emp" key={m.id}>
                  <span className="eav">{initial(m.full_name)}</span>
                  <div className="ei">
                    <div className="en">{m.full_name}</div>
                    <div className="eu">@{m.username}</div>
                  </div>
                  <span className={`rolebadge ${m.role}`}>{t(m.role)}</span>
                  {isSelf ? (
                    <span
                      style={{ fontSize: 11, color: "var(--faint)", fontWeight: 600, flex: "none" }}
                    >
                      {t("you")}
                    </span>
                  ) : (
                    <button className="rmbtn" onClick={() => remove(m.id)} aria-label="Remove">
                      <Trash2 />
                    </button>
                  )}
                </div>
              );
            })}
            <button
              className="addbtn-row"
              onClick={() => {
                setSheetEnter(true);
                setSheetOpen(true);
              }}
            >
              <Plus />
              {t("addEmployee")}
            </button>
          </div>

          <div className="section-h">{t("audit")}</div>
          <div className="slist glass">
            {audit.map((e) => {
              const { actor, verb, target } = auditText(e, lang, t);
              return (
                <div className="aud" key={e.id}>
                  <span className="adot" />
                  <div>
                    <div className="at">
                      <b>{actor}</b> {verb} {target}
                    </div>
                    <div className="atime">{fmtDateTime(e.created_at, lang)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {prefs}

      <form action={signOutAction}>
        <button
          className="btn ghost"
          type="submit"
          style={{ marginTop: 18, color: "var(--u-urgent)" }}
        >
          {t("signout")}
        </button>
      </form>

      <AddEmployeeSheet
        open={sheetOpen}
        enter={sheetEnter}
        onClose={() => setSheetOpen(false)}
        onAdded={() => setSheetOpen(false)}
      />
    </div>
  );
}
