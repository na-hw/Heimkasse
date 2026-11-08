import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import type { SqlExecutor } from "@/lib/db/adapters/sqlite/SqlExecutor";

/** SqlExecutor backed by Node's built-in SQLite – real SQL semantics in unit tests. */
export function createNodeSqliteExecutor(path = ":memory:"): SqlExecutor & { raw: DatabaseSync } {
  const db = new DatabaseSync(path);
  return {
    raw: db,
    async select({ sql, params }) {
      return db.prepare(sql).all(...(params as SQLInputValue[])) as Record<string, unknown>[];
    },
    async batch(statements) {
      db.exec("BEGIN");
      try {
        for (const s of statements) db.prepare(s.sql).run(...(s.params as SQLInputValue[]));
        db.exec("COMMIT");
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
    },
    async close() {
      db.close();
    },
  };
}
