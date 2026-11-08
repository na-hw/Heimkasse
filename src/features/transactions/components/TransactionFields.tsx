"use client";

import type { ReactNode } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  Combobox,
  FormField,
  Input,
  MoneyInput,
  RadioGroup,
  Select,
  TagInput,
  Textarea,
} from "@/components/ui";
import type { Account } from "@/features/accounts/schemas";
import { useAllCategories } from "@/features/categories/hooks";
import { categoryOptions } from "@/features/categories/options";
import { useTransactionMeta } from "../hooks";
import {
  PAYMENT_METHODS,
  type PaymentMethod,
  TAX_CATEGORIES,
  type TaxCategory,
  TRANSACTION_TYPES,
  type TransactionType,
} from "../schemas";
import styles from "./TransactionForm.module.css";

const NONE = "__none";

/** Fields shared by transactions and recurring rules (both use the same names). */
export interface TransactionFieldValues {
  type: TransactionType;
  amount_cents: number;
  account_id: string;
  transfer_account_id: string | null;
  category_id: string | null;
  payee: string | null;
  note: string | null;
  payment_method: PaymentMethod | null;
  tags: string[];
  tax_category: TaxCategory | null;
}

interface TransactionFieldsProps {
  accounts: Account[];
  /** Rendered next to the amount (e.g. the date picker). */
  besideAmount?: ReactNode;
  /** Rendered after the main fields (e.g. schedule settings). */
  children?: ReactNode;
}

/** Type, amount, accounts, category, payee, note and optional details. */
export function TransactionFields({ accounts, besideAmount, children }: TransactionFieldsProps) {
  const { t } = useTranslation();
  const form = useFormContext<TransactionFieldValues>();
  const { errors } = form.formState;
  const categories = useAllCategories();
  const meta = useTransactionMeta();
  const type = useWatch({ control: form.control, name: "type" });
  const accountId = useWatch({ control: form.control, name: "account_id" });
  const hasDetails = Boolean(
    form.getValues("payment_method") ||
    form.getValues("tax_category") ||
    form.getValues("tags")?.length,
  );
  const accountOptions = accounts.map((a) => ({ value: a.id, label: a.name }));

  return (
    <>
      <Controller
        control={form.control}
        name="type"
        render={({ field }) => (
          <RadioGroup
            label={t("transactions.fields.type")}
            appearance="cards"
            orientation="horizontal"
            value={field.value}
            onValueChange={(next) => {
              field.onChange(next);
              if (next === "transfer") form.setValue("category_id", null);
              else {
                form.setValue("transfer_account_id", null);
                const current = categories.data?.find(
                  (c) => c.id === form.getValues("category_id"),
                );
                if (current && current.type !== next) form.setValue("category_id", null);
              }
            }}
            options={TRANSACTION_TYPES.map((v) => ({
              value: v,
              label: t(`transactions.types.${v}`),
            }))}
          />
        )}
      />
      <div className={styles.row}>
        <FormField
          label={t("transactions.fields.amount")}
          required
          error={errors.amount_cents?.message}
        >
          <Controller
            control={form.control}
            name="amount_cents"
            render={({ field }) => (
              <MoneyInput
                autoFocus
                value={field.value ?? null}
                onChange={field.onChange}
                onBlur={field.onBlur}
                ref={field.ref}
              />
            )}
          />
        </FormField>
        {besideAmount}
      </div>
      <div className={styles.row}>
        <FormField
          label={
            type === "transfer"
              ? t("transactions.fields.fromAccount")
              : t("transactions.fields.account")
          }
          required
          error={errors.account_id?.message}
        >
          <Controller
            control={form.control}
            name="account_id"
            render={({ field }) => (
              <Select
                value={field.value || undefined}
                onValueChange={field.onChange}
                options={accountOptions}
              />
            )}
          />
        </FormField>
        {type === "transfer" ? (
          <FormField
            label={t("transactions.fields.toAccount")}
            required
            error={errors.transfer_account_id?.message}
          >
            <Controller
              control={form.control}
              name="transfer_account_id"
              render={({ field }) => (
                <Select
                  value={field.value ?? undefined}
                  onValueChange={field.onChange}
                  options={accountOptions.filter((a) => a.value !== accountId)}
                />
              )}
            />
          </FormField>
        ) : (
          <FormField label={t("transactions.fields.category")} error={errors.category_id?.message}>
            <Controller
              control={form.control}
              name="category_id"
              render={({ field }) => (
                <Combobox
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={t("categories.uncategorized")}
                  options={categoryOptions(t, categories.data ?? [], type)}
                />
              )}
            />
          </FormField>
        )}
      </div>
      {children}
      <FormField label={t("transactions.fields.payee")} error={errors.payee?.message}>
        <Input
          list="payee-suggestions"
          placeholder={t("transactions.fields.payeePlaceholder")}
          autoComplete="off"
          {...form.register("payee")}
        />
      </FormField>
      <datalist id="payee-suggestions">
        {meta.data?.payees.map((p) => (
          <option key={p} value={p} />
        ))}
      </datalist>
      <FormField label={t("transactions.fields.note")} error={errors.note?.message}>
        <Textarea rows={2} {...form.register("note")} />
      </FormField>
      <details className={styles.details} open={hasDetails || undefined}>
        <summary className={styles.summary}>{t("transactions.fields.more")}</summary>
        <div className={styles.detailsBody}>
          <div className={styles.row}>
            <FormField label={t("transactions.fields.paymentMethod")}>
              <Controller
                control={form.control}
                name="payment_method"
                render={({ field }) => (
                  <Select
                    value={field.value ?? NONE}
                    onValueChange={(v) => field.onChange(v === NONE ? null : v)}
                    options={[
                      { value: NONE, label: t("transactions.fields.none") },
                      ...PAYMENT_METHODS.map((m) => ({
                        value: m,
                        label: t(`paymentMethods.${m}`),
                      })),
                    ]}
                  />
                )}
              />
            </FormField>
            <FormField label={t("transactions.fields.taxCategory")}>
              <Controller
                control={form.control}
                name="tax_category"
                render={({ field }) => (
                  <Select
                    value={field.value ?? NONE}
                    onValueChange={(v) => field.onChange(v === NONE ? null : v)}
                    options={[
                      { value: NONE, label: t("transactions.fields.none") },
                      ...TAX_CATEGORIES.map((c) => ({ value: c, label: t(`taxCategories.${c}`) })),
                    ]}
                  />
                )}
              />
            </FormField>
          </div>
          <FormField label={t("transactions.fields.tags")} error={errors.tags?.message}>
            <Controller
              control={form.control}
              name="tags"
              render={({ field }) => (
                <TagInput
                  value={field.value ?? []}
                  onChange={field.onChange}
                  suggestions={meta.data?.tags}
                />
              )}
            />
          </FormField>
        </div>
      </details>
    </>
  );
}
