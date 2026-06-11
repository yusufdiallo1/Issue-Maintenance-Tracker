"use client";

// ============================================================
// AppShell — composes the desktop sidebar + mobile top/bottom bars
// around a scrollable main area. Holds nav state, profile-menu state,
// and the entry-animation gate. Renders the active screen (role-aware).
// ============================================================
import { useEffect, useRef, useState } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { BottomNav } from "./BottomNav";
import { ProfileMenu } from "./ProfileMenu";
import { SyncPill } from "./SyncPill";
import { ReportsScreen } from "./ReportsScreen";
import { AddReportScreen } from "./AddReportScreen";
import { MyReportsScreen } from "./MyReportsScreen";
import { SummaryScreen } from "./SummaryScreen";
import { SettingsScreen } from "./SettingsScreen";
import { ManageScreen } from "./manage/ManageScreen";
import { navItemsFor, type Role } from "./nav-items";
import { useLang } from "@/app/providers";
import { useViewEnter } from "@/lib/useViewEnter";
import { createClient } from "@/lib/supabase/client";
import { signOutAction } from "@/app/login/actions";
import type { Issue } from "@/lib/issues";
import type { ProfileLite, ProfileFull, AuditRow } from "@/lib/data";

export function AppShell({
  userName,
  role,
  currentUserId,
  issues,
  profiles,
  team,
  audit,
  roomsByProperty,
}: {
  userName: string;
  role: Role;
  currentUserId: string;
  issues: Issue[];
  profiles: ProfileLite[];
  team: ProfileFull[];
  audit: AuditRow[];
  roomsByProperty: Record<string, string[]>;
}) {
  const { t } = useLang();
  const items = navItemsFor(role);
  const [active, setActive] = useState(items[0].id);
  const [menuOpen, setMenuOpen] = useState(false);
  // Entry animation plays on view-change / first-open only (hydration-safe).
  const enter = useViewEnter(active);
  const menuEnter = menuOpen;

  const roleLabel = role === "admin" ? t("admin") : t("staff");
  const userInitial = (userName[0] || "?").toUpperCase();
  const isAdmin = role === "admin";

  // ---- Unread indicator: new urgent / safety reports while away from Reports.
  const [unread, setUnread] = useState(false);
  const [supabase] = useState(() => createClient());
  const activeRef = useRef(active);
  useEffect(() => {
    activeRef.current = active;
  }, [active]);
  useEffect(() => {
    const onInsert = (payload: { new: Record<string, unknown> }) => {
      const row = payload.new as { urgency?: string; tags?: string[]; reported_by?: string };
      const flagged = row.urgency === "urgent" || (row.tags ?? []).includes("safety");
      // Don't flag my own reports or when I'm already looking at Reports.
      if (flagged && row.reported_by !== currentUserId && activeRef.current !== "reports") {
        setUnread(true);
      }
    };
    const channel = supabase
      .channel(`unread-${Math.floor(performance.now())}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "issues" }, onInsert);
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.access_token) supabase.realtime.setAuth(session.access_token);
      channel.subscribe();
    });
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, currentUserId]);

  const navigate = (id: string) => {
    setActive(id);
    if (id === "reports") setUnread(false);
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
    screen = <SettingsScreen userName={userName} role={role} />;
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
          onNavigate={navigate}
          onAdd={() => navigate("add")}
          onProfile={toggleProfile}
        />
        <div className="main">
          <TopBar
            role={roleLabel}
            userInitial={userInitial}
            unread={unread}
            onProfile={toggleProfile}
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

      <SyncPill />
    </div>
  );
}
