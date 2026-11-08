import { AppError } from "@/lib/errors/AppError";
import type { StorageAdapter } from "./types";

/** True when running inside the Tauri webview. */
export async function isTauriRuntime(): Promise<boolean> {
  const { isTauri } = await import("@tauri-apps/api/core");
  return isTauri();
}

/** Creates the adapter for the current runtime (SQLite in Tauri, IndexedDB in browsers). */
export async function createStorageAdapter(): Promise<StorageAdapter> {
  if (await isTauriRuntime()) {
    const [{ createTauriExecutor }, { TauriSqliteAdapter }] = await Promise.all([
      import("./adapters/sqlite/tauriExecutor"),
      import("./adapters/sqlite/TauriSqliteAdapter"),
    ]);
    return new TauriSqliteAdapter(await createTauriExecutor());
  }
  if (typeof indexedDB === "undefined") {
    throw new AppError("storage_unavailable", "IndexedDB is not available");
  }
  const { BrowserAdapter } = await import("./adapters/browser/BrowserAdapter");
  return new BrowserAdapter();
}

let storagePromise: Promise<StorageAdapter> | null = null;

/** Opens storage and runs migrations once per app session. Retries after failure. */
export function initStorage(): Promise<StorageAdapter> {
  if (!storagePromise) {
    storagePromise = (async () => {
      const adapter = await createStorageAdapter();
      await adapter.init();
      return adapter;
    })().catch((error: unknown) => {
      storagePromise = null;
      throw error;
    });
  }
  return storagePromise;
}
