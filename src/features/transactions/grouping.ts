import type { Transaction } from "./schemas";

/** Net effect of a transaction on the overall household (transfers are neutral). */
export function netEffect(tx: Pick<Transaction, "type" | "amount_cents">): number {
  if (tx.type === "income") return tx.amount_cents;
  if (tx.type === "expense") return -tx.amount_cents;
  return 0;
}

export interface DayGroup {
  date: string;
  transactions: Transaction[];
  netCents: number;
}

/** Groups an already sorted list by calendar day, preserving order. */
export function groupByDay(sorted: readonly Transaction[]): DayGroup[] {
  const groups: DayGroup[] = [];
  for (const tx of sorted) {
    const last = groups.at(-1);
    if (last && last.date === tx.date) {
      last.transactions.push(tx);
      last.netCents += netEffect(tx);
    } else {
      groups.push({ date: tx.date, transactions: [tx], netCents: netEffect(tx) });
    }
  }
  return groups;
}

export type ListItem =
  { kind: "header"; key: string; group: DayGroup } | { kind: "row"; key: string; tx: Transaction };

/** Flattens day groups into header + row items for a virtualized list. */
export function flattenGroups(groups: readonly DayGroup[]): ListItem[] {
  return groups.flatMap((group) => [
    { kind: "header" as const, key: `h-${group.date}`, group },
    ...group.transactions.map((tx) => ({ kind: "row" as const, key: tx.id, tx })),
  ]);
}
