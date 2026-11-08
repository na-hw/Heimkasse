import type { SqlStatement } from "../../sql/sqlBuilder";
import type { SqlExecutor } from "./SqlExecutor";

/** File name of the local SQLite database inside the app data directory. */
export const DB_FILE = "heimkasse.db";

/**
 * Opens `heimkasse.db` in the app data directory via tauri-plugin-sql.
 * Reads use the plugin; writes go through the `db_batch` command, which runs
 * all statements in one SQLite transaction on a single pooled connection.
 */
export async function createTauriExecutor(): Promise<SqlExecutor> {
  const [{ default: Database }, { appDataDir, join }, { invoke }] = await Promise.all([
    import("@tauri-apps/plugin-sql"),
    import("@tauri-apps/api/path"),
    import("@tauri-apps/api/core"),
  ]);
  const path = await join(await appDataDir(), DB_FILE);
  const db = await Database.load(`sqlite:${path}`);

  return {
    select: ({ sql, params }: SqlStatement) => db.select<Record<string, unknown>[]>(sql, params),
    batch: (statements: SqlStatement[]) => invoke<void>("db_batch", { db: db.path, statements }),
    close: async () => {
      await db.close();
    },
  };
}
