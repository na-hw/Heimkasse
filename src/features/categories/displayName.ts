import type { TFunction } from "i18next";
import type { Category } from "./schemas";

/** Display name: translated for built-in categories, user text otherwise. */
export function categoryDisplayName(t: TFunction, category: Pick<Category, "name" | "name_key">): string {
  if (category.name) return category.name;
  if (category.name_key) return t(category.name_key as "categories.builtin.rent");
  return "";
}
