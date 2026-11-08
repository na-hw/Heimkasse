import type { ColumnDef, IndexDef, TableDef } from "../types";
import { quoteIdent } from "./sqlBuilder";

const SQL_TYPES: Record<ColumnDef["type"], string> = {
  text: "TEXT",
  integer: "INTEGER",
  real: "REAL",
  boolean: "INTEGER",
  json: "TEXT",
};

function sqlLiteral(def: ColumnDef): string {
  const value = def.default;
  if (value === undefined || value === null) return "NULL";
  if (typeof value === "boolean") return value ? "1" : "0";
  if (typeof value === "number") return String(value);
  return `'${value.replaceAll("'", "''")}'`;
}

export function columnSql(name: string, def: ColumnDef): string {
  const parts = [quoteIdent(name), SQL_TYPES[def.type]];
  if (def.primaryKey) parts.push("PRIMARY KEY");
  if (!def.nullable) parts.push("NOT NULL");
  if (def.default !== undefined) parts.push(`DEFAULT ${sqlLiteral(def)}`);
  if (def.type === "boolean") parts.push(`CHECK (${quoteIdent(name)} IN (0, 1))`);
  return parts.join(" ");
}

export function createTableSql(table: TableDef): string {
  const cols = Object.entries(table.columns).map(([name, def]) => columnSql(name, def));
  return `CREATE TABLE IF NOT EXISTS ${quoteIdent(table.name)} (${cols.join(", ")})`;
}

export function indexName(table: string, index: IndexDef): string {
  return `${index.unique ? "ux" : "ix"}_${table}_${index.columns.join("_")}`;
}

export function createIndexSql(table: string, index: IndexDef): string {
  const unique = index.unique ? "UNIQUE " : "";
  const cols = index.columns.map(quoteIdent).join(", ");
  return `CREATE ${unique}INDEX IF NOT EXISTS ${quoteIdent(indexName(table, index))} ON ${quoteIdent(table)} (${cols})`;
}

/**
 * SQLite has no ADD COLUMN IF NOT EXISTS; the migration runner only runs
 * each migration once (tracked in schema_version), which keeps this safe.
 */
export function addColumnSql(table: string, name: string, def: ColumnDef): string {
  return `ALTER TABLE ${quoteIdent(table)} ADD COLUMN ${columnSql(name, def)}`;
}
