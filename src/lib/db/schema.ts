import { MIGRATIONS, type Migration } from "./migrations";
import type { TableDef } from "./types";

export const TABLE_NAMES = [
  "accounts",
  "categories",
  "transactions",
  "recurring_rules",
  "budgets",
  "contracts",
  "meters",
  "meter_readings",
  "utility_settlements",
  "savings_goals",
  "goal_contributions",
  "attachments",
  "import_rules",
  "settings",
] as const;

export type TableName = (typeof TABLE_NAMES)[number];

/**
 * Folds migrations into the table definitions as of `version`.
 * The current schema is therefore always derived from migrations –
 * there is exactly one source of truth.
 */
export function schemaAt(
  version: number,
  migrations: readonly Migration[] = MIGRATIONS,
): Map<string, TableDef> {
  const tables = new Map<string, TableDef>();
  for (const m of migrations) {
    if (m.version > version) break;
    for (const t of m.createTables ?? []) {
      tables.set(t.name, {
        name: t.name,
        columns: { ...t.columns },
        indexes: [...(t.indexes ?? [])],
      });
    }
    for (const { table, column, def } of m.addColumns ?? []) {
      const t = tables.get(table);
      if (!t) throw new Error(`Migration ${m.version}: unknown table ${table}`);
      t.columns[column] = def;
    }
    for (const { table, index } of m.addIndexes ?? []) {
      const t = tables.get(table);
      if (!t) throw new Error(`Migration ${m.version}: unknown table ${table}`);
      t.indexes = [...(t.indexes ?? []), index];
    }
  }
  return tables;
}

const CURRENT = schemaAt(Number.POSITIVE_INFINITY);

/** Returns the current definition of a table or throws for unknown tables. */
export function tableDef(name: string): TableDef {
  const def = CURRENT.get(name);
  if (!def) throw new Error(`Unknown table: ${name}`);
  return def;
}

/** Throws if a field does not exist on the table (protects against injection and typos). */
export function assertColumn(def: TableDef, field: string): void {
  if (!Object.hasOwn(def.columns, field)) {
    throw new Error(`Unknown column ${def.name}.${field}`);
  }
}
