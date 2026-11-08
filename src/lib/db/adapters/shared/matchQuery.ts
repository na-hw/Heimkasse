import { decodeValue, encodeValue } from "../../codec";
import { assertColumn } from "../../schema";
import type { Condition, OrderBy, Query, TableDef } from "../../types";

/**
 * In-memory query evaluation with the same semantics as the SQL builder
 * (null-safe eq/neq, nulls never match range comparisons, NULLs sort first
 * ascending like SQLite). Used by the IndexedDB adapter.
 */
export function matchesCondition(table: TableDef, row: Record<string, unknown>, c: Condition): boolean {
  assertColumn(table, c.field);
  const def = table.columns[c.field];
  if (!def) return false;
  const actual = row[c.field] ?? null;
  switch (c.op) {
    case "isNull":
      return actual === null;
    case "notNull":
      return actual !== null;
    case "in":
      return c.values.some((v) => encodeValue(def, v) === actual);
    case "contains":
      return actual !== null && String(actual).toLowerCase().includes(c.value.toLowerCase());
    case "eq":
      return encodeValue(def, c.value) === actual;
    case "neq":
      return encodeValue(def, c.value) !== actual;
    default: {
      const expected = encodeValue(def, c.value);
      if (actual === null || expected === null) return false;
      const a = decodeValue(def, actual) as string | number;
      const e = decodeValue(def, expected) as string | number;
      if (c.op === "gt") return a > e;
      if (c.op === "gte") return a >= e;
      if (c.op === "lt") return a < e;
      return a <= e;
    }
  }
}

function compare(a: unknown, b: unknown): number {
  if (a === b) return 0;
  if (a === null || a === undefined) return -1;
  if (b === null || b === undefined) return 1;
  return (a as string | number) < (b as string | number) ? -1 : 1;
}

export function sortRows<T extends Record<string, unknown>>(table: TableDef, rows: T[], orderBy: OrderBy[] = []): T[] {
  if (orderBy.length === 0) return rows;
  orderBy.forEach((o) => assertColumn(table, o.field));
  return [...rows].sort((x, y) => {
    for (const o of orderBy) {
      const result = compare(x[o.field], y[o.field]);
      if (result !== 0) return o.direction === "desc" ? -result : result;
    }
    return 0;
  });
}

/** Filters, sorts and paginates stored rows. */
export function applyQuery<T extends Record<string, unknown>>(table: TableDef, rows: T[], query: Query = {}): T[] {
  const filtered = rows.filter((row) => (query.where ?? []).every((c) => matchesCondition(table, row, c)));
  const sorted = sortRows(table, filtered, query.orderBy);
  const start = query.offset ?? 0;
  const end = query.limit !== undefined ? start + query.limit : undefined;
  return sorted.slice(start, end);
}
