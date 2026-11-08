import type { TFunction } from "i18next";
import type { ComboboxOption } from "@/components/ui";
import { categoryDisplayName } from "./displayName";
import type { Category, CategoryType } from "./schemas";
import { buildCategoryTree } from "./tree";

/** Combobox options grouped by main category (main category first, then its subcategories). */
export function categoryOptions(
  t: TFunction,
  categories: readonly Category[],
  type?: CategoryType,
): ComboboxOption[] {
  return buildCategoryTree(
    categories.filter((c) => !c.archived),
    type,
  ).flatMap(({ category, children }) => {
    const group = categoryDisplayName(t, category);
    return [category, ...children].map((c) => ({
      value: c.id,
      label: categoryDisplayName(t, c),
      group: type ? group : `${t(`categoryTypes.${c.type}`)} · ${group}`,
    }));
  });
}
