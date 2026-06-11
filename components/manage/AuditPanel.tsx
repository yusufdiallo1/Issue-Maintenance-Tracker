"use client";

// ============================================================
// AuditPanel — full filterable audit log (admin only). Filter by
// user, by action type, and free-text search. Paginated (Load more)
// and exportable to CSV (filtered rows, Western digits).
// ============================================================
import { useMemo, useState } from "react";
import { Search, Download, ChevronDown } from "lucide-react";
import { useLang } from "@/app/providers";
import { Sheet } from "../Sheet";
import { fmtDateTime } from "@/lib/issues";
import { auditText } from "@/lib/audit";
import type { Key } from "@/lib/i18n/dictionary";
import type { AuditRow, ProfileFull } from "@/lib/data";

const PAGE = 30;

// All action types we may encounter (DB enum + the role/pwreset extras).
const ACTIONS: { id: string; key: Key }[] = [
  { id: "report", key: "acReport" },
  { id: "take", key: "acTake" },
  { id: "done", key: "acDone" },
  { id: "deadline", key: "acDeadline" },
  { id: "addemp", key: "acAddemp" },
  { id: "rmemp", key: "acRmemp" },
  { id: "login", key: "acLogin" },
  { id: "role", key: "acRole" },
  { id: "pwreset", key: "acPwreset" },
  { id: "passcode", key: "acPasscode" },
];

export function AuditPanel({ audit, team }: { audit: AuditRow[]; team: ProfileFull[] }) {
  const { t, lang } = useLang();
  const [userFilter, setUserFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(PAGE);
  const [detail, setDetail] = useState<AuditRow | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = audit
      .filter((e) => userFilter === "all" || e.actor === userFilter)
      .filter((e) => actionFilter === "all" || e.action === actionFilter)
      .filter((e) => {
        if (!q) return true;
        return (
          (e.actor_name ?? "").toLowerCase().includes(q) ||
          (e.target_text ?? "").toLowerCase().includes(q) ||
          (e.target_room ?? "").toLowerCase().includes(q)
        );
      });
    // Newest first.
    return [...rows].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  }, [audit, userFilter, actionFilter, search]);

  // Reset the page window when the query changes (render-phase, not effect).
  const queryKey = `${userFilter}|${actionFilter}|${search.trim().toLowerCase()}`;
  const [lastQueryKey, setLastQueryKey] = useState(queryKey);
  if (lastQueryKey !== queryKey) {
    setLastQueryKey(queryKey);
    setLimit(PAGE);
  }

  const visible = filtered.slice(0, limit);
  const hasMore = filtered.length > limit;

  function exportCsv() {
    const header = ["actor", "action", "target", "datetime"];
    const esc = (s: string) => `"${(s ?? "").replace(/"/g, '""')}"`;
    const rows = filtered.map((e) => {
      const { target } = auditText(e, lang, t);
      return [
        esc(e.actor_name ?? ""),
        esc(e.action),
        esc(target),
        esc(fmtDateTime(e.created_at, lang)),
      ].join(",");
    });
    const csv = [header.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "aurion-audit.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <div className="reports-toolbar" style={{ marginTop: 0 }}>
        <div className="searchwrap">
          <Search />
          <input
            className="searchinput"
            type="search"
            placeholder={t("search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label={t("search")}
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <div className="sortwrap" style={{ flex: 1 }}>
          <select
            className="sortselect"
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            aria-label={t("filterUser")}
          >
            <option value="all">{t("allUsers")}</option>
            {team.map((m) => (
              <option key={m.id} value={m.id}>
                {m.full_name}
              </option>
            ))}
          </select>
          <ChevronDown className="chev" />
        </div>
        <div className="sortwrap" style={{ flex: 1 }}>
          <select
            className="sortselect"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            aria-label={t("filterAction")}
          >
            <option value="all">{t("allActions")}</option>
            {ACTIONS.map((a) => (
              <option key={a.id} value={a.id}>
                {t(a.key)}
              </option>
            ))}
          </select>
          <ChevronDown className="chev" />
        </div>
      </div>

      {visible.length > 0 ? (
        <div className="slist glass">
          {visible.map((e) => {
            const { actor, verb, target } = auditText(e, lang, t);
            return (
              <button className="aud aud-btn" key={e.id} onClick={() => setDetail(e)} type="button">
                <span className="adot" />
                <div>
                  <div className="at">
                    <b>{actor}</b> {verb} {target}
                  </div>
                  <div className="atime">{fmtDateTime(e.created_at, lang)}</div>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="empty">{t("noData")}</div>
      )}

      {hasMore && (
        <button
          className="btn ghost"
          style={{ marginTop: 12 }}
          onClick={() => setLimit((n) => n + PAGE)}
        >
          {t("loadMore")}
        </button>
      )}

      <button className="btn ghost" style={{ marginTop: 12 }} onClick={exportCsv}>
        <Download />
        {t("exportCsv")}
      </button>

      <Sheet
        open={detail != null}
        enter
        onClose={() => setDetail(null)}
        title={detail ? auditText(detail, lang, t).verb : ""}
      >
        {detail && (
          <div className="aud-detail">
            <Row label={t("filterUser")} value={detail.actor_name} />
            <Row label={t("filterAction")} value={detail.action} />
            {auditText(detail, lang, t).target && (
              <Row label={t("proofLabel")} value={auditText(detail, lang, t).target} />
            )}
            <Row label="" value={fmtDateTime(detail.created_at, lang)} />
            {detail.action === "passcode" && detail.target_text && (
              <Row label={t("newPasswordLabel")} value={detail.target_text} mono />
            )}
          </div>
        )}
      </Sheet>
    </>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="aud-detail-row">
      {label && <span className="adl">{label}</span>}
      <span className={mono ? "adv mono" : "adv"}>{value}</span>
    </div>
  );
}
