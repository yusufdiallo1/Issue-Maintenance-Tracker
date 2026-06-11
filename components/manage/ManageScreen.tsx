"use client";

// ============================================================
// ManageScreen — admin-only "Manage" area. A LiquidTabs segmented
// control switches between Team, Audit, and Analytics sub-panels.
// ============================================================
import { useState } from "react";
import { LiquidTabs } from "../LiquidTabs";
import { TeamPanel } from "./TeamPanel";
import { AuditPanel } from "./AuditPanel";
import { AnalyticsPanel } from "./AnalyticsPanel";
import { useLang } from "@/app/providers";
import type { Issue } from "@/lib/issues";
import type { ProfileFull, ProfileLite, AuditRow } from "@/lib/data";

type Tab = "team" | "audit" | "analytics";

export function ManageScreen({
  currentUserId,
  team,
  audit,
  issues,
  profiles,
}: {
  currentUserId: string;
  team: ProfileFull[];
  audit: AuditRow[];
  issues: Issue[];
  profiles: ProfileLite[];
}) {
  const { t } = useLang();
  const [tab, setTab] = useState<Tab>("team");

  return (
    <div className="screen">
      <h1 className="title">{t("navManage")}</h1>

      <div className="glasstabs-wrap">
        <LiquidTabs
          aria-label={t("navManage")}
          segments={[
            { id: "team", label: t("tabTeam") },
            { id: "audit", label: t("tabAudit") },
            { id: "analytics", label: t("tabAnalytics") },
          ]}
          value={tab}
          onChange={(id) => setTab(id as Tab)}
        />
      </div>

      {tab === "team" && <TeamPanel currentUserId={currentUserId} team={team} />}
      {tab === "audit" && <AuditPanel audit={audit} team={team} />}
      {tab === "analytics" && <AnalyticsPanel issues={issues} profiles={profiles} />}
    </div>
  );
}
