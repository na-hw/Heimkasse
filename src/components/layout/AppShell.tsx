"use client";

import type { ReactNode } from "react";
import { useUiStore } from "@/lib/preferences/uiStore";
import { BottomNav } from "./BottomNav";
import { CommandPaletteHost } from "./CommandPaletteHost";
import { MobileHeader } from "./MobileHeader";
import { Sidebar } from "./Sidebar";
import { SkipLink } from "./SkipLink";
import styles from "./AppShell.module.css";

/**
 * Responsive app frame: sidebar on ≥768px, top bar + bottom navigation on
 * phones. Main content is the skip-link target.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  return (
    <>
      <SkipLink />
      <div className={styles.shell} data-collapsed={collapsed || undefined}>
        <Sidebar />
        <div className={styles.column}>
          <MobileHeader />
          <main id="main" tabIndex={-1} className={styles.main}>
            {children}
          </main>
        </div>
        <BottomNav />
      </div>
      <CommandPaletteHost />
    </>
  );
}
