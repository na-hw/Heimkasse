"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useId, useMemo } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  ColorPicker,
  DatePicker,
  Dialog,
  FormField,
  IconPicker,
  Input,
  MoneyInput,
} from "@/components/ui";
import { FormDialogFooter } from "@/features/shared/components/FormDialogFooter";
import styles from "@/features/shared/components/EntityList.module.css";
import { useGoalMutations } from "../hooks";
import { type SavingsGoal, type SavingsGoalCreate, savingsGoalCreateSchema } from "../schemas";

interface Props {
  target: { goal: SavingsGoal | null } | null;
  onClose: () => void;
}

/** Create/edit a savings goal. */
export function GoalFormDialog({ target, onClose }: Props) {
  const { t } = useTranslation();
  const formId = useId();
  const { create, update } = useGoalMutations();
  const goal = target?.goal ?? null;
  const open = target !== null;

  const initial = useMemo<SavingsGoalCreate>(
    () => ({
      name: goal?.name ?? "",
      target_cents: goal?.target_cents ?? (null as unknown as number),
      target_date: goal?.target_date ?? null,
      color: goal?.color ?? "green",
      icon: goal?.icon ?? "piggy-bank",
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recompute only when the dialog target changes
    [target],
  );
  const form = useForm<SavingsGoalCreate>({
    resolver: zodResolver(savingsGoalCreateSchema),
    defaultValues: initial,
  });
  useEffect(() => {
    if (open) form.reset(initial);
  }, [open, initial, form]);
  const { errors } = form.formState;
  const color = useWatch({ control: form.control, name: "color" }) ?? "green";

  const submit = form.handleSubmit(async (values) => {
    const { name, target_cents, target_date, color, icon } = values;
    const patch = { name, target_cents, target_date, color, icon };
    if (goal) await update.mutateAsync({ id: goal.id, patch });
    else await create.mutateAsync(patch);
    onClose();
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !next && onClose()}
      title={goal ? t("goals.edit") : t("goals.new")}
      footer={
        <FormDialogFooter
          formId={formId}
          submitLabel={goal ? t("common.saveChanges") : t("common.create")}
          loading={create.isPending || update.isPending}
          onCancel={onClose}
        />
      }
    >
      <form id={formId} noValidate onSubmit={(e) => void submit(e)} className={styles.form}>
        <FormField label={t("goals.fields.name")} required error={errors.name?.message}>
          <Input
            autoFocus
            placeholder={t("goals.fields.namePlaceholder")}
            {...form.register("name")}
          />
        </FormField>
        <div className={styles.formRow}>
          <FormField label={t("goals.fields.target")} required error={errors.target_cents?.message}>
            <Controller
              control={form.control}
              name="target_cents"
              render={({ field }) => (
                <MoneyInput
                  value={field.value ?? null}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
              )}
            />
          </FormField>
          <FormField label={t("goals.fields.targetDate")} error={errors.target_date?.message}>
            <Controller
              control={form.control}
              name="target_date"
              render={({ field }) => (
                <DatePicker value={field.value ?? null} onChange={field.onChange} clearable />
              )}
            />
          </FormField>
        </div>
        <Controller
          control={form.control}
          name="color"
          render={({ field }) => (
            <ColorPicker value={field.value ?? "green"} onChange={field.onChange} />
          )}
        />
        <Controller
          control={form.control}
          name="icon"
          render={({ field }) => (
            <IconPicker
              value={field.value ?? "piggy-bank"}
              onChange={field.onChange}
              color={color}
            />
          )}
        />
      </form>
    </Dialog>
  );
}
