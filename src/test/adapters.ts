import { BrowserAdapter } from "@/lib/db/adapters/browser/BrowserAdapter";
import { TauriSqliteAdapter } from "@/lib/db/adapters/sqlite/TauriSqliteAdapter";
import type { Migration } from "@/lib/db/migrations";
import { MIGRATIONS } from "@/lib/db/migrations";
import type { StorageAdapter } from "@/lib/db/types";
import { createNodeSqliteExecutor } from "./nodeSqliteExecutor";

export const FIXED_NOW = "2026-11-08T10:00:00.000Z";

let dbCounter = 0;

/** Both storage adapters, so every contract test runs against SQLite and IndexedDB. */
export const ADAPTER_FACTORIES: Array<{
  name: string;
  create: (migrations?: readonly Migration[]) => StorageAdapter;
}> = [
  {
    name: "sqlite",
    create: (migrations = MIGRATIONS) =>
      new TauriSqliteAdapter(createNodeSqliteExecutor(), migrations, () => FIXED_NOW),
  },
  {
    name: "indexeddb",
    create: (migrations = MIGRATIONS) =>
      new BrowserAdapter(`kiseh-test-${++dbCounter}`, migrations, () => FIXED_NOW),
  },
];
