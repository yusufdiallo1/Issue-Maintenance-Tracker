// Pure analytics over the issues set — time-to-fix, repeat offenders, SLA,
// trend, leaderboard. No I/O; safe to run client-side from the loaded issues.
import type { Issue } from "@/lib/issues";
import type { ProfileLite } from "@/lib/data";

const MS_PER_DAY = 86_400_000;

/** Minutes between created and resolved (prefers stored resolved_minutes). */
function fixMinutes(i: Issue): number | null {
  if (i.status !== "done") return null;
  if (typeof i.resolved_minutes === "number") return i.resolved_minutes;
  if (i.resolved_at) {
    return Math.round((Date.parse(i.resolved_at) - Date.parse(i.created_at)) / 60000);
  }
  return null;
}

function avg(nums: number[]): number | null {
  if (!nums.length) return null;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

export type Breakdown = { key: string; avgMinutes: number | null; count: number };

export type RepeatOffender = {
  property: string;
  room: string;
  category: string | null; // null = room-level (any category)
  count: number;
};

export type LeaderRow = { id: string; name: string; resolved: number; avgMinutes: number | null };

export type Analytics = {
  open: number;
  urgent: number;
  overdue: number;
  doneTotal: number;
  withinDeadlinePct: number | null;
  timeToFixOverall: number | null;
  byProperty: Breakdown[];
  byCategory: Breakdown[];
  repeatOffenders: RepeatOffender[];
  trend: { date: string; created: number; resolved: number }[];
  leaderboard: LeaderRow[];
};

function isOverdueIssue(i: Issue, now: number): boolean {
  if (i.status === "done" || !i.deadline) return false;
  const created = Date.parse(i.created_at);
  const add: Record<string, number> = { today: 1, tomorrow: 2, days3: 3, week: 7 };
  const days = add[i.deadline] ?? 0;
  return now > created + days * MS_PER_DAY;
}

export function computeAnalytics(
  issues: Issue[],
  profiles: ProfileLite[],
  now: number,
  trendDays = 14,
): Analytics {
  const done = issues.filter((i) => i.status === "done");
  const open = issues.filter((i) => i.status !== "done").length;
  const urgent = issues.filter((i) => i.urgency === "urgent" && i.status !== "done").length;
  const overdue = issues.filter((i) => isOverdueIssue(i, now)).length;

  // SLA: of the resolved issues that had a deadline, how many beat it.
  const withDeadline = done.filter((i) => i.deadline && i.resolved_at);
  let withinPct: number | null = null;
  if (withDeadline.length) {
    const add: Record<string, number> = { today: 1, tomorrow: 2, days3: 3, week: 7 };
    const within = withDeadline.filter((i) => {
      const due = Date.parse(i.created_at) + (add[i.deadline!] ?? 0) * MS_PER_DAY;
      return Date.parse(i.resolved_at!) <= due;
    }).length;
    withinPct = Math.round((within / withDeadline.length) * 100);
  }

  const allFix = done.map(fixMinutes).filter((n): n is number => n != null);

  // By-property / by-category time-to-fix.
  const group = (keyOf: (i: Issue) => string): Breakdown[] => {
    const map = new Map<string, number[]>();
    for (const i of done) {
      const m = fixMinutes(i);
      if (m == null) continue;
      (map.get(keyOf(i)) ?? map.set(keyOf(i), []).get(keyOf(i))!).push(m);
    }
    return [...map.entries()]
      .map(([key, arr]) => ({ key, avgMinutes: avg(arr), count: arr.length }))
      .sort((a, b) => (b.avgMinutes ?? 0) - (a.avgMinutes ?? 0));
  };

  // Repeat offenders: ≥3 issues in the last 60 days, by room and by room+category.
  const since = now - 60 * MS_PER_DAY;
  const recent = issues.filter((i) => Date.parse(i.created_at) >= since);
  const roomCount = new Map<string, RepeatOffender>();
  const comboCount = new Map<string, RepeatOffender>();
  for (const i of recent) {
    const rk = `${i.property}|${i.room}`;
    const r = roomCount.get(rk) ?? { property: i.property, room: i.room, category: null, count: 0 };
    r.count++;
    roomCount.set(rk, r);
    const ck = `${i.property}|${i.room}|${i.type}`;
    const c = comboCount.get(ck) ?? {
      property: i.property,
      room: i.room,
      category: i.type,
      count: 0,
    };
    c.count++;
    comboCount.set(ck, c);
  }
  const repeatOffenders = [...comboCount.values(), ...roomCount.values()]
    .filter((r) => r.count >= 3)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // Trend: created vs resolved per day over the window.
  const dayKey = (ts: number) => new Date(ts).toISOString().slice(0, 10);
  const trend: { date: string; created: number; resolved: number }[] = [];
  for (let d = trendDays - 1; d >= 0; d--) {
    const key = dayKey(now - d * MS_PER_DAY);
    trend.push({
      date: key,
      created: issues.filter((i) => dayKey(Date.parse(i.created_at)) === key).length,
      resolved: done.filter((i) => i.resolved_at && dayKey(Date.parse(i.resolved_at)) === key)
        .length,
    });
  }

  // Leaderboard: per taker, resolved count + avg time-to-fix.
  const nameById = new Map(profiles.map((p) => [p.id, p.full_name]));
  const byTaker = new Map<string, number[]>();
  const resolvedByTaker = new Map<string, number>();
  for (const i of done) {
    if (!i.taken_by) continue;
    resolvedByTaker.set(i.taken_by, (resolvedByTaker.get(i.taken_by) ?? 0) + 1);
    const m = fixMinutes(i);
    if (m != null)
      (byTaker.get(i.taken_by) ?? byTaker.set(i.taken_by, []).get(i.taken_by)!).push(m);
  }
  const leaderboard: LeaderRow[] = [...resolvedByTaker.entries()]
    .map(([id, resolved]) => ({
      id,
      name: nameById.get(id) ?? "—",
      resolved,
      avgMinutes: avg(byTaker.get(id) ?? []),
    }))
    .sort((a, b) => b.resolved - a.resolved);

  return {
    open,
    urgent,
    overdue,
    doneTotal: done.length,
    withinDeadlinePct: withinPct,
    timeToFixOverall: avg(allFix),
    byProperty: group((i) => i.property),
    byCategory: group((i) => i.type),
    repeatOffenders,
    trend,
    leaderboard,
  };
}
