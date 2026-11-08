"use client";

import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { IconButton } from "@/components/ui";
import { useUiStore } from "@/lib/preferences/uiStore";
import { Brand } from "./Brand";
import styles from "./AppShell.module.css";

/** Compact top bar on phones. */
export function MobileHeader() {
  const { t } = useTranslation();
  const openPalette = useUiStore((s) => s.setCommandPaletteOpen);
  return (
    <header className={styles.mobileHeader}>
      <Brand />
      <IconButton
        label={t("nav.openCommandPalette")}
        icon={<Search />}
        onClick={() => openPalette(true)}
        showTooltip={false}
      />
    </header>
  );
}
