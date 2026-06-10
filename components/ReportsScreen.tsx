"use client";

import { useEffect, useMemo, useState } from "react";
import { ClipboardList, LayoutGrid, List as ListIcon, RotateCw } from "lucide-react";
import { IssueCard } from "./IssueCard";
import { IssueDetailSheet } from "./IssueDetailSheet";
import { useLang } from "@/app/providers";
import { createClient } from "@/lib/supabase/client";
import type { Issue } from "@/lib/issues";
import type { ProfileLite } from "@/lib/data";

type Filter = "all" | "urgent" | "new" | "progress" | "done";
type View = "list" | "grid";

const FILTERS: { id: Filter; key: "fAll" | "fUrgent" | "fNew" | "fProgress" | "fDone" }[] = [
  { id: "all", key: "fAll" },
  { id: "urgent", key: "fUrgent" },
  { id: "new", key: "fNew" },
  { id: "progress", key: "fProgress" },
  { id: "done", key: "fDone" },
];

function applyFilter(list: Issue[], f: Filter): Issue[] {
  switch (f) {
    case "urgent":
      return list.filter((i) => i.urgency === "urgent" && i.status !== "done");
    case "new":
      return list.filter((i) => i.status === "open");
    case "progress":
      return list.filter((i) => i.status === "progress");
    case "done":
      return list.filter((i) => i.status === "done");
    default:
      return list;
  }
}

export function ReportsScreen({
  initialIssues,
  profiles,
  currentUserId,
  isAdmin,
}: {
  initialIssues: Issue[];
  profiles: ProfileLite[];
  currentUserId: string;
  isAdmin: boolean;
}) {
  const { t } = useLang();
  const [supabase] = useState(() => createClient());
  const [issues, setIssues] = useState<Issue[]>(initialIssues);
  const [filter, setFilter] = useState<Filter>("all");
  const [view, setView] = useState<View>("list");
  const [detailId, setDetailId] = useState<number | null>(null);
  // Gate the sheet entry animation to the open transition only.
  const [sheetEnter, setSheetEnter] = useState(false);

  const nameById = useMemo(() => {
    const m = new Map<string, string>();
    profiles.forEach((p) => m.set(p.id, p.full_name));
    return m;
  }, [profiles]);

  // Keep local state in sync when the server sends fresh data (e.g. after a
  // submit triggers revalidatePath). Realtime handles live deltas; this catches
  // the navigation-back case so a just-created report is never missing.
  // Render-phase sync (the React-recommended pattern, not an effect):
  const [seededFrom, setSeededFrom] = useState(initialIssues);
  if (seededFrom !== initialIssues) {
    setSeededFrom(initialIssues);
    setIssues(initialIssues);
  }

  // Resolve a thumbnail (first photo) signed URL per issue, once.
  const [thumbUrls, setThumbUrls] = useState<Record<number, string>>({});
  const thumbKey = issues.map((i) => `${i.id}:${i.photo_paths?.[0] ?? ""}`).join(",");
  useEffect(() => {
    let active = true;
    const withPhoto = issues.filter((i) => i.photo_paths && i.photo_paths.length > 0);
    if (!withPhoto.length) return;
    Promise.all(
      withPhoto.map((i) =>
        supabase.storage
          .from("issue-photos")
          .createSignedUrl(i.photo_paths[0], 3600)
          .then(({ data }) => [i.id, data?.signedUrl ?? ""] as const),
      ),
    ).then((pairs) => {
      if (!active) return;
      const map: Record<number, string> = {};
      pairs.forEach(([id, url]) => url && (map[id] = url));
      setThumbUrls(map);
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thumbKey, supabase]);

  // ---- Realtime: update the list in place, no refetch, no scroll jump ----
  // Functional setState updates only the changed card; the scroll container is
  // untouched and the list isn't re-animated.
  useEffect(() => {
    const onChange = (payload: {
      eventType: "INSERT" | "UPDATE" | "DELETE";
      new: Record<string, unknown>;
      old: Record<string, unknown>;
    }) => {
      setIssues((prev) => {
        if (payload.eventType === "INSERT") {
          const row = payload.new as Issue;
          if (prev.some((i) => i.id === row.id)) return prev;
          return [row, ...prev];
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

    // Build the channel and register the listener BEFORE subscribing — the
    // postgres_changes callback cannot be added after subscribe().
    const channel = supabase
      .channel(`issues-stream-${Math.floor(performance.now())}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "issues" }, onChange);

    // RLS-protected tables need the user's token on the Realtime socket.
    // setAuth applies to the shared socket; fire it, then subscribe.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.access_token) supabase.realtime.setAuth(session.access_token);
      channel.subscribe();
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  // Newest first (the DB already returns this order; keep it stable on updates).
  const sorted = useMemo(
    () =>
      [...issues].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      ),
    [issues],
  );
  const visible = useMemo(() => applyFilter(sorted, filter), [sorted, filter]);

  const detail = detailId != null ? (issues.find((i) => i.id === detailId) ?? null) : null;
  const [refreshing, setRefreshing] = useState(false);

  async function refresh() {
    setRefreshing(true);
    const { data } = await supabase
      .from("issues")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setIssues(data as Issue[]);
    setRefreshing(false);
  }

  const openDetail = (id: number) => {
    setSheetEnter(true);
    setDetailId(id);
  };
  const closeDetail = () => {
    setDetailId(null);
    setSheetEnter(false);
  };

  const cards = visible.map((issue) => (
    <IssueCard
      key={issue.id}
      issue={issue}
      takerName={issue.taken_by ? (nameById.get(issue.taken_by) ?? null) : null}
      thumbUrl={thumbUrls[issue.id] ?? null}
      onOpen={openDetail}
    />
  ));

  return (
    <div className="screen">
      <div className="reports-head">
        <h1 className="title">{t("reportsTitle")}</h1>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            className="iconbtn"
            aria-label={t("refresh")}
            onClick={refresh}
            data-spin={refreshing ? "true" : undefined}
          >
            <RotateCw />
          </button>
          <div className="viewtoggle" role="group" aria-label="View">
            <button
              className={view === "list" ? "on" : ""}
              aria-label="List view"
              aria-pressed={view === "list"}
              onClick={() => setView("list")}
            >
              <ListIcon />
            </button>
            <button
              className={view === "grid" ? "on" : ""}
              aria-label="Grid view"
              aria-pressed={view === "grid"}
              onClick={() => setView("grid")}
            >
              <LayoutGrid />
            </button>
          </div>
        </div>
      </div>

      <div className="filterbar">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            className={filter === f.id ? "fchip on" : "fchip"}
            onClick={() => setFilter(f.id)}
          >
            {t(f.key)}
          </button>
        ))}
      </div>

      {visible.length > 0 ? (
        view === "grid" ? (
          <div className="issuegrid">{cards}</div>
        ) : (
          cards
        )
      ) : (
        <div className="empty">
          <ClipboardList />
          <div>{t("noIssues")}</div>
        </div>
      )}

      <IssueDetailSheet
        issue={detail}
        reporterName={detail ? (nameById.get(detail.reported_by) ?? "—") : "—"}
        takerName={detail?.taken_by ? (nameById.get(detail.taken_by) ?? null) : null}
        currentUserId={currentUserId}
        isAdmin={isAdmin}
        open={detailId != null}
        enter={sheetEnter}
        onClose={closeDetail}
      />
    </div>
  );
}
