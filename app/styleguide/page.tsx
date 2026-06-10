"use client";

// ============================================================
// /styleguide — a living verification surface for the design system.
// Shows tokens, buttons, nav, pills, a sheet, and a live LiquidTabs.
// Includes quick lang + theme toggles to eyeball RTL + theming.
// ============================================================
import { useState } from "react";
import { LiquidTabs } from "@/components/LiquidTabs";
import { Sheet } from "@/components/Sheet";
import { BottomNav } from "@/components/BottomNav";
import { navItemsFor } from "@/components/nav-items";
import { useLang, useTheme } from "@/app/providers";
import type { Lang } from "@/lib/i18n/dictionary";
import type { Theme } from "@/lib/prefs";

const TOKENS = [
  "canvas",
  "card",
  "card2",
  "raise",
  "text",
  "dim",
  "faint",
  "hair",
  "border",
  "accent",
  "fill",
  "fill-2",
  "fill-text",
  "u-urgent",
  "u-soon",
  "u-wait",
];

export default function StyleguidePage() {
  const { lang, setLang, dir } = useLang();
  const { theme, setTheme } = useTheme();
  const [tab, setTab] = useState("reports");
  const [seg2, setSeg2] = useState("made");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [navActive, setNavActive] = useState("reports");

  const langs: Lang[] = ["ar", "en"];
  const themes: Theme[] = ["auto", "light", "dark"];

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "var(--canvas)",
        color: "var(--text)",
        padding: "28px 22px 160px",
      }}
    >
      <div style={{ maxWidth: 780, margin: "0 auto" }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-.03em" }}>
          Aurion — Style Guide
        </h1>
        <p style={{ color: "var(--dim)", margin: "6px 0 22px" }}>
          dir=<b>{dir}</b> · lang=<b>{lang}</b> · theme=<b>{theme}</b>
        </p>

        {/* Quick toggles */}
        <Section title="Language & Theme">
          <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
            <div className="seg">
              {langs.map((l) => (
                <button key={l} className={lang === l ? "on" : ""} onClick={() => setLang(l)}>
                  {l === "ar" ? "العربية" : "English"}
                </button>
              ))}
            </div>
            <div className="seg">
              {themes.map((th) => (
                <button key={th} className={theme === th ? "on" : ""} onClick={() => setTheme(th)}>
                  {th}
                </button>
              ))}
            </div>
          </div>
        </Section>

        {/* Color tokens */}
        <Section title="Color tokens">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))",
              gap: 10,
            }}
          >
            {TOKENS.map((token) => (
              <div key={token}>
                <div
                  style={{
                    height: 48,
                    borderRadius: 10,
                    background: `var(--${token})`,
                    border: "1px solid var(--border)",
                  }}
                />
                <div style={{ fontSize: 11, color: "var(--dim)", marginTop: 5 }}>--{token}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* LiquidTabs — the centerpiece */}
        <Section title="LiquidTabs (liquid-glass slider)">
          <p style={{ color: "var(--dim)", fontSize: 14, marginBottom: 12 }}>
            Click between segments — the frosted thumb slides with spring physics and refracts the
            gradient behind it (Chrome/Edge). Safari shows a frosted fallback.
          </p>
          {/* A colorful backdrop so the refraction is visible */}
          <div
            style={{
              padding: 18,
              borderRadius: 20,
              background: "linear-gradient(120deg,#c8442a,#a9791e,#2c8a57,#3E7CB1,#7A6BA8)",
            }}
          >
            <LiquidTabs
              aria-label="Demo tabs"
              segments={[
                { id: "reports", label: "Reports" },
                { id: "summary", label: "Summary" },
                { id: "settings", label: "Settings" },
              ]}
              value={tab}
              onChange={setTab}
            />
          </div>
          <div style={{ height: 14 }} />
          <LiquidTabs
            aria-label="Two-segment tabs"
            segments={[
              { id: "made", label: "Reported by me" },
              { id: "took", label: "Assigned to me" },
            ]}
            value={seg2}
            onChange={setSeg2}
          />
        </Section>

        {/* Buttons */}
        <Section title="Buttons">
          <div style={{ display: "grid", gap: 12, maxWidth: 320 }}>
            <button className="btn gold">Gold button</button>
            <button className="btn ghost">Ghost button</button>
            <button className="btn gold" disabled>
              Disabled
            </button>
          </div>
        </Section>

        {/* Status + urgency pills */}
        <Section title="Status & urgency pills">
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <span className="statuspill open">New</span>
            <span className="statuspill progress">In progress</span>
            <span className="statuspill done">Done</span>
          </div>
          <div style={{ height: 12 }} />
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <UrgBadge token="u-urgent" label="Urgent" />
            <UrgBadge token="u-soon" label="Soon" />
            <UrgBadge token="u-wait" label="Can wait" />
            <span className="due">⏱ Due today</span>
            <span className="due over">⏱ Overdue</span>
          </div>
        </Section>

        {/* Glass card */}
        <Section title="Glass card">
          <div className="glass" style={{ borderRadius: 18, padding: 18 }}>
            <div style={{ fontWeight: 700, fontSize: 17 }}>Al-Salam · 305</div>
            <div style={{ color: "var(--dim)", fontSize: 14, marginTop: 4 }}>
              AC not cooling, guest is complaining about the heat.
            </div>
          </div>
        </Section>

        {/* Sheet */}
        <Section title="Bottom sheet">
          <button
            className="btn ghost"
            style={{ maxWidth: 220 }}
            onClick={() => setSheetOpen(true)}
          >
            Open sheet
          </button>
        </Section>

        {/* Bottom nav (also fixed at the bottom of the viewport) */}
        <Section title="Bottom nav (mobile pill)">
          <p style={{ color: "var(--dim)", fontSize: 14 }}>
            Shown floating at the bottom of this page. Resize below 500px → labels hide (icons
            only). At ≥860px it is hidden in favor of the sidebar.
          </p>
        </Section>
      </div>

      <BottomNav
        items={navItemsFor("admin")}
        active={navActive}
        onNavigate={setNavActive}
        onAdd={() => setNavActive("reports")}
      />

      <Sheet
        open={sheetOpen}
        enter={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Example sheet"
      >
        <p style={{ fontSize: 16, lineHeight: 1.55, color: "var(--text)" }}>
          This is a bottom sheet. On desktop it centers and pops in; on mobile it slides up from the
          bottom.
        </p>
        <div style={{ height: 16 }} />
        <button className="btn gold" onClick={() => setSheetOpen(false)}>
          Close
        </button>
      </Sheet>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginTop: 30 }}>
      <div className="section-h" style={{ margin: "0 0 12px" }}>
        {title}
      </div>
      {children}
    </section>
  );
}

function UrgBadge({ token, label }: { token: string; label: string }) {
  return (
    <span
      className="ubadge"
      style={{
        color: `var(--${token})`,
        background: `color-mix(in srgb, var(--${token}) 16%, transparent)`,
      }}
    >
      {label}
    </span>
  );
}
