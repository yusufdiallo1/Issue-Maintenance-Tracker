"use client";

// ============================================================
// AppShell — composes the desktop sidebar + mobile top/bottom bars
// around a scrollable main area. Holds nav state, profile-menu state,
// and the entry-animation gate. Renders the active screen (role-aware).
// ============================================================
import { useEffect, useState } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { BottomNav } from "./BottomNav";
import { ProfileMenu } from "./ProfileMenu";
import { NotificationsModal } from "./NotificationsModal";
import { SyncPill } from "./SyncPill";
import { PushPrimer } from "./PushPrimer";
import { ReportsScreen } from "./ReportsScreen";
import { AddReportScreen } from "./AddReportScreen";
import { MyReportsScreen } from "./MyReportsScreen";
import { SummaryScreen } from "./SummaryScreen";
import { PendingScreen } from "./PendingScreen";
import { SettingsScreen } from "./SettingsScreen";
import { ManageScreen } from "./manage/ManageScreen";
import { navItemsFor, type Role } from "./nav-items";
import { useLang } from "@/app/providers";
import { useViewEnter } from "@/lib/useViewEnter";
import { createClient } from "@/lib/supabase/client";
import { pingNewIssue } from "@/lib/ping";
import { useLowPowerClass, useDisplayMode } from "@/lib/perf";
import { signOutAction } from "@/app/login/actions";
import type { Issue } from "@/lib/issues";
import type { ProfileLite, ProfileFull, AuditRow } from "@/lib/data";

export function AppShell({
  userName,
  username,
  role,
  currentUserId,
  issues,
  profiles,
  team,
  audit,
  roomsByProperty,
  notifEnabled = true,
  notifSound = true,
}: {
  userName: string;
  username: string;
  role: Role;
  currentUserId: string;
  issues: Issue[];
  profiles: ProfileLite[];
  team: ProfileFull[];
  audit: AuditRow[];
  roomsByProperty: Record<string, string[]>;
  notifEnabled?: boolean;
  notifSound?: boolean;
}) {
  const { t } = useLang();
  useLowPowerClass();
  useDisplayMode();
  const items = navItemsFor(role);
  const [active, setActive] = useState(items[0].id);
  const [menuOpen, setMenuOpen] = useState(false);
  // Entry animation plays on view-change / first-open only (hydration-safe).
  const enter = useViewEnter(active);
  const menuEnter = menuOpen;

  const roleLabel = role === "admin" ? t("admin") : t("staff");
  const userInitial = (userName[0] || "?").toUpperCase();
  const isAdmin = role === "admin";

  // ---- Notification inbox: unread badge driven by the notifications table.
  const [unread, setUnread] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [openIssueId, setOpenIssueId] = useState<number | null>(null);
  const [supabase] = useState(() => createClient());

  useEffect(() => {
    let cancelled = false;
    const refreshUnread = async () => {
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("read", false);
      if (!cancelled) setUnread((count ?? 0) > 0);
    };
    refreshUnread();
    const channel = supabase
      .channel(`notif-${Math.floor(performance.now())}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          void refreshUnread();
          // In-app ping when the app is open (where system push banners don't
          // fire). Honors the user's sound pref + reduced-motion (in pingNewIssue).
          if (notifSound && document.visibilityState === "visible") {
            const row = payload.new as { kind?: string };
            void pingNewIssue(row.kind === "urgent" || row.kind === "safety");
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "notifications" },
        () => void refreshUnread(),
      );
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.access_token) supabase.realtime.setAuth(session.access_token);
      channel.subscribe();
    });
    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [supabase, notifSound]);

  // Deep-link: /?issue=<id> (from a push tap) opens that issue in Reports.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const id = setTimeout(() => {
      const q = new URLSearchParams(window.location.search).get("issue");
      const n = q ? Number(q) : NaN;
      if (Number.isFinite(n)) {
        setActive("reports");
        setOpenIssueId(n);
        window.history.replaceState(null, "", "/");
      }
    }, 0);
    return () => clearTimeout(id);
  }, []);

  const navigate = (id: string) => {
    setActive(id);
    setMenuOpen(false);
  };
  const toggleProfile = () => setMenuOpen((v) => !v);

  let screen: React.ReactNode;
  if (active === "reports") {
    screen = (
      <ReportsScreen
        initialIssues={issues}
        profiles={profiles}
        currentUserId={currentUserId}
        isAdmin={isAdmin}
        openIssueId={openIssueId}
        onConsumedOpenIssue={() => setOpenIssueId(null)}
      />
    );
  } else if (active === "add") {
    // After submit, staff go to "My reports"; admins (no mine nav) to Reports.
    screen = (
      <AddReportScreen
        roomsByProperty={roomsByProperty}
        onViewReports={() => navigate(isAdmin ? "reports" : "mine")}
      />
    );
  } else if (active === "mine") {
    screen = (
      <MyReportsScreen initialIssues={issues} profiles={profiles} currentUserId={currentUserId} />
    );
  } else if (active === "pending" && isAdmin) {
    screen = <PendingScreen issues={issues} />;
  } else if (active === "summary") {
    screen = <SummaryScreen initialIssues={issues} />;
  } else if (active === "manage" && isAdmin) {
    // Staff can't reach Manage via nav; this guard + the empty team/audit data
    // + server-side admin checks on every write are the real boundary.
    screen = (
      <ManageScreen
        currentUserId={currentUserId}
        team={team}
        audit={audit}
        issues={issues}
        profiles={profiles}
      />
    );
  } else {
    screen = (
      <SettingsScreen
        userName={userName}
        username={username}
        role={role}
        notifEnabled={notifEnabled}
        notifSound={notifSound}
      />
    );
  }

  return (
    <div id="app">
      <div className="shell">
        <Sidebar
          items={items}
          active={active}
          role={roleLabel}
          userName={userName}
          userInitial={userInitial}
          unread={unread}
          onNavigate={navigate}
          onAdd={() => navigate("add")}
          onProfile={toggleProfile}
          onNotifications={() => setNotifOpen(true)}
        />
        <div className="main">
          <TopBar
            role={roleLabel}
            userInitial={userInitial}
            unread={unread}
            onProfile={toggleProfile}
            onNotifications={() => setNotifOpen(true)}
          />
          <div className={enter ? "scroll enter" : "scroll"} id="scroll">
            {screen}
          </div>
        </div>
      </div>

      <BottomNav
        items={items}
        active={active}
        unread={unread}
        onNavigate={navigate}
        onAdd={() => navigate("add")}
      />

      <ProfileMenu
        userName={userName}
        role={roleLabel}
        open={menuOpen}
        enter={menuEnter}
        onClose={() => setMenuOpen(false)}
        signOutAction={signOutAction}
      />

      <NotificationsModal
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        onOpenIssue={(id) => {
          setOpenIssueId(id);
          navigate("reports");
        }}
      />

      <SyncPill />
      <PushPrimer />
    </div>
  );
}
