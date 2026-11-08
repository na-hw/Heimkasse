import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { createAccount, useGerman } from "./helpers";

test.describe("Germany features", () => {
  test.beforeEach(async ({ page }) => {
    await useGerman(page);
  });

  test("creates a contract with deadline and linked payment, then cancels it", async ({ page }) => {
    await createAccount(page, "Giro", "500");
    await page.goto("/contracts/");
    await page.getByRole("button", { name: "Vertrag anlegen" }).first().click();
    const dialog = page.getByRole("dialog", { name: "Neuer Vertrag" });
    await dialog.getByLabel("Name").fill("Handyvertrag");
    await dialog.getByLabel("Anbieter").fill("Telekom");
    await dialog.getByLabel("Betrag").fill("29,99");
    await expect(dialog.getByText(/Kündigen bis .* zum /)).toBeVisible();
    await dialog.getByRole("switch", { name: /wiederkehrende Buchung/ }).click();
    await page.getByRole("button", { name: "Anlegen" }).click();
    await expect(dialog).toBeHidden();

    const row = page.locator("#main").getByRole("listitem").filter({ hasText: "Handyvertrag" });
    await expect(row).toContainText("Kündigen bis");
    await expect(row.getByLabel("Mit wiederkehrender Zahlung verknüpft")).toBeVisible();
    await expect(page.getByText("29,99 €").first()).toBeVisible();

    // The first payment (today) was booked by the linked rule.
    await page.goto("/transactions/");
    await expect(page.getByRole("button", { name: /^Telekom .*-29,99/ })).toBeVisible();

    await page.goto("/contracts/");
    await page.getByRole("button", { name: "Aktionen für Handyvertrag" }).click();
    await page.getByRole("menuitem", { name: "Als gekündigt markieren" }).click();
    const cancel = page.getByRole("dialog", { name: "Vertrag gekündigt" });
    await cancel.getByRole("button", { name: "Speichern" }).click();
    await expect(cancel).toBeHidden();
    await expect(
      page.getByRole("heading", { name: "Gekündigte und beendete Verträge" }),
    ).toBeVisible();
    await expect(row).toContainText("Gekündigt zum");
  });

  test("records meter readings and rejects a lower value", async ({ page }) => {
    await page.goto("/utilities/");
    await page.getByRole("button", { name: "Zähler anlegen" }).first().click();
    const dialog = page.getByRole("dialog", { name: "Neuer Zähler" });
    await dialog.getByLabel("Name").fill("Strom");
    await dialog.getByLabel("Preis pro Einheit").fill("32,15");
    await page.getByRole("button", { name: "Anlegen" }).click();
    await expect(dialog).toBeHidden();

    const addReading = async (value: string) => {
      await page.getByRole("button", { name: "Zählerstand erfassen" }).click();
      const reading = page.getByRole("dialog", { name: "Neuer Zählerstand" });
      await reading.getByLabel("Zählerstand").fill(value);
      await page.getByRole("button", { name: "Speichern", exact: true }).click();
      return reading;
    };
    await expect(await addReading("1.000")).toBeHidden();
    await expect(page.getByText("1.000 kWh").first()).toBeVisible();

    const invalid = await addReading("900");
    await expect(
      invalid.getByText("Der Stand ist kleiner als der vorherige (1.000 kWh)."),
    ).toBeVisible();
    await page.getByRole("button", { name: "Abbrechen" }).click();
  });

  test("calculates a Nebenkosten back-payment", async ({ page }) => {
    await page.goto("/utilities/");
    await page.getByRole("tab", { name: "Nebenkosten" }).click();
    await page.getByRole("button", { name: "Abrechnung erfassen" }).first().click();
    const dialog = page.getByRole("dialog", { name: "Neue Nebenkostenabrechnung" });
    await dialog.getByLabel("Monatliche Vorauszahlung").fill("200");
    await dialog.getByLabel("Tatsächliche Kosten laut Abrechnung").fill("2.700");
    await expect(dialog).toContainText("Nachzahlung: 300,00 €");
    await page.getByRole("button", { name: "Speichern", exact: true }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByText("Nachzahlung 300,00 €")).toBeVisible();
    await expect(page.getByText("Empfohlene neue Vorauszahlung: 225,00 € / Monat")).toBeVisible();
  });

  test("tracks a savings goal", async ({ page }) => {
    await page.goto("/goals/");
    await page.getByRole("button", { name: "Sparziel anlegen" }).first().click();
    const dialog = page.getByRole("dialog", { name: "Neues Sparziel" });
    await dialog.getByLabel("Name").fill("Notgroschen");
    await dialog.getByLabel("Zielbetrag").fill("3.000");
    await page.getByRole("button", { name: "Anlegen" }).click();
    await expect(dialog).toBeHidden();

    await page.getByRole("button", { name: "Einzahlen" }).click();
    const deposit = page.getByRole("dialog", { name: "Einzahlung" });
    await deposit.getByLabel("Betrag").fill("500");
    await page.getByRole("button", { name: "Speichern", exact: true }).click();
    await expect(deposit).toBeHidden();

    const card = page.getByRole("article").filter({ hasText: "Notgroschen" });
    await expect(card).toContainText("500,00 € von 3.000,00 €");
    await expect(card).toContainText("Voraussichtlich erreicht im");
  });

  test("sums tax-relevant bookings and exports them", async ({ page }) => {
    await createAccount(page, "Giro", "0");
    await page.goto("/transactions/");
    await page
      .getByRole("button", { name: /Buchung erfassen/ })
      .first()
      .click();
    const dialog = page.getByRole("dialog", { name: "Neue Buchung" });
    await dialog.getByLabel("Betrag").fill("120");
    await dialog.getByLabel("Empfänger / Zahler").fill("Rotes Kreuz");
    await dialog.getByText("Weitere Angaben").click();
    await dialog.getByRole("combobox", { name: "Steuerkategorie" }).click();
    await page.getByRole("option", { name: "Spenden" }).click();
    await page.getByRole("button", { name: "Speichern", exact: true }).click();
    await expect(dialog).toBeHidden();

    await page.goto("/tax/");
    await expect(page.getByRole("heading", { name: "Spenden" })).toBeVisible();
    await expect(page.locator("#main")).toContainText("120,00 €");
    await page.getByRole("button", { name: "Buchungen anzeigen" }).click();
    await expect(page.getByRole("button", { name: /Rotes Kreuz/ })).toBeVisible();

    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "Exportieren" }).click();
    await page.getByRole("menuitem", { name: "Als CSV (Tabellenkalkulation)" }).click();
    const csv = await readFile(await (await download).path(), "utf8");
    expect(csv).toContain("Spenden;1;120,00");
    expect(csv).toContain("Rotes Kreuz");
  });
});
