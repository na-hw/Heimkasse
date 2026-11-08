import type { Repositories } from "@/features/repositories";
import { reorder } from "@/features/shared/reorder";
import { AppError } from "@/lib/errors/AppError";
import type { WriteOp } from "@/lib/db/types";
import type { Account } from "./schemas";

/** Active transactions and recurring rules that reference the account. */
export async function accountUsage(repos: Repositories, id: string): Promise<number> {
  const [own, incoming, rules, rulesIncoming] = await Promise.all([
    repos.transactions.count({ where: [{ field: "account_id", op: "eq", value: id }] }),
    repos.transactions.count({ where: [{ field: "transfer_account_id", op: "eq", value: id }] }),
    repos.recurringRules.count({ where: [{ field: "account_id", op: "eq", value: id }] }),
    repos.recurringRules.count({ where: [{ field: "transfer_account_id", op: "eq", value: id }] }),
  ]);
  return own + incoming + rules + rulesIncoming;
}

/** Persists a new order after moving one account up or down. */
export async function moveAccount(
  repos: Repositories,
  siblings: readonly Account[],
  id: string,
  direction: "up" | "down",
) {
  const changes = reorder(siblings, id, direction);
  const ops: WriteOp[] = changes.map((c) =>
    repos.accounts.prepareUpdate(c.id, { sort_order: c.sort_order }),
  );
  await repos.storage.write(ops);
  return changes.length > 0;
}

/** Permanently deletes an account from the trash; refused while any transaction (even trashed) references it. */
export async function purgeAccount(repos: Repositories, id: string): Promise<void> {
  const refs = await Promise.all([
    repos.transactions.count({
      where: [{ field: "account_id", op: "eq", value: id }],
      deleted: "include",
    }),
    repos.transactions.count({
      where: [{ field: "transfer_account_id", op: "eq", value: id }],
      deleted: "include",
    }),
    repos.recurringRules.count({
      where: [{ field: "account_id", op: "eq", value: id }],
      deleted: "include",
    }),
  ]);
  if (refs.some((n) => n > 0)) throw new AppError("in_use", `account ${id} is referenced`);
  await repos.accounts.purge([id]);
}
