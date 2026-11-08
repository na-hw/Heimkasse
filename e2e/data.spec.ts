import { readFile } from "node:fs/promises";
import { type Page, expect, test } from "@playwright/test";
import { addExpense, createAccount, useGerman } from "./helpers";

const SPARKASSE_CSV = [
  '"Auftragskonto";"Buchungstag";"Valutadatum";"Buchungstext";"Verwendungszweck";"Beguenstigter/Zahlungspflichtiger";"Kontonummer/IBAN";"Betrag";"Waehrung";"Info"',
  '"DE00";"30.10.26";"30.10.26";"KARTENZAHLUNG";"REWE SAGT DANKE";"REWE Markt GmbH";"DE11";"-45,10";"EUR";"Umsatz gebucht"',
  '"DE00";"29.10.26";"29.10.26";"LOHN GEHALT";"Gehalt Oktober";"Arbeitgeber GmbH";"DE22";"2.500,00";"EUR";"Umsatz gebucht"',
].join("\r\n");

// 1×1 transparent PNG
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "base64",
);

/** Clicks a FileInput button and provides the file through the native chooser. */
async function chooseFile(
  page: Page,
  buttonName: string | RegExp,
  file: { name: string; mimeType: string; buffer: Buffer },
) {
  const chooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: buttonName }).click();
  await (await chooser).setFiles(file);
}

async function importCsv(page: Page) {
  await page.goto("/import/");
  await chooseFile(page, "CSV-Datei auswählen", {
    name: "umsaetze.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(SPARKASSE_CSV, "latin1"),
  });
  await expect(page.getByText(/Vorlage: Sparkasse/)).toBeVisible();
  await expect(page.getByRole("cell", { name: "REWE Markt GmbH" })).toBeVisible();
  // On phones a toast may cover the buttons at the end of the page until it disappears.
  await expect(
    page.getByRole("region", { name: /Benachrichtigungen/ }).getByRole("listitem"),
  ).toHaveCount(0, { timeout: 15_000 });
  await page.getByRole("button", { name: "Weiter zur Prüfung" }).click();
}

test.describe("data management", () => {
  test.beforeEach(async ({ page }) => {
    await useGerman(page);
  });

  test("imports a bank CSV with a rule and skips it on re-import", async ({ page }) => {
    test.setTimeout(90_000);
    await createAccount(page, "Giro", "0");

    await page.goto("/import/");
    await page.getByRole("tab", { name: "Regeln" }).click();
    await page.getByRole("button", { name: "Regel hinzufügen" }).first().click();
    const ruleDialog = page.getByRole("dialog", { name: "Neue Regel" });
    await ruleDialog.getByLabel("Enthält").fill("rewe");
    await ruleDialog.getByLabel("Empfänger umbenennen in").fill("REWE");
    await page.getByRole("button", { name: "Anlegen" }).click();
    await expect(ruleDialog).toBeHidden();
    await expect(page.getByText("Empfänger oder Verwendungszweck enthält „rewe“")).toBeVisible();
    await page.getByRole("tab", { name: "Import" }).click();

    await importCsv(page);
    await expect(page.getByText("Regel", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "2 Buchungen importieren" }).click();
    await expect(page.getByRole("heading", { name: "Import abgeschlossen" })).toBeVisible();

    await page.getByRole("link", { name: "Zu den Buchungen" }).click();
    await expect(page.getByRole("button", { name: /^REWE .*-45,10/ })).toBeVisible();
    await expect(
      page.getByRole("button", { name: /^Arbeitgeber GmbH .*\+2\.500,00/ }),
    ).toBeVisible();

    // Same file again: everything is recognised as already imported.
    await importCsv(page);
    await expect(page.getByText("Bereits importiert").first()).toBeVisible();
    await expect(page.getByRole("button", { name: "0 Buchungen importieren" })).toBeDisabled();
  });

  test("attaches, lists and removes a receipt", async ({ page }) => {
    await createAccount(page, "Giro", "100");
    await page.goto("/transactions/");
    await addExpense(page, "12,50", "Baumarkt");
    await page.getByRole("button", { name: "Aktionen für Baumarkt" }).click();
    await page.getByRole("menuitem", { name: "Belege" }).click();
    const dialog = page.getByRole("dialog", { name: "Belege: Baumarkt" });
    await chooseFile(page, "Beleg hinzufügen", {
      name: "kassenbon.png",
      mimeType: "image/png",
      buffer: PNG,
    });
    await expect(dialog.getByText("kassenbon.png")).toBeVisible();
    await expect(dialog.getByRole("button", { name: "kassenbon.png ansehen" })).toBeVisible();

    // Wrong type is rejected.
    await chooseFile(page, "Beleg hinzufügen", {
      name: "notiz.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("x"),
    });
    await expect(page.getByText("Dateityp nicht unterstützt").first()).toBeVisible();

    await dialog.getByRole("button", { name: "kassenbon.png löschen" }).click();
    await expect(dialog.getByText("Noch keine Belege")).toBeVisible();
    // Focus stays inside the dialog after the focused delete button disappeared.
    await expect(dialog.locator(":focus")).toHaveCount(1);
    await dialog.getByRole("button", { name: "Schließen" }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByRole("button", { name: /^Baumarkt .*-12,50/ })).toBeVisible();
  });

  test("exports a backup, deletes all data and restores it", async ({ page }) => {
    await createAccount(page, "Sparbuch", "1234,56");
    await page.goto("/settings/");

    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "Sicherung exportieren" }).click();
    const file = await download;
    expect(file.suggestedFilename()).toMatch(/^heimkasse-backup-\d{4}-\d{2}-\d{2}-\d{4}\.json$/);
    const backup = await readFile(await file.path());
    expect(JSON.parse(backup.toString("utf8"))).toMatchObject({ app: "heimkasse", format: 1 });

    await page.getByRole("button", { name: "Alle Daten löschen …" }).click();
    const confirm = page.getByRole("alertdialog", { name: "Wirklich alle Daten löschen?" });
    const finalButton = confirm.getByRole("button", { name: "Endgültig löschen" });
    await expect(finalButton).toBeDisabled();
    await confirm.getByRole("textbox").fill("LÖSCHEN");
    await finalButton.click();
    await expect(page.getByText("Alle Daten wurden gelöscht").first()).toBeVisible();
    await page.goto("/accounts/");
    await expect(page.getByText("Sparbuch")).toBeHidden();

    // Invalid files are rejected without changes.
    await page.goto("/settings/");
    await chooseFile(page, "Sicherung wiederherstellen", {
      name: "kaputt.json",
      mimeType: "application/json",
      buffer: Buffer.from('{"app":"other"}'),
    });
    await expect(page.getByText("keine gültige Heimkasse-Sicherung").first()).toBeVisible();

    await chooseFile(page, "Sicherung wiederherstellen", {
      name: file.suggestedFilename(),
      mimeType: "application/json",
      buffer: backup,
    });
    const restore = page.getByRole("alertdialog", { name: "Sicherung wiederherstellen?" });
    await expect(restore).toContainText("1 Konten");
    await restore.getByRole("button", { name: "Daten ersetzen" }).click();
    await expect(page.getByText("Sicherung wiederhergestellt").first()).toBeVisible();
    await page.goto("/accounts/");
    await expect(page.getByText("Sparbuch")).toBeVisible();
  });

  test("locks the app with a password", async ({ page }) => {
    await page.goto("/settings/");
    await page.getByRole("button", { name: "Passwort festlegen" }).click();
    const dialog = page.getByRole("dialog", { name: "Passwort festlegen" });
    await dialog.getByLabel("Neues Passwort").fill("12");
    await dialog.getByLabel("Passwort wiederholen").fill("12");
    await dialog.getByRole("button", { name: "Speichern" }).click();
    await expect(dialog.getByText("Bitte mindestens 4 Zeichen.")).toBeVisible();
    await dialog.getByLabel("Neues Passwort").fill("geheim");
    await dialog.getByLabel("Passwort wiederholen").fill("geheim");
    await dialog.getByRole("button", { name: "Speichern" }).click();
    await expect(dialog).toBeHidden();

    await page.reload();
    await expect(page.getByRole("heading", { name: "Heimkasse ist gesperrt" })).toBeVisible();
    await expect(page.getByRole("navigation")).toHaveCount(0);
    await page.getByLabel("Passwort").fill("falsch");
    await page.getByRole("button", { name: "Entsperren" }).click();
    await expect(page.getByText("Falsches Passwort.")).toBeVisible();
    await page.getByLabel("Passwort").fill("geheim");
    await page.getByRole("button", { name: "Entsperren" }).click();
    await expect(page.getByRole("heading", { name: "Einstellungen", level: 1 })).toBeVisible();

    await page.getByRole("button", { name: "Jetzt sperren" }).click();
    await expect(page.getByRole("heading", { name: "Heimkasse ist gesperrt" })).toBeVisible();
  });
});
