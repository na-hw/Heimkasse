import type { Category, CategoryType } from "./schemas";

export interface CategoryNode {
  category: Category;
  children: Category[];
}

const bySortOrder = (a: Category, b: Category) => a.sort_order - b.sort_order;

/** Groups categories into top-level nodes with their children (sorted). Orphans become top-level. */
export function buildCategoryTree(
  categories: readonly Category[],
  type?: CategoryType,
): CategoryNode[] {
  const list = type ? categories.filter((c) => c.type === type) : [...categories];
  const ids = new Set(list.map((c) => c.id));
  const roots = list.filter((c) => !c.parent_id || !ids.has(c.parent_id)).sort(bySortOrder);
  return roots.map((category) => ({
    category,
    children: list.filter((c) => c.parent_id === category.id).sort(bySortOrder),
  }));
}

/** IDs of a category and all its descendants (one level of nesting is supported). */
export function withDescendants(categories: readonly Category[], id: string): string[] {
  return [id, ...categories.filter((c) => c.parent_id === id).map((c) => c.id)];
}

/** Siblings in display order (same parent and type), used for reordering. */
export function siblingsOf(categories: readonly Category[], category: Category): Category[] {
  return categories
    .filter(
      (c) =>
        c.type === category.type &&
        c.parent_id === category.parent_id &&
        c.archived === category.archived,
    )
    .sort(bySortOrder);
}
