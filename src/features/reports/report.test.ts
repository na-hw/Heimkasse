import { describe, expect, it } from "vitest";
import { buildReport, reportPeriodFor, reportRange, shiftReportPeriod } from "./report";

describe("report periods", () => {
  it("derives and shifts month and year periods", () => {
    expect(reportPeriodFor("month", "2026-11-08")).toEqual({ mode: "month", key: "2026-11" });
    expect(reportPeriodFor("year", "2026-11-08")).toEqual({ mode: "year", key: "2026" });
    expect(shiftReportPeriod({ mode: "month", key: "2026-01" }, -1)).toEqual({
      mode: "month",
      key: "2025-12",
    });
    expect(shiftReportPeriod({ mode: "month", key: "2026-12" }, 1).key).toBe("2027-01");
    expect(shiftReportPeriod({ mode: "year", key: "2026" }, -2).key).toBe("2024");
    expect(reportRange({ mode: "year", key: "2026" })).toEqual({
      start: "2026-01-01",
      end: "2026-12-31",
    });
  });

  it("covers the 12 months ending with the period", () => {
    const report = buildReport({
      period: { mode: "year", key: "2026" },
      transactions: [],
      categories: [],
      accounts: [],
    });
    expect(report.months[0]).toBe("2026-01");
    expect(report.months).toHaveLength(12);
    expect(report.totals.savingsRate).toBeNull();
  });
});
