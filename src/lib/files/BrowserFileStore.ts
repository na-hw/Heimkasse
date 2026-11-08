import Dexie, { type Table } from "dexie";
import { AppError } from "@/lib/errors/AppError";
import type { FileStore } from "./types";

interface StoredFile {
  path: string;
  data: ArrayBuffer;
}

/** Files for the browser version, kept in their own IndexedDB database. */
export class BrowserFileStore implements FileStore {
  readonly kind = "indexeddb" as const;
  private readonly db: Dexie;
  private readonly files: Table<StoredFile, string>;

  constructor(name = "heimkasse-files") {
    this.db = new Dexie(name);
    this.db.version(1).stores({ files: "path" });
    this.files = this.db.table("files");
  }

  async write(path: string, data: Uint8Array): Promise<void> {
    await this.files.put({ path, data: data.slice().buffer });
  }

  async read(path: string): Promise<Uint8Array> {
    const file = await this.files.get(path);
    if (!file) throw new AppError("not_found", path);
    return new Uint8Array(file.data);
  }

  async remove(path: string): Promise<void> {
    await this.files.delete(path);
  }

  async list(): Promise<string[]> {
    return (await this.files.toCollection().primaryKeys()) as string[];
  }
}
