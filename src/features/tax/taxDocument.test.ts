import { describe, expect, it } from "vitest";
import { documentToCsv } from "@/lib/export/document";
import { fakeT, makeTransaction } from "@/test/fixtures";
import { taxReport } from "./report";
import { buildTaxDocument } from "./taxDocument";

describe("buildTaxDocument", () => {
  const report = taxReport(
    [
      makeTransaction({ tax_category: "donations", amount_cents: 5000, payee: "Rotes Kreuz" }),
      makeTransaction({ tax_category: "donations", amount_cents: 2000, date: "2026-05-02" }),
      makeTransaction({
        tax_category: "medical_costs",
        type: "income",
        amount_cents: 300,
        note: "Erstattung",
      }),
    ],
    2026,
  );
  const doc = buildTaxDocument(
    report,
    fakeT,
    { money: (c) => `${c}c`, date: (d) => d, year: "2026" },
    { footnote: "foot", language: "de", direction: "ltr" },
  );

  it("lists totals per category and a grand total", () => {
    const [totals, details] = doc.tables;
    expect(totals?.rows).toContainEqual(["taxCategories.donations", "2", "7000c"]);
    expect(totals?.rows.at(-1)).toEqual(["tax.total", "", `${report.total}c`]);
    expect(details?.rows).toHaveLength(3);
    expect(doc.subtitle).toBe("tax.yearLabel(year=2026)");
  });

  it("serialises German CSV amounts (refunds negative)", () => {
    const csv = documentToCsv(doc);
    expect(csv).toContain("taxCategories.donations;2;70,00");
    expect(csv).toContain("Rotes Kreuz");
    expect(csv).toContain("-3,00");
  });
});
