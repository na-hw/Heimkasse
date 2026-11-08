import { describe, expect, it } from "vitest";
import { goalProgress } from "./projection";

const c = (amount_cents: number, date: string) => ({ amount_cents, date });
const today = "2026-11-08";

describe("goalProgress", () => {
  it("projects completion from the last 3 months", () => {
    const p = goalProgress(
      { target_cents: 3000_00, target_date: null },
      [
        c(500_00, "2026-01-01"),
        c(100_00, "2026-09-10"),
        c(100_00, "2026-10-10"),
        c(100_00, "2026-11-01"),
      ],
      today,
    );
    expect(p.saved).toBe(800_00);
    expect(p.remaining).toBe(2200_00);
    expect(p.averageMonthly).toBe(100_00);
    expect(p.projectedDate).toBe("2028-09-08");
    expect(p.requiredMonthly).toBeNull();
  });

  it("computes the required monthly amount for a target date", () => {
    const p = goalProgress({ target_cents: 1200_00, target_date: "2027-11-08" }, [], today);
    expect(p.projectedDate).toBeNull();
    expect(p.requiredMonthly).toBe(100_00);
  });

  it("subtracts withdrawals and detects reached and overdue goals", () => {
    expect(
      goalProgress({ target_cents: 100_00, target_date: null }, [c(150_00, "2026-11-01")], today),
    ).toMatchObject({
      reached: true,
      ratio: 1,
      remaining: 0,
    });
    expect(
      goalProgress(
        { target_cents: 100_00, target_date: "2026-10-01" },
        [c(80_00, "2026-09-01"), c(-30_00, "2026-10-01")],
        today,
      ),
    ).toMatchObject({ saved: 50_00, overdue: true, requiredMonthly: null });
  });
});
