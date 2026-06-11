"use client";

// ============================================================
// AnalyticsPanel — the manager's north-star view (admin only).
// AI manager brief + time-to-fix, SLA, repeat offenders, 14-day
// trend, by-property / by-category, and a non-punitive leaderboard.
// ============================================================
import { useEffect, useMemo, useState } from "react";
import { Sparkles, AlertTriangle, Download } from "lucide-react";
import { useLang } from "@/app/providers";
import { propMeta, TYPES } from "@/lib/i18n/dictionary";
import { fmtDur, type Issue } from "@/lib/issues";
import { computeAnalytics } from "@/lib/analytics";
import { getAiSummary } from "@/app/actions/summary";
import type { ProfileLite } from "@/lib/data";

const typeKey = (id: string) => TYPES.find((x) => x.id === id)?.k ?? "tOther";
const dash = (m: number | null, lang: "en" | "ar") => (m == null ? "—" : fmtDur(m, lang));

export function AnalyticsPanel({ issues, profiles }: { issues: Issue[]; profiles: ProfileLite[] }) {
  const { t, lang } = useLang();
  // Pin "now" once at mount so analytics stay stable across re-renders
  // (calling Date.now() directly in render is impure / disallowed).
  const [now] = useState(() => Date.now());
  const [brief, setBrief] = useState<string>("");
  // Loading is keyed to the language we last requested a brief for, so a
  // language switch shows the shimmer again — computed in render, not via
  // a synchronous setState inside the effect.
  const [loadedLang, setLoadedLang] = useState<string | null>(null);
  const briefLoading = loadedLang !== lang;

  const a = useMemo(() => computeAnalytics(issues, profiles, now, 14), [issues, profiles, now]);

  useEffect(() => {
    let active = true;
    getAiSummary(lang).then((r) => {
      if (!active) return;
      setBrief(r.text);
      setLoadedLang(lang);
    });
    return () => {
      active = false;
    };
  }, [lang]);

  const maxTrend = Math.max(1, ...a.trend.map((d) => Math.max(d.created, d.resolved)));

  const propLabel = (code: string) => propMeta(code)?.[lang] ?? code;

  return (
    <>
      {/* AI manager brief */}
      <div className="ai-recap glass">
        <div className="h">
          <Sparkles />
          {t("managerBrief")}
        </div>
        {briefLoading ? (
          <p className="skeleton" style={{ height: 18, borderRadius: 8, color: "transparent" }}>
            …
          </p>
        ) : (
          <p>{brief || t("noData")}</p>
        )}
      </div>

      {/* North-star: time-to-fix */}
      <div className="section-h">{t("timeToFix")}</div>
      <div className="stat glass" style={{ padding: "26px 16px" }}>
        <div className="num" style={{ fontSize: 44, fontFamily: "var(--mono, ui-monospace)" }}>
          {dash(a.timeToFixOverall, lang)}
        </div>
        <div className="lbl">{t("timeToFix")}</div>
      </div>

      <div className="stats" style={{ marginTop: 11 }}>
        <div className="stat glass open">
          <div className="num">{a.open}</div>
          <div className="lbl">{t("stOpen")}</div>
        </div>
        <div className="stat glass urgent">
          <div className="num">{a.urgent}</div>
          <div className="lbl">{t("stUrgent")}</div>
        </div>
        <div className="stat glass done">
          <div className="num">{a.overdue}</div>
          <div className="lbl">{t("overdue")}</div>
        </div>
      </div>

      {/* SLA */}
      {a.withinDeadlinePct != null && (
        <div className="ai-recap glass" style={{ marginTop: 11 }}>
          <p style={{ margin: 0 }}>
            <b style={{ fontSize: 22 }}>{a.withinDeadlinePct}%</b> {t("slaWithin")}
          </p>
        </div>
      )}

      {/* Repeat offenders */}
      {a.repeatOffenders.length > 0 && (
        <>
          <div className="section-h">{t("repeatOffenders")}</div>
          <div style={{ display: "grid", gap: 9 }}>
            {a.repeatOffenders.map((r, idx) => (
              <div
                key={`${r.property}|${r.room}|${r.category ?? ""}|${idx}`}
                className="glass"
                style={{
                  display: "flex",
                  gap: 11,
                  padding: "13px 15px",
                  borderRadius: 14,
                  borderInlineStart: "3px solid var(--u-soon)",
                  alignItems: "flex-start",
                }}
              >
                <AlertTriangle
                  style={{
                    width: 18,
                    height: 18,
                    color: "var(--u-soon)",
                    flex: "none",
                    marginTop: 2,
                  }}
                />
                <div style={{ fontSize: 14, lineHeight: 1.45 }}>
                  <b>
                    {propLabel(r.property)} {r.room}
                  </b>
                  {r.category ? ` · ${t(typeKey(r.category))}` : ""} ·
                  <span style={{ color: "var(--dim)" }}>
                    {" "}
                    {lang === "ar" ? `${r.count}× خلال 60 يومًا` : `${r.count}× in 60 days`}
                  </span>{" "}
                  <span style={{ color: "var(--faint)" }}>→ {t("needsPermfix")}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Trend */}
      <div className="section-h">{t("trend")}</div>
      <div className="card glass" style={{ borderRadius: 16, padding: 16 }}>
        <div
          style={{
            display: "flex",
            gap: 14,
            marginBottom: 12,
            fontSize: 12,
            fontWeight: 600,
            color: "var(--faint)",
          }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 9, height: 9, borderRadius: 3, background: "var(--accent)" }} />
            {t("trendCreated")}
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 9, height: 9, borderRadius: 3, background: "var(--u-wait)" }} />
            {t("trendResolved")}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 90 }}>
          {a.trend.map((d) => (
            <div
              key={d.date}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "center",
                gap: 2,
                height: "100%",
              }}
              title={`${d.date}: +${d.created} / ✓${d.resolved}`}
            >
              <div
                style={{
                  width: "45%",
                  height: `${Math.round((d.created / maxTrend) * 100)}%`,
                  minHeight: d.created ? 3 : 0,
                  background: "var(--accent)",
                  borderRadius: 3,
                }}
              />
              <div
                style={{
                  width: "45%",
                  height: `${Math.round((d.resolved / maxTrend) * 100)}%`,
                  minHeight: d.resolved ? 3 : 0,
                  background: "var(--u-wait)",
                  borderRadius: 3,
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* By property */}
      {a.byProperty.length > 0 && (
        <>
          <div className="section-h">{t("byProperty")}</div>
          <div className="slist glass">
            {a.byProperty.map((b) => (
              <div className="emp" key={b.key}>
                <div className="ei">
                  <div className="en">{propLabel(b.key)}</div>
                </div>
                <span className="anv" style={{ fontSize: 16 }}>
                  {dash(b.avgMinutes, lang)}
                </span>
                <span className="rolebadge staff">{b.count}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* By category */}
      {a.byCategory.length > 0 && (
        <>
          <div className="section-h">{t("byCategory")}</div>
          <div className="slist glass">
            {a.byCategory.map((b) => (
              <div className="emp" key={b.key}>
                <div className="ei">
                  <div className="en">{t(typeKey(b.key))}</div>
                </div>
                <span className="anv" style={{ fontSize: 16 }}>
                  {dash(b.avgMinutes, lang)}
                </span>
                <span className="rolebadge staff">{b.count}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Leaderboard */}
      {a.leaderboard.length > 0 && (
        <>
          <div className="section-h">{t("leaderboard")}</div>
          <div className="slist glass">
            {a.leaderboard.map((row) => (
              <div className="emp" key={row.id}>
                <span className="eav">{(row.name[0] ?? "?").toUpperCase()}</span>
                <div className="ei">
                  <div className="en">{row.name}</div>
                  <div className="eu">
                    {row.resolved} {t("jobsResolved")} · {dash(row.avgMinutes, lang)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <a
        className="btn ghost"
        href="/api/export-week"
        download
        style={{ marginTop: 18, textDecoration: "none" }}
      >
        <Download />
        {t("downloadPdf")}
      </a>
    </>
  );
}
