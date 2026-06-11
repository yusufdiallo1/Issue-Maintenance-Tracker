import { describe, it, expect } from "vitest";
import { fmtDur, tagDisplay } from "@/lib/issues";

describe("fmtDur", () => {
  it("formats minutes / hours (en)", () => {
    expect(fmtDur(45, "en")).toBe("45m");
    expect(fmtDur(120, "en")).toBe("2h");
    expect(fmtDur(185, "en")).toBe("3h 5m");
  });
  it("formats in Arabic units", () => {
    expect(fmtDur(45, "ar")).toBe("45 د");
    expect(fmtDur(120, "ar")).toBe("2 س");
  });
});

describe("tagDisplay", () => {
  const t = ((k: string) => `T:${k}`) as any; // eslint-disable-line @typescript-eslint/no-explicit-any
  it("strips the custom: prefix", () => {
    expect(tagDisplay("custom:Needs Electrician", t)).toBe("Needs Electrician");
  });
  it("maps a known tag id through the dictionary", () => {
    expect(tagDisplay("safety", t)).toMatch(/^T:/);
  });
});
