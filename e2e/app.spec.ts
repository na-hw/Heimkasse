import { expect, test } from "@playwright/test";

test.describe("app shell", () => {
  test("starts in German (LTR) with seeded categories", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("lang", "de");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.goto("/settings/");
    const data = page.getByRole("region", { name: "Daten" });
    await expect(data.getByText("Kategorien", { exact: true })).toBeVisible();
    await expect(data.getByText("30", { exact: true })).toBeVisible();
  });

  test("switches to Persian instantly and persists it", async ({ page }) => {
    await page.goto("/settings/");
    await expect(page.getByRole("heading", { level: 1, name: "Einstellungen" })).toBeVisible();

    await page.getByRole("radio", { name: "فارسی" }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", "fa");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.getByRole("heading", { level: 1, name: "تنظیمات" })).toBeVisible();
    await expect(page).toHaveTitle("تنظیمات · Heimkasse");
    await expect(page.getByRole("status").filter({ hasText: "تنظیمات ذخیره شد" })).toBeAttached();

    await page.reload();
    await expect(page.getByRole("heading", { level: 1, name: "تنظیمات" })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");

    await page.getByRole("radio", { name: "Deutsch" }).click();
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    await expect(page.getByRole("heading", { level: 1, name: "Einstellungen" })).toBeVisible();
  });

  test("applies the dark theme", async ({ page }) => {
    await page.goto("/settings/");
    await page.getByRole("radio", { name: "Dunkel" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  });

  test("shows Persian digits in Persian, Latin digits on request", async ({ page }) => {
    await page.goto("/settings/");
    await page.getByRole("radio", { name: "فارسی" }).click();
    await expect(page.getByRole("status").filter({ hasText: "تنظیمات ذخیره شد" })).toBeAttached();
    const data = page.getByRole("region", { name: "داده‌ها" });
    await expect(data.getByText("۳۰", { exact: true })).toBeVisible();

    await page.getByRole("radio", { name: "لاتین (123)" }).click();
    await expect(page.getByRole("status").filter({ hasText: "تنظیمات ذخیره شد" })).toBeAttached();
    await expect(data.getByText("30", { exact: true })).toBeVisible();
  });

  test("skip link jumps to the main content", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Zum Inhalt springen" });
    await expect(skip).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator("#main")).toBeFocused();
  });
});

test("labels the notification region in the UI language", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("region", { name: "Benachrichtigungen (F8)" })).toBeAttached();
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
    const dialog = page.getByRole("dialog", { name: "Befehlspalette" });
    await expect(dialog).toBeVisible();
    await page.keyboard.type("Einstellungen");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/settings\/?$/);
    await expect(page.getByRole("heading", { level: 1, name: "Einstellungen" })).toBeVisible();
  });
});

test.describe("responsive navigation", () => {
  test("uses bottom navigation on phones and sidebar on desktop", async ({ page, isMobile }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const bottom = page.getByRole("navigation", { name: "Navigation", exact: true });
    const sidebar = page.getByRole("navigation", { name: "Hauptnavigation" });
    if (isMobile) {
      await expect(bottom).toBeVisible();
      await expect(sidebar).toBeHidden();
    } else {
      await expect(sidebar).toBeVisible();
      await expect(bottom).toBeHidden();
    }
  });
});
