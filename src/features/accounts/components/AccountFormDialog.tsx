"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useId, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  ColorPicker,
  Dialog,
  FormField,
  IconPicker,
  Input,
  MoneyInput,
  Select,
} from "@/components/ui";
import { FormDialogFooter } from "@/features/shared/components/FormDialogFooter";
import styles from "@/features/shared/components/EntityList.module.css";
import { useAccountMutations } from "../hooks";
import { ACCOUNT_TYPES, type Account, type AccountCreate, accountCreateSchema } from "../schemas";
import { ACCOUNT_TYPE_ICON } from "../typeIcons";

interface AccountFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Edit this account; omit to create a new one. */
  account?: Account | null;
  /** sort_order for new accounts (appended at the end). */
  nextSortOrder: number;
}

/** Create/edit form for accounts (shared Zod schema with the repository). */
export function AccountFormDialog({
  open,
  onOpenChange,
  account,
  nextSortOrder,
}: AccountFormDialogProps) {
  const { t } = useTranslation();
  const formId = useId();
  const { create, update } = useAccountMutations();
  const initial = useMemo<AccountCreate>(
    () =>
      account
        ? {
            name: account.name,
            type: account.type,
            initial_balance_cents: account.initial_balance_cents,
            color: account.color,
            icon: account.icon,
          }
        : {
            name: "",
            type: "bank",
            initial_balance_cents: 0,
            color: "teal",
            icon: "landmark",
            sort_order: nextSortOrder,
          },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recompute only when the dialog target changes
    [open, account],
  );
  const form = useForm<AccountCreate>({
    resolver: zodResolver(accountCreateSchema),
    defaultValues: initial,
  });
  // Fresh form for every opening (the dialog component stays mounted).
  useEffect(() => {
    if (open) form.reset(initial);
  }, [open, initial, form]);
  const { errors } = form.formState;
  const color = form.watch("color") ?? "teal";

  const submit = form.handleSubmit(async (values) => {
    if (account) {
      // Only fields edited here – never reset sort order or archive state.
      const { name, type, initial_balance_cents, color, icon } = values;
      await update.mutateAsync({
        id: account.id,
        patch: { name, type, initial_balance_cents, color, icon },
      });
    } else await create.mutateAsync(values);
    onOpenChange(false);
  });

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={account ? t("accounts.edit") : t("accounts.new")}
      footer={
        <FormDialogFooter
          formId={formId}
          submitLabel={account ? t("common.saveChanges") : t("common.create")}
          loading={create.isPending || update.isPending}
          onCancel={() => onOpenChange(false)}
        />
      }
    >
      <form id={formId} noValidate onSubmit={(e) => void submit(e)} className={styles.form}>
        <FormField label={t("accounts.fields.name")} required error={errors.name?.message}>
          <Input
            autoFocus
            placeholder={t("accounts.fields.namePlaceholder")}
            {...form.register("name")}
          />
        </FormField>
        <div className={styles.formRow}>
          <FormField label={t("accounts.fields.type")} required>
            <Controller
              control={form.control}
              name="type"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(type) => {
                    field.onChange(type);
                    if (!account) form.setValue("icon", ACCOUNT_TYPE_ICON[type]);
                  }}
                  options={ACCOUNT_TYPES.map((type) => ({
                    value: type,
                    label: t(`accountTypes.${type}`),
                  }))}
                />
              )}
            />
          </FormField>
          <FormField
            label={t("accounts.fields.initialBalance")}
            hint={t("accounts.fields.initialBalanceHint")}
            error={errors.initial_balance_cents?.message}
          >
            <Controller
              control={form.control}
              name="initial_balance_cents"
              render={({ field }) => (
                <MoneyInput
                  allowNegative
                  value={field.value ?? null}
                  onChange={(v) => field.onChange(v ?? 0)}
                  onBlur={field.onBlur}
                />
              )}
            />
          </FormField>
        </div>
        <Controller
          control={form.control}
          name="color"
          render={({ field }) => (
            <ColorPicker value={field.value ?? "teal"} onChange={field.onChange} />
          )}
        />
        <Controller
          control={form.control}
          name="icon"
          render={({ field }) => (
            <IconPicker value={field.value ?? "landmark"} onChange={field.onChange} color={color} />
          )}
        />
      </form>
    </Dialog>
  );
}
