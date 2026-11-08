import type { Repositories } from "@/features/repositories";

/** Permanently deletes savings goals together with all their contributions (atomic). */
export async function purgeGoals(repos: Repositories, ids: readonly string[]): Promise<void> {
  const contributions = await repos.goalContributions.list({
    where: [{ field: "goal_id", op: "in", values: [...ids] }],
    deleted: "include",
  });
  await repos.storage.write([
    ...repos.goalContributions.preparePurge(contributions.map((c) => c.id)),
    ...repos.savingsGoals.preparePurge(ids),
  ]);
}
