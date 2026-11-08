"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useId } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { ColorPicker, Dialog, FormField, IconPicker, Input, RadioGroup, Select } from "@/components/ui";
import { FormDialogFooter } from "@/features/shared/components/FormDialogFooter";
import styles from "@/features/shared/components/EntityList.module.css";
import { categoryDisplayName } from "../displayName";
import { useCategoryMutations } from "../hooks";
import { CATEGORY_TYPES, type Category, type CategoryCreate, type CategoryType, categoryCreateSchema } from "../schemas";

const NO_PARENT = "__none";

export interface CategoryFormTarget {
  /** Category to edit; null to create. */
  category: Category | null;
  /** Presets for new categories (e.g. "add subcategory"). */
  type?: CategoryType;
  parentId?: string | null;
}

interface CategoryFormDialogProps {
  target: CategoryFormTarget | null;
  onClose: () => void;
  all: Category[];
}

/** Create/edit categories incl. parent selection (one level of subcategories). */
export function CategoryFormDialog({ target, onClose, all }: CategoryFormDialogProps) {
  const { t } = useTranslation();
  const formId = useId();
  const { create, update } = useCategoryMutations();
  const category = target?.category ?? null;
  const displayName = category ? categoryDisplayName(t, category) : "";
  const hasChildren = category ? all.some((c) => c.parent_id === category.id) : false;

  const form = useForm<CategoryCreate>({
    resolver: zodResolver(categoryCreateSchema),
    values: category
      ? {
          name: displayName,
          type: category.type,
          parent_id: category.parent_id,
          color: category.color,
          icon: category.icon,
        }
      : {
          name: "",
          type: target?.type ?? "expense",
          parent_id: target?.parentId ?? null,
          color: "gray",
          icon: "tag",
          sort_order: all.length,
        },
  });
  const { errors } = form.formState;
  const type = form.watch("type");
  const parentId = form.watch("parent_id");
  const color = form.watch("color") ?? "gray";
  const parentOptions = all.filter((c) => !c.parent_id && !c.archived && c.type === type && c.id !== category?.id);
  const isChild = Boolean(parentId);

  const submit = form.handleSubmit(async (values) => {
    // Inherit type and color from the parent for subcategories.
    const parent = values.parent_id ? all.find((c) => c.id === values.parent_id) : undefined;
    const data = { ...values, type: parent?.type ?? values.type };
    if (category) {
      // Only fields edited here – never reset sort order or archive state.
      const patch = { type: data.type, parent_id: data.parent_id, color: data.color, icon: data.icon };
      // Keep built-in names translatable unless the user actually renamed them.
      const renamed = !(category.name_key && data.name === displayName);
      await update.mutateAsync({ id: category.id, patch: renamed ? { ...patch, name: data.name } : patch, all });
    } else {
      await create.mutateAsync(data);
    }
    onClose();
  });

  return (
    <Dialog
      open={target !== null}
      onOpenChange={(open) => !open && onClose()}
      title={category ? t("categories.edit") : t("categories.new")}
      footer={
        <FormDialogFooter
          formId={formId}
          submitLabel={category ? t("common.saveChanges") : t("common.create")}
          loading={create.isPending || update.isPending}
          onCancel={onClose}
        />
      }
    >
      <form id={formId} noValidate onSubmit={(e) => void submit(e)} className={styles.form}>
        <FormField label={t("categories.fields.name")} required error={errors.name?.message}>
          <Input autoFocus {...form.register("name")} />
        </FormField>
        {!isChild && (
          <Controller
            control={form.control}
            name="type"
            render={({ field }) => (
              <RadioGroup
                label={t("categories.fields.type")}
                appearance="cards"
                orientation="horizontal"
                value={field.value}
                onValueChange={(v) => {
                  field.onChange(v);
                  form.setValue("parent_id", null);
                }}
                options={CATEGORY_TYPES.map((v) => ({ value: v, label: t(`categoryTypes.${v}`) }))}
              />
            )}
          />
        )}
        <FormField label={t("categories.fields.parent")}>
          <Controller
            control={form.control}
            name="parent_id"
            render={({ field }) => (
              <Select
                disabled={hasChildren}
                value={field.value ?? NO_PARENT}
                onValueChange={(v) => field.onChange(v === NO_PARENT ? null : v)}
                options={[
                  { value: NO_PARENT, label: t("categories.fields.parentNone") },
                  ...parentOptions.map((c) => ({ value: c.id, label: categoryDisplayName(t, c) })),
                ]}
              />
            )}
          />
        </FormField>
        <Controller
          control={form.control}
          name="color"
          render={({ field }) => <ColorPicker value={field.value ?? "gray"} onChange={field.onChange} />}
        />
        <Controller
          control={form.control}
          name="icon"
          render={({ field }) => <IconPicker value={field.value ?? "tag"} onChange={field.onChange} color={color} />}
        />
      </form>
    </Dialog>
  );
}
