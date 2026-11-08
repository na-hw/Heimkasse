import { describe, expect, it } from "vitest";
import { firstOnOrAfter, occurrenceAfter, occurrenceAt, occurrencesBetween, ruleStatus, type Schedule } from "./schedule";

const monthly = (start: string, extra: Partial<Schedule> = {}): Schedule => ({
  frequency: "monthly",
  interval: 1,
  start_date: start,
  end_date: null,
  ...extra,
});

describe("schedule", () => {
  it("keeps month-end anchors", () => {
    const s = monthly("2026-01-31");
    expect([0, 1, 2, 3].map((n) => occurrenceAt(s, n))).toEqual(["2026-01-31", "2026-02-28", "2026-03-31", "2026-04-30"]);
  });

  it("handles leap years", () => {
    expect(occurrenceAt(monthly("2027-01-31"), 13)).toBe("2028-02-29");
  });

  it("supports weekly, quarterly, yearly and intervals", () => {
    expect(occurrenceAt({ ...monthly("2026-11-02"), frequency: "weekly", interval: 2 }, 1)).toBe("2026-11-16");
    expect(occurrenceAt({ ...monthly("2026-01-15"), frequency: "quarterly" }, 2)).toBe("2026-07-15");
    expect(occurrenceAt({ ...monthly("2024-02-29"), frequency: "yearly" }, 1)).toBe("2025-02-28");
    expect(occurrenceAt(monthly("2026-01-10", { interval: 2 }), 3)).toBe("2026-07-10");
  });

  it("finds the first occurrence on or after a date", () => {
    const s = monthly("2026-01-31");
    expect(firstOnOrAfter(s, "2026-02-01")).toBe("2026-02-28");
    expect(firstOnOrAfter(s, "2026-02-28")).toBe("2026-02-28");
    expect(firstOnOrAfter(s, "2025-01-01")).toBe("2026-01-31");
    expect(firstOnOrAfter({ ...s, end_date: "2026-03-01" }, "2026-03-02")).toBeNull();
  });

  it("advances strictly after a date", () => {
    expect(occurrenceAfter(monthly("2026-01-31"), "2026-02-28")).toBe("2026-03-31");
    expect(occurrenceAfter(monthly("2026-01-01", { end_date: "2026-01-01" }), "2026-01-01")).toBe("2026-02-01");
  });

  it("lists occurrences in a range and respects the end date", () => {
    expect(occurrencesBetween(monthly("2026-01-15", { end_date: "2026-04-01" }), "2026-01-01", "2026-12-31")).toEqual([
      "2026-01-15",
      "2026-02-15",
      "2026-03-15",
    ]);
  });

  it("derives the rule status", () => {
    expect(ruleStatus({ paused: false, end_date: null, next_run_date: "2026-01-01" })).toBe("active");
    expect(ruleStatus({ paused: true, end_date: null, next_run_date: "2026-01-01" })).toBe("paused");
    expect(ruleStatus({ paused: false, end_date: "2025-12-31", next_run_date: "2026-01-01" })).toBe("ended");
  });

  it("is fast for long-running schedules", () => {
    const s = { ...monthly("1990-01-01"), frequency: "weekly" as const };
    expect(firstOnOrAfter(s, "2026-11-08")).toBe("2026-11-09");
  });
});
