"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { AddEmployeeSheet } from "./AddEmployeeSheet";
import { useLang } from "@/app/providers";
import { fmtDateTime } from "@/lib/issues";
import { auditText } from "@/lib/audit";
import { removeEmployee } from "@/app/actions/employees";
import type { ProfileFull, AuditRow } from "@/lib/data";
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
  const { lang, t } = useLang();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetEnter, setSheetEnter] = useState(false);
  const [, startTransition] = useTransition();

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
