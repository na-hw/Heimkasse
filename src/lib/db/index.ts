import type Database from "@tauri-apps/plugin-sql";

/** File name of the local SQLite database (stored in the app data directory). */
export const DB_FILE = "kiseh.db";

let dbPromise: Promise<Database> | null = null;

/** True when running inside the Tauri webview (false in a plain browser). */
export async function isTauriRuntime(): Promise<boolean> {
  const { isTauri } = await import("@tauri-apps/api/core");
  return isTauri();
}

/**
 * Returns a lazily-opened, shared connection to `kiseh.db`.
 *
 * The absolute path is resolved from the app data directory
 * (macOS: ~/Library/Application Support/<identifier>/kiseh.db).
 * Imports are dynamic so this module is safe to reference during the
 * static export build and in a plain browser.
 */
export function getDb(): Promise<Database> {
  if (!dbPromise) {
    dbPromise = (async () => {
      if (!(await isTauriRuntime())) {
        throw new Error("Database is only available inside the Tauri app.");
      }
      const [{ default: Database }, { appDataDir, join }] = await Promise.all([
        import("@tauri-apps/plugin-sql"),
        import("@tauri-apps/api/path"),
      ]);
      const path = await join(await appDataDir(), DB_FILE);
      return Database.load(`sqlite:${path}`);
    })().catch((err) => {
      dbPromise = null; // allow retry after a failure
      throw err;
    });
  }
  return dbPromise;
}

/** Closes the shared connection (e.g. before app exit or in tests). */
export async function closeDb(): Promise<void> {
  if (!dbPromise) return;
  const db = await dbPromise;
  dbPromise = null;
  await db.close();
}
