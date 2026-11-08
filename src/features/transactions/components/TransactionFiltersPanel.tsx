"use client";

import { useTranslation } from "react-i18next";
import { Button, Checkbox, DateRangePicker, FormField, MoneyInput, Select } from "@/components/ui";
import type { Account } from "@/features/accounts/schemas";
import { categoryDisplayName } from "@/features/categories/displayName";
import type { Category } from "@/features/categories/schemas";
import { CATEGORY_TYPES } from "@/features/categories/schemas";
import { useTransactionFilters } from "../filtersStore";
import { TAX_CATEGORIES, TRANSACTION_TYPES, type TaxCategory } from "../schemas";
import styles from "./TransactionsScreen.module.css";

const ANY = "__any";

function toggle<T>(list: readonly T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

interface Props {
  accounts: Account[];
  categories: Category[];
  tags: string[];
}

/** All list filters; changes apply immediately. */
export function TransactionFiltersPanel({ accounts, categories, tags }: Props) {
  const { t } = useTranslation();
  const { filters, setFilter, reset } = useTransactionFilters();
  const roots = categories.filter((c) => !c.parent_id && !c.archived);

  return (
    <div className={styles.filters}>
      <FormField label={t("transactions.filters.dateRange")}>
        <DateRangePicker
          value={{ from: filters.dateFrom, to: filters.dateTo }}
          onChange={({ from, to }) => {
            setFilter("dateFrom", from);
            setFilter("dateTo", to);
          }}
        />
      </FormField>

      <fieldset className={styles.fieldset}>
        <legend>{t("transactions.filters.types")}</legend>
        {TRANSACTION_TYPES.map((type) => (
          <Checkbox
            key={type}
            label={t(`transactions.types.${type}`)}
            checked={filters.types.includes(type)}
            onCheckedChange={() => setFilter("types", toggle(filters.types, type))}
          />
        ))}
      </fieldset>

      {accounts.length > 0 && (
        <fieldset className={styles.fieldset}>
          <legend>{t("transactions.filters.accounts")}</legend>
          {accounts.map((a) => (
            <Checkbox
              key={a.id}
              label={a.name}
              checked={filters.accountIds.includes(a.id)}
              onCheckedChange={() => setFilter("accountIds", toggle(filters.accountIds, a.id))}
            />
          ))}
        </fieldset>
      )}

      {CATEGORY_TYPES.map((type) => {
        const list = roots.filter((c) => c.type === type);
        if (list.length === 0) return null;
        return (
          <fieldset key={type} className={styles.fieldset}>
            <legend>
              {t("transactions.filters.categories")} · {t(`categoryTypes.${type}`)}
            </legend>
            {list.map((c) => (
              <Checkbox
                key={c.id}
                label={categoryDisplayName(t, c)}
                checked={filters.categoryIds.includes(c.id)}
                onCheckedChange={() => setFilter("categoryIds", toggle(filters.categoryIds, c.id))}
              />
            ))}
          </fieldset>
        );
      })}

      <div className={styles.filterRow}>
        <FormField label={t("transactions.filters.amountMin")}>
          <MoneyInput value={filters.amountMin} onChange={(v) => setFilter("amountMin", v)} />
        </FormField>
        <FormField label={t("transactions.filters.amountMax")}>
          <MoneyInput value={filters.amountMax} onChange={(v) => setFilter("amountMax", v)} />
        </FormField>
      </div>

      {tags.length > 0 && (
        <fieldset className={styles.fieldset}>
          <legend>{t("transactions.filters.tags")}</legend>
          {tags.map((tag) => (
            <Checkbox
              key={tag}
              label={tag}
              checked={filters.tags.includes(tag)}
              onCheckedChange={() => setFilter("tags", toggle(filters.tags, tag))}
            />
          ))}
        </fieldset>
      )}

      <FormField label={t("transactions.filters.taxCategory")}>
        <Select
          value={filters.taxCategory ?? ANY}
          onValueChange={(v) => setFilter("taxCategory", v === ANY ? null : (v as TaxCategory))}
          options={[
            { value: ANY, label: t("transactions.filters.any") },
            ...TAX_CATEGORIES.map((c) => ({ value: c, label: t(`taxCategories.${c}`) })),
          ]}
        />
      </FormField>

      <Button variant="secondary" onClick={reset}>
        {t("transactions.filters.reset")}
      </Button>
    </div>
  );
}
