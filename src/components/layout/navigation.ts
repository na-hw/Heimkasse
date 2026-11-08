import {
  ArrowLeftRight,
  FolderTree,
  House,
  Landmark,
  Palette,
  Repeat,
  Settings,
  Trash2,
  type LucideIcon,
} from "lucide-react";

export type NavLabelKey =
  | "nav.home"
  | "nav.transactions"
  | "nav.accounts"
  | "nav.categories"
  | "nav.recurring"
  | "nav.trash"
  | "nav.settings"
  | "nav.design";

export interface NavItem {
  id: string;
  href: string;
  labelKey: NavLabelKey;
  icon: LucideIcon;
  /** Shown directly in the mobile bottom navigation; others go to "More". */
  mobile: boolean;
  /** Placed at the bottom of the sidebar. */
  secondary?: boolean;
  /** Only visible in development builds. */
  devOnly?: boolean;
}

/** Single source of truth for app navigation. New features add their route here. */
export const NAV_ITEMS: readonly NavItem[] = [
  { id: "home", href: "/", labelKey: "nav.home", icon: House, mobile: true },
  {
    id: "transactions",
    href: "/transactions/",
    labelKey: "nav.transactions",
    icon: ArrowLeftRight,
    mobile: true,
  },
  { id: "accounts", href: "/accounts/", labelKey: "nav.accounts", icon: Landmark, mobile: true },
  { id: "recurring", href: "/recurring/", labelKey: "nav.recurring", icon: Repeat, mobile: true },
  {
    id: "categories",
    href: "/categories/",
    labelKey: "nav.categories",
    icon: FolderTree,
    mobile: false,
  },
  {
    id: "trash",
    href: "/trash/",
    labelKey: "nav.trash",
    icon: Trash2,
    mobile: false,
    secondary: true,
  },
  {
    id: "design",
    href: "/design/",
    labelKey: "nav.design",
    icon: Palette,
    mobile: false,
    secondary: true,
    devOnly: true,
  },
  {
    id: "settings",
    href: "/settings/",
    labelKey: "nav.settings",
    icon: Settings,
    mobile: false,
    secondary: true,
  },
];

/** Bottom navigation holds at most 5 entries: 4 destinations + "More". */
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
