"use client";

import { useEffect, useMemo, useState } from "react";
import { Sparkles, Download } from "lucide-react";
import { useLang } from "@/app/providers";
import { PROPS, TYPES } from "@/lib/i18n/dictionary";
import { fmtDur, type Issue } from "@/lib/issues";
import { getAiSummary } from "@/app/actions/summary";

const typeKey = (id: string) => TYPES.find((x) => x.id === id)?.k ?? "tOther";

export function SummaryScreen({ initialIssues }: { initialIssues: Issue[] }) {
  const { t, lang } = useLang();
  const issues = initialIssues;
  const [recap, setRecap] = useState<string>("");
  const [exporting, setExporting] = useState(false);

  const open = useMemo(() => issues.filter((i) => i.status !== "done"), [issues]);
  const urgent = open.filter((i) => i.urgency === "urgent");
  const doneToday = issues.filter((i) => i.status === "done");

  // By-type breakdown of open issues.
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    open.forEach((i) => (c[i.type] = (c[i.type] ?? 0) + 1));
    return c;
  }, [open]);
  const maxC = Math.max(1, ...Object.values(counts));
  const sortedTypes = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);

  // Repair-speed analytics from resolved_minutes.
  const resolved = issues.filter((i) => i.status === "done" && i.resolved_minutes != null);
  const avg = resolved.length
    ? Math.round(resolved.reduce((s, i) => s + (i.resolved_minutes ?? 0), 0) / resolved.length)
    : 0;
  const fastest = resolved.length ? Math.min(...resolved.map((i) => i.resolved_minutes ?? 0)) : 0;

  useEffect(() => {
    let active = true;
    getAiSummary(lang).then((r) => {
      if (active) setRecap(r.text);
    });
    return () => {
      active = false;
    };
  }, [lang]);

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
    const a = document.createElement("a");
    a.href = url;
    a.download = "aurion-issues.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function exportPdf() {
    setExporting(true);
    try {
      const res = await fetch("/api/export");
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "aurion-issues.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="screen">
      <div className="aurora">
        <h1 className="title">{t("sumTitle")}</h1>
      </div>
      <p className="sub">
        {PROPS.length} {lang === "ar" ? "عقارات" : "properties"} ·{" "}
        {lang === "ar" ? "اليوم" : "today"}
      </p>

      <div className="stats">
        <div className="stat glass open">
          <div className="num">{open.length}</div>
          <div className="lbl">{t("stOpen")}</div>
        </div>
        <div className="stat glass urgent">
          <div className="num">{urgent.length}</div>
          <div className="lbl">{t("stUrgent")}</div>
        </div>
        <div className="stat glass done">
          <div className="num">{doneToday.length}</div>
          <div className="lbl">{t("stDone")}</div>
        </div>
      </div>

      <div className="ai-recap glass" style={{ marginTop: 14 }}>
        <div className="h">
          <Sparkles />
          {t("aiSummary")}
        </div>
        <p>{recap || "…"}</p>
      </div>

      {resolved.length > 0 && (
        <>
          <div className="section-h">{t("analyticsTitle")}</div>
          <div className="card glass analytics">
            <div className="an">
              <div className="anv">{fmtDur(avg, lang)}</div>
              <div className="anl">{t("avgTime")}</div>
            </div>
            <div className="an">
              <div className="anv">{fmtDur(fastest, lang)}</div>
              <div className="anl">{t("fastest")}</div>
            </div>
            <div className="an">
              <div className="anv">{resolved.length}</div>
              <div className="anl">{t("completed")}</div>
            </div>
          </div>
        </>
      )}

      <div className="section-h">{t("byType")}</div>
      <div className="card glass">
        <div className="bars">
          {sortedTypes.map((ty) => (
            <div className="bar" key={ty}>
              <div className="bl">
                <span>{t(typeKey(ty))}</span>
                <span className="v">{counts[ty]}</span>
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
