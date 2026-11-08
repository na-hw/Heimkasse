import type { Repositories } from "@/features/repositories";
import { reorder } from "@/features/shared/reorder";
import type { WriteOp } from "@/lib/db/types";
import type { Category } from "./schemas";
import { withDescendants } from "./tree";

/** Active transactions, rules, budgets and contracts that use the category or its subcategories. */
export async function categoryUsage(
  repos: Repositories,
  categories: readonly Category[],
  id: string,
): Promise<number> {
  const ids = withDescendants(categories, id);
  const where = [{ field: "category_id", op: "in" as const, values: ids }];
  const counts = await Promise.all([
    repos.transactions.count({ where }),
    repos.recurringRules.count({ where }),
    repos.budgets.count({ where }),
    repos.contracts.count({ where }),
  ]);
  return counts.reduce((a, b) => a + b, 0);
}

/** Moves a category (with its subcategories) to the trash. */
export async function softDeleteCategory(
  repos: Repositories,
  categories: readonly Category[],
  id: string,
) {
  await repos.categories.softDelete(withDescendants(categories, id));
}

/** Archives or unarchives a category together with its subcategories. */
export async function setCategoryArchived(
  repos: Repositories,
  categories: readonly Category[],
  id: string,
  archived: boolean,
) {
  const ops = withDescendants(categories, id).map((cid) =>
    repos.categories.prepareUpdate(cid, { archived }),
  );
  await repos.storage.write(ops);
}

export async function moveCategory(
  repos: Repositories,
  siblings: readonly Category[],
  id: string,
  direction: "up" | "down",
) {
  const ops: WriteOp[] = reorder(siblings, id, direction).map((c) =>
    repos.categories.prepareUpdate(c.id, { sort_order: c.sort_order }),
  );
  await repos.storage.write(ops);
  return ops.length > 0;
}

/**
 * Permanently deletes a category from the trash. References are cleared
 * atomically (transactions/rules/contracts become uncategorized, budgets are removed).
 */
export async function purgeCategory(repos: Repositories, id: string): Promise<void> {
  const where = [{ field: "category_id", op: "eq" as const, value: id }];
  const [transactions, rules, budgets, contracts, children] = await Promise.all([
    repos.transactions.list({ where, deleted: "include" }),
    repos.recurringRules.list({ where, deleted: "include" }),
    repos.budgets.list({ where, deleted: "include" }),
    repos.contracts.list({ where, deleted: "include" }),
    repos.categories.list({
      where: [{ field: "parent_id", op: "eq", value: id }],
      deleted: "include",
    }),
  ]);
  await repos.storage.write([
    ...transactions.map((t) => repos.transactions.prepareUpdate(t.id, { category_id: null })),
    ...rules.map((r) => repos.recurringRules.prepareUpdate(r.id, { category_id: null })),
    ...repos.budgets.preparePurge(budgets.map((b) => b.id)),
    ...contracts.map((c) => repos.contracts.prepareUpdate(c.id, { category_id: null })),
    ...children.map((c) => repos.categories.prepareUpdate(c.id, { parent_id: null })),
    ...repos.categories.preparePurge([id]),
  ]);
}
