"use client";

import { Ellipsis } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Sheet } from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import { NavLink } from "./NavLink";
import { MAX_BOTTOM_NAV_ITEMS, isActivePath, visibleNavItems } from "./navigation";
import styles from "./AppShell.module.css";

/** Phone navigation: 4 main destinations + "More" (sheet with the rest). */
export function BottomNav() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const all = visibleNavItems();
  const main = all.filter((i) => i.mobile).slice(0, MAX_BOTTOM_NAV_ITEMS - 1);
  const more = all.filter((i) => !main.includes(i));
  const moreActive = more.some((i) => isActivePath(pathname, i.href));

  return (
    <nav aria-label={t("nav.mobileNavigation")} className={styles.bottomNav}>
      <ul role="list" className={styles.bottomNavList}>
        {main.map((item) => (
          <li key={item.id}>
            <NavLink
              item={item}
              className={styles.bottomNavLink}
              activeClassName={styles.bottomNavLinkActive}
            />
          </li>
        ))}
        <li>
          <Sheet
            side="bottom"
            open={moreOpen}
            onOpenChange={setMoreOpen}
            title={t("nav.moreTitle")}
            trigger={
              <button
                type="button"
                className={cn(styles.bottomNavLink, moreActive && styles.bottomNavLinkActive)}
                aria-current={moreActive ? "page" : undefined}
              >
                <Ellipsis aria-hidden="true" />
                <span>{t("nav.more")}</span>
              </button>
            }
          >
            <ul role="list" className={styles.moreList}>
              {more.map((item) => (
                <li key={item.id}>
                  <NavLink
                    item={item}
                    className={styles.navLink}
                    activeClassName={styles.navLinkActive}
                    onNavigate={() => setMoreOpen(false)}
                  />
                </li>
              ))}
            </ul>
          </Sheet>
        </li>
      </ul>
    </nav>
  );
}
