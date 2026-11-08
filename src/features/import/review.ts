import type { Category } from "@/features/categories/schemas";
import type { Transaction } from "@/features/transactions/schemas";
import { importHashes, manualMatchKey } from "./duplicates";
import type { ExtractedRow, RowError } from "./extract";
import { applyImportRules } from "./rules";
import type { ImportRule } from "./schemas";

export type CandidateStatus = "new" | "duplicate" | "possibleDuplicate" | "invalid";

/** A row on the review screen. Only `selected` rows with status != invalid are saved. */
export interface ImportCandidate {
  line: number;
  status: CandidateStatus;
  errors: RowError[];
  selected: boolean;
  date: string | null;
  type: "income" | "expense";
  amountCents: number;
  payee: string | null;
  note: string | null;
  categoryId: string | null;
  ruleApplied: boolean;
  importHash: string | null;
}

export interface DuplicateContext {
  /** Import hashes already stored (incl. trash). */
  hashes: ReadonlySet<string>;
  /** Manually entered transactions of the target account (no import hash). */
  manual: readonly Pick<Transaction, "date" | "type" | "amount_cents">[];
}

/** Builds the duplicate context from the account's transactions (active + trash). */
export function duplicateContext(transactions: readonly Transaction[]): DuplicateContext {
  return {
    hashes: new Set(transactions.flatMap((t) => (t.import_hash ? [t.import_hash] : []))),
    manual: transactions.filter((t) => !t.import_hash && t.deleted_at === null),
  };
}

const signed = (t: Pick<Transaction, "type" | "amount_cents">) =>
  t.type === "expense" ? -t.amount_cents : t.amount_cents;

/**
 * Turns extracted rows into review candidates: rules assign categories
 * (only if the category type fits), exact re-imports are marked as
 * duplicates and same date/amount manual bookings as possible duplicates.
 * Both kinds start unselected; invalid rows can't be selected.
 */
export function buildCandidates(input: {
  rows: readonly ExtractedRow[];
  accountId: string;
  rules: readonly ImportRule[];
  categories: readonly Category[];
  context: DuplicateContext;
}): ImportCandidate[] {
  const { rows, accountId, rules, categories, context } = input;
  const usableCategory = new Map(
    categories.filter((c) => !c.archived && c.deleted_at === null).map((c) => [c.id, c]),
  );
  const valid = rows.filter((r) => r.errors.length === 0);
  const hashes = importHashes(
    valid.map((r) => ({
      accountId,
      date: r.date ?? "",
      amountCents: r.amountCents ?? 0,
      payee: r.payee,
      note: r.note,
    })),
  );
  const hashByLine = new Map(valid.map((r, i) => [r.line, hashes[i] ?? null]));

  const manualCounts = new Map<string, number>();
  for (const t of context.manual) {
    const key = manualMatchKey(t.date, signed(t));
    manualCounts.set(key, (manualCounts.get(key) ?? 0) + 1);
  }

  return rows.map((row) => {
    const amount = row.amountCents ?? 0;
    const type = amount < 0 ? "expense" : "income";
    const rule = applyImportRules(row, rules);
    const category = rule.categoryId ? usableCategory.get(rule.categoryId) : undefined;
    const categoryId = category?.type === type ? category.id : null;
    const importHash = hashByLine.get(row.line) ?? null;

    let status: CandidateStatus = "new";
    if (row.errors.length > 0) status = "invalid";
    else if (importHash && context.hashes.has(importHash)) status = "duplicate";
    else if (row.date) {
      const key = manualMatchKey(row.date, amount);
      const left = manualCounts.get(key) ?? 0;
      if (left > 0) {
        status = "possibleDuplicate";
        manualCounts.set(key, left - 1);
      }
    }

    return {
      line: row.line,
      status,
      errors: row.errors,
      selected: status === "new",
      date: row.date,
      type,
      amountCents: Math.abs(amount),
      payee: rule.payee,
      note: row.note,
      categoryId,
      ruleApplied: rule.ruleId !== null,
      importHash,
    };
  });
}

export interface ImportSummary {
  total: number;
  selected: number;
  duplicates: number;
  possibleDuplicates: number;
  invalid: number;
}

export function summarize(candidates: readonly ImportCandidate[]): ImportSummary {
  const count = (status: CandidateStatus) => candidates.filter((c) => c.status === status).length;
  return {
    total: candidates.length,
    selected: candidates.filter((c) => c.selected && c.status !== "invalid").length,
    duplicates: count("duplicate"),
    possibleDuplicates: count("possibleDuplicate"),
    invalid: count("invalid"),
  };
}
