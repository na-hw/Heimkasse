"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Combobox, Dialog, FormField } from "@/components/ui";
import { useAllCategories } from "@/features/categories/hooks";
import { categoryOptions } from "@/features/categories/options";

interface Props {
  open: boolean;
  count: number;
  onOpenChange: (open: boolean) => void;
  onApply: (categoryId: string | null) => void;
}

/** Bulk action: assign one category to all selected transactions. */
export function ChangeCategoryDialog({ open, count, onOpenChange, onApply }: Props) {
  const { t } = useTranslation();
  const categories = useAllCategories();
  const [value, setValue] = useState<string | null>(null);
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      size="sm"
      title={t("transactions.changeCategory.title")}
      description={t("transactions.changeCategory.description", { count })}
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              onApply(value);
              onOpenChange(false);
            }}
          >
            {t("common.apply")}
          </Button>
        </>
      }
    >
      <FormField label={t("transactions.fields.category")}>
        <Combobox
          value={value}
          onChange={setValue}
          placeholder={t("categories.uncategorized")}
          options={categoryOptions(t, categories.data ?? [])}
        />
      </FormField>
    </Dialog>
  );
}
