import { describe, expect, it } from "vitest";
import {
  centsToMillicents,
  consumptionPeriods,
  costCents,
  meterStats,
  neighbours,
} from "./consumption";

const r = (id: string, date: string, value: number) => ({ id, date, value });
const readings = [r("c", "2026-01-01", 1500), r("a", "2025-01-01", 0), r("b", "2025-07-01", 700)];

describe("meter consumption", () => {
  it("converts prices and costs", () => {
    expect(centsToMillicents(32.15)).toBe(32150);
    expect(costCents(100, 32150)).toBe(3215);
  });

  it("computes consumption per reading period", () => {
    expect(consumptionPeriods(readings, 30000)).toEqual([
      {
        from: "2025-01-01",
        to: "2025-07-01",
        days: 181,
        amount: 700,
        perDay: 700 / 181,
        costCents: 21000,
      },
      {
        from: "2025-07-01",
        to: "2026-01-01",
        days: 184,
        amount: 800,
        perDay: 800 / 184,
        costCents: 24000,
      },
    ]);
  });

  it("projects the yearly consumption and cost", () => {
    const stats = meterStats(readings, 30000);
    expect(stats.latest?.value).toBe(1500);
    expect(stats.perDay).toBeCloseTo(1500 / 365);
    expect(stats.yearly).toBeCloseTo(1500);
    expect(stats.yearlyCostCents).toBe(45000);
  });

  it("uses the reading closest to one year before the latest", () => {
    const stats = meterStats([...readings, r("d", "2026-07-01", 2100)], 0);
    // base = 2025-07-01 (700) → 1400 in 365 days
    expect(stats.yearly).toBeCloseTo(1400);
  });

  it("needs two readings", () => {
    expect(meterStats([r("a", "2026-01-01", 5)], 1000)).toEqual({
      latest: r("a", "2026-01-01", 5),
      perDay: null,
      yearly: null,
      yearlyCostCents: null,
    });
  });

  it("finds neighbouring readings for validation", () => {
    expect(neighbours(readings, "2025-08-01")).toEqual({
      previous: r("b", "2025-07-01", 700),
      next: r("c", "2026-01-01", 1500),
    });
    expect(neighbours(readings, "2025-07-01", "b").previous?.id).toBe("a");
  });
});
