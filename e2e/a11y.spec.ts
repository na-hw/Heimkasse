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
  test.setTimeout(120_000);

  test("no page scrolls horizontally at 320 px", async ({ page }) => {
    await useGerman(page);
    await seed(page);
    await page.setViewportSize({ width: 320, height: 640 });
    const overflowing: string[] = [];
    for (const route of ROUTES) {
      await openPage(page, route);
      const { scroll, client } = await page.evaluate(() => ({
        scroll: document.documentElement.scrollWidth,
        client: document.documentElement.clientWidth,
      }));
      if (scroll > client) overflowing.push(`${route}: ${scroll} > ${client}`);
    }
    expect(overflowing).toEqual([]);
  });
});
