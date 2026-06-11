// Branded "Aurion Maintenance — Week of …" PDF for ownership (admin only).
// Pure JS via @react-pdf/renderer. Owner-grade: metrics, repeat offenders,
// by-property + by-category time-to-fix, staff leaderboard.
import { NextResponse } from "next/server";
import React from "react";
import path from "node:path";
import { Document, Page, Text, View, Image, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import { getCurrentProfile } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { propMeta, TYPES } from "@/lib/i18n/dictionary";
import { fmtDateTime, type Issue } from "@/lib/issues";
import { computeAnalytics } from "@/lib/analytics";
import type { ProfileLite } from "@/lib/data";

const GOLD = "#b58a3e";
const styles = StyleSheet.create({
  page: { padding: 34, fontSize: 10, fontFamily: "Helvetica", color: "#1a1a1a" },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  logo: { width: 26, height: 26, marginRight: 8 },
  brand: { fontSize: 18, fontFamily: "Helvetica-Bold" },
  sub: { fontSize: 9, color: "#777", marginBottom: 16 },
  h2: { fontSize: 12, fontFamily: "Helvetica-Bold", marginTop: 16, marginBottom: 6, color: GOLD },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 4 },
  stat: { flex: 1, border: "1 solid #e3e3e3", borderRadius: 6, padding: 10 },
  statNum: { fontSize: 18, fontFamily: "Helvetica-Bold" },
  statLabel: { fontSize: 8, color: "#888", marginTop: 2 },
  row: { flexDirection: "row", borderBottom: "1 solid #eee", paddingVertical: 4 },
  warn: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 8,
    backgroundColor: "#fdf6ea",
    borderRadius: 5,
    marginBottom: 3,
  },
  cL: { flex: 1 },
  cR: { width: 110, textAlign: "right" },
  b: { fontFamily: "Helvetica-Bold" },
  muted: { color: "#888" },
});

function dur(min: number | null): string {
  if (min == null) return "—";
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}
const typeLabel = (id: string) => {
  const k = TYPES.find((x) => x.id === id)?.k;
  const map: Record<string, string> = {
    tAC: "AC",
    tPlumb: "Plumbing",
    tElec: "Electrical",
    tFurn: "Furniture",
    tAppl: "Appliances",
    tNet: "Internet/TV",
    tClean: "Cleaning",
    tSafe: "Safety",
    tOther: "Other",
  };
  return k ? (map[k] ?? id) : id;
};

export async function GET() {
  const me = await getCurrentProfile();
  if (!me || me.role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const supabase = await createClient();
  const admin = createAdminClient();
  const [{ data: issuesData }, { data: profData }] = await Promise.all([
    supabase.from("issues").select("*"),
    admin.from("profiles").select("id, full_name, username"),
  ]);
  const issues = (issuesData ?? []) as Issue[];
  const profiles = (profData ?? []) as ProfileLite[];
  const a = computeAnalytics(issues, profiles, Date.now(), 14);

  const logoPath = path.join(process.cwd(), "public", "aurion-logo.png");
  const e = React.createElement;

  const doc = e(
    Document,
    null,
    e(
      Page,
      { size: "A4", style: styles.page },
      e(
        View,
        { style: styles.header },
        e(Image, { style: styles.logo, src: logoPath }),
        e(Text, { style: styles.brand }, "Aurion Maintenance"),
      ),
      e(
        Text,
        { style: styles.sub },
        `Week of ${fmtDateTime(new Date().toISOString(), "en")} · prepared for ownership`,
      ),

      // Key metrics
      e(
        View,
        { style: styles.statsRow },
        e(
          View,
          { style: styles.stat },
          e(Text, { style: styles.statNum }, dur(a.timeToFixOverall)),
          e(Text, { style: styles.statLabel }, "AVG TIME TO FIX"),
        ),
        e(
          View,
          { style: styles.stat },
          e(Text, { style: styles.statNum }, String(a.open)),
          e(Text, { style: styles.statLabel }, "OPEN"),
        ),
        e(
          View,
          { style: styles.stat },
          e(Text, { style: styles.statNum }, String(a.urgent)),
          e(Text, { style: styles.statLabel }, "URGENT"),
        ),
        e(
          View,
          { style: styles.stat },
          e(
            Text,
            { style: styles.statNum },
            a.withinDeadlinePct == null ? "—" : `${a.withinDeadlinePct}%`,
          ),
          e(Text, { style: styles.statLabel }, "WITHIN DEADLINE"),
        ),
      ),

      // Repeat offenders
      e(Text, { style: styles.h2 }, "Repeat offenders (≥3 in 60 days)"),
      a.repeatOffenders.length
        ? a.repeatOffenders.map((r, idx) =>
            e(
              View,
              { style: styles.warn, key: idx },
              e(
                Text,
                { style: styles.cL },
                `${propMeta(r.property)?.en ?? r.property} ${r.room}${r.category ? ` · ${typeLabel(r.category)}` : ""} — needs a permanent fix`,
              ),
              e(Text, { style: styles.cR }, `${r.count}× in 60d`),
            ),
          )
        : e(Text, { style: styles.muted }, "None — no room has 3+ issues in the last 60 days."),

      // By property
      e(Text, { style: styles.h2 }, "Time to fix — by property"),
      a.byProperty.length
        ? a.byProperty.map((b, idx) =>
            e(
              View,
              { style: styles.row, key: idx },
              e(Text, { style: styles.cL }, propMeta(b.key)?.en ?? b.key),
              e(Text, { style: styles.cR }, `${dur(b.avgMinutes)} · ${b.count} fixed`),
            ),
          )
        : e(Text, { style: styles.muted }, "No resolved issues yet."),

      // By category
      e(Text, { style: styles.h2 }, "Time to fix — by category"),
      a.byCategory.length
        ? a.byCategory.map((b, idx) =>
            e(
              View,
              { style: styles.row, key: idx },
              e(Text, { style: styles.cL }, typeLabel(b.key)),
              e(Text, { style: styles.cR }, `${dur(b.avgMinutes)} · ${b.count} fixed`),
            ),
          )
        : e(Text, { style: styles.muted }, "No resolved issues yet."),

      // Leaderboard
      e(Text, { style: styles.h2 }, "Team — jobs resolved"),
      a.leaderboard.length
        ? a.leaderboard.map((l, idx) =>
            e(
              View,
              { style: styles.row, key: idx },
              e(Text, { style: styles.cL }, l.name),
              e(Text, { style: styles.cR }, `${l.resolved} resolved · ${dur(l.avgMinutes)} avg`),
            ),
          )
        : e(Text, { style: styles.muted }, "No completed jobs yet."),
    ),
  );

  const buffer = await renderToBuffer(doc);
  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="aurion-weekly-report.pdf"',
    },
  });
}
