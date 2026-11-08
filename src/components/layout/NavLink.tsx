"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Tooltip } from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import { type NavItem, isActivePath } from "./navigation";

interface NavLinkProps {
  item: NavItem;
  className: string;
  activeClassName: string;
  /** Icon-only mode (collapsed sidebar): label becomes tooltip + accessible name. */
  iconOnly?: boolean;
}

/** Navigation link with aria-current for the active page. */
export function NavLink({ item, className, activeClassName, iconOnly }: NavLinkProps) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const active = isActivePath(pathname, item.href);
  const label = t(item.labelKey);
  const Icon = item.icon;
  const link = (
    <Link
      href={item.href}
      className={cn(className, active && activeClassName)}
      aria-current={active ? "page" : undefined}
      aria-label={iconOnly ? label : undefined}
    >
      <Icon aria-hidden="true" />
      <span className={iconOnly ? "visually-hidden" : undefined}>{label}</span>
    </Link>
  );
  return iconOnly ? (
    <Tooltip content={label} side="right">
      {link}
    </Tooltip>
  ) : (
    link
  );
}
