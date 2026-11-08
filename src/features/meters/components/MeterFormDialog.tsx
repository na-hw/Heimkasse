"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useId, useMemo } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Dialog, FormField, Input, NumberInput, Select } from "@/components/ui";
import { FormDialogFooter } from "@/features/shared/components/FormDialogFooter";
import styles from "@/features/shared/components/EntityList.module.css";
import { DEFAULT_UNITS, centsToMillicents, millicentsToCents } from "../consumption";
import { useMeterMutations } from "../hooks";
import { METER_TYPES, type Meter, type MeterCreate, meterCreateSchema } from "../schemas";

interface Props {
  /** null = closed, { meter: null } = create, { meter } = edit. */
  target: { meter: Meter | null } | null;
  onClose: () => void;
  onCreated?: (meter: Meter) => void;
}

/** Create/edit a meter (type, unit, number, unit price in cent). */
export function MeterFormDialog({ target, onClose, onCreated }: Props) {
  const { t } = useTranslation();
  const formId = useId();
  const { create, update } = useMeterMutations();
  const meter = target?.meter ?? null;
  const open = target !== null;

  const initial = useMemo<MeterCreate>(
    () => ({
      name: meter?.name ?? "",
      type: meter?.type ?? "electricity",
      unit: meter?.unit ?? DEFAULT_UNITS.electricity,
      meter_number: meter?.meter_number ?? "",
      price_per_unit_millicents: meter?.price_per_unit_millicents ?? 0,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recompute only when the dialog target changes
    [target],
  );
  const form = useForm<MeterCreate>({
    resolver: zodResolver(meterCreateSchema),
    defaultValues: initial,
  });
  useEffect(() => {
    if (open) form.reset(initial);
  }, [open, initial, form]);
  const { errors } = form.formState;
  const unit = useWatch({ control: form.control, name: "unit" });

  const submit = form.handleSubmit(async (values) => {
    const { name, type, unit, meter_number, price_per_unit_millicents } = values;
    const patch = { name, type, unit, meter_number, price_per_unit_millicents };
    if (meter) await update.mutateAsync({ id: meter.id, patch });
    else onCreated?.(await create.mutateAsync(patch));
    onClose();
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !next && onClose()}
      title={meter ? t("meters.edit") : t("meters.new")}
      footer={
        <FormDialogFooter
          formId={formId}
          submitLabel={meter ? t("common.saveChanges") : t("common.create")}
          loading={create.isPending || update.isPending}
          onCancel={onClose}
        />
      }
    >
      <form id={formId} noValidate onSubmit={(e) => void submit(e)} className={styles.form}>
        <FormField label={t("meters.fields.name")} required error={errors.name?.message}>
          <Input
            autoFocus
            placeholder={t("meters.fields.namePlaceholder")}
            {...form.register("name")}
          />
        </FormField>
        <div className={styles.formRow}>
          <FormField label={t("meters.fields.type")} required>
            <Controller
              control={form.control}
              name="type"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(type) => {
                    field.onChange(type);
                    if (!meter) form.setValue("unit", DEFAULT_UNITS[type]);
                  }}
                  options={METER_TYPES.map((type) => ({
                    value: type,
                    label: t(`meters.types.${type}`),
                  }))}
                />
              )}
            />
          </FormField>
          <FormField label={t("meters.fields.unit")} required error={errors.unit?.message}>
            <Input {...form.register("unit")} />
          </FormField>
        </div>
        <div className={styles.formRow}>
          <FormField label={t("meters.fields.meterNumber")} error={errors.meter_number?.message}>
            <Input {...form.register("meter_number")} />
          </FormField>
          <FormField
            label={t("meters.fields.price")}
            hint={t("meters.fields.priceHint")}
            error={errors.price_per_unit_millicents?.message}
          >
            <Controller
              control={form.control}
              name="price_per_unit_millicents"
              render={({ field }) => (
                <NumberInput
                  value={field.value != null ? millicentsToCents(field.value) : null}
                  onChange={(v) => field.onChange(v === null ? 0 : centsToMillicents(v))}
                  onBlur={field.onBlur}
                  maxDecimals={3}
                  min={0}
                  unit={t("meters.priceUnit", { unit: unit || "" })}
                />
              )}
            />
          </FormField>
        </div>
      </form>
    </Dialog>
  );
}
