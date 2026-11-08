import type { ColumnDef, IndexDef, TableDef, WriteOp } from "../types";

/**
 * A versioned, declarative migration. Both adapters interpret the same
 * definition (SQL DDL for SQLite, store definitions for IndexedDB).
 * Structural steps must only ever be appended in new migrations –
 * never edit a released migration.
 */
export interface Migration {
  version: number;
  name: string;
  createTables?: TableDef[];
  addColumns?: Array<{ table: string; column: string; def: ColumnDef }>;
  addIndexes?: Array<{ table: string; index: IndexDef }>;
  /** Deterministic data writes (e.g. built-in categories). Inserts should use onConflict "ignore". */
  seed?: (now: string) => WriteOp[];
}
