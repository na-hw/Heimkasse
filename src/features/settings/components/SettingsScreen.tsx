"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";
import { AutoBackupCard } from "@/features/backup/components/AutoBackupCard";
import { BackupCard } from "@/features/backup/components/BackupCard";
import { DeleteAllCard } from "@/features/backup/components/DeleteAllCard";
import { Card, FormField, PageHeader, RadioGroup, Select } from "@/components/ui";
import { LANGUAGES, LANGUAGE_NATIVE_NAME } from "@/lib/i18n/config";
import { currencySymbol } from "@/lib/i18n/format";
import { useFormat } from "@/lib/i18n/useFormat";
import { usePreferences } from "@/lib/preferences/store";
import { preferencesSchema } from "@/lib/preferences/types";
import { useDocumentTitle } from "@/lib/utils/useDocumentTitle";
import { useUpdatePreference } from "../hooks";
import styles from "./SettingsScreen.module.css";
import { StorageInfoCard } from "./StorageInfoCard";

const CURRENCIES = preferencesSchema.shape.currency.unwrap().options;
const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;
const MONTH_DAYS = Array.from({ length: 28 }, (_, i) => i + 1);

/** Preferences that apply instantly (no save button) and persist locally. */
export function SettingsScreen() {
  const { t } = useTranslation();
  const format = useFormat();
  const prefs = usePreferences();
  const update = useUpdatePreference();
  useDocumentTitle(t("settings.title"));
  const weekdays = format.weekdays();
  const isPersian = prefs.language === "fa";

  return (
    <>
      <PageHeader title={t("settings.title")} description={t("settings.description")} />
      <div className={styles.sections}>
        <Card title={t("settings.sections.language")}>
          <RadioGroup
            label={t("settings.language.label")}
            appearance="cards"
            orientation="horizontal"
            value={prefs.language}
            onValueChange={(v) => update("language", v)}
            options={LANGUAGES.map((l) => ({
              value: l,
              label: (
                <span lang={l} dir={l === "fa" ? "rtl" : "ltr"}>
                  {LANGUAGE_NATIVE_NAME[l]}
                </span>
              ),
            }))}
          />
          <FormField label={t("settings.currency.label")}>
            <Select
              value={prefs.currency}
              onValueChange={(v) => update("currency", v)}
              options={CURRENCIES.map((c) => ({ value: c, label: `${c} (${currencySymbol(c)})` }))}
            />
          </FormField>
        </Card>

        <Card title={t("settings.sections.appearance")}>
          <RadioGroup
            label={t("settings.theme.label")}
            hint={t("settings.theme.hint")}
            appearance="cards"
            orientation="horizontal"
            value={prefs.theme}
            onValueChange={(v) => update("theme", v)}
            options={[
              {
                value: "system",
                label: (
                  <span className={styles.option}>
                    <Monitor aria-hidden="true" />
                    {t("theme.system")}
                  </span>
                ),
              },
              {
                value: "light",
                label: (
                  <span className={styles.option}>
                    <Sun aria-hidden="true" />
                    {t("theme.light")}
                  </span>
                ),
              },
              {
                value: "dark",
                label: (
                  <span className={styles.option}>
                    <Moon aria-hidden="true" />
                    {t("theme.dark")}
                  </span>
                ),
              },
            ]}
          />
          {isPersian && (
            <RadioGroup
              label={t("settings.digitStyle.label")}
              hint={t("settings.digitStyle.hint")}
              appearance="cards"
              orientation="horizontal"
              value={prefs.digitStyle}
              onValueChange={(v) => update("digitStyle", v)}
              options={[
                { value: "persian", label: t("settings.digitStyle.persian") },
                { value: "latin", label: t("settings.digitStyle.latin") },
              ]}
            />
          )}
        </Card>

        <Card title={t("settings.sections.budget")}>
          {isPersian && (
            <RadioGroup
              label={t("settings.calendar.label")}
              hint={t("settings.calendar.hint")}
              appearance="cards"
              orientation="horizontal"
              value={prefs.calendar}
              onValueChange={(v) => update("calendar", v)}
              options={[
                { value: "gregorian", label: t("settings.calendar.gregorian") },
                { value: "jalali", label: t("settings.calendar.jalali") },
              ]}
            />
          )}
          <div className={styles.row}>
            <FormField label={t("settings.weekStart.label")}>
              <Select
                value={String(prefs.weekStart)}
                onValueChange={(v) => update("weekStart", Number(v))}
                options={WEEKDAY_ORDER.map((d) => ({
                  value: String(d),
                  label: weekdays[d] ?? String(d),
                }))}
              />
            </FormField>
            <FormField
              label={t("settings.budgetMonthStartDay.label")}
              hint={t("settings.budgetMonthStartDay.hint")}
            >
              <Select
                value={String(prefs.budgetMonthStartDay)}
                onValueChange={(v) => update("budgetMonthStartDay", Number(v))}
                options={MONTH_DAYS.map((d) => ({
                  value: String(d),
                  label: t("settings.budgetMonthStartDay.option", { day: format.number(d) }),
                }))}
              />
            </FormField>
          </div>
        </Card>

        <StorageInfoCard />
        <BackupCard />
        <AutoBackupCard />
        <DeleteAllCard />
      </div>
    </>
  );
}
