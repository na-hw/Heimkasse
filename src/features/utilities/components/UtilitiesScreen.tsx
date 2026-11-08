"use client";

import { useTranslation } from "react-i18next";
import { PageHeader, Tabs } from "@/components/ui";
import { MetersPanel } from "@/features/meters/components/MetersPanel";
import { useDocumentTitle } from "@/lib/utils/useDocumentTitle";
import { SettlementsPanel } from "./SettlementsPanel";

/** Meter readings and Nebenkosten settlements on one page. */
export function UtilitiesScreen() {
  const { t } = useTranslation();
  useDocumentTitle(t("utilities.title"));
  return (
    <>
      <PageHeader title={t("utilities.title")} description={t("utilities.description")} />
      <Tabs
        label={t("utilities.tabs.label")}
        items={[
          { value: "meters", label: t("utilities.tabs.meters"), content: <MetersPanel /> },
          {
            value: "settlements",
            label: t("utilities.tabs.settlements"),
            content: <SettlementsPanel />,
          },
        ]}
      />
    </>
  );
}
