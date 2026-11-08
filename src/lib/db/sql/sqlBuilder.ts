import { encodePatch, encodeRow, encodeValue } from "../codec";
import { assertColumn } from "../schema";
import type { Condition, DomainRow, Query, StoredValue, TableDef } from "../types";

export interface SqlStatement {
  sql: string;
  params: StoredValue[];
}

/** Quotes an SQL identifier. Callers validate identifiers against the schema first. */
export function quoteIdent(name: string): string {
  if (!/^[a-z_][a-z0-9_]*$/i.test(name)) throw new Error(`Invalid identifier: ${name}`);
  return `"${name}"`;
}

function conditionSql(table: TableDef, c: Condition, params: StoredValue[]): string {
  assertColumn(table, c.field);
  const column = quoteIdent(c.field);
  const def = table.columns[c.field];
  if (!def) throw new Error(`Unknown column ${table.name}.${c.field}`);
  switch (c.op) {
    case "isNull":
      return `${column} IS NULL`;
    case "notNull":
      return `${column} IS NOT NULL`;
    case "in": {
      if (c.values.length === 0) return "0";
      params.push(...c.values.map((v) => encodeValue(def, v)));
      return `${column} IN (${c.values.map(() => "?").join(", ")})`;
    }
    case "contains":
      params.push(c.value);
      return `instr(lower(${column}), lower(?)) > 0`;
    case "eq":
      params.push(encodeValue(def, c.value));
      return `${column} IS ?`;
    case "neq":
      params.push(encodeValue(def, c.value));
      return `${column} IS NOT ?`;
    case "gt":
    case "gte":
    case "lt":
    case "lte": {
      const op = { gt: ">", gte: ">=", lt: "<", lte: "<=" }[c.op];
      params.push(encodeValue(def, c.value));
      return `${column} ${op} ?`;
    }
  }
}

function whereSql(table: TableDef, where: Condition[] | undefined, params: StoredValue[]): string {
  if (!where || where.length === 0) return "";
  return ` WHERE ${where.map((c) => conditionSql(table, c, params)).join(" AND ")}`;
}

export function buildSelect(table: TableDef, query: Query = {}): SqlStatement {
  const params: StoredValue[] = [];
  let sql = `SELECT * FROM ${quoteIdent(table.name)}${whereSql(table, query.where, params)}`;
  if (query.orderBy?.length) {
    const order = query.orderBy.map((o) => {
      assertColumn(table, o.field);
      return `${quoteIdent(o.field)} ${o.direction === "desc" ? "DESC" : "ASC"}`;
    });
    sql += ` ORDER BY ${order.join(", ")}`;
  }
  if (query.limit !== undefined || query.offset !== undefined) {
    sql += " LIMIT ? OFFSET ?";
    params.push(query.limit ?? -1, query.offset ?? 0);
  }
  return { sql, params };
}

export function buildCount(table: TableDef, where?: Condition[]): SqlStatement {
  const params: StoredValue[] = [];
  const sql = `SELECT COUNT(*) AS count FROM ${quoteIdent(table.name)}${whereSql(table, where, params)}`;
  return { sql, params };
}

export function buildGet(table: TableDef, id: string): SqlStatement {
  return { sql: `SELECT * FROM ${quoteIdent(table.name)} WHERE "id" = ? LIMIT 1`, params: [id] };
}

export function buildInsert(
  table: TableDef,
  row: DomainRow,
  onConflict: "abort" | "ignore" = "abort",
): SqlStatement {
  const encoded = encodeRow(table, row);
  const columns = Object.keys(encoded);
  const verb = onConflict === "ignore" ? "INSERT OR IGNORE" : "INSERT";
  return {
    sql: `${verb} INTO ${quoteIdent(table.name)} (${columns.map(quoteIdent).join(", ")}) VALUES (${columns.map(() => "?").join(", ")})`,
    params: Object.values(encoded),
  };
}

export function buildUpdate(table: TableDef, id: string, patch: DomainRow): SqlStatement {
  const encoded = encodePatch(table, patch);
  const columns = Object.keys(encoded);
  if (columns.length === 0) throw new Error("Empty update");
  return {
    sql: `UPDATE ${quoteIdent(table.name)} SET ${columns.map((c) => `${quoteIdent(c)} = ?`).join(", ")} WHERE "id" = ?`,
    params: [...Object.values(encoded), id],
  };
}

export function buildDelete(table: TableDef, id: string): SqlStatement {
  return { sql: `DELETE FROM ${quoteIdent(table.name)} WHERE "id" = ?`, params: [id] };
}

export function buildClear(table: TableDef): SqlStatement {
  return { sql: `DELETE FROM ${quoteIdent(table.name)}`, params: [] };
}
