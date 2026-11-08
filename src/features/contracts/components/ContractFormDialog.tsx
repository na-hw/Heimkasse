"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useId, useMemo } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import {
  Combobox,
  DatePicker,
  Dialog,
  FormField,
  Input,
  MoneyInput,
  NumberInput,
  Select,
  Switch,
  Textarea,
} from "@/components/ui";
import { useAccounts } from "@/features/accounts/hooks";
import { useAllCategories } from "@/features/categories/hooks";
import { categoryOptions } from "@/features/categories/options";
import { FormDialogFooter } from "@/features/shared/components/FormDialogFooter";
import styles from "@/features/shared/components/EntityList.module.css";
import { useFormat } from "@/lib/i18n/useFormat";
import { useUiStore } from "@/lib/preferences/uiStore";
import { todayIso } from "@/lib/utils/dates";
import { idSchema, isoDateSchema } from "@/lib/validation/common";
import { validationMessage } from "@/lib/validation/messages";
import { nextDeadline } from "../deadlines";
import { useContractMutations } from "../hooks";
import { BILLING_FREQUENCIES, type Contract, NOTICE_UNITS, contractCreateSchema } from "../schemas";

const formSchema = contractCreateSchema
  .extend({
    create_payment: z.boolean(),
    payment_account_id: idSchema.nullable(),
    first_payment_date: isoDateSchema.nullable(),
  })
  .refine((v) => !v.create_payment || v.payment_account_id !== null, {
    path: ["payment_account_id"],
    message: validationMessage("validation.required"),
  })
  .refine((v) => !v.create_payment || v.first_payment_date !== null, {
    path: ["first_payment_date"],
    message: validationMessage("validation.required"),
  });
type ContractForm = z.input<typeof formSchema>;

interface Props {
  /** null = closed, { contract: null } = create, { contract } = edit. */
  target: { contract: Contract | null } | null;
  onClose: () => void;
}

/** Create/edit a contract, optionally with a linked recurring payment. */
export function ContractFormDialog({ target, onClose }: Props) {
  const { t } = useTranslation();
  const format = useFormat();
  const formId = useId();
  const categories = useAllCategories();
  const accounts = useAccounts();
  const lastAccountId = useUiStore((s) => s.lastAccountId);
  const { create, update } = useContractMutations();
  const contract = target?.contract ?? null;
  const open = target !== null;
  const active = accounts.data?.active ?? [];
  const fallbackAccount = active.find((a) => a.id === lastAccountId)?.id ?? active[0]?.id ?? null;

  const initial = useMemo<ContractForm>(
    () => ({
      name: contract?.name ?? "",
      provider: contract?.provider ?? "",
      category_id: contract?.category_id ?? null,
      amount_cents: contract?.amount_cents ?? (null as unknown as number),
      billing_frequency: contract?.billing_frequency ?? "monthly",
      start_date: contract?.start_date ?? todayIso(),
      minimum_term_months: contract?.minimum_term_months ?? 24,
      notice_period_value: contract?.notice_period_value ?? 1,
      notice_period_unit: contract?.notice_period_unit ?? "months",
      auto_renew_months: contract?.auto_renew_months ?? 0,
      notes: contract?.notes ?? "",
      create_payment: false,
      payment_account_id: fallbackAccount,
      first_payment_date: todayIso(),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recompute only when the dialog target changes
    [target],
  );
  const form = useForm<ContractForm>({ resolver: zodResolver(formSchema), defaultValues: initial });
  useEffect(() => {
    if (open) form.reset(initial);
  }, [open, initial, form]);
  const { errors } = form.formState;
  const [createPayment, startDate, minTerm, noticeValue, noticeUnit, renew] = useWatch({
    control: form.control,
    name: [
      "create_payment",
      "start_date",
      "minimum_term_months",
      "notice_period_value",
      "notice_period_unit",
      "auto_renew_months",
    ],
  });

  const preview = useMemo(() => {
    const parsed = contractCreateSchema
      .pick({
        start_date: true,
        minimum_term_months: true,
        notice_period_value: true,
        notice_period_unit: true,
        auto_renew_months: true,
      })
      .safeParse({
        start_date: startDate,
        minimum_term_months: minTerm,
        notice_period_value: noticeValue,
        notice_period_unit: noticeUnit,
        auto_renew_months: renew,
      });
    if (!parsed.success) return null;
    const info = nextDeadline(parsed.data, todayIso());
    return info.kind === "open"
      ? t("contracts.deadline.previewOpen", { date: format.date(info.earliestEnd, "medium") })
      : t("contracts.deadline.previewFixed", {
          deadline: format.date(info.deadline, "medium"),
          termEnd: format.date(info.termEnd, "medium"),
        });
  }, [startDate, minTerm, noticeValue, noticeUnit, renew, t, format]);

  const submit = form.handleSubmit(async (values) => {
    const { create_payment, payment_account_id, first_payment_date, ...parsed } = values;
    // Only the edited fields – never reset status, cancellation date or the linked rule.
    const input = {
      name: parsed.name,
      provider: parsed.provider,
      category_id: parsed.category_id,
      amount_cents: parsed.amount_cents,
      billing_frequency: parsed.billing_frequency,
      start_date: parsed.start_date,
      minimum_term_months: parsed.minimum_term_months,
      notice_period_value: parsed.notice_period_value,
      notice_period_unit: parsed.notice_period_unit,
      auto_renew_months: parsed.auto_renew_months,
      notes: parsed.notes,
    };
    if (contract) {
      await update.mutateAsync({ contract, patch: input });
    } else {
      await create.mutateAsync({
        input,
        payment:
          create_payment && payment_account_id && first_payment_date
            ? { account_id: payment_account_id, first_payment_date }
            : null,
      });
    }
    onClose();
  });

  const integerField = (
    name: "minimum_term_months" | "notice_period_value" | "auto_renew_months",
    unit?: string,
  ) => (
    <Controller
      control={form.control}
      name={name}
      render={({ field }) => (
        <NumberInput
          value={field.value ?? null}
          onChange={(v) => field.onChange(v ?? 0)}
          onBlur={field.onBlur}
          maxDecimals={0}
          min={0}
          unit={unit}
        />
      )}
    />
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !next && onClose()}
      title={contract ? t("contracts.edit") : t("contracts.new")}
      footer={
        <FormDialogFooter
          formId={formId}
          submitLabel={contract ? t("common.saveChanges") : t("common.create")}
          loading={create.isPending || update.isPending}
          onCancel={onClose}
        />
      }
    >
      <form id={formId} noValidate onSubmit={(e) => void submit(e)} className={styles.form}>
        <div className={styles.formRow}>
          <FormField label={t("contracts.fields.name")} required error={errors.name?.message}>
            <Input
              autoFocus
              placeholder={t("contracts.fields.namePlaceholder")}
              {...form.register("name")}
            />
          </FormField>
          <FormField label={t("contracts.fields.provider")} error={errors.provider?.message}>
            <Input
              placeholder={t("contracts.fields.providerPlaceholder")}
              {...form.register("provider")}
            />
          </FormField>
        </div>
        <div className={styles.formRow}>
          <FormField
            label={t("contracts.fields.amount")}
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
                />
              )}
            />
          </FormField>
          <FormField label={t("contracts.fields.frequency")} required>
            <Controller
              control={form.control}
              name="billing_frequency"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  options={BILLING_FREQUENCIES.map((f) => ({
                    value: f,
                    label: t(`contracts.frequencies.${f}`),
                  }))}
                />
              )}
            />
          </FormField>
        </div>
        <FormField label={t("contracts.fields.category")}>
          <Controller
            control={form.control}
            name="category_id"
            render={({ field }) => (
              <Combobox
                value={field.value ?? null}
                onChange={field.onChange}
                placeholder={t("categories.uncategorized")}
                options={categoryOptions(t, categories.data ?? [], "expense")}
              />
            )}
          />
        </FormField>
        <div className={styles.formRow}>
          <FormField
            label={t("contracts.fields.startDate")}
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
            label={t("contracts.fields.minimumTerm")}
            hint={t("contracts.fields.minimumTermHint")}
            error={errors.minimum_term_months?.message}
          >
            {integerField("minimum_term_months", t("contracts.units.months"))}
          </FormField>
        </div>
        <div className={styles.formRow}>
          <FormField
            label={t("contracts.fields.noticeValue")}
            error={errors.notice_period_value?.message}
          >
            {integerField("notice_period_value")}
          </FormField>
          <FormField label={t("contracts.fields.noticeUnit")}>
            <Controller
              control={form.control}
              name="notice_period_unit"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  options={NOTICE_UNITS.map((u) => ({
                    value: u,
                    label: t(`contracts.units.${u}`),
                  }))}
                />
              )}
            />
          </FormField>
          <FormField
            label={t("contracts.fields.autoRenew")}
            hint={t("contracts.fields.autoRenewHint")}
            error={errors.auto_renew_months?.message}
          >
            {integerField("auto_renew_months", t("contracts.units.months"))}
          </FormField>
        </div>
        {preview && (
          <p className={styles.meta} aria-live="polite">
            <strong>{t("contracts.deadline.preview")}:</strong> {preview}
          </p>
        )}
        {!contract && (
          <>
            <Controller
              control={form.control}
              name="create_payment"
              render={({ field }) => (
                <Switch
                  label={t("contracts.fields.createPayment")}
                  description={t("contracts.fields.createPaymentHint")}
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            {createPayment && (
              <div className={styles.formRow}>
                <FormField
                  label={t("contracts.fields.account")}
                  required
                  error={errors.payment_account_id?.message}
                >
                  <Controller
                    control={form.control}
                    name="payment_account_id"
                    render={({ field }) => (
                      <Select
                        value={field.value ?? undefined}
                        onValueChange={field.onChange}
                        options={active.map((a) => ({ value: a.id, label: a.name }))}
                      />
                    )}
                  />
                </FormField>
                <FormField
                  label={t("contracts.fields.firstPayment")}
                  required
                  error={errors.first_payment_date?.message}
                >
                  <Controller
                    control={form.control}
                    name="first_payment_date"
                    render={({ field }) => (
                      <DatePicker value={field.value} onChange={field.onChange} />
                    )}
                  />
                </FormField>
              </div>
            )}
          </>
        )}
        <FormField label={t("contracts.fields.notes")} error={errors.notes?.message}>
          <Textarea rows={3} {...form.register("notes")} />
        </FormField>
      </form>
    </Dialog>
  );
}
