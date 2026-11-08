import { isTauriRuntime } from "@/lib/db/runtime";
import type { FileStore } from "./types";

/** File store for the current runtime (app data folder in Tauri, IndexedDB in browsers). */
export async function createFileStore(): Promise<FileStore> {
  if (await isTauriRuntime()) {
    const { TauriFileStore } = await import("./TauriFileStore");
    return new TauriFileStore();
  }
  const { BrowserFileStore } = await import("./BrowserFileStore");
  return new BrowserFileStore();
}
