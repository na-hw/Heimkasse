import { expect, test } from "@playwright/test";

test.describe("app shell", () => {
  test("starts in Persian (RTL) with seeded categories", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("lang", "fa");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText("دسته‌بندی‌ها", { exact: true })).toBeVisible();
    // 24 built-in categories, shown with Persian digits.
    await expect(page.getByText("۲۴", { exact: true })).toBeVisible();
  });

  test("switches language instantly and persists it", async ({ page }) => {
    await page.goto("/settings/");
    await expect(page.getByRole("heading", { level: 1, name: "تنظیمات" })).toBeVisible();

    await page.getByRole("radio", { name: "Deutsch" }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", "de");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    await expect(page.getByRole("heading", { level: 1, name: "Einstellungen" })).toBeVisible();
    await expect(page).toHaveTitle("Einstellungen · Heimkasse");

    await page.reload();
    await expect(page.getByRole("heading", { level: 1, name: "Einstellungen" })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");

    await page.getByRole("radio", { name: "فارسی" }).click();
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.getByRole("heading", { level: 1, name: "تنظیمات" })).toBeVisible();
  });

  test("applies the dark theme and Latin digits", async ({ page }) => {
    await page.goto("/settings/");
    await page.getByRole("radio", { name: "تیره" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await page.getByRole("radio", { name: "لاتین (123)" }).click();
    await page.goto("/");
    await expect(page.getByText("24", { exact: true })).toBeVisible();
  });

  test("skip link jumps to the main content", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "پرش به محتوا" });
    await expect(skip).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator("#main")).toBeFocused();
  });
});

test.describe("command palette", () => {
  test("opens with the keyboard and navigates", async ({ page, isMobile }) => {
    test.skip(isMobile, "keyboard shortcut is a desktop feature");
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    // The app uses ⌘ on Apple platforms and Ctrl elsewhere, based on the user agent.
    const mod = await page.evaluate(() =>
      /Mac|iPhone|iPad/i.test(navigator.userAgent) ? "Meta" : "Control",
    );
    await page.keyboard.press(`${mod}+k`);
    const dialog = page.getByRole("dialog", { name: "پالت فرمان" });
    await expect(dialog).toBeVisible();
    await page.keyboard.type("تنظیمات");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/settings\/?$/);
    await expect(page.getByRole("heading", { level: 1, name: "تنظیمات" })).toBeVisible();
  });
});

test.describe("responsive navigation", () => {
  test("uses bottom navigation on phones and sidebar on desktop", async ({ page, isMobile }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    if (isMobile) {
      await expect(page.getByRole("navigation", { name: "ناوبری", exact: true })).toBeVisible();
      await expect(page.getByRole("navigation", { name: "ناوبری اصلی" })).toBeHidden();
    } else {
      await expect(page.getByRole("navigation", { name: "ناوبری اصلی" })).toBeVisible();
      await expect(page.getByRole("navigation", { name: "ناوبری", exact: true })).toBeHidden();
    }
  });
});
