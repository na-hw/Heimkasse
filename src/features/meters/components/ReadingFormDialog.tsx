"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useId, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { DatePicker, Dialog, FormField, Input, NumberInput } from "@/components/ui";
import { FormDialogFooter } from "@/features/shared/components/FormDialogFooter";
import styles from "@/features/shared/components/EntityList.module.css";
import { useFormat } from "@/lib/i18n/useFormat";
import { todayIso } from "@/lib/utils/dates";
import { neighbours } from "../consumption";
import { useMeterMutations } from "../hooks";
import {
  type Meter,
  type MeterReading,
  type MeterReadingCreate,
  meterReadingCreateSchema,
} from "../schemas";

interface Props {
  /** null = closed; reading null = create. */
  target: { meter: Meter; readings: MeterReading[]; reading: MeterReading | null } | null;
  onClose: () => void;
}

/** Records or edits a meter reading; a meter can only count up. */
export function ReadingFormDialog({ target, onClose }: Props) {
  const { t } = useTranslation();
  const format = useFormat();
  const formId = useId();
  const { createReading, updateReading } = useMeterMutations();
  const open = target !== null;
  const reading = target?.reading ?? null;

  const initial = useMemo<MeterReadingCreate>(
    () => ({
      meter_id: target?.meter.id ?? "",
      date: reading?.date ?? todayIso(),
      value: reading?.value ?? (null as unknown as number),
      note: reading?.note ?? "",
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recompute only when the dialog target changes
    [target],
  );
  const form = useForm<MeterReadingCreate>({
    resolver: zodResolver(meterReadingCreateSchema),
    defaultValues: initial,
  });
  useEffect(() => {
    if (open) form.reset(initial);
  }, [open, initial, form]);
  const { errors } = form.formState;
  const unit = target?.meter.unit ?? "";

  const submit = form.handleSubmit(async (values) => {
    if (!target) return;
    const { previous, next } = neighbours(target.readings, values.date, reading?.id);
    const shown = (v: number) => `${format.number(v, { maximumFractionDigits: 3 })} ${unit}`;
    if (previous && values.value < previous.value) {
      form.setError("value", {
        message: t("meters.readings.tooLow", { value: shown(previous.value) }),
      });
      return;
    }
    if (next && values.value > next.value) {
      form.setError("value", {
        message: t("meters.readings.tooHigh", { value: shown(next.value) }),
      });
      return;
    }
    const { date, value, note } = values;
    if (reading) await updateReading.mutateAsync({ id: reading.id, patch: { date, value, note } });
    else await createReading.mutateAsync(values);
    onClose();
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !next && onClose()}
      title={reading ? t("meters.readings.edit") : t("meters.readings.new")}
      description={target?.meter.name}
      footer={
        <FormDialogFooter
          formId={formId}
          submitLabel={reading ? t("common.saveChanges") : t("common.save")}
          loading={createReading.isPending || updateReading.isPending}
          onCancel={onClose}
        />
      }
    >
      <form id={formId} noValidate onSubmit={(e) => void submit(e)} className={styles.form}>
        <div className={styles.formRow}>
          <FormField label={t("meters.fields.value")} required error={errors.value?.message}>
            <Controller
              control={form.control}
              name="value"
              render={({ field }) => (
                <NumberInput
                  autoFocus
                  value={field.value ?? null}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  maxDecimals={3}
                  min={0}
                  unit={unit}
                />
              )}
            />
          </FormField>
          <FormField label={t("meters.fields.date")} required error={errors.date?.message}>
            <Controller
              control={form.control}
              name="date"
              render={({ field }) => (
                <DatePicker
                  value={field.value}
                  onChange={(v) => field.onChange(v ?? "")}
                  max={todayIso()}
                />
              )}
            />
          </FormField>
        </div>
        <FormField label={t("meters.fields.note")} error={errors.note?.message}>
          <Input {...form.register("note")} />
        </FormField>
      </form>
    </Dialog>
  );
}
