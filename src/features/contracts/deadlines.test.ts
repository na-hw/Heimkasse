import { describe, expect, it } from "vitest";
import {
  type ContractTerms,
  monthlyCents,
  nextDeadline,
  noticeDeadline,
  pendingReminders,
  reminderStage,
} from "./deadlines";

const terms = (over: Partial<ContractTerms>): ContractTerms => ({
  start_date: "2025-01-01",
  minimum_term_months: 24,
  notice_period_value: 3,
  notice_period_unit: "months",
  auto_renew_months: 12,
  ...over,
});

describe("noticeDeadline", () => {
  it("handles months, weeks and days", () => {
    expect(noticeDeadline("2026-12-31", 3, "months")).toBe("2026-09-30");
    expect(noticeDeadline("2026-03-31", 1, "months")).toBe("2026-02-28");
    expect(noticeDeadline("2026-12-31", 2, "weeks")).toBe("2026-12-17");
    expect(noticeDeadline("2026-12-31", 30, "days")).toBe("2026-12-01");
  });
});

describe("nextDeadline", () => {
  it("is in the minimum term before the first deadline", () => {
    expect(nextDeadline(terms({}), "2026-05-01")).toEqual({
      kind: "fixed",
      termEnd: "2026-12-31",
      deadline: "2026-09-30",
      daysLeft: 152,
    });
  });

  it("includes the deadline day itself", () => {
    expect(nextDeadline(terms({}), "2026-09-30")).toMatchObject({
      deadline: "2026-09-30",
      daysLeft: 0,
    });
  });

  it("moves to the next renewal after a missed deadline", () => {
    expect(nextDeadline(terms({}), "2026-10-01")).toMatchObject({
      kind: "renewing",
      termEnd: "2027-12-31",
      deadline: "2027-09-30",
    });
  });

  it("becomes open-ended without auto renewal", () => {
    expect(
      nextDeadline(terms({ auto_renew_months: 0, notice_period_value: 1 }), "2026-12-05"),
    ).toEqual({ kind: "open", earliestEnd: "2027-01-05" });
  });

  it("never ends before the minimum term when open", () => {
    expect(nextDeadline(terms({ auto_renew_months: 0 }), "2026-10-15")).toEqual({
      kind: "open",
      earliestEnd: "2027-01-15",
    });
    expect(nextDeadline(terms({ minimum_term_months: 0 }), "2026-11-08")).toEqual({
      kind: "open",
      earliestEnd: "2027-02-08",
    });
  });

  it("anchors month ends to the start date", () => {
    expect(
      nextDeadline(
        terms({ start_date: "2026-01-31", minimum_term_months: 1, notice_period_value: 0 }),
        "2026-02-01",
      ),
    ).toMatchObject({ termEnd: "2026-02-27" });
  });
});

describe("monthlyCents", () => {
  it("converts billing frequencies", () => {
    expect(monthlyCents(12000, "yearly")).toBe(1000);
    expect(monthlyCents(3000, "quarterly")).toBe(1000);
    expect(monthlyCents(1200, "weekly")).toBe(5200);
  });
});

describe("reminders", () => {
  it("maps days left to stages", () => {
    expect(reminderStage(31)).toBeNull();
    expect(reminderStage(30)).toBe(30);
    expect(reminderStage(14)).toBe(14);
    expect(reminderStage(2)).toBe(3);
    expect(reminderStage(-1)).toBeNull();
  });

  it("reminds once per stage and deadline", () => {
    const info = { kind: "fixed" as const, termEnd: "x", deadline: "2026-12-01", daysLeft: 12 };
    const first = pendingReminders([{ id: "c1", info }], {});
    expect(first.due).toEqual([
      { contractId: "c1", deadline: "2026-12-01", daysLeft: 12, stage: 14 },
    ]);
    expect(pendingReminders([{ id: "c1", info }], first.next).due).toEqual([]);
    const later = pendingReminders([{ id: "c1", info: { ...info, daysLeft: 2 } }], first.next);
    expect(later.due.map((d) => d.stage)).toEqual([3]);
  });

  it("skips open-ended contracts and drops stale entries", () => {
    const { due, next } = pendingReminders(
      [{ id: "c1", info: { kind: "open", earliestEnd: "2027-01-01" } }],
      { "c1:2025-01-01": 3 },
    );
    expect(due).toEqual([]);
    expect(next).toEqual({});
  });
});
