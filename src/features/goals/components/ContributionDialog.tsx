"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useId, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { DatePicker, Dialog, FormField, Input, MoneyInput } from "@/components/ui";
import { FormDialogFooter } from "@/features/shared/components/FormDialogFooter";
import styles from "@/features/shared/components/EntityList.module.css";
import { todayIso } from "@/lib/utils/dates";
import { isoDateSchema, optionalText, positiveCentsSchema } from "@/lib/validation/common";
import { useGoalMutations } from "../hooks";
import type { SavingsGoal } from "../schemas";

const formSchema = z.object({
  amount_cents: positiveCentsSchema,
  date: isoDateSchema,
  note: optionalText(300),
});
type ContributionForm = z.input<typeof formSchema>;

interface Props {
  target: { goal: SavingsGoal; kind: "deposit" | "withdrawal" } | null;
  onClose: () => void;
}

/** Records a deposit or a withdrawal (stored as negative amount). */
export function ContributionDialog({ target, onClose }: Props) {
  const { t } = useTranslation();
  const formId = useId();
  const { addContribution } = useGoalMutations();
  const open = target !== null;
  const initial = useMemo<ContributionForm>(
    () => ({ amount_cents: null as unknown as number, date: todayIso(), note: "" }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fresh values for every opening
    [target],
  );
  const form = useForm<ContributionForm>({
    resolver: zodResolver(formSchema),
    defaultValues: initial,
  });
  useEffect(() => {
    if (open) form.reset(initial);
  }, [open, initial, form]);
  const { errors } = form.formState;

  const submit = form.handleSubmit(async (values) => {
    if (!target) return;
    await addContribution.mutateAsync({
      goal_id: target.goal.id,
      amount_cents: target.kind === "withdrawal" ? -values.amount_cents : values.amount_cents,
      date: values.date,
      note: values.note,
    });
    onClose();
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !next && onClose()}
      title={
        target?.kind === "withdrawal"
          ? t("goals.contribution.newWithdrawal")
          : t("goals.contribution.newDeposit")
      }
      description={target?.goal.name}
      footer={
        <FormDialogFooter
          formId={formId}
          submitLabel={t("common.save")}
          loading={addContribution.isPending}
          onCancel={onClose}
        />
      }
    >
      <form id={formId} noValidate onSubmit={(e) => void submit(e)} className={styles.form}>
        <div className={styles.formRow}>
          <FormField
            label={t("goals.contribution.amount")}
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
                />
              )}
            />
          </FormField>
          <FormField label={t("goals.contribution.date")} required error={errors.date?.message}>
            <Controller
              control={form.control}
              name="date"
              render={({ field }) => (
                <DatePicker value={field.value} onChange={(v) => field.onChange(v ?? "")} />
              )}
            />
          </FormField>
        </div>
        <FormField label={t("goals.contribution.note")} error={errors.note?.message}>
          <Input {...form.register("note")} />
        </FormField>
      </form>
    </Dialog>
  );
}
