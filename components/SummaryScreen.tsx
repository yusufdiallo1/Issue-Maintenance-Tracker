"use client";

import { useEffect, useMemo, useState } from "react";
import { Sparkles, Download } from "lucide-react";
import { useLang } from "@/app/providers";
import { PROPS, TYPES } from "@/lib/i18n/dictionary";
import { fmtDur, type Issue } from "@/lib/issues";
import { computeAnalytics } from "@/lib/analytics";
import { getAiSummary } from "@/app/actions/summary";
import { SkeletonBlock } from "@/components/States";

const typeKey = (id: string) => TYPES.find((x) => x.id === id)?.k ?? "tOther";

/** Gold-family palette for the donut (cycles for >5 types). */
const DONUT_PALETTE = [
  "var(--fill)",
  "var(--accent)",
  "color-mix(in srgb, var(--fill) 62%, var(--card2))",
  "var(--u-soon)",
  "color-mix(in srgb, var(--accent) 55%, var(--card2))",
  "color-mix(in srgb, var(--fill) 40%, var(--u-soon))",
  "color-mix(in srgb, var(--u-soon) 55%, var(--card2))",
  "color-mix(in srgb, var(--accent) 30%, var(--card2))",
  "var(--faint)",
];

// ---- Hand-built donut chart (inline SVG, stroke-dasharray arcs) ----
function Donut({
  segments,
  total,
  totalLabel,
}: {
  segments: { label: string; value: number; color: string }[];
  total: number;
  totalLabel: string;
}) {
  const R = 52; // radius
  const C = 2 * Math.PI * R; // circumference
  const STROKE = 18;
  // Accumulate offsets so each arc starts where the previous ended.
  // Pure reduce (no closure mutation) keeps the react-compiler happy.
  const arcs = segments.reduce<
    { label: string; value: number; color: string; frac: number; offset: number }[]
  >((rows, s) => {
    const frac = total > 0 ? s.value / total : 0;
    const offset = rows.length ? rows[rows.length - 1].offset + rows[rows.length - 1].frac : 0;
    return [...rows, { ...s, frac, offset }];
  }, []);

  return (
    <div className="donut-wrap">
      <svg className="donut" viewBox="0 0 140 140" role="img" aria-label={totalLabel}>
        {/* track */}
        <circle cx="70" cy="70" r={R} fill="none" stroke="var(--card2)" strokeWidth={STROKE} />
        {arcs.map((a, i) => (
          <circle
            key={i}
            className="donut-arc"
            cx="70"
            cy="70"
            r={R}
            fill="none"
            stroke={a.color}
            strokeWidth={STROKE}
            strokeLinecap="butt"
            // dash = visible arc length; gap = the rest of the circle
            strokeDasharray={`${a.frac * C} ${C}`}
            // rotate each arc to begin at its cumulative offset; -90deg = 12 o'clock
            transform={`rotate(${a.offset * 360 - 90} 70 70)`}
            style={{ ["--dash" as string]: `${a.frac * C}`, ["--full" as string]: `${C}` }}
          />
        ))}
      </svg>
      <div className="donut-center">
        <div className="donut-total mono">{total}</div>
        <div className="donut-cap">{totalLabel}</div>
      </div>
    </div>
  );
}

// ---- Hand-built area/line trend chart (inline SVG path) ----
function TrendChart({
  trend,
  createdLabel,
  resolvedLabel,
}: {
  trend: { date: string; created: number; resolved: number }[];
  createdLabel: string;
  resolvedLabel: string;
}) {
  const W = 320;
  const H = 120;
  const PAD_T = 8;
  const PAD_B = 16;
  const innerH = H - PAD_T - PAD_B;
  const n = trend.length;
  const maxV = Math.max(1, ...trend.map((d) => Math.max(d.created, d.resolved)));

  const x = (i: number) => (n <= 1 ? 0 : (i / (n - 1)) * W);
  const y = (v: number) => PAD_T + innerH - (v / maxV) * innerH;

  // Smooth path via Catmull-Rom -> cubic bezier conversion.
  const smooth = (pts: { x: number; y: number }[]) => {
    if (pts.length < 2) return pts.length ? `M${pts[0].x},${pts[0].y}` : "";
    let d = `M${pts[0].x},${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] ?? pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] ?? p2;
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
    }
    return d;
  };

  const createdPts = trend.map((d, i) => ({ x: x(i), y: y(d.created) }));
  const resolvedPts = trend.map((d, i) => ({ x: x(i), y: y(d.resolved) }));
  const createdLine = smooth(createdPts);
  const resolvedLine = smooth(resolvedPts);
  const baseline = PAD_T + innerH;
  const createdArea =
    createdPts.length > 0
      ? `${createdLine} L${createdPts[createdPts.length - 1].x},${baseline} L${createdPts[0].x},${baseline} Z`
      : "";

  // 3 subtle horizontal gridlines.
  const grids = [0, 0.5, 1].map((g) => PAD_T + innerH - g * innerH);

  return (
    <svg
      className="area-chart"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={`${createdLabel} / ${resolvedLabel}`}
    >
      <defs>
        <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--fill)" stopOpacity="0.34" />
          <stop offset="100%" stopColor="var(--fill)" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {grids.map((gy, i) => (
        <line key={i} x1="0" y1={gy} x2={W} y2={gy} className="area-grid" />
      ))}
      {createdArea && <path className="area-fill" d={createdArea} fill="url(#areaFill)" />}
      {createdLine && <path className="area-line-created" d={createdLine} fill="none" />}
      {resolvedLine && <path className="area-line-resolved" d={resolvedLine} fill="none" />}
      {/* Dot markers so even a single day of data reads clearly (not a flat line). */}
      {createdPts.map((p, i) =>
        trend[i].created > 0 ? (
          <circle key={`c${i}`} cx={p.x} cy={p.y} r="2.5" className="area-dot-created" />
        ) : null,
      )}
      {resolvedPts.map((p, i) =>
        trend[i].resolved > 0 ? (
          <circle key={`r${i}`} cx={p.x} cy={p.y} r="2.5" className="area-dot-resolved" />
        ) : null,
      )}
    </svg>
  );
}

export function SummaryScreen({ initialIssues }: { initialIssues: Issue[] }) {
  const { t, lang } = useLang();
  const issues = initialIssues;
  const [now] = useState(() => Date.now());

  // ---- AI summary: fetch once per language in an effect ----
  const [recap, setRecap] = useState<{ lang: string; text: string } | null>(null);
  useEffect(() => {
    let active = true;
    getAiSummary(lang).then((r) => {
      if (active) setRecap({ lang, text: r.text });
    });
    return () => {
      active = false;
    };
  }, [lang]);
  const recapLoading = recap?.lang !== lang;
  const recapText = recap?.lang === lang ? recap.text : "";

  const [exporting, setExporting] = useState(false);

  const a = useMemo(() => computeAnalytics(issues, [], now), [issues, now]);

  const open = useMemo(() => issues.filter((i) => i.status !== "done"), [issues]);
  const doneToday = useMemo(() => issues.filter((i) => i.status === "done"), [issues]);

  // By-type breakdown of open issues (for donut + bar list).
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    open.forEach((i) => (c[i.type] = (c[i.type] ?? 0) + 1));
    return c;
  }, [open]);
  const maxC = Math.max(1, ...Object.values(counts));
  const sortedTypes = useMemo(
    () => Object.keys(counts).sort((x, y) => counts[y] - counts[x]),
    [counts],
  );

  const donutSegments = useMemo(
    () =>
      sortedTypes.map((ty, i) => ({
        label: t(typeKey(ty)),
        value: counts[ty],
        color: DONUT_PALETTE[i % DONUT_PALETTE.length],
      })),
    [sortedTypes, counts, t],
  );
  const openTotal = open.length;

  // Repair-speed analytics from resolved_minutes.
  const resolved = useMemo(
    () => issues.filter((i) => i.status === "done" && i.resolved_minutes != null),
    [issues],
  );
  const fastest = resolved.length ? Math.min(...resolved.map((i) => i.resolved_minutes ?? 0)) : 0;

  function exportCsv() {
    const header = [
      "id",
      "property",
      "room",
      "type",
      "urgency",
      "status",
      "description",
      "created_at",
    ];
    const rows = issues.map((i) => [
      i.id,
      i.property,
      i.room,
      i.type,
      i.urgency,
      i.status,
      `"${(i.description || "").replace(/"/g, '""')}"`,
      i.created_at,
    ]);
    const csv = [header.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const el = document.createElement("a");
    el.href = url;
    el.download = "aurion-issues.csv";
    el.click();
    URL.revokeObjectURL(url);
  }

  async function exportPdf() {
    setExporting(true);
    try {
      const res = await fetch("/api/export");
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const el = document.createElement("a");
      el.href = url;
      el.download = "aurion-issues.pdf";
      el.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  const hasTrend = a.trend.some((d) => d.created > 0 || d.resolved > 0);

  return (
    <div className="screen summary-screen">
      <div className="aurora">
        <h1 className="title">{t("sumTitle")}</h1>
      </div>
      <p className="sub">
        {PROPS.length} {lang === "ar" ? "عقارات" : "properties"} ·{" "}
        {lang === "ar" ? "اليوم" : "today"}
      </p>

      <div className="stats sum-anim">
        <div className="stat glass open">
          <div className="num">{open.length}</div>
          <div className="lbl">{t("stOpen")}</div>
        </div>
        <div className="stat glass urgent">
          <div className="num">{a.urgent}</div>
          <div className="lbl">{t("stUrgent")}</div>
        </div>
        <div className="stat glass done">
          <div className="num">{doneToday.length}</div>
          <div className="lbl">{t("stDone")}</div>
        </div>
      </div>

      <div className="ai-recap glass sum-anim" style={{ marginTop: 14 }}>
        <div className="h">
          <Sparkles />
          {t("aiSummary")}
        </div>
        {recapText ? (
          <p>{recapText}</p>
        ) : recapLoading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <SkeletonBlock w="100%" h={15} />
            <SkeletonBlock w="82%" h={15} />
          </div>
        ) : (
          <p style={{ color: "var(--faint)" }}>{t("noData")}</p>
        )}
      </div>

      {openTotal > 0 && (
        <>
          <div className="section-h">{t("byType")}</div>
          <div className="card glass donut-card sum-anim">
            <Donut segments={donutSegments} total={openTotal} totalLabel={t("stOpen")} />
            <ul className="donut-legend">
              {donutSegments.map((s) => (
                <li key={s.label}>
                  <span className="dot" style={{ background: s.color }} aria-hidden />
                  <span className="lg-label">{s.label}</span>
                  <span className="lg-val mono">{s.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      {hasTrend && (
        <>
          <div className="section-h">{t("trend")}</div>
          <div className="card glass trend-card sum-anim">
            <div className="trend-legend">
              <span>
                <i className="sw sw-created" aria-hidden />
                {t("trendCreated")}
              </span>
              <span>
                <i className="sw sw-resolved" aria-hidden />
                {t("trendResolved")}
              </span>
            </div>
            <TrendChart
              trend={a.trend}
              createdLabel={t("trendCreated")}
              resolvedLabel={t("trendResolved")}
            />
          </div>
        </>
      )}

      {resolved.length > 0 && (
        <>
          <div className="section-h">{t("analyticsTitle")}</div>
          <div className="card glass analytics sum-anim">
            <div className="an">
              <div className="anv">{fmtDur(a.timeToFixOverall ?? 0, lang)}</div>
              <div className="anl">{t("avgTime")}</div>
            </div>
            <div className="an">
              <div className="anv">{fmtDur(fastest, lang)}</div>
              <div className="anl">{t("fastest")}</div>
            </div>
            <div className="an">
              <div className="anv">{a.doneTotal}</div>
              <div className="anl">{t("completed")}</div>
            </div>
          </div>
        </>
      )}

      <div className="section-h">{t("byType")}</div>
      <div className="card glass sum-anim">
        <div className="bars">
          {sortedTypes.map((ty) => (
            <div className="bar" key={ty}>
              <div className="bl">
                <span>{t(typeKey(ty))}</span>
                <span className="v mono">{counts[ty]}</span>
              </div>
              <div className="track">
                <div
                  className="fill"
                  style={{ width: `${Math.round((counts[ty] / maxC) * 100)}%` }}
                />
              </div>
            </div>
          ))}
          {sortedTypes.length === 0 && (
            <div style={{ color: "var(--faint)", fontSize: 14 }}>{t("noIssues")}</div>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gap: 10, marginTop: 18 }}>
        <button className="btn ghost" onClick={exportCsv}>
          <Download />
          {t("export")} · CSV
        </button>
        <button className="btn ghost" onClick={exportPdf} disabled={exporting}>
          <Download />
          {t("export")} · PDF
        </button>
      </div>
    </div>
  );
}
