"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import {
  Button,
  Checkbox,
  Combobox,
  DatePicker,
  DateRangePicker,
  FormField,
  Input,
  MoneyInput,
  NumberInput,
  RadioGroup,
  Switch,
  Textarea,
  announce,
} from "@/components/ui";
import { useCategories } from "@/features/categories/hooks";
import { categoryDisplayName } from "@/features/categories/displayName";
import { todayIso } from "@/lib/utils/dates";
import { idSchema, isoDateSchema, optionalText, positiveCentsSchema, requiredText } from "@/lib/validation/common";
import { GallerySection } from "./GallerySection";
import styles from "./DesignGallery.module.css";

const demoSchema = z.object({
  name: requiredText(60),
  amount: positiveCentsSchema,
  quantity: z.number().min(0),
  date: isoDateSchema,
  range: z.object({ from: isoDateSchema.nullable(), to: isoDateSchema.nullable() }),
  type: z.enum(["income", "expense"]),
  category: idSchema,
  note: optionalText(200),
  recurring: z.boolean(),
  accept: z.literal(true),
});

type DemoInput = z.input<typeof demoSchema>;
type DemoOutput = z.output<typeof demoSchema>;

/** Demonstrates React Hook Form + shared Zod schemas with all form controls. */
export function FormDemo() {
  const { t } = useTranslation();
  const categories = useCategories("expense");
  const form = useForm<DemoInput, unknown, DemoOutput>({
    resolver: zodResolver(demoSchema),
    defaultValues: {
      name: "",
      amount: null as unknown as number,
      quantity: null as unknown as number,
      date: todayIso(),
      range: { from: null, to: null },
      type: "expense",
      category: "",
      note: "",
      recurring: false,
      accept: false as unknown as true,
    },
  });
  const { errors } = form.formState;

  return (
    <GallerySection title={t("design.form.title")}>
      <form
        noValidate
        className={styles.form}
        onSubmit={form.handleSubmit(() => announce(t("design.form.submitted")))}
      >
        <FormField label={t("design.form.name")} hint={t("design.form.nameHint")} required error={errors.name?.message}>
          <Input autoFocus {...form.register("name")} />
        </FormField>
        <div className={styles.formRow}>
          <FormField label={t("design.form.amount")} required error={errors.amount?.message}>
            <Controller
              control={form.control}
              name="amount"
              render={({ field }) => (
                <MoneyInput value={field.value ?? null} onChange={field.onChange} onBlur={field.onBlur} ref={field.ref} />
              )}
            />
          </FormField>
          <FormField label={t("design.form.quantity")} required error={errors.quantity?.message}>
            <Controller
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <NumberInput value={field.value ?? null} onChange={field.onChange} onBlur={field.onBlur} unit="kWh" maxDecimals={3} />
              )}
            />
          </FormField>
        </div>
        <div className={styles.formRow}>
          <FormField label={t("design.form.date")} required error={errors.date?.message}>
            <Controller
              control={form.control}
              name="date"
              render={({ field }) => <DatePicker value={field.value} onChange={(v) => field.onChange(v ?? "")} />}
            />
          </FormField>
          <FormField label={t("design.form.range")} showOptional>
            <Controller
              control={form.control}
              name="range"
              render={({ field }) => <DateRangePicker value={field.value} onChange={field.onChange} />}
            />
          </FormField>
        </div>
        <Controller
          control={form.control}
          name="type"
          render={({ field }) => (
            <RadioGroup
              label={t("design.form.type")}
              orientation="horizontal"
              appearance="cards"
              value={field.value}
              onValueChange={field.onChange}
              options={[
                { value: "expense", label: t("amount.expense") },
                { value: "income", label: t("amount.income") },
              ]}
            />
          )}
        />
        <FormField label={t("design.form.category")} required error={errors.category?.message}>
          <Controller
            control={form.control}
            name="category"
            render={({ field }) => (
              <Combobox
                value={field.value || null}
                onChange={(v) => field.onChange(v ?? "")}
                options={(categories.data ?? []).map((c) => ({
                  value: c.id,
                  label: categoryDisplayName(t, c),
                }))}
              />
            )}
          />
        </FormField>
        <FormField label={t("design.form.note")} showOptional error={errors.note?.message}>
          <Textarea {...form.register("note")} />
        </FormField>
        <Controller
          control={form.control}
          name="recurring"
          render={({ field }) => (
            <Switch label={t("design.form.recurring")} checked={field.value} onCheckedChange={field.onChange} />
          )}
        />
        <FormField label={t("design.form.accept")} hideLabel error={errors.accept?.message}>
          <Controller
            control={form.control}
            name="accept"
            render={({ field }) => (
              <Checkbox label={t("design.form.accept")} checked={field.value === true} onCheckedChange={(v) => field.onChange(v === true)} />
            )}
          />
        </FormField>
        <div className={styles.row}>
          <Button type="submit" variant="primary">{t("common.save")}</Button>
          <Button type="button" variant="ghost" onClick={() => form.reset()}>{t("common.clear")}</Button>
        </div>
      </form>
    </GallerySection>
  );
}
