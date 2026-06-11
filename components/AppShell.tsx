"use client";

// ============================================================
// AppShell — composes the desktop sidebar + mobile top/bottom bars
// around a scrollable main area. Holds nav state, profile-menu state,
// and the entry-animation gate. Renders the active screen (role-aware).
// ============================================================
import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { BottomNav } from "./BottomNav";
import { ProfileMenu } from "./ProfileMenu";
import { ReportsScreen } from "./ReportsScreen";
import { AddReportScreen } from "./AddReportScreen";
import { MyReportsScreen } from "./MyReportsScreen";
import { SummaryScreen } from "./SummaryScreen";
import { SettingsScreen } from "./SettingsScreen";
import { ManageScreen } from "./manage/ManageScreen";
import { navItemsFor, type Role } from "./nav-items";
import { useLang } from "@/app/providers";
import { useViewEnter } from "@/lib/useViewEnter";
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
    screen = <SettingsScreen role={role} currentUserId={currentUserId} team={team} audit={audit} />;
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
          <TopBar role={roleLabel} userInitial={userInitial} onProfile={toggleProfile} />
          <div className={enter ? "scroll enter" : "scroll"} id="scroll">
            {screen}
          </div>
        </div>
      </div>

      <BottomNav
        items={items}
        active={active}
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
    </div>
  );
}
