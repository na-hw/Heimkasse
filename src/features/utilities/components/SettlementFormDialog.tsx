"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useId, useMemo } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { type z } from "zod";
import { Dialog, FormField, MoneyInput, Select, Textarea } from "@/components/ui";
import { FormDialogFooter } from "@/features/shared/components/FormDialogFooter";
import styles from "@/features/shared/components/EntityList.module.css";
import { useFormat } from "@/lib/i18n/useFormat";
import { useSettlementMutations } from "../hooks";
import { type UtilitySettlement, utilitySettlementCreateSchema } from "../schemas";
import { prepaidTotal, settlementResult } from "../settlement";

const formSchema = utilitySettlementCreateSchema.omit({ result_cents: true });
type SettlementForm = z.input<typeof formSchema>;

interface Props {
  target: { settlement: UtilitySettlement | null } | null;
  onClose: () => void;
  /** Years that already have a settlement (one per year). */
  usedYears: ReadonlySet<number>;
}

/** Records a yearly Nebenkosten settlement; the result is calculated. */
export function SettlementFormDialog({ target, onClose, usedYears }: Props) {
  const { t } = useTranslation();
  const format = useFormat();
  const formId = useId();
  const { create, update } = useSettlementMutations();
  const settlement = target?.settlement ?? null;
  const open = target !== null;

  const initial = useMemo<SettlementForm>(
    () => ({
      year: settlement?.year ?? new Date().getFullYear() - 1,
      monthly_prepayment_cents: settlement?.monthly_prepayment_cents ?? (null as unknown as number),
      actual_cost_cents: settlement?.actual_cost_cents ?? (null as unknown as number),
      notes: settlement?.notes ?? "",
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recompute only when the dialog target changes
    [target],
  );
  const form = useForm<SettlementForm>({
    resolver: zodResolver(formSchema),
    defaultValues: initial,
  });
  useEffect(() => {
    if (open) form.reset(initial);
  }, [open, initial, form]);
  const { errors } = form.formState;
  const yearOptions = useMemo(() => {
    const current = new Date().getFullYear();
    const years = Array.from({ length: 16 }, (_, i) => current + 1 - i);
    return settlement && !years.includes(settlement.year) ? [...years, settlement.year] : years;
  }, [settlement]);
  const [monthly, actual] = useWatch({
    control: form.control,
    name: ["monthly_prepayment_cents", "actual_cost_cents"],
  });
  const canPreview = Number.isInteger(monthly) && Number.isInteger(actual);
  const result = canPreview ? settlementResult(monthly, actual) : null;

  const submit = form.handleSubmit(async (values) => {
    if (values.year !== settlement?.year && usedYears.has(values.year)) {
      form.setError("year", { message: t("settlements.duplicateYear") });
      return;
    }
    const input = {
      year: values.year,
      monthly_prepayment_cents: values.monthly_prepayment_cents,
      actual_cost_cents: values.actual_cost_cents,
      notes: values.notes,
      result_cents: settlementResult(values.monthly_prepayment_cents, values.actual_cost_cents),
    };
    if (settlement) await update.mutateAsync({ id: settlement.id, patch: input });
    else await create.mutateAsync(input);
    onClose();
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !next && onClose()}
      title={settlement ? t("settlements.edit") : t("settlements.new")}
      footer={
        <FormDialogFooter
          formId={formId}
          submitLabel={settlement ? t("common.saveChanges") : t("common.save")}
          loading={create.isPending || update.isPending}
          onCancel={onClose}
        />
      }
    >
      <form id={formId} noValidate onSubmit={(e) => void submit(e)} className={styles.form}>
        <FormField label={t("settlements.fields.year")} required error={errors.year?.message}>
          <Controller
            control={form.control}
            name="year"
            render={({ field }) => (
              <Select
                value={String(field.value)}
                onValueChange={(v) => field.onChange(Number(v))}
                options={yearOptions.map((y) => ({
                  value: String(y),
                  label: format.date(`${y}-01-01`, "year"),
                }))}
              />
            )}
          />
        </FormField>
        <div className={styles.formRow}>
          <FormField
            label={t("settlements.fields.prepayment")}
            required
            error={errors.monthly_prepayment_cents?.message}
          >
            <Controller
              control={form.control}
              name="monthly_prepayment_cents"
              render={({ field }) => (
                <MoneyInput
                  value={field.value ?? null}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
              )}
            />
          </FormField>
          <FormField
            label={t("settlements.fields.actual")}
            required
            error={errors.actual_cost_cents?.message}
          >
            <Controller
              control={form.control}
              name="actual_cost_cents"
              render={({ field }) => (
                <MoneyInput
                  value={field.value ?? null}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
              )}
            />
          </FormField>
        </div>
        {result !== null && (
          <p className={styles.meta} aria-live="polite">
            {t("settlements.prepaidTotal")}: {format.money(prepaidTotal(monthly))} ·{" "}
            <strong>
              {result > 0
                ? t("settlements.refund")
                : result < 0
                  ? t("settlements.backPayment")
                  : t("settlements.balanced")}
              : {format.money(Math.abs(result))}
            </strong>
          </p>
        )}
        <FormField label={t("settlements.fields.notes")} error={errors.notes?.message}>
          <Textarea rows={3} {...form.register("notes")} />
        </FormField>
      </form>
    </Dialog>
  );
}
