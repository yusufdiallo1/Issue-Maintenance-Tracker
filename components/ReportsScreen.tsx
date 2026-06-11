"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ClipboardList,
  LayoutGrid,
  List as ListIcon,
  RotateCw,
  Search,
  ChevronDown,
} from "lucide-react";
import { IssueCard } from "./IssueCard";
import { IssueDetailSheet } from "./IssueDetailSheet";
import { EmptyState } from "./States";
import { useLang } from "@/app/providers";
import { createClient } from "@/lib/supabase/client";
import { propMeta } from "@/lib/i18n/dictionary";
import { isOverdue, type Issue } from "@/lib/issues";
import type { ProfileLite } from "@/lib/data";

type Filter = "all" | "urgent" | "new" | "progress" | "done";
type View = "list" | "grid";
type SortKey = "newest" | "urgent" | "deadline";

const FILTERS: { id: Filter; key: "fAll" | "fUrgent" | "fNew" | "fProgress" | "fDone" }[] = [
  { id: "all", key: "fAll" },
  { id: "urgent", key: "fUrgent" },
  { id: "new", key: "fNew" },
  { id: "progress", key: "fProgress" },
  { id: "done", key: "fDone" },
];
// Property filter — the three with rooms (whole-property units rarely filtered).
const PROP_FILTERS = ["all", "as_salaam", "al_aqeeq", "quba"] as const;
const PAGE = 20; // render this many at a time (infinite scroll)
const URGENCY_RANK: Record<string, number> = { urgent: 0, soon: 1, wait: 2 };

function applyStatusFilter(list: Issue[], f: Filter): Issue[] {
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
  openIssueId = null,
  onConsumedOpenIssue,
}: {
  initialIssues: Issue[];
  profiles: ProfileLite[];
  currentUserId: string;
  isAdmin: boolean;
  openIssueId?: number | null;
  onConsumedOpenIssue?: () => void;
}) {
  const { t, lang } = useLang();
  const router = useRouter();
  const params = useSearchParams();
  const [supabase] = useState(() => createClient());
  const [issues, setIssues] = useState<Issue[]>(initialIssues);
  const [view, setView] = useState<View>("list");
  const [detailId, setDetailId] = useState<number | null>(null);
  const [sheetEnter, setSheetEnter] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [limit, setLimit] = useState(PAGE);

  // ---- Filter/sort/search state, seeded from + persisted to the URL ----
  const [filter, setFilter] = useState<Filter>((params.get("status") as Filter) || "all");
  const [propFilter, setPropFilter] = useState<string>(params.get("prop") || "all");
  const [sort, setSort] = useState<SortKey>((params.get("sort") as SortKey) || "newest");
  const [search, setSearch] = useState(params.get("q") || "");
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(id);
  }, [search]);

  // Reflect state in the URL (shareable, survives refresh) without scrolling.
  useEffect(() => {
    const q = new URLSearchParams();
    if (filter !== "all") q.set("status", filter);
    if (propFilter !== "all") q.set("prop", propFilter);
    if (sort !== "newest") q.set("sort", sort);
    if (debouncedSearch.trim()) q.set("q", debouncedSearch.trim());
    const qs = q.toString();
    router.replace(qs ? `/?${qs}` : "/", { scroll: false });
  }, [filter, propFilter, sort, debouncedSearch, router]);

  const nameById = useMemo(() => {
    const m = new Map<string, string>();
    profiles.forEach((p) => m.set(p.id, p.full_name));
    return m;
  }, [profiles]);

  // Render-phase sync when the server sends fresh data.
  const [seededFrom, setSeededFrom] = useState(initialIssues);
  if (seededFrom !== initialIssues) {
    setSeededFrom(initialIssues);
    setIssues(initialIssues);
  }

  // Thumbnail signed URLs (first photo per issue).
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

  // Realtime: prepend inserts, patch updates, drop deletes.
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
    const channel = supabase
      .channel(`issues-stream-${Math.floor(performance.now())}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "issues" }, onChange);
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.access_token) supabase.realtime.setAuth(session.access_token);
      channel.subscribe();
    });
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  // ---- Compose: search → property → status → sort ----
  const processed = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    let list = issues;
    if (q) {
      list = list.filter((i) => {
        const reporter = (nameById.get(i.reported_by) ?? "").toLowerCase();
        const taker = i.taken_by ? (nameById.get(i.taken_by) ?? "").toLowerCase() : "";
        return (
          i.room.toLowerCase().includes(q) ||
          (i.description ?? "").toLowerCase().includes(q) ||
          (i.description_ar ?? "").toLowerCase().includes(q) ||
          reporter.includes(q) ||
          taker.includes(q)
        );
      });
    }
    if (propFilter !== "all") list = list.filter((i) => i.property === propFilter);
    list = applyStatusFilter(list, filter);
    const arr = [...list];
    arr.sort((a, b) => {
      if (sort === "urgent") {
        const d = (URGENCY_RANK[a.urgency] ?? 9) - (URGENCY_RANK[b.urgency] ?? 9);
        if (d !== 0) return d;
      } else if (sort === "deadline") {
        const ao = isOverdue(a) ? 0 : a.deadline ? 1 : 2;
        const bo = isOverdue(b) ? 0 : b.deadline ? 1 : 2;
        if (ao !== bo) return ao - bo;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    return arr;
  }, [issues, debouncedSearch, propFilter, filter, sort, nameById]);

  // Reset the page window when the query changes (render-phase, not an effect).
  const queryKey = `${debouncedSearch}|${propFilter}|${filter}|${sort}`;
  const [lastQueryKey, setLastQueryKey] = useState(queryKey);
  if (lastQueryKey !== queryKey) {
    setLastQueryKey(queryKey);
    setLimit(PAGE);
  }

  const visible = processed.slice(0, limit);
  const hasMore = processed.length > limit;

  // Infinite scroll: grow the window when the sentinel enters view.
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => entries[0]?.isIntersecting && setLimit((n) => n + PAGE),
      { rootMargin: "400px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, visible.length]);

  const detail = detailId != null ? (issues.find((i) => i.id === detailId) ?? null) : null;

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

  // Open a specific issue's detail when requested (e.g. from a notification).
  useEffect(() => {
    if (openIssueId == null) return;
    const id = setTimeout(() => {
      setSheetEnter(true);
      setDetailId(openIssueId);
      onConsumedOpenIssue?.();
    }, 0);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openIssueId]);

  const cards = visible.map((issue) => (
    <IssueCard
      key={issue.id}
      issue={issue}
      takerName={issue.taken_by ? (nameById.get(issue.taken_by) ?? null) : null}
      thumbUrl={thumbUrls[issue.id] ?? null}
      onOpen={openDetail}
    />
  ));

  const propLabel = (code: string) =>
    code === "all" ? t("fAllProps") : (propMeta(code)?.[lang] ?? code);

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

      {/* search + sort */}
      <div className="reports-toolbar">
        <div className="searchwrap">
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
        <div className="sortwrap">
          <select
            className="sortselect"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            aria-label={t("sortNewest")}
          >
            <option value="newest">{t("sortNewest")}</option>
            <option value="urgent">{t("sortUrgent")}</option>
            <option value="deadline">{t("sortDeadline")}</option>
          </select>
          <ChevronDown className="chev" />
        </div>
      </div>

      {/* status filter */}
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

      {/* property filter */}
      <div className="filterbar">
        {PROP_FILTERS.map((p) => (
          <button
            key={p}
            className={propFilter === p ? "fchip on" : "fchip"}
            onClick={() => setPropFilter(p)}
          >
            {propLabel(p)}
          </button>
        ))}
      </div>

      {processed.length > 0 ? (
        <>
          {view === "grid" ? <div className="issuegrid">{cards}</div> : cards}
          {hasMore && <div ref={sentinelRef} className="loadmore-sentinel" aria-hidden />}
        </>
      ) : (
        <EmptyState
          icon={ClipboardList}
          message={
            debouncedSearch || propFilter !== "all" || filter !== "all"
              ? t("noResults")
              : t("noIssues")
          }
        />
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
