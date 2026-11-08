"use client";

import { useTranslation } from "react-i18next";
import { NavLink } from "./NavLink";
import { MAX_BOTTOM_NAV_ITEMS, visibleNavItems } from "./navigation";
import styles from "./AppShell.module.css";

/** Phone navigation (max. 5 destinations), respects the bottom safe area. */
export function BottomNav() {
  const { t } = useTranslation();
  const items = visibleNavItems().filter((i) => i.mobile).slice(0, MAX_BOTTOM_NAV_ITEMS);
  return (
    <nav aria-label={t("nav.mobileNavigation")} className={styles.bottomNav}>
      <ul role="list" className={styles.bottomNavList}>
        {items.map((item) => (
          <li key={item.id}>
            <NavLink item={item} className={styles.bottomNavLink} activeClassName={styles.bottomNavLinkActive} />
          </li>
        ))}
      </ul>
    </nav>
  );
}
