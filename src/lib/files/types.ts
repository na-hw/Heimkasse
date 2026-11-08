/**
 * Binary file storage for attachments, next to the database.
 * Paths are relative ("attachments/<id>.pdf"); adapters resolve them.
 */
export interface FileStore {
  readonly kind: "appdata" | "indexeddb" | "memory";
  write(path: string, data: Uint8Array): Promise<void>;
  /** Throws if the file does not exist. */
  read(path: string): Promise<Uint8Array>;
  /** Removing a missing file is not an error. */
  remove(path: string): Promise<void>;
  /** All stored paths (for backup and "delete all data"). */
  list(): Promise<string[]>;
}
