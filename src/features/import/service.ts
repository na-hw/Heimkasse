import type { Repositories } from "@/features/repositories";
import type { WriteOp } from "@/lib/db/types";
import { type BankPreset, IMPORT_PRESETS_KEY, userPresetsSchema } from "./format";
import { type DuplicateContext, type ImportCandidate, duplicateContext } from "./review";

/** Stored transactions of the account (incl. trash) for duplicate detection. */
export async function loadDuplicateContext(
  repos: Repositories,
  accountId: string,
): Promise<DuplicateContext> {
  const transactions = await repos.transactions.list({
    where: [{ field: "account_id", op: "eq", value: accountId }],
    deleted: "include",
  });
  return duplicateContext(transactions);
}

/** Saves all selected, valid candidates as transactions in one atomic write. Returns the count. */
export async function importCandidates(
  repos: Repositories,
  accountId: string,
  candidates: readonly ImportCandidate[],
): Promise<number> {
  const ops: WriteOp[] = candidates
    .filter((c) => c.selected && c.status !== "invalid" && c.date !== null)
    .map(
      (c) =>
        repos.transactions.prepareCreate({
          account_id: accountId,
          type: c.type,
          amount_cents: c.amountCents,
          date: c.date ?? "",
          payee: c.payee,
          note: c.note,
          category_id: c.categoryId,
          payment_method: null,
          import_hash: c.importHash,
        }).op,
    );
  await repos.storage.write(ops);
  return ops.length;
}

export function loadUserPresets(repos: Repositories): Promise<BankPreset[]> {
  return repos.settings.getValue(IMPORT_PRESETS_KEY, userPresetsSchema, []);
}

/** Adds or replaces a user preset (matched by id). */
export async function saveUserPreset(repos: Repositories, preset: BankPreset): Promise<void> {
  const presets = await loadUserPresets(repos);
  const next = [preset, ...presets.filter((p) => p.id !== preset.id)];
  await repos.settings.setValue(IMPORT_PRESETS_KEY, userPresetsSchema.parse(next));
}

export async function deleteUserPreset(repos: Repositories, id: string): Promise<void> {
  const presets = await loadUserPresets(repos);
  await repos.settings.setValue(
    IMPORT_PRESETS_KEY,
    presets.filter((p) => p.id !== id),
  );
}
