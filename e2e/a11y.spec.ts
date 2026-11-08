import AxeBuilder from "@axe-core/playwright";
import { type Page, expect, test } from "@playwright/test";
import { addExpense, createAccount, useGerman } from "./helpers";

const ROUTES = [
  "/",
  "/transactions/",
  "/accounts/",
  "/categories/",
  "/recurring/",
  "/budgets/",
  "/reports/",
  "/contracts/",
  "/utilities/",
  "/goals/",
  "/tax/",
  "/import/",
  "/trash/",
  "/settings/",
] as const;

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

/** Some data so lists, charts and tables are rendered instead of empty states. */
async function seed(page: Page) {
  await createAccount(page, "Giro", "1500");
  await page.goto("/transactions/");
  await addExpense(page, "45,10", "REWE", "Lebensmittel");
  await addExpense(page, "9,99", "Streaming", "Abos");
}

async function openPage(page: Page, route: string) {
  await page.goto(route);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  // Let lazy charts and queries settle.
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(300);
}

async function scan(page: Page, label: string) {
  const problems: string[] = [];
  for (const route of ROUTES) {
    await openPage(page, route);
    const result = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    for (const v of result.violations) {
      problems.push(
        `[${label}] ${route} ${v.id} (${v.impact}): ${v.nodes
          .slice(0, 3)
          .map((n) => n.target.join(" "))
          .join(" | ")}`,
      );
    }
  }
  return problems;
}

test.describe("accessibility (WCAG 2.2 AA, axe)", () => {
  test.skip(({ isMobile }) => isMobile, "Scanned once on desktop; reflow covers small screens.");
  test.setTimeout(180_000);

  test("all pages pass in German/light and Persian/dark", async ({ page }) => {
    await useGerman(page);
    await seed(page);
    const problems = await scan(page, "de light");

    await page.goto("/settings/");
    await page.getByRole("radio", { name: "فارسی" }).click();
    await page.getByRole("radio", { name: "تیره" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    problems.push(...(await scan(page, "fa dark")));

    expect(problems).toEqual([]);
  });
});

test.describe("reflow (200 % zoom ≙ 320 px)", () => {
  test.skip(({ isMobile }) => isMobile, "Uses its own viewport.");
  test.setTimeout(180_000);

  test("no page scrolls horizontally at 320 and 375 px, even with long content", async ({
    page,
  }) => {
    await useGerman(page);
    await seed(page);
    // Stress content: long names, a seven-digit amount and an entry in the trash.
    await createAccount(page, "Gemeinschaftskonto Sparkasse Hannover Tagesgeld", "1234567,89");
    await page.goto("/transactions/");
    await addExpense(page, "1234567,89", "Autohaus Mustermann Vertriebsgesellschaft mbH", "Abos");
    await page.getByRole("button", { name: "Aktionen für Streaming" }).click();
    await page.getByRole("menuitem", { name: "Löschen" }).click();

    const overflowing: string[] = [];
    for (const width of [320, 375]) {
      await page.setViewportSize({ width, height: 640 });
      for (const route of ROUTES) {
        await openPage(page, route);
        const { scroll, client } = await page.evaluate(() => ({
          scroll: document.documentElement.scrollWidth,
          client: document.documentElement.clientWidth,
        }));
        if (scroll > client) overflowing.push(`${width} ${route}: ${scroll} > ${client}`);
      }
    }
    expect(overflowing).toEqual([]);
  });

  test("the date picker fits a 320 px screen", async ({ page }) => {
    await useGerman(page);
    await createAccount(page, "Giro", "0");
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto("/transactions/");
    await page
      .getByRole("button", { name: /Buchung erfassen/ })
      .first()
      .click();
    const dialog = page.getByRole("dialog", { name: "Neue Buchung" });
    await dialog.getByRole("button", { name: /Datum/ }).first().click();
    const grid = page.getByRole("grid");
    await expect(grid).toBeVisible();
    const box = await grid.boundingBox();
    expect(box).not.toBeNull();
    const { x = -1, width = Infinity } = box ?? {};
    expect(x).toBeGreaterThanOrEqual(0);
    expect(x + width).toBeLessThanOrEqual(320);
  });
});
