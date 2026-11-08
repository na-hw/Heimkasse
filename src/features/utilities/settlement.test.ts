import { describe, expect, it } from "vitest";
import type { Category } from "@/features/categories/schemas";
import {
  UTILITIES_CATEGORY_KEY,
  bookedUtilities,
  prepaidTotal,
  settlementResult,
  suggestedPrepayment,
} from "./settlement";

describe("utility settlement", () => {
  it("compares prepayments with actual costs", () => {
    expect(prepaidTotal(200_00)).toBe(2400_00);
    expect(settlementResult(200_00, 2250_00)).toBe(150_00);
    expect(settlementResult(200_00, 2700_00)).toBe(-300_00);
  });

  it("suggests a prepayment rounded up to whole euros", () => {
    expect(suggestedPrepayment(2700_00)).toBe(225_00);
    expect(suggestedPrepayment(2701_00)).toBe(226_00);
  });

  it("sums bookings in the Nebenkosten category for a year", () => {
    const category = (id: string, name_key: string | null, parent_id: string | null = null) =>
      ({ id, name_key, parent_id }) as Category;
    const categories = [
      category("u", UTILITIES_CATEGORY_KEY),
      category("sub", null, "u"),
      category("x", null),
    ];
    const tx = (category_id: string, date: string, amount_cents = 100) => ({
      type: "expense" as const,
      amount_cents,
      date,
      category_id,
      account_id: "a",
      transfer_account_id: null,
    });
    expect(
      bookedUtilities(
        [
          tx("u", "2026-01-05"),
          tx("sub", "2026-06-05"),
          tx("x", "2026-02-01"),
          tx("u", "2025-12-31"),
        ],
        categories,
        2026,
      ),
    ).toBe(200);
  });
});
