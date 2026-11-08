import { type Page, expect } from "@playwright/test";

/** Opens the app in its default language (German) and waits until it is ready. */
export async function useGerman(page: Page) {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "de");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
}

/** Creates an account through the UI. */
export async function createAccount(page: Page, name: string, initial: string) {
  await page.goto("/accounts/");
  await page.getByRole("button", { name: "Konto anlegen" }).first().click();
  const dialog = page.getByRole("dialog", { name: "Neues Konto" });
  await dialog.getByLabel("Name").fill(name);
  await dialog.getByLabel("Anfangssaldo").fill(initial);
  await page.getByRole("button", { name: "Anlegen" }).click();
  await expect(dialog).toBeHidden();
}

/** Opens the quick-add dialog and saves an expense. */
export async function addExpense(page: Page, amount: string, payee: string, category?: string) {
  await page
    .getByRole("button", { name: /Buchung erfassen/ })
    .first()
    .click();
  const dialog = page.getByRole("dialog", { name: "Neue Buchung" });
  await dialog.getByLabel("Betrag").fill(amount);
  if (category) {
    await dialog.getByRole("combobox", { name: "Kategorie" }).click();
    const option = page.getByRole("option", { name: category, exact: true });
    // Enabled options must not look disabled (cmdk sets data-disabled="false").
    await expect(option).not.toHaveCSS("cursor", "not-allowed");
    await option.click();
  }
  await dialog.getByLabel("Empfänger / Zahler").fill(payee);
  await page.getByRole("button", { name: "Speichern", exact: true }).click();
  await expect(dialog).toBeHidden();
}
