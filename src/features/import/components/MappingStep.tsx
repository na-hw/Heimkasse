"use client";

import { Save } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Amount, Badge, Button, FormField, Select, Switch } from "@/components/ui";
import { useFormat } from "@/lib/i18n/useFormat";
import { CSV_ENCODINGS } from "../csv/decode";
import { CSV_DELIMITERS } from "../csv/parse";
import type { ParsedFile } from "../detect";
import { extractRows } from "../extract";
import {
  type BankPreset,
  type ImportFormat,
  MAPPING_FIELDS,
  type MappingField,
  REQUIRED_MAPPING_FIELDS,
} from "../format";
import { DATE_FORMATS, DECIMAL_SEPARATORS } from "../values";
import styles from "./ImportScreen.module.css";

const NONE = "none";
const AUTO = "auto";
const PREVIEW_ROWS = 5;
const MAX_HEADER_ROW = 30;

const DELIMITER_KEYS = { ";": "semicolon", ",": "comma", "\t": "tab", "|": "pipe" } as const;
const DATE_FORMAT_KEYS = {
  "dd.mm.yyyy": "dmyDots",
  "dd.mm.yy": "dmyShort",
  "yyyy-mm-dd": "iso",
  "dd/mm/yyyy": "dmySlash",
  "mm/dd/yyyy": "mdySlash",
} as const;

interface Props {
  file: ParsedFile;
  format: ImportFormat;
  presets: readonly BankPreset[];
  presetId: string | null;
  onFormatChange: (patch: Partial<ImportFormat>) => void;
  onPresetChange: (id: string) => void;
  onSavePreset: () => void;
  onBack: () => void;
  onNext: () => void;
}

/** Step 2: file settings, column mapping and a live preview. */
export function MappingStep({
  file,
  format,
  presets,
  presetId,
  onFormatChange,
  onPresetChange,
  onSavePreset,
  onBack,
  onNext,
}: Props) {
  const { t } = useTranslation();
  const fmt = useFormat();
  const preview = useMemo(
    () => extractRows(file.rows, format).slice(0, PREVIEW_ROWS),
    [file.rows, format],
  );
  const dataRows = Math.max(file.rows.length - format.headerRow - 1, 0);
  const missing = REQUIRED_MAPPING_FIELDS.filter((f) => format.mapping[f] === null);

  const columnOptions = [
    { value: NONE, label: t("import.mapping.notMapped") },
    ...file.header.map((name, index) => ({
      value: String(index),
      label: name || t("import.mapping.column", { number: fmt.number(index + 1) }),
    })),
  ];
  const setColumn = (field: MappingField, value: string) =>
    onFormatChange({
      mapping: { ...format.mapping, [field]: value === NONE ? null : Number(value) },
    });

  return (
    <div className={styles.step}>
      <section aria-labelledby="import-file-settings" className={styles.section}>
        <h2 id="import-file-settings" className={styles.sectionTitle}>
          {t("import.mapping.fileSettings")}
        </h2>
        <div className={styles.grid}>
          <FormField label={t("import.mapping.preset")} hint={t("import.mapping.presetHint")}>
            <Select
              value={presetId ?? AUTO}
              onValueChange={onPresetChange}
              options={[
                { value: AUTO, label: t("import.mapping.noPreset") },
                ...presets.map((p) => ({ value: p.id, label: p.name })),
              ]}
            />
          </FormField>
          <FormField label={t("import.mapping.encoding")}>
            <Select
              value={format.encoding}
              onValueChange={(encoding) => onFormatChange({ encoding })}
              options={CSV_ENCODINGS.map((e) => ({ value: e, label: t(`import.encodings.${e}`) }))}
            />
          </FormField>
          <FormField label={t("import.mapping.delimiter")}>
            <Select
              value={format.delimiter}
              onValueChange={(delimiter) => onFormatChange({ delimiter })}
              options={CSV_DELIMITERS.map((d) => ({
                value: d,
                label: t(`import.delimiters.${DELIMITER_KEYS[d]}`),
              }))}
            />
          </FormField>
          <FormField label={t("import.mapping.headerRow")} hint={t("import.mapping.headerRowHint")}>
            <Select
              value={String(format.headerRow)}
              onValueChange={(v) => onFormatChange({ headerRow: Number(v) })}
              options={Array.from(
                { length: Math.min(file.rows.length, MAX_HEADER_ROW) },
                (_, i) => ({
                  value: String(i),
                  label: t("import.mapping.rowOption", {
                    number: fmt.number(i + 1),
                    text: (file.rows[i] ?? []).filter(Boolean).slice(0, 3).join(" · "),
                  }),
                }),
              )}
            />
          </FormField>
          <FormField label={t("import.mapping.dateFormat")}>
            <Select
              value={format.dateFormat}
              onValueChange={(dateFormat) => onFormatChange({ dateFormat })}
              options={DATE_FORMATS.map((d) => ({
                value: d,
                label: t(`import.dateFormats.${DATE_FORMAT_KEYS[d]}`),
              }))}
            />
          </FormField>
          <FormField label={t("import.mapping.decimal")}>
            <Select
              value={format.decimal}
              onValueChange={(decimal) => onFormatChange({ decimal })}
              options={DECIMAL_SEPARATORS.map((d) => ({
                value: d,
                label: t(`import.decimals.${d}`),
              }))}
            />
          </FormField>
        </div>
        <Switch
          label={t("import.mapping.invert")}
          description={t("import.mapping.invertHint")}
          checked={format.invertAmounts}
          onCheckedChange={(invertAmounts) => onFormatChange({ invertAmounts })}
        />
      </section>

      <section aria-labelledby="import-columns" className={styles.section}>
        <h2 id="import-columns" className={styles.sectionTitle}>
          {t("import.mapping.columns")}
        </h2>
        <div className={styles.grid}>
          {MAPPING_FIELDS.map((field) => (
            <FormField
              key={field}
              label={t(`import.fields.${field}`)}
              hint={field === "payeeIncome" ? t("import.fields.payeeIncomeHint") : undefined}
              required={REQUIRED_MAPPING_FIELDS.includes(field)}
              error={missing.includes(field) ? t("import.mapping.required") : undefined}
            >
              <Select
                value={format.mapping[field] === null ? NONE : String(format.mapping[field])}
                onValueChange={(v) => setColumn(field, v)}
                options={columnOptions}
              />
            </FormField>
          ))}
        </div>
      </section>

      <section aria-labelledby="import-preview" className={styles.section}>
        <h2 id="import-preview" className={styles.sectionTitle}>
          {t("import.mapping.preview", { count: dataRows, formatted: fmt.number(dataRows) })}
        </h2>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">{t("import.fields.date")}</th>
                <th scope="col">{t("import.fields.payee")}</th>
                <th scope="col">{t("import.fields.note")}</th>
                <th scope="col" className={styles.numeric}>
                  {t("import.fields.amount")}
                </th>
              </tr>
            </thead>
            <tbody>
              {preview.map((row) => (
                <tr key={row.line}>
                  <td>
                    {row.date ? (
                      fmt.date(row.date, "medium")
                    ) : (
                      <Badge tone="danger">{t("import.errors.date")}</Badge>
                    )}
                  </td>
                  <td>{row.payee ?? "–"}</td>
                  <td className={styles.noteCell}>{row.note ?? "–"}</td>
                  <td className={styles.numeric}>
                    {row.amountCents === null ? (
                      <Badge tone="danger">{t("import.errors.amount")}</Badge>
                    ) : (
                      <Amount cents={row.amountCents} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className={styles.actions}>
        <Button variant="ghost" iconStart={<Save />} onClick={onSavePreset}>
          {t("import.presets.saveAs")}
        </Button>
        <span className={styles.spacer} />
        <Button onClick={onBack}>{t("common.back")}</Button>
        <Button variant="primary" disabled={missing.length > 0 || dataRows === 0} onClick={onNext}>
          {t("import.mapping.next")}
        </Button>
      </div>
    </div>
  );
}
