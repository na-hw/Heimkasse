import { House, Palette, Settings, type LucideIcon } from "lucide-react";

export interface NavItem {
  id: string;
  href: string;
  /** Translation key of the label. */
  labelKey: "nav.home" | "nav.settings" | "nav.design";
  icon: LucideIcon;
  /** Shown in the mobile bottom navigation (max. 5 items). */
  mobile: boolean;
  /** Placed at the bottom of the sidebar. */
  secondary?: boolean;
  /** Only visible in development builds. */
  devOnly?: boolean;
}

/** Single source of truth for app navigation. New features add their route here. */
export const NAV_ITEMS: readonly NavItem[] = [
  { id: "home", href: "/", labelKey: "nav.home", icon: House, mobile: true },
  { id: "design", href: "/design/", labelKey: "nav.design", icon: Palette, mobile: false, secondary: true, devOnly: true },
  { id: "settings", href: "/settings/", labelKey: "nav.settings", icon: Settings, mobile: true, secondary: true },
];

export const MAX_BOTTOM_NAV_ITEMS = 5;

export function visibleNavItems(): NavItem[] {
  const isDev = process.env.NODE_ENV !== "production";
  return NAV_ITEMS.filter((item) => isDev || !item.devOnly);
}

/** Matches a pathname to a nav item (works with and without trailing slash). */
export function isActivePath(pathname: string, href: string): boolean {
  const normalize = (p: string) => (p.length > 1 ? p.replace(/\/+$/, "") : p);
  const current = normalize(pathname);
  const target = normalize(href);
  return target === "/" ? current === "/" : current === target || current.startsWith(`${target}/`);
}
