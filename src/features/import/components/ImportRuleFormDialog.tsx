"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useId, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Combobox, Dialog, FormField, Input, Select } from "@/components/ui";
import { useAllCategories } from "@/features/categories/hooks";
import { categoryOptions } from "@/features/categories/options";
import { FormDialogFooter } from "@/features/shared/components/FormDialogFooter";
import styles from "@/features/shared/components/EntityList.module.css";
import { useImportRuleMutations } from "../hooks";
import {
  IMPORT_MATCH_FIELDS,
  type ImportRule,
  type ImportRuleCreate,
  importRuleCreateSchema,
} from "../schemas";

interface Props {
  target: { rule: ImportRule | null; nextOrder: number } | null;
  onClose: () => void;
}

/** Create/edit an import rule ("if payee contains X → category Y, rename to Z"). */
export function ImportRuleFormDialog({ target, onClose }: Props) {
  const { t } = useTranslation();
  const formId = useId();
  const categories = useAllCategories();
  const { create, update } = useImportRuleMutations();
  const rule = target?.rule ?? null;
  const open = target !== null;

  const initial = useMemo<ImportRuleCreate>(
    () => ({
      match_field: rule?.match_field ?? "any",
      match_text: rule?.match_text ?? "",
      category_id: rule?.category_id ?? null,
      payee_rename: rule?.payee_rename ?? "",
      sort_order: rule?.sort_order ?? target?.nextOrder ?? 0,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recompute only when the dialog target changes
    [target],
  );
  const form = useForm<ImportRuleCreate>({
    resolver: zodResolver(importRuleCreateSchema),
    defaultValues: initial,
  });
  useEffect(() => {
    if (open) form.reset(initial);
  }, [open, initial, form]);
  const { errors } = form.formState;

  const submit = form.handleSubmit(async (values) => {
    const { match_field, match_text, category_id, payee_rename } = values;
    const patch = { match_field, match_text, category_id, payee_rename };
    if (rule) await update.mutateAsync({ id: rule.id, patch });
    else await create.mutateAsync({ ...patch, sort_order: values.sort_order });
    onClose();
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !next && onClose()}
      title={rule ? t("import.rules.edit") : t("import.rules.new")}
      description={t("import.rules.formHint")}
      footer={
        <FormDialogFooter
          formId={formId}
          submitLabel={rule ? t("common.saveChanges") : t("common.create")}
          loading={create.isPending || update.isPending}
          onCancel={onClose}
        />
      }
    >
      <form id={formId} noValidate onSubmit={(e) => void submit(e)} className={styles.form}>
        <div className={styles.formRow}>
          <FormField label={t("import.rules.fields.matchField")} required>
            <Controller
              control={form.control}
              name="match_field"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  options={IMPORT_MATCH_FIELDS.map((f) => ({
                    value: f,
                    label: t(`import.rules.matchFields.${f}`),
                  }))}
                />
              )}
            />
          </FormField>
          <FormField
            label={t("import.rules.fields.matchText")}
            required
            error={errors.match_text?.message}
          >
            <Input
              autoFocus
              placeholder={t("import.rules.fields.matchTextPlaceholder")}
              {...form.register("match_text")}
            />
          </FormField>
        </div>
        <FormField label={t("import.rules.fields.category")} showOptional>
          <Controller
            control={form.control}
            name="category_id"
            render={({ field }) => (
              <Combobox
                value={field.value ?? null}
                onChange={field.onChange}
                options={categoryOptions(t, categories.data ?? [])}
                placeholder={t("common.none")}
              />
            )}
          />
        </FormField>
        <FormField
          label={t("import.rules.fields.payeeRename")}
          hint={t("import.rules.fields.payeeRenameHint")}
          showOptional
          error={errors.payee_rename?.message}
        >
          <Input {...form.register("payee_rename")} />
        </FormField>
      </form>
    </Dialog>
  );
}
