import type { Repositories } from "@/features/repositories";

/** Assigns one category to many transactions atomically. */
export async function changeCategory(repos: Repositories, ids: readonly string[], categoryId: string | null) {
  await repos.storage.write(ids.map((id) => repos.transactions.prepareUpdate(id, { category_id: categoryId })));
}
