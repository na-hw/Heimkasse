/**
 * Storage abstraction. UI code never touches adapters directly – only
 * repositories (src/features/<feature>/repository.ts) and hooks do.
 */

/** Values as stored by adapters (booleans → 0/1, JSON → string). */
export type StoredValue = string | number | null;
export type StoredRow = Record<string, StoredValue>;

/** Values as seen by repositories (decoded according to the column type). */
export type DomainValue = string | number | boolean | null | unknown[] | Record<string, unknown>;
export type DomainRow = Record<string, unknown>;

export type ColumnType = "text" | "integer" | "real" | "boolean" | "json";

export interface ColumnDef {
  type: ColumnType;
  nullable?: boolean;
  default?: string | number | boolean | null;
  primaryKey?: boolean;
}

export interface IndexDef {
  columns: string[];
  unique?: boolean;
}

export interface TableDef {
  name: string;
  columns: Record<string, ColumnDef>;
  indexes?: IndexDef[];
}

export type ComparisonOp = "eq" | "neq" | "gt" | "gte" | "lt" | "lte";

export type Condition =
  | { field: string; op: ComparisonOp; value: DomainValue }
  | { field: string; op: "in"; values: DomainValue[] }
  | { field: string; op: "isNull" | "notNull" }
  /** Case-insensitive substring match. */
  | { field: string; op: "contains"; value: string };

export interface OrderBy {
  field: string;
  direction?: "asc" | "desc";
}

export interface Query {
  where?: Condition[];
  orderBy?: OrderBy[];
  limit?: number;
  offset?: number;
}

/** Atomic write operations; `write()` applies a list of them in one transaction. */
export type WriteOp =
  | { type: "insert"; table: string; row: DomainRow; onConflict?: "abort" | "ignore" }
  | { type: "update"; table: string; id: string; patch: DomainRow }
  | { type: "delete"; table: string; id: string };

export type StorageKind = "sqlite" | "indexeddb";

export interface StorageAdapter {
  readonly kind: StorageKind;
  /** Opens the database and runs pending migrations (idempotent). */
  init(): Promise<void>;
  /** Highest applied migration version. */
  schemaVersion(): Promise<number>;
  find(table: string, query?: Query): Promise<DomainRow[]>;
  get(table: string, id: string): Promise<DomainRow | null>;
  count(table: string, where?: Condition[]): Promise<number>;
  /** Applies all operations atomically (all succeed or none). */
  write(ops: WriteOp[]): Promise<void>;
  close(): Promise<void>;
}
