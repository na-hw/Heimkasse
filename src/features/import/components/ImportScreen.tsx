"use client";

import { useTranslation } from "react-i18next";
import { Card, PageHeader, Tabs } from "@/components/ui";
import { useDocumentTitle } from "@/lib/utils/useDocumentTitle";
import { ImportRulesPanel } from "./ImportRulesPanel";
import { ImportWizard } from "./ImportWizard";

/** Bank CSV import and the rules used for auto-categorisation. */
export function ImportScreen() {
  const { t } = useTranslation();
  useDocumentTitle(t("import.title"));
  return (
    <>
      <PageHeader title={t("import.title")} description={t("import.description")} />
      <Tabs
        label={t("import.tabs.label")}
        items={[
          {
            value: "import",
            label: t("import.tabs.import"),
            content: (
              <Card>
                <ImportWizard />
              </Card>
            ),
          },
          { value: "rules", label: t("import.tabs.rules"), content: <ImportRulesPanel /> },
        ]}
      />
    </>
  );
}
