import { describe, expect, it } from "vitest";
import type { Category } from "@/features/categories/schemas";
import { categoryDisplayName } from "@/features/categories/displayName";
import { categoryOptions } from "@/features/categories/options";
import { fakeT } from "@/test/fixtures";
import type { RecurringRule } from "./schemas";
import { frequencyLabel, ruleTitle } from "./ruleTitle";

const cat = (over: Partial<Category>): Category =>
  ({
    id: crypto.randomUUID(),
    name: null,
    name_key: null,
    type: "expense",
    parent_id: null,
    archived: false,
    sort_order: 0,
    ...over,
  }) as Category;

describe("display names", () => {
  it("prefers user names, then translated built-in keys", () => {
    expect(categoryDisplayName(fakeT, cat({ name: "Hobby" }))).toBe("Hobby");
    expect(categoryDisplayName(fakeT, cat({ name_key: "categories.builtin.rent" }))).toBe(
      "categories.builtin.rent",
    );
    expect(categoryDisplayName(fakeT, cat({}))).toBe("");
  });

  it("titles rules by payee, category or type", () => {
    const rule = { payee: null, type: "expense" } as RecurringRule;
    expect(ruleTitle(fakeT, { ...rule, payee: "Miete" }, undefined)).toBe("Miete");
    expect(ruleTitle(fakeT, rule, cat({ name: "Wohnen" }))).toBe("Wohnen");
    expect(ruleTitle(fakeT, rule, undefined)).toBe("transactions.types.expense");
    expect(frequencyLabel(fakeT, { frequency: "monthly", interval: 2 })).toBe(
      "recurring.every.monthly(count=2)",
    );
  });

  it("groups category options by parent and skips archived ones", () => {
    const parent = cat({ name: "Wohnen" });
    const child = cat({ name: "Strom", parent_id: parent.id });
    const archived = cat({ name: "Alt", archived: true });
    const income = cat({ name: "Gehalt", type: "income" });
    const options = categoryOptions(fakeT, [parent, child, archived, income], "expense");
    expect(options.map((o) => [o.label, o.group])).toEqual([
      ["Wohnen", "Wohnen"],
      ["Strom", "Wohnen"],
    ]);
    expect(categoryOptions(fakeT, [income]).map((o) => o.group)).toEqual([
      "categoryTypes.income · Gehalt",
    ]);
  });
});
