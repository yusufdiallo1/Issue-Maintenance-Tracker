"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Check } from "lucide-react";
import { LiquidTabs } from "./LiquidTabs";
import { IssueDetailSheet } from "./IssueDetailSheet";
import { useLang } from "@/app/providers";
import { createClient } from "@/lib/supabase/client";
import { propMeta } from "@/lib/i18n/dictionary";
import { statusColor, statusLabelKey, type Issue } from "@/lib/issues";
import type { ProfileLite } from "@/lib/data";
import { markDone, reopenIssue } from "@/app/actions/issues";

type Mode = "made" | "took";

export function MyReportsScreen({
  initialIssues,
  profiles,
  currentUserId,
}: {
  initialIssues: Issue[];
  profiles: ProfileLite[];
  currentUserId: string;
}) {
  const { t, lang } = useLang();
  const [supabase] = useState(() => createClient());
  const [issues, setIssues] = useState<Issue[]>(initialIssues);
  const [mode, setMode] = useState<Mode>("made");
  const [detailId, setDetailId] = useState<number | null>(null);
  const [sheetEnter, setSheetEnter] = useState(false);
  const [, startTransition] = useTransition();

  const nameById = useMemo(() => {
    const m = new Map<string, string>();
    profiles.forEach((p) => m.set(p.id, p.full_name));
    return m;
  }, [profiles]);

  // Realtime keeps personal lists fresh.
  useEffect(() => {
    const onChange = (payload: {
      eventType: "INSERT" | "UPDATE" | "DELETE";
      new: Record<string, unknown>;
      old: Record<string, unknown>;
    }) => {
      setIssues((prev) => {
        if (payload.eventType === "INSERT") {
          const row = payload.new as Issue;
          return prev.some((i) => i.id === row.id) ? prev : [row, ...prev];
        }
        if (payload.eventType === "UPDATE") {
          const row = payload.new as Issue;
          return prev.map((i) => (i.id === row.id ? row : i));
        }
        if (payload.eventType === "DELETE") {
          const oldRow = payload.old as { id: number };
          return prev.filter((i) => i.id !== oldRow.id);
        }
        return prev;
      });
    };
    const channel = supabase
      .channel(`mine-stream-${Math.floor(performance.now())}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "issues" }, onChange);
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.access_token) supabase.realtime.setAuth(session.access_token);
      channel.subscribe();
    });
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  // STRICTLY personal — only my own rows ever appear here.
  const list = useMemo(() => {
    const mine =
      mode === "made"
        ? issues.filter((i) => i.reported_by === currentUserId)
        : issues.filter((i) => i.taken_by === currentUserId);
    // Done items sink to the bottom; otherwise newest first.
    return [...mine].sort((a, b) => {
      const ad = a.status === "done" ? 1 : 0;
      const bd = b.status === "done" ? 1 : 0;
      if (ad !== bd) return ad - bd;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [issues, mode, currentUserId]);

  const detail = detailId != null ? (issues.find((i) => i.id === detailId) ?? null) : null;

  const toggleDone = (issue: Issue) => {
    startTransition(async () => {
      if (issue.status === "done") await reopenIssue(issue.id);
      else await markDone(issue.id);
    });
  };

  return (
    <div className="screen">
      <h1 className="title">{t("navMine")}</h1>

      <div className="glasstabs-wrap">
        <LiquidTabs
          aria-label={t("navMine")}
          segments={[
            { id: "made", label: t("mineMade") },
            { id: "took", label: t("mineTook") },
          ]}
          value={mode}
          onChange={(id) => setMode(id as Mode)}
        />
      </div>

      <p className="sub" style={{ margin: "0 2px 16px", fontSize: 14 }}>
        {mode === "took" ? t("mineSub") : t("mineMadeSub")}
      </p>

      {list.length > 0 ? (
        <div className="checklist glass">
          {list.map((i) => {
            const pm = propMeta(i.property);
            const desc = (lang === "ar" ? i.description_ar : i.description) || i.description;
            if (mode === "took") {
              const done = i.status === "done";
              return (
                <div key={i.id} className={done ? "crow done" : "crow"}>
                  <button
                    className="ccirc"
                    onClick={() => toggleDone(i)}
                    aria-label={done ? t("reopen") : t("markDone")}
                  >
                    {done && <Check />}
                  </button>
                  <button
                    className="ci"
                    style={{ textAlign: "start" }}
                    onClick={() => {
                      setSheetEnter(true);
                      setDetailId(i.id);
                    }}
                  >
                    <div className="ct">
                      {pm ? pm[lang] : i.property} {i.room && `· ${i.room}`}
                    </div>
                    <div className="cd">{desc}</div>
                  </button>
                </div>
              );
            }
            // "made" → tracking row with a status pill, opens the detail sheet.
            return (
              <button
                key={i.id}
                className="crow"
                onClick={() => {
                  setSheetEnter(true);
                  setDetailId(i.id);
                }}
              >
                <span className="srow-dot" style={{ background: statusColor(i.status) }} />
                <div className="ci">
                  <div className="ct">
                    {pm ? pm[lang] : i.property} {i.room && `· ${i.room}`}
                  </div>
                  <div className="cd">{desc}</div>
                </div>
                <span className={`statuspill ${i.status}`}>{t(statusLabelKey(i.status))}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="empty">
          <div>{t("noIssues")}</div>
        </div>
      )}

      <IssueDetailSheet
        issue={detail}
        reporterName={detail ? (nameById.get(detail.reported_by) ?? "—") : "—"}
        takerName={detail?.taken_by ? (nameById.get(detail.taken_by) ?? null) : null}
        currentUserId={currentUserId}
        isAdmin={false}
        open={detailId != null}
        enter={sheetEnter}
        onClose={() => {
          setDetailId(null);
          setSheetEnter(false);
        }}
      />
    </div>
  );
}
