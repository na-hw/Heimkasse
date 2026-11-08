import { describe, expect, it } from "vitest";
import type { Category } from "@/features/categories/schemas";
import { documentToCsv } from "@/lib/export/document";
import { fakeT, makeTransaction } from "@/test/fixtures";
import { buildReport } from "./report";
import { buildReportDocument } from "./reportDocument";

const GROCERIES = "22222222-2222-4222-8222-222222222222";
const SALARY = "33333333-3333-4333-8333-333333333333";
const category = (id: string, type: "income" | "expense", name: string) =>
  ({ id, type, name, name_key: null, parent_id: null, archived: false }) as Category;

describe("buildReportDocument", () => {
  const report = buildReport({
    period: { mode: "month", key: "2026-11" },
    transactions: [
      makeTransaction({ category_id: GROCERIES, amount_cents: 4510, date: "2026-11-03" }),
      makeTransaction({
        category_id: SALARY,
        type: "income",
        amount_cents: 250000,
        date: "2026-11-01",
      }),
    ],
    categories: [
      category(GROCERIES, "expense", "Lebensmittel"),
      category(SALARY, "income", "Gehalt"),
    ],
    accounts: [],
  });
  const doc = buildReportDocument(
    report,
    fakeT,
    {
      money: (c) => `${c}c`,
      percent: (r) => `${Math.round(r * 100)}%`,
      month: (k) => k,
      categoryName: (id) => (id === GROCERIES ? "Lebensmittel" : id === SALARY ? "Gehalt" : "?"),
    },
    { periodLabel: "November 2026", createdOn: "today", language: "de", direction: "ltr" },
  );

  it("contains summary and category tables with shares", () => {
    expect(doc.title).toBe("reports.title");
    expect(doc.subtitle).toBe("November 2026");
    const headings = doc.tables.map((t) => t.heading);
    expect(headings).toContain("reports.summaryTitle");
    expect(headings).toContain("reports.expensesByCategory");
    const expenses = doc.tables.find((t) => t.heading === "reports.expensesByCategory");
    expect(expenses?.rows[0]).toEqual(["Lebensmittel", "4510c", "100%"]);
    expect(expenses?.bars).toEqual([1]);
  });

  it("serialises to CSV", () => {
    const csv = documentToCsv(doc);
    expect(csv).toContain("Lebensmittel;45,10");
    expect(csv).toContain("Gehalt;2500,00");
  });
});
