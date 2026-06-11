// ============================================================
// Shared issue helpers — category meta (thumbnail color + icon),
// status/urgency colors, deadline labels, and date/time formatting.
// Ported from the prototype so list + detail render identically.
// ============================================================
import {
  Wind,
  Droplets,
  Zap,
  Armchair,
  Refrigerator,
  Wifi,
  Sparkles,
  ShieldCheck,
  MoreHorizontal,
  type LucideIcon,
} from "lucide-react";
import { MON_AR, MON_EN, relAr, relEn, TYPES, TAGS, type Lang } from "@/lib/i18n/dictionary";
import type { Database } from "@/lib/database.types";

export type Issue = Database["public"]["Tables"]["issues"]["Row"];
export type Deadline = Database["public"]["Enums"]["issue_deadline"];
export type Urgency = Database["public"]["Enums"]["issue_urgency"];
export type Status = Database["public"]["Enums"]["issue_status"];

/** Per-type thumbnail background (verbatim from the prototype). */
export const THUMB_COLOR: Record<string, string> = {
  ac: "#3E7CB1",
  plumbing: "#2E8C8C",
  electrical: "#C99A2E",
  furniture: "#9C6B4A",
  appliances: "#7A6BA8",
  internet: "#4A8C6B",
  cleaning: "#5BA0C9",
  safety: "#C4553A",
  other: "#7A8497",
};
export const thumbColor = (type: string) => THUMB_COLOR[type] ?? "#7A8497";

/** Per-type lucide icon, matching the prototype's hand-drawn set. */
export const TYPE_ICON: Record<string, LucideIcon> = {
  ac: Wind,
  plumbing: Droplets,
  electrical: Zap,
  furniture: Armchair,
  appliances: Refrigerator,
  internet: Wifi,
  cleaning: Sparkles,
  safety: ShieldCheck,
  other: MoreHorizontal,
};
export const typeIcon = (type: string) => TYPE_ICON[type] ?? MoreHorizontal;

/** i18n key for a type's label (e.g. "tAC"). */
export const typeLabelKey = (type: string) => TYPES.find((t) => t.id === type)?.k ?? "tOther";

/** CSS var for the status dot color. */
export const statusColor = (s: Status) =>
  ({
    open: "var(--faint)",
    progress: "var(--accent)",
    pending: "var(--u-soon)",
    done: "var(--u-wait)",
  })[s];

/** CSS var for an urgency color. */
export const urgencyColor = (u: Urgency) =>
  ({
    urgent: "var(--u-urgent)",
    soon: "var(--u-soon)",
    wait: "var(--u-wait)",
  })[u];

/** i18n key for a status label. */
export const statusLabelKey = (s: Status) =>
  ({ open: "sNew", progress: "sProgress", pending: "sPending", done: "sDone" })[s] as
    | "sNew"
    | "sProgress"
    | "sPending"
    | "sDone";

/** i18n key for an urgency label. */
export const urgencyLabelKey = (u: Urgency) => u; // "urgent" | "soon" | "wait" are keys

/** i18n key for a "due …" badge. */
export const dueLabelKey = (d: Deadline) =>
  ({
    today: "dueToday",
    tomorrow: "dueTomorrow",
    days3: "dueDays3",
    week: "dueWeek",
  })[d] as "dueToday" | "dueTomorrow" | "dueDays3" | "dueWeek";

/**
 * An issue is "overdue" when its deadline has passed. We compute it from the
 * deadline label + created_at (the prototype used a literal "overdue" flag; we
 * derive it from real timestamps so it stays correct over time).
 */
const DEADLINE_DAYS: Record<Deadline, number> = {
  today: 0,
  tomorrow: 1,
  days3: 3,
  week: 7,
};
export function isOverdue(issue: Issue, now: number = Date.now()): boolean {
  if (!issue.deadline || issue.status === "done") return false;
  const created = new Date(issue.created_at).getTime();
  const dueByEndOfDay = created + (DEADLINE_DAYS[issue.deadline] + 1) * 24 * 60 * 60 * 1000;
  return now > dueByEndOfDay;
}

// ---- Date / time formatting (Western numerals, Arabic month names) ----

export function minutesAgo(iso: string, now: number = Date.now()): number {
  return Math.max(0, Math.floor((now - new Date(iso).getTime()) / 60000));
}

/** Relative "x min ago" string in the given language. */
export function ago(iso: string, lang: Lang, now: number = Date.now()): string {
  const m = minutesAgo(iso, now);
  return lang === "ar" ? relAr(m) : relEn(m);
}

/**
 * Display label for a tag value. Fixed tags resolve via the i18n dictionary;
 * custom tags are stored as `custom:<label>` and render verbatim.
 */
export function tagDisplay(
  value: string,
  t: (key: import("@/lib/i18n/dictionary").Key) => string,
  /** Optional per-issue custom-tag translations + the viewer's language. */
  opts?: { tagTranslations?: Record<string, Record<string, string>>; lang?: Lang },
): string | null {
  if (value.startsWith("custom:")) {
    const label = value.slice(7);
    const tr = opts?.tagTranslations?.[label];
    if (tr && opts?.lang && tr[opts.lang]) return tr[opts.lang];
    return label;
  }
  const meta = TAGS.find((x) => x.id === value);
  return meta ? t(meta.k) : value;
}

/**
 * The issue description in the viewer's language: prefers the cached
 * translation, falls back to the original. Returns whether it's translated and
 * the original source language (for a "Translated from X" toggle).
 */
export function localizedDescription(
  issue: Issue,
  lang: Lang,
): { text: string; original: string; translated: boolean; source: Lang } {
  const source = (issue.source_language as Lang) ?? "ar";
  const original =
    (issue.description_translations as Record<string, string>)?.[source] ||
    issue.description ||
    issue.description_ar ||
    "";
  const translations = (issue.description_translations as Record<string, string>) ?? {};
  // Legacy rows have no translations map → fall back to description/_ar.
  const fallback = lang === "ar" ? issue.description_ar || issue.description : issue.description;
  const text = translations[lang] || fallback || original;
  return { text, original, translated: source !== lang && !!translations[lang], source };
}

/** Format a duration in minutes like the prototype: "3h 5m" / "2h" / "45m". */
export function fmtDur(m: number, lang: Lang): string {
  if (m < 60) return m + (lang === "ar" ? " د" : "m");
  const h = Math.floor(m / 60);
  const mm = m % 60;
  if (lang === "ar") return h + " س" + (mm ? " " + mm + " د" : "");
  return h + "h" + (mm ? " " + mm + "m" : "");
}

/** Full date + time, e.g. "10 Jun 2026 · 14:32" (Arabic month names in ar). */
export function fmtDateTime(iso: string, lang: Lang): string {
  const d = new Date(iso);
  const mon = (lang === "ar" ? MON_AR : MON_EN)[d.getMonth()];
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${d.getDate()} ${mon} ${d.getFullYear()} · ${hh}:${mm}`;
}
