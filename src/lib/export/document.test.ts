import { describe, expect, it } from "vitest";
import {
  type ExportDocument,
  type ExportTable,
  documentToCsv,
  fileSlug,
  tableToCsv,
} from "./document";

const doc: ExportDocument & { tables: ExportTable[] } = {
  title: "Bericht",
  subtitle: "November 2026",
  direction: "ltr",
  language: "de",
  tables: [],
};
const table: ExportTable = {
  heading: "Ausgaben",
  columns: [{ header: "Kategorie" }, { header: "Betrag", align: "end" }],
  rows: [["Miete", "800,00 €"]],
  csvRows: [["Miete", "800,00"]],
};
doc.tables = [table];

describe("export document", () => {
  it("serializes all tables to CSV using machine values", () => {
    expect(documentToCsv(doc)).toBe(
      "﻿Bericht\r\nNovember 2026\r\n\r\nAusgaben\r\nKategorie;Betrag\r\nMiete;800,00\r\n",
    );
  });

  it("serializes a single table", () => {
    expect(tableToCsv(table)).toBe("﻿Kategorie;Betrag\r\nMiete;800,00\r\n");
  });

  it("builds file slugs", () => {
    expect(fileSlug("Bericht März 2026")).toBe("bericht-marz-2026");
    expect(fileSlug("گزارش ۱۴۰۵")).toBe("گزارش-۱۴۰۵");
    expect(fileSlug("!!!")).toBe("export");
  });
});
