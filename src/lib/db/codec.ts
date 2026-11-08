import type { ColumnDef, DomainRow, StoredRow, StoredValue, TableDef } from "./types";

/** Encodes a domain value for storage according to its column type. */
export function encodeValue(def: ColumnDef, value: unknown): StoredValue {
  if (value === null || value === undefined) return null;
  switch (def.type) {
    case "boolean":
      return value === true || value === 1 ? 1 : 0;
    case "json":
      return JSON.stringify(value);
    case "integer":
    case "real":
      if (typeof value !== "number" || !Number.isFinite(value)) {
        throw new TypeError(`Expected a finite number, got ${String(value)}`);
      }
      if (def.type === "integer" && !Number.isInteger(value)) {
        throw new TypeError(`Expected an integer, got ${value}`);
      }
      return value;
    case "text":
      return String(value);
  }
}

/** Decodes a stored value into its domain representation. */
export function decodeValue(def: ColumnDef, value: unknown): unknown {
  if (value === null || value === undefined) return null;
  switch (def.type) {
    case "boolean":
      return value === 1 || value === true || value === "1";
    case "json":
      return typeof value === "string" ? (JSON.parse(value) as unknown) : value;
    case "integer":
    case "real":
      return Number(value);
    case "text":
      return String(value);
  }
}

/** Column default as a domain value (JSON defaults are stored as JSON text). */
function defaultValue(def: ColumnDef): unknown {
  if (def.default === undefined) return null;
  if (def.type === "json" && typeof def.default === "string") return JSON.parse(def.default);
  return def.default;
}

/** Encodes a full row for insertion; missing columns get their defaults. */
export function encodeRow(table: TableDef, row: DomainRow): StoredRow {
  const out: StoredRow = {};
  for (const [name, def] of Object.entries(table.columns)) {
    const value = Object.hasOwn(row, name) ? row[name] : defaultValue(def);
    if ((value === null || value === undefined) && !def.nullable && !def.primaryKey) {
      throw new TypeError(`Missing required column ${table.name}.${name}`);
    }
    out[name] = encodeValue(def, value);
  }
  return out;
}

/** Encodes a partial row (for updates). Unknown columns throw. */
export function encodePatch(table: TableDef, patch: DomainRow): StoredRow {
  const out: StoredRow = {};
  for (const [name, value] of Object.entries(patch)) {
    const def = table.columns[name];
    if (!def) throw new Error(`Unknown column ${table.name}.${name}`);
    if (def.primaryKey) throw new Error(`Primary key ${table.name}.${name} cannot be updated`);
    out[name] = encodeValue(def, value);
  }
  return out;
}

/** Decodes a stored row; unknown stored columns are dropped. */
export function decodeRow(table: TableDef, row: Record<string, unknown>): DomainRow {
  const out: DomainRow = {};
  for (const [name, def] of Object.entries(table.columns)) {
    out[name] = decodeValue(def, row[name]);
  }
  return out;
}
