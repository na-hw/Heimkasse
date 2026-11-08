"use client";

import { Languages, Monitor, Moon, Plus, Sun } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { type CommandGroup, CommandPalette } from "@/components/ui";
import { useUpdatePreference } from "@/features/settings/hooks";
import { useTransactionEditor } from "@/features/transactions/editorStore";
import { LANGUAGES, LANGUAGE_NATIVE_NAME } from "@/lib/i18n/config";
import { usePreferences } from "@/lib/preferences/store";
import { useUiStore } from "@/lib/preferences/uiStore";
import { shortcutLabel, useModHotkey } from "@/lib/utils/useHotkey";
import { visibleNavItems } from "./navigation";

/** Wires the command palette to navigation and preferences; opens with ⌘K / Ctrl+K. */
export function CommandPaletteHost() {
  const { t } = useTranslation();
  const router = useRouter();
  const open = useUiStore((s) => s.commandPaletteOpen);
  const setOpen = useUiStore((s) => s.setCommandPaletteOpen);
  const language = usePreferences((s) => s.language);
  const updatePreference = useUpdatePreference();
  const openCreate = useTransactionEditor((s) => s.openCreate);

  useModHotkey("k", () => setOpen(!useUiStore.getState().commandPaletteOpen));

  const groups = useMemo<CommandGroup[]>(
    () => [
      {
        id: "actions",
        heading: t("common.actions"),
        items: [
          {
            id: "quick-add",
            label: t("nav.quickAdd"),
            icon: <Plus />,
            shortcut: shortcutLabel("n"),
            onSelect: () => openCreate(),
          },
        ],
      },
      {
        id: "navigation",
        heading: t("command.groups.navigation"),
        items: visibleNavItems().map((item) => {
          const Icon = item.icon;
          return {
            id: `nav-${item.id}`,
            label: t(item.labelKey),
            icon: <Icon />,
            onSelect: () => router.push(item.href),
          };
        }),
      },
      {
        id: "preferences",
        heading: t("command.groups.preferences"),
        items: [
          ...LANGUAGES.filter((l) => l !== language).map((l) => ({
            id: `lang-${l}`,
            label: t("command.switchLanguage", { language: LANGUAGE_NATIVE_NAME[l] }),
            keywords: ["language", "zaban", "Sprache", "زبان"],
            icon: <Languages />,
            onSelect: () => updatePreference("language", l),
          })),
          ...(
            [
              ["light", Sun],
              ["dark", Moon],
              ["system", Monitor],
            ] as const
          ).map(([theme, Icon]) => ({
            id: `theme-${theme}`,
            label: t("command.setTheme", { theme: t(`theme.${theme}`) }),
            icon: <Icon />,
            onSelect: () => updatePreference("theme", theme),
          })),
        ],
      },
    ],
    [t, router, language, updatePreference, openCreate],
  );

  return (
    <CommandPalette
      open={open}
      onOpenChange={setOpen}
      groups={groups}
      title={t("command.title")}
      placeholder={t("command.placeholder")}
      emptyText={t("command.empty")}
    />
  );
}
