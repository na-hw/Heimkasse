import { AppError } from "@/lib/errors/AppError";
import type { FileStore } from "./types";

/** In-memory file store (unit tests). */
export class MemoryFileStore implements FileStore {
  readonly kind = "memory" as const;
  private readonly files = new Map<string, Uint8Array>();

  async write(path: string, data: Uint8Array): Promise<void> {
    this.files.set(path, data.slice());
  }

  async read(path: string): Promise<Uint8Array> {
    const data = this.files.get(path);
    if (!data) throw new AppError("not_found", path);
    return data.slice();
  }

  async remove(path: string): Promise<void> {
    this.files.delete(path);
  }

  async list(): Promise<string[]> {
    return [...this.files.keys()];
  }
}
