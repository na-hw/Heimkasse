import { describe, expect, it } from "vitest";
import { MAX_BOTTOM_NAV_ITEMS, NAV_ITEMS, isActivePath } from "./navigation";

describe("navigation", () => {
  it("matches active paths with and without trailing slash", () => {
    expect(isActivePath("/", "/")).toBe(true);
    expect(isActivePath("/settings", "/")).toBe(false);
    expect(isActivePath("/settings", "/settings/")).toBe(true);
    expect(isActivePath("/settings/", "/settings/")).toBe(true);
    expect(isActivePath("/settingsx", "/settings/")).toBe(false);
  });

  it("keeps the bottom navigation within 5 items", () => {
    expect(NAV_ITEMS.filter((i) => i.mobile).length).toBeLessThanOrEqual(MAX_BOTTOM_NAV_ITEMS);
  });
});
