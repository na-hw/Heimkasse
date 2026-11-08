"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useId, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Combobox, Dialog, FormField, MoneyInput, NumberInput } from "@/components/ui";
import { useAllCategories } from "@/features/categories/hooks";
import { categoryOptions } from "@/features/categories/options";
import { FormDialogFooter } from "@/features/shared/components/FormDialogFooter";
import styles from "@/features/shared/components/EntityList.module.css";
import { useBudgetMutations } from "../hooks";
import { type Budget, type BudgetCreate, budgetCreateSchema } from "../schemas";

interface BudgetFormDialogProps {
  /** null = closed, { budget: null } = create, { budget } = edit. */
  target: { budget: Budget | null } | null;
  onClose: () => void;
  /** Categories that already have a budget (excluded when creating). */
  usedCategoryIds: ReadonlySet<string>;
}

/** Create/edit a monthly budget for an expense category. */
export function BudgetFormDialog({ target, onClose, usedCategoryIds }: BudgetFormDialogProps) {
  const { t } = useTranslation();
  const formId = useId();
  const categories = useAllCategories();
  const { create, update } = useBudgetMutations();
  const budget = target?.budget ?? null;
  const open = target !== null;

  const options = useMemo(
    () =>
      categoryOptions(t, categories.data ?? [], "expense").filter(
        (o) => o.value === budget?.category_id || !usedCategoryIds.has(o.value),
      ),
    [t, categories.data, budget, usedCategoryIds],
  );

  const initial = useMemo<BudgetCreate>(
    () =>
      budget
        ? {
            category_id: budget.category_id,
            amount_cents: budget.amount_cents,
            alert_threshold_percent: budget.alert_threshold_percent,
          }
        : {
            // Empty until chosen; Zod reports "required" for null.
            category_id: null as unknown as string,
            amount_cents: null as unknown as number,
            alert_threshold_percent: 80,
          },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recompute only when the dialog target changes
    [target],
  );
  const form = useForm<BudgetCreate>({
    resolver: zodResolver(budgetCreateSchema),
    defaultValues: initial,
  });
  useEffect(() => {
    if (open) form.reset(initial);
  }, [open, initial, form]);
  const { errors } = form.formState;

  const submit = form.handleSubmit(async (values) => {
    const { category_id, amount_cents, alert_threshold_percent } = values;
    if (budget)
      await update.mutateAsync({
        id: budget.id,
        patch: { category_id, amount_cents, alert_threshold_percent },
      });
    else await create.mutateAsync(values);
    onClose();
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !next && onClose()}
      title={budget ? t("budgets.edit") : t("budgets.new")}
      footer={
        <FormDialogFooter
          formId={formId}
          submitLabel={budget ? t("common.saveChanges") : t("common.create")}
          loading={create.isPending || update.isPending}
          onCancel={onClose}
        />
      }
    >
      <form id={formId} noValidate onSubmit={(e) => void submit(e)} className={styles.form}>
        <FormField
          label={t("budgets.fields.category")}
          hint={options.length === 0 ? t("budgets.noCategories") : t("budgets.fields.categoryHint")}
          required
          error={errors.category_id?.message}
        >
          <Controller
            control={form.control}
            name="category_id"
            render={({ field }) => (
              <Combobox
                value={field.value ?? null}
                onChange={field.onChange}
                placeholder={t("common.selectPlaceholder")}
                options={options}
              />
            )}
          />
        </FormField>
        <div className={styles.formRow}>
          <FormField
            label={t("budgets.fields.amount")}
            required
            error={errors.amount_cents?.message}
          >
            <Controller
              control={form.control}
              name="amount_cents"
              render={({ field }) => (
                <MoneyInput
                  value={field.value ?? null}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  ref={field.ref}
                />
              )}
            />
          </FormField>
          <FormField
            label={t("budgets.fields.threshold")}
            hint={t("budgets.fields.thresholdHint")}
            required
            error={errors.alert_threshold_percent?.message}
          >
            <Controller
              control={form.control}
              name="alert_threshold_percent"
              render={({ field }) => (
                <NumberInput
                  value={field.value ?? null}
                  onChange={(v) => field.onChange(v ?? undefined)}
                  onBlur={field.onBlur}
                  maxDecimals={0}
                  min={1}
                  max={100}
                  unit="%"
                />
              )}
            />
          </FormField>
        </div>
      </form>
    </Dialog>
  );
}
