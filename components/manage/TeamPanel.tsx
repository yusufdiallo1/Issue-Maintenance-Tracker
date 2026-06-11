"use client";

// ============================================================
// TeamPanel — inline team management (admin only). Role toggle,
// inline password reset, and remove — all optimistic with rollback
// and a toast. Never acts on self.
// ============================================================
import { useMemo, useState, useTransition } from "react";
import { Plus, Trash2, Search, Check, X, KeyRound } from "lucide-react";
import { AddEmployeeSheet } from "../AddEmployeeSheet";
import { useToast } from "../Toast";
import { useLang } from "@/app/providers";
import { changeRole, removeEmployee, resetPassword } from "@/app/actions/employees";
import type { ProfileFull } from "@/lib/data";

function initial(name: string) {
  return (name?.[0] ?? "?").toUpperCase();
}

export function TeamPanel({ currentUserId, team }: { currentUserId: string; team: ProfileFull[] }) {
  const { t } = useLang();
  const { show } = useToast();
  const [, startTransition] = useTransition();

  // Local copy so we can apply optimistic role changes / removals.
  const [members, setMembers] = useState<ProfileFull[]>(team);
  // Render-phase sync when the server sends a fresh team list.
  const [seededFrom, setSeededFrom] = useState(team);
  if (seededFrom !== team) {
    setSeededFrom(team);
    setMembers(team);
  }

  const [search, setSearch] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetEnter, setSheetEnter] = useState(false);
  const [resetFor, setResetFor] = useState<string | null>(null);
  const [pwValue, setPwValue] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return members;
    return members.filter(
      (m) => m.full_name.toLowerCase().includes(q) || m.username.toLowerCase().includes(q),
    );
  }, [members, search]);

  function setRole(id: string, role: "admin" | "staff") {
    const prev = members;
    setMembers((cur) => cur.map((m) => (m.id === id ? { ...m, role } : m)));
    startTransition(async () => {
      const res = await changeRole(id, role);
      if (res.ok) {
        show(t("roleChanged"), "success");
      } else {
        setMembers(prev);
        show(t("actionFailed"), "error");
      }
    });
  }

  function remove(id: string) {
    if (!confirm(t("confirmRemove"))) return;
    const prev = members;
    setMembers((cur) => cur.filter((m) => m.id !== id));
    startTransition(async () => {
      const res = await removeEmployee(id);
      if (res.ok) {
        show(t("removed2"), "success");
      } else {
        setMembers(prev);
        show(t("actionFailed"), "error");
      }
    });
  }

  function submitReset(id: string) {
    const pw = pwValue.trim();
    if (pw.length < 6) return;
    startTransition(async () => {
      const res = await resetPassword(id, pw);
      if (res.ok) {
        show(t("pwReset"), "success");
        setResetFor(null);
        setPwValue("");
      } else {
        show(t("actionFailed"), "error");
      }
    });
  }

  return (
    <>
      <div className="searchwrap" style={{ marginBottom: 12 }}>
        <Search />
        <input
          className="searchinput"
          type="search"
          placeholder={t("searchPh")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label={t("search")}
        />
      </div>

      <p className="sub" style={{ margin: "0 2px 12px", fontSize: 13 }}>
        {filtered.length} {t("team")}
      </p>

      <div className="slist glass">
        {filtered.map((m) => {
          const isSelf = m.id === currentUserId;
          return (
            <div key={m.id}>
              <div className="emp">
                <span className="eav">{initial(m.full_name)}</span>
                <div className="ei">
                  <div className="en">{m.full_name}</div>
                  <div className="eu">@{m.username}</div>
                </div>
                {isSelf ? (
                  <span
                    style={{
                      fontSize: 11,
                      color: "var(--faint)",
                      fontWeight: 600,
                      flex: "none",
                    }}
                  >
                    {t("you")}
                  </span>
                ) : (
                  <>
                    <div
                      className="seg"
                      style={{ flex: "none", padding: 3 }}
                      role="group"
                      aria-label={t("role")}
                    >
                      <button
                        type="button"
                        className={m.role === "staff" ? "on" : ""}
                        style={{ flex: "none", padding: "6px 11px" }}
                        onClick={() => m.role !== "staff" && setRole(m.id, "staff")}
                      >
                        {t("staff")}
                      </button>
                      <button
                        type="button"
                        className={m.role === "admin" ? "on" : ""}
                        style={{ flex: "none", padding: "6px 11px" }}
                        onClick={() => m.role !== "admin" && setRole(m.id, "admin")}
                      >
                        {t("admin")}
                      </button>
                    </div>
                    <button
                      className="rmbtn"
                      style={{
                        background: "var(--card2)",
                        color: "var(--dim)",
                      }}
                      onClick={() => {
                        setResetFor(resetFor === m.id ? null : m.id);
                        setPwValue("");
                      }}
                      aria-label={t("resetPw")}
                      title={t("resetPw")}
                    >
                      <KeyRound />
                    </button>
                    <button className="rmbtn" onClick={() => remove(m.id)} aria-label={t("remove")}>
                      <Trash2 />
                    </button>
                  </>
                )}
              </div>

              {resetFor === m.id && !isSelf && (
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                    padding: "0 16px 13px",
                  }}
                >
                  <input
                    className="inset-input"
                    type="password"
                    autoComplete="new-password"
                    placeholder={t("newPassword")}
                    value={pwValue}
                    onChange={(e) => setPwValue(e.target.value)}
                    aria-label={t("newPassword")}
                    style={{ flex: 1 }}
                  />
                  <button
                    className="rmbtn"
                    style={{
                      background: "var(--accent-soft)",
                      color: "var(--accent)",
                    }}
                    disabled={pwValue.trim().length < 6}
                    onClick={() => submitReset(m.id)}
                    aria-label={t("save")}
                  >
                    <Check />
                  </button>
                  <button
                    className="rmbtn"
                    style={{ background: "var(--card2)", color: "var(--dim)" }}
                    onClick={() => {
                      setResetFor(null);
                      setPwValue("");
                    }}
                    aria-label={t("cancel")}
                  >
                    <X />
                  </button>
                </div>
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

      <AddEmployeeSheet
        open={sheetOpen}
        enter={sheetEnter}
        onClose={() => setSheetOpen(false)}
        onAdded={() => setSheetOpen(false)}
      />
    </>
  );
}
