"use client";

import { PanelLeftClose, PanelLeftOpen, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { DirectionalIcon, IconButton, Kbd } from "@/components/ui";
import { useUiStore } from "@/lib/preferences/uiStore";
import { shortcutLabel } from "@/lib/utils/useHotkey";
import { Brand } from "./Brand";
import { NavLink } from "./NavLink";
import { visibleNavItems } from "./navigation";
import styles from "./AppShell.module.css";

/** Desktop/tablet navigation; collapsible to an icon rail. */
export function Sidebar() {
  const { t } = useTranslation();
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggle = useUiStore((s) => s.toggleSidebar);
  const openPalette = useUiStore((s) => s.setCommandPaletteOpen);
  const items = visibleNavItems();

  return (
    <aside className={styles.sidebar} data-collapsed={collapsed || undefined}>
      <div className={styles.sidebarTop}>
        <Brand compact={collapsed} />
        <IconButton
          label={collapsed ? t("nav.expandSidebar") : t("nav.collapseSidebar")}
          icon={<DirectionalIcon icon={collapsed ? PanelLeftOpen : PanelLeftClose} />}
          onClick={toggle}
          aria-expanded={!collapsed}
          size="sm"
        />
      </div>
      <button
        type="button"
        className={styles.searchButton}
        onClick={() => openPalette(true)}
        aria-label={collapsed ? t("nav.openCommandPalette") : undefined}
        aria-keyshortcuts="Meta+K Control+K"
      >
        <Search aria-hidden="true" />
        {!collapsed && (
          <>
            <span className={styles.searchText}>{t("nav.search")}</span>
            <Kbd>{shortcutLabel("k")}</Kbd>
          </>
        )}
      </button>
      <nav aria-label={t("nav.mainNavigation")} className={styles.sidebarNav}>
        <ul role="list" className={styles.navList}>
          {items
            .filter((i) => !i.secondary)
            .map((item) => (
              <li key={item.id}>
                <NavLink
                  item={item}
                  className={styles.navLink}
                  activeClassName={styles.navLinkActive}
                  iconOnly={collapsed}
                />
              </li>
            ))}
        </ul>
        <ul role="list" className={styles.navList}>
          {items
            .filter((i) => i.secondary)
            .map((item) => (
              <li key={item.id}>
                <NavLink
                  item={item}
                  className={styles.navLink}
                  activeClassName={styles.navLinkActive}
                  iconOnly={collapsed}
                />
              </li>
            ))}
        </ul>
      </nav>
    </aside>
  );
}
