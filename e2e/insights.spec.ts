import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { addExpense, createAccount, useGerman } from "./helpers";

test.describe("dashboard, budgets & reports", () => {
  test.beforeEach(async ({ page }) => {
    await useGerman(page);
    await createAccount(page, "Giro", "1.000");
    await page.goto("/transactions/");
    await addExpense(page, "300", "REWE", "Lebensmittel");
  });

  test("shows key figures and top categories on the dashboard", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Gesamtsaldo")).toBeVisible();
    await expect(page.locator("#main")).toContainText("700,00");
    const top = page.getByRole("region", { name: "Top-Ausgabenkategorien" });
    await top.getByRole("tab", { name: "Tabelle" }).click();
    await expect(top.getByRole("row", { name: /Lebensmittel/ })).toContainText("300,00");
  });

  test("creates a budget and alerts at the threshold", async ({ page }) => {
    await page.goto("/budgets/");
    await page.getByRole("button", { name: "Budget anlegen" }).first().click();
    const dialog = page.getByRole("dialog", { name: "Neues Budget" });
    await dialog.getByRole("combobox", { name: "Kategorie" }).click();
    await page.getByRole("option", { name: "Lebensmittel", exact: true }).click();
    await dialog.getByLabel("Monatliches Limit").fill("350");
    await page.getByRole("button", { name: "Anlegen" }).click();
    await expect(dialog).toBeHidden();

    const row = page.locator("#main").getByRole("listitem").filter({ hasText: "Lebensmittel" });
    await expect(row).toContainText("300,00 € von 350,00 €");
    await expect(row).toContainText("Schwelle erreicht");
    await expect(page.getByText("Budget „Lebensmittel“: 86 % verbraucht").first()).toBeVisible();

    // Exceeding the budget raises a second alert.
    await page.goto("/transactions/");
    await addExpense(page, "60", "Markt", "Lebensmittel");
    await expect(page.getByText("Budget „Lebensmittel“ überschritten").first()).toBeVisible();
    await page.goto("/budgets/");
    await expect(row).toContainText("Überschritten");
  });

  test("reports by category with a table view and CSV export", async ({ page }) => {
    await page.goto("/reports/");
    const expenses = page.getByRole("region", { name: "Ausgaben nach Kategorie" });
    await expenses.getByRole("tab", { name: "Tabelle" }).click();
    await expect(expenses.getByRole("row", { name: /Lebensmittel/ })).toContainText("100");

    await page.getByRole("tab", { name: "Jahr" }).click();
    await expect(
      expenses.getByText(String(new Date().getFullYear()), { exact: true }),
    ).toBeVisible();

    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "Exportieren" }).click();
    await page.getByRole("menuitem", { name: "Als CSV (Tabellenkalkulation)" }).click();
    const file = await download;
    expect(file.suggestedFilename()).toMatch(/^berichte-.*\.csv$/);
    const csv = await readFile(await file.path(), "utf8");
    expect(csv).toContain("Lebensmittel;300,00;100,0");
  });

  test("exports the transaction list as PDF", async ({ page }) => {
    await page.goto("/transactions/");
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "Exportieren" }).click();
    await page.getByRole("menuitem", { name: "Als PDF" }).click();
    const file = await download;
    expect(file.suggestedFilename()).toMatch(/\.pdf$/);
    const pdf = await readFile(await file.path());
    expect(pdf.subarray(0, 8).toString("latin1")).toBe("%PDF-1.4");
  });
});
