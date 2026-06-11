import {
  List,
  BarChart3,
  Settings,
  ClipboardCheck,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import type { Key } from "@/lib/i18n/dictionary";
import type { Database } from "@/lib/database.types";

export type Role = Database["public"]["Enums"]["user_role"];
export type NavItem = { id: string; labelKey: Key; Icon: LucideIcon };

/**
 * Role-aware nav set (matches the prototype):
 * - staff:  Reports · My reports · Settings
 * - admin:  Reports · Summary · Manage · Settings
 * The center "+" (new report) is rendered separately by the nav bars.
 */
export function navItemsFor(role: Role): NavItem[] {
  const reports: NavItem = { id: "reports", labelKey: "navReports", Icon: List };
  const settings: NavItem = { id: "settings", labelKey: "navSettings", Icon: Settings };
  if (role === "admin") {
    const summary: NavItem = { id: "summary", labelKey: "navSummary", Icon: BarChart3 };
    const manage: NavItem = { id: "manage", labelKey: "navManage", Icon: ShieldCheck };
    return [reports, summary, manage, settings];
  }
  const mine: NavItem = { id: "mine", labelKey: "navMine", Icon: ClipboardCheck };
  return [reports, mine, settings];
}
