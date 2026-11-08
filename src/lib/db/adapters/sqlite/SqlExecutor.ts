import type { SqlStatement } from "../../sql/sqlBuilder";

/**
 * Minimal SQL execution surface. The Tauri implementation talks to
 * tauri-plugin-sql (reads) and the `db_batch` Rust command (atomic writes);
 * tests use node:sqlite.
 */
export interface SqlExecutor {
  select(statement: SqlStatement): Promise<Record<string, unknown>[]>;
  /** Executes all statements in a single transaction. */
  batch(statements: SqlStatement[]): Promise<void>;
  close(): Promise<void>;
}
