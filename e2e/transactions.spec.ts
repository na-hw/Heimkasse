import { expect, test } from "@playwright/test";
import { addExpense, createAccount, useGerman } from "./helpers";

test.describe("accounts & transactions", () => {
  test.beforeEach(async ({ page }) => {
    await useGerman(page);
    await createAccount(page, "Sparkasse Giro", "1.000");
  });

  test("creates an account with its balance", async ({ page }) => {
    const row = page.getByRole("listitem").filter({ hasText: "Sparkasse Giro" });
    await expect(row).toContainText("1.000,00");
    await expect(page.getByText("Gesamtsaldo")).toBeVisible();
  });

  test("adds, edits, deletes and restores a transaction", async ({ page }) => {
    await page.goto("/transactions/");
    await addExpense(page, "45,99", "REWE", "Lebensmittel");

    const row = page.getByRole("button", { name: /^REWE, -45,99/ });
    await expect(row).toBeVisible();
    await expect(page.getByText("1 Buchung", { exact: true })).toBeVisible();

    // Edit: amount 50
    await row.click();
    const dialog = page.getByRole("dialog", { name: "Buchung bearbeiten" });
    await dialog.getByLabel("Betrag").fill("50");
    await page.getByRole("button", { name: "Änderungen speichern" }).click();
    await expect(page.getByRole("button", { name: /^REWE, -50,00/ })).toBeVisible();

    // Balance reflects the expense
    await page.goto("/accounts/");
    await expect(page.getByRole("listitem").filter({ hasText: "Sparkasse Giro" })).toContainText(
      "950,00",
    );

    // Delete with undo
    await page.goto("/transactions/");
    await page.getByRole("button", { name: "Aktionen für REWE" }).click();
    await page.getByRole("menuitem", { name: "Löschen" }).click();
    await expect(page.getByRole("button", { name: /^REWE/ })).toBeHidden();
    await page.getByRole("button", { name: "Rückgängig" }).click();
    await expect(page.getByRole("button", { name: /^REWE, -50,00/ })).toBeVisible();
  });

  test("searches and bulk-deletes transactions, then restores from trash", async ({ page }) => {
    await page.goto("/transactions/");
    await addExpense(page, "10", "Bäcker");
    await addExpense(page, "20", "Apotheke");
    await page.getByRole("searchbox", { name: "Buchungen durchsuchen" }).fill("bäck");
    await expect(page.getByText("1 Buchung", { exact: true })).toBeVisible();
    await page.getByRole("searchbox", { name: "Buchungen durchsuchen" }).fill("");

    await page.getByRole("button", { name: "Auswählen" }).click();
    await page.getByRole("button", { name: "Alle auswählen" }).click();
    await expect(page.getByText("2 ausgewählt").first()).toBeVisible();
    await page.getByRole("button", { name: "Löschen", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Noch keine Buchungen" })).toBeVisible();

    await page.goto("/trash/");
    await expect(page.getByRole("tab", { name: "Buchungen (2)" })).toBeVisible();
    await page
      .getByRole("listitem")
      .filter({ hasText: "Bäcker" })
      .getByRole("button", { name: "Wiederherstellen" })
      .click();
    await expect(page.getByRole("tab", { name: "Buchungen (1)" })).toBeVisible();
    await page.goto("/transactions/");
    await expect(page.getByRole("button", { name: /^Bäcker/ })).toBeVisible();
  });

  test("creates a recurring payment that is booked immediately", async ({ page }) => {
    await page.goto("/recurring/");
    await page.getByRole("button", { name: "Regel anlegen" }).first().click();
    const dialog = page.getByRole("dialog", { name: "Neue wiederkehrende Zahlung" });
    await dialog.getByLabel("Betrag").fill("18,36");
    await dialog.getByLabel("Empfänger / Zahler").fill("Rundfunkbeitrag");
    await page.getByRole("button", { name: "Anlegen" }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByText("1 wiederkehrende Buchung erstellt").first()).toBeVisible();
    await expect(page.getByRole("listitem").filter({ hasText: "Monatlich" })).toContainText(
      "Rundfunkbeitrag",
    );

    await page.goto("/transactions/");
    await expect(page.getByRole("button", { name: /^Rundfunkbeitrag, -18,36/ })).toBeVisible();
  });
});

test("archives an account that is in use instead of deleting it", async ({ page }) => {
  await useGerman(page);
  await createAccount(page, "Bar", "0");
  await page.goto("/transactions/");
  await addExpense(page, "5", "Kiosk");
  await page.goto("/accounts/");
  await page.getByRole("button", { name: "Aktionen für Bar" }).click();
  await page.getByRole("menuitem", { name: "Löschen" }).click();
  const dialog = page.getByRole("alertdialog", { name: "Konto wird verwendet" });
  await expect(dialog).toContainText("1 Buchungen");
  await dialog.getByRole("button", { name: "Archivieren" }).click();
  await expect(page.getByRole("heading", { name: "Archivierte Konten" })).toBeVisible();
});
