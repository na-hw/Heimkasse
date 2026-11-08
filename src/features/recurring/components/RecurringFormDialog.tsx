"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useId, useMemo } from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { DatePicker, Dialog, FormField, NumberInput, Select, Switch } from "@/components/ui";
import { useAccounts } from "@/features/accounts/hooks";
import { FormDialogFooter } from "@/features/shared/components/FormDialogFooter";
import { TransactionFields } from "@/features/transactions/components/TransactionFields";
import formStyles from "@/features/transactions/components/TransactionForm.module.css";
import { useUiStore } from "@/lib/preferences/uiStore";
import { todayIso } from "@/lib/utils/dates";
import { validationMessage } from "@/lib/validation/messages";
import { useRecurringMutations } from "../hooks";
import { FREQUENCIES, type RecurringRule, recurringRuleCreateSchema } from "../schemas";
import type { z } from "zod";

const ruleFormSchema = recurringRuleCreateSchema
  .omit({ next_run_date: true })
  .refine(
    (r) =>
      r.type !== "transfer" ||
      (r.transfer_account_id !== null && r.transfer_account_id !== r.account_id),
    {
      path: ["transfer_account_id"],
      message: validationMessage("validation.required"),
    },
  )
  .refine((r) => !r.end_date || r.end_date >= r.start_date, {
    path: ["end_date"],
    message: validationMessage("validation.invalidDate"),
  });

type RuleForm = z.input<typeof ruleFormSchema>;

interface Props {
  /** null = closed, { rule: null } = create, { rule } = edit. */
  target: { rule: RecurringRule | null } | null;
  onClose: () => void;
}

/** Create/edit a recurring payment. Edits apply to future occurrences only. */
export function RecurringFormDialog({ target, onClose }: Props) {
  const { t } = useTranslation();
  const formId = useId();
  const accounts = useAccounts();
  const lastAccountId = useUiStore((s) => s.lastAccountId);
  const { create, update } = useRecurringMutations();
  const rule = target?.rule ?? null;
  const active = accounts.data?.active ?? [];
  const fallbackAccount = active.find((a) => a.id === lastAccountId)?.id ?? active[0]?.id ?? "";

  const initial = useMemo<RuleForm>(
    () =>
      rule
        ? {
            type: rule.type,
            amount_cents: rule.amount_cents,
            account_id: rule.account_id,
            transfer_account_id: rule.transfer_account_id,
            category_id: rule.category_id,
            payee: rule.payee,
            note: rule.note,
            payment_method: rule.payment_method,
            tags: rule.tags,
            tax_category: rule.tax_category,
            frequency: rule.frequency,
            interval: rule.interval,
            start_date: rule.start_date,
            end_date: rule.end_date,
            auto_create: rule.auto_create,
          }
        : {
            type: "expense",
            amount_cents: null as unknown as number,
            account_id: fallbackAccount,
            transfer_account_id: null,
            category_id: null,
            payee: "",
            note: "",
            payment_method: null,
            tags: [],
            tax_category: null,
            frequency: "monthly",
            interval: 1,
            start_date: todayIso(),
            end_date: null,
            auto_create: true,
          },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recompute only when the dialog target changes
    [target, fallbackAccount],
  );
  const form = useForm<RuleForm>({
    resolver: zodResolver(ruleFormSchema),
    defaultValues: initial,
  });
  // Fresh form for every opening (the dialog component stays mounted).
  useEffect(() => {
    if (target !== null) form.reset(initial);
  }, [target, initial, form]);
  const { errors } = form.formState;
  const selectable = (accounts.data?.all ?? []).filter(
    (a) => !a.archived || a.id === rule?.account_id || a.id === rule?.transfer_account_id,
  );

  const submit = form.handleSubmit(async (values) => {
    const { paused: _p, ...data } = values;
    if (rule) await update.mutateAsync({ rule, patch: data });
    else await create.mutateAsync(values);
    onClose();
  });

  return (
    <Dialog
      open={target !== null}
      onOpenChange={(open) => !open && onClose()}
      size="lg"
      title={rule ? t("recurring.edit") : t("recurring.new")}
      footer={
        <FormDialogFooter
          formId={formId}
          submitLabel={rule ? t("common.saveChanges") : t("common.create")}
          loading={create.isPending || update.isPending}
          onCancel={onClose}
        />
      }
    >
      <FormProvider {...form}>
        <form id={formId} noValidate onSubmit={(e) => void submit(e)} className={formStyles.form}>
          <TransactionFields accounts={selectable}>
            <div className={formStyles.row}>
              <FormField label={t("recurring.fields.frequency")} required>
                <Controller
                  control={form.control}
                  name="frequency"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      options={FREQUENCIES.map((f) => ({
                        value: f,
                        label: t(`recurring.frequencies.${f}`),
                      }))}
                    />
                  )}
                />
              </FormField>
              <FormField
                label={t("recurring.fields.interval")}
                hint={t("recurring.fields.intervalHint")}
                error={errors.interval?.message}
              >
                <Controller
                  control={form.control}
                  name="interval"
                  render={({ field }) => (
                    <NumberInput
                      value={field.value ?? null}
                      onChange={(v) => field.onChange(v ?? undefined)}
                      maxDecimals={0}
                      min={1}
                      max={36}
                    />
                  )}
                />
              </FormField>
            </div>
            <div className={formStyles.row}>
              <FormField
                label={t("recurring.fields.startDate")}
                hint={rule ? undefined : t("recurring.fields.startDateHint")}
                required
                error={errors.start_date?.message}
              >
                <Controller
                  control={form.control}
                  name="start_date"
                  render={({ field }) => (
                    <DatePicker value={field.value} onChange={(v) => field.onChange(v ?? "")} />
                  )}
                />
              </FormField>
              <FormField
                label={t("recurring.fields.endDate")}
                showOptional
                error={errors.end_date?.message}
              >
                <Controller
                  control={form.control}
                  name="end_date"
                  render={({ field }) => (
                    <DatePicker clearable value={field.value ?? null} onChange={field.onChange} />
                  )}
                />
              </FormField>
            </div>
            <Controller
              control={form.control}
              name="auto_create"
              render={({ field }) => (
                <Switch
                  label={t("recurring.fields.autoCreate")}
                  description={t("recurring.fields.autoCreateHint")}
                  checked={field.value ?? true}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </TransactionFields>
        </form>
      </FormProvider>
    </Dialog>
  );
}
