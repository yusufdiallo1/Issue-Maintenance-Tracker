import { describe, it, expect } from "vitest";
import { computeAnalytics } from "@/lib/analytics";
import type { Issue } from "@/lib/issues";

const NOW = Date.parse("2026-06-11T12:00:00Z");
const day = 86_400_000;

function mk(p: Partial<Issue>): Issue {
  return {
    id: Math.floor(Math.random() * 1e9),
    property: "al_aqeeq",
    room: "204",
    type: "plumbing",
    urgency: "soon",
    status: "open",
    description: "",
    description_ar: "",
    tags: [],
    photo_path: null,
    photo_paths: [],
    reported_by: "u1",
    taken_by: null,
    deadline: null,
    resolved_minutes: null,
    created_at: new Date(NOW - day).toISOString(),
    resolved_at: null,
    ...p,
  } as Issue;
}

describe("computeAnalytics", () => {
  it("counts open / urgent (excludes done)", () => {
    const a = computeAnalytics(
      [
        mk({ status: "open", urgency: "urgent" }),
        mk({ status: "progress", urgency: "soon" }),
        mk({ status: "done", urgency: "urgent", resolved_minutes: 30 }),
      ],
      [],
      NOW,
    );
    expect(a.open).toBe(2);
    expect(a.urgent).toBe(1); // the done-urgent is excluded
    expect(a.doneTotal).toBe(1);
  });

  it("averages time-to-fix from resolved_minutes", () => {
    const a = computeAnalytics(
      [mk({ status: "done", resolved_minutes: 60 }), mk({ status: "done", resolved_minutes: 120 })],
      [],
      NOW,
    );
    expect(a.timeToFixOverall).toBe(90);
  });

  it("flags a repeat offender at >=3 in 60 days", () => {
    const issues = [
      mk({ property: "al_aqeeq", room: "204", type: "plumbing" }),
      mk({ property: "al_aqeeq", room: "204", type: "plumbing" }),
      mk({ property: "al_aqeeq", room: "204", type: "plumbing" }),
    ];
    const a = computeAnalytics(issues, [], NOW);
    const combo = a.repeatOffenders.find((r) => r.room === "204" && r.category === "plumbing");
    expect(combo?.count).toBe(3);
  });

  it("does NOT flag fewer than 3", () => {
    const a = computeAnalytics([mk({ room: "101" }), mk({ room: "101" })], [], NOW);
    expect(a.repeatOffenders.find((r) => r.room === "101")).toBeUndefined();
  });

  it("builds a trend window of the requested length", () => {
    const a = computeAnalytics([mk({})], [], NOW, 14);
    expect(a.trend).toHaveLength(14);
  });
});
