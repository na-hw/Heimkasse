import { AppError } from "@/lib/errors/AppError";
import type { Migration } from "../../migrations";
import { schemaAt } from "../../schema";
import { addColumnSql, createIndexSql, createTableSql } from "../../sql/ddl";
import {
  type SqlStatement,
  buildClear,
  buildDelete,
  buildInsert,
  buildUpdate,
} from "../../sql/sqlBuilder";
import type { WriteOp } from "../../types";
import type { SqlExecutor } from "./SqlExecutor";

const VERSION_TABLE_SQL =
  'CREATE TABLE IF NOT EXISTS "schema_version" ("version" INTEGER PRIMARY KEY NOT NULL, "name" TEXT NOT NULL, "applied_at" TEXT NOT NULL)';

export async function readSqlSchemaVersion(executor: SqlExecutor): Promise<number> {
  const rows = await executor.select({
    sql: 'SELECT MAX("version") AS v FROM "schema_version"',
    params: [],
  });
  return Number(rows[0]?.v ?? 0);
}

/** Compiles write operations against the schema as of `version`. */
export function compileOps(ops: WriteOp[], version: number): SqlStatement[] {
  const tables = schemaAt(version);
  return ops.map((op) => {
    const def = tables.get(op.table);
    if (!def) throw new Error(`Unknown table ${op.table}`);
    if (op.type === "insert") return buildInsert(def, op.row, op.onConflict);
    if (op.type === "update") return buildUpdate(def, op.id, op.patch);
    if (op.type === "clear") return buildClear(def);
    return buildDelete(def, op.id);
  });
}

function migrationStatements(m: Migration, now: string): SqlStatement[] {
  const ddl: string[] = [];
  for (const table of m.createTables ?? []) {
    ddl.push(createTableSql(table));
    for (const index of table.indexes ?? []) ddl.push(createIndexSql(table.name, index));
  }
  for (const c of m.addColumns ?? []) ddl.push(addColumnSql(c.table, c.column, c.def));
  for (const i of m.addIndexes ?? []) ddl.push(createIndexSql(i.table, i.index));

  return [
    ...ddl.map((sql) => ({ sql, params: [] })),
    ...compileOps(m.seed?.(now) ?? [], m.version),
    {
      sql: 'INSERT INTO "schema_version" ("version", "name", "applied_at") VALUES (?, ?, ?)',
      params: [m.version, m.name, now],
    },
  ];
}

/**
 * Runs all pending migrations. Each migration (DDL + seed + version row) is
 * applied in its own transaction, so a failure leaves the DB at the last good
 * version and the next start simply retries.
 */
export async function migrateSql(
  executor: SqlExecutor,
  migrations: readonly Migration[],
  now: () => string,
): Promise<number> {
  await executor.batch([{ sql: VERSION_TABLE_SQL, params: [] }]);
  let current = await readSqlSchemaVersion(executor);
  const latest = migrations.at(-1)?.version ?? 0;
  if (current > latest) {
    throw new AppError(
      "storage_init_failed",
      `Database version ${current} is newer than app version ${latest}`,
    );
  }
  for (const m of migrations) {
    if (m.version <= current) continue;
    await executor.batch(migrationStatements(m, now()));
    current = m.version;
  }
  return current;
}
