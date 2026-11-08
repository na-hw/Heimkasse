import { describe, expect, it } from "vitest";
import {
  budgetPeriod,
  inRange,
  lastMonthKeys,
  monthKeysBetween,
  monthRange,
  shiftBudgetPeriod,
  yearRange,
} from "./period";

describe("budgetPeriod", () => {
  it("uses calendar months for start day 1", () => {
    expect(budgetPeriod("2026-02-14", 1)).toEqual({ start: "2026-02-01", end: "2026-02-28" });
    expect(budgetPeriod("2024-02-29", 1)).toEqual({ start: "2024-02-01", end: "2024-02-29" });
  });

  it("starts on the configured day", () => {
    expect(budgetPeriod("2026-11-25", 25)).toEqual({ start: "2026-11-25", end: "2026-12-24" });
    expect(budgetPeriod("2026-11-24", 25)).toEqual({ start: "2026-10-25", end: "2026-11-24" });
  });

  it("crosses the year boundary", () => {
    expect(budgetPeriod("2027-01-10", 15)).toEqual({ start: "2026-12-15", end: "2027-01-14" });
  });

  it("shifts by whole periods", () => {
    const p = budgetPeriod("2026-11-08", 25);
    expect(shiftBudgetPeriod(p, -1, 25)).toEqual({ start: "2026-09-25", end: "2026-10-24" });
    expect(shiftBudgetPeriod(p, 2, 25)).toEqual({ start: "2026-12-25", end: "2027-01-24" });
  });
});

describe("month helpers", () => {
  it("builds month and year ranges", () => {
    expect(monthRange("2026-04")).toEqual({ start: "2026-04-01", end: "2026-04-30" });
    expect(yearRange(2026)).toEqual({ start: "2026-01-01", end: "2026-12-31" });
  });

  it("lists month keys", () => {
    expect(monthKeysBetween("2026-11-20", "2027-02-01")).toEqual([
      "2026-11",
      "2026-12",
      "2027-01",
      "2027-02",
    ]);
    expect(lastMonthKeys("2026-03-31", 3)).toEqual(["2026-01", "2026-02", "2026-03"]);
  });

  it("checks inclusive ranges", () => {
    const r = monthRange("2026-04");
    expect(inRange("2026-04-01", r)).toBe(true);
    expect(inRange("2026-04-30", r)).toBe(true);
    expect(inRange("2026-05-01", r)).toBe(false);
  });
});
