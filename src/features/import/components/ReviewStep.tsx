"use client";

import { Wand2 } from "lucide-react";
import { memo } from "react";
import { useTranslation } from "react-i18next";
import {
  Amount,
  Badge,
  type BadgeTone,
  Button,
  Checkbox,
  Combobox,
  type ComboboxOption,
  FormField,
} from "@/components/ui";
import { useFormat } from "@/lib/i18n/useFormat";
import { type CandidateStatus, type ImportCandidate, summarize } from "../review";
import styles from "./ImportScreen.module.css";

const STATUS_TONE: Record<CandidateStatus, BadgeTone> = {
  new: "success",
  duplicate: "neutral",
  possibleDuplicate: "warning",
  invalid: "danger",
};

interface Props {
  candidates: ImportCandidate[];
  categoryOptions: { income: ComboboxOption[]; expense: ComboboxOption[] };
  importing: boolean;
  onChange: (line: number, patch: Partial<ImportCandidate>) => void;
  onSelectAll: (selected: boolean) => void;
  onBack: () => void;
  onImport: () => void;
}

const CandidateRow = memo(function CandidateRow({
  candidate: c,
  options,
  onChange,
}: {
  candidate: ImportCandidate;
  options: ComboboxOption[];
  onChange: Props["onChange"];
}) {
  const { t } = useTranslation();
  const fmt = useFormat();
  const invalid = c.status === "invalid";
  const title = c.payee ?? c.note ?? t("categories.uncategorized");
  const signed = c.type === "expense" ? -c.amountCents : c.amountCents;
  return (
    <li className={styles.candidate} data-status={c.status}>
      <Checkbox
        aria-label={t("import.review.include", {
          title,
          date: c.date ? fmt.date(c.date, "medium") : "",
        })}
        checked={c.selected && !invalid}
        disabled={invalid}
        onCheckedChange={(v) => onChange(c.line, { selected: v === true })}
      />
      <div className={styles.candidateMain}>
        <span className={styles.candidateTitle}>{title}</span>
        <span className={styles.candidateMeta}>
          {c.date ? fmt.date(c.date, "medium") : t("import.errors.date")}
          {c.payee && c.note ? ` · ${c.note}` : ""}
        </span>
        <span className={styles.candidateBadges}>
          <Badge tone={STATUS_TONE[c.status]}>{t(`import.status.${c.status}`)}</Badge>
          {c.ruleApplied && (
            <Badge tone="info" icon={<Wand2 />}>
              {t("import.review.ruleApplied")}
            </Badge>
          )}
          {c.errors.map((e) => (
            <Badge key={e} tone="danger">
              {t(`import.errors.${e}`)}
            </Badge>
          ))}
        </span>
      </div>
      {!invalid && (
        <div className={styles.candidateCategory}>
          <FormField label={t("import.review.categoryFor", { title })} hideLabel>
            <Combobox
              value={c.categoryId}
              onChange={(categoryId) => onChange(c.line, { categoryId })}
              options={options}
              placeholder={t("categories.uncategorized")}
            />
          </FormField>
        </div>
      )}
      <span className={styles.candidateAmount}>
        {invalid ? "–" : <Amount cents={signed} withIcon />}
      </span>
    </li>
  );
});

/** Step 3: review rows, adjust categories, include/exclude duplicates, then save. */
export function ReviewStep({
  candidates,
  categoryOptions,
  importing,
  onChange,
  onSelectAll,
  onBack,
  onImport,
}: Props) {
  const { t } = useTranslation();
  const fmt = useFormat();
  const summary = summarize(candidates);
  const selectable = candidates.filter((c) => c.status !== "invalid");
  const allSelected = selectable.length > 0 && selectable.every((c) => c.selected);
  const someSelected = selectable.some((c) => c.selected);

  return (
    <div className={styles.step}>
      <dl className={styles.summary}>
        {(
          [
            ["total", summary.total],
            ["selected", summary.selected],
            ["duplicates", summary.duplicates],
            ["possibleDuplicates", summary.possibleDuplicates],
            ["invalid", summary.invalid],
          ] as const
        ).map(([key, value]) => (
          <div key={key} className={styles.summaryItem}>
            <dt>{t(`import.review.summary.${key}`)}</dt>
            <dd>{fmt.number(value)}</dd>
          </div>
        ))}
      </dl>
      {summary.duplicates + summary.possibleDuplicates > 0 && (
        <p className={styles.hint}>{t("import.review.duplicateHint")}</p>
      )}
      <Checkbox
        label={t("import.review.selectAll")}
        checked={allSelected ? true : someSelected ? "indeterminate" : false}
        onCheckedChange={() => onSelectAll(!allSelected)}
      />
      <ul className={styles.candidates} aria-label={t("import.review.listLabel")}>
        {candidates.map((c) => (
          <CandidateRow
            key={c.line}
            candidate={c}
            options={categoryOptions[c.type]}
            onChange={onChange}
          />
        ))}
      </ul>
      <div className={styles.actions}>
        <span className={styles.spacer} />
        <Button onClick={onBack} disabled={importing}>
          {t("common.back")}
        </Button>
        <Button
          variant="primary"
          loading={importing}
          disabled={summary.selected === 0}
          onClick={onImport}
        >
          {t("import.review.import", {
            count: summary.selected,
            formatted: fmt.number(summary.selected),
          })}
        </Button>
      </div>
    </div>
  );
}
