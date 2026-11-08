import type { ColumnDef } from "../types";

/** Small helpers to keep table definitions readable. */
export const col = {
  id: (): ColumnDef => ({ type: "text", primaryKey: true }),
  text: (opts: Partial<ColumnDef> = {}): ColumnDef => ({ type: "text", ...opts }),
  textNull: (): ColumnDef => ({ type: "text", nullable: true }),
  int: (opts: Partial<ColumnDef> = {}): ColumnDef => ({ type: "integer", ...opts }),
  intNull: (): ColumnDef => ({ type: "integer", nullable: true }),
  real: (opts: Partial<ColumnDef> = {}): ColumnDef => ({ type: "real", ...opts }),
  bool: (defaultValue: boolean): ColumnDef => ({ type: "boolean", default: defaultValue }),
  json: (defaultValue: string): ColumnDef => ({ type: "json", default: defaultValue }),
};

/** Columns shared by every table. */
export const baseColumns = (): Record<string, ColumnDef> => ({
  id: col.id(),
  created_at: col.text(),
  updated_at: col.text(),
  deleted_at: col.textNull(),
});
