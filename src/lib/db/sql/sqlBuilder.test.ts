import { describe, expect, it } from "vitest";
import { tableDef } from "../schema";
import { createIndexSql, createTableSql } from "./ddl";
import { buildCount, buildInsert, buildSelect, buildUpdate, quoteIdent } from "./sqlBuilder";

const accounts = tableDef("accounts");

describe("sqlBuilder", () => {
  it("builds parameterized selects with null-safe comparisons", () => {
    const { sql, params } = buildSelect(accounts, {
      where: [
        { field: "deleted_at", op: "isNull" },
        { field: "archived", op: "eq", value: false },
        { field: "type", op: "in", values: ["bank", "cash"] },
        { field: "name", op: "contains", value: "Spar" },
      ],
      orderBy: [{ field: "sort_order" }, { field: "name", direction: "desc" }],
      limit: 10,
      offset: 20,
    });
    expect(sql).toBe(
      'SELECT * FROM "accounts" WHERE "deleted_at" IS NULL AND "archived" IS ? AND "type" IN (?, ?) AND instr(lower("name"), lower(?)) > 0 ORDER BY "sort_order" ASC, "name" DESC LIMIT ? OFFSET ?',
    );
    expect(params).toEqual([0, "bank", "cash", "Spar", 10, 20]);
  });

  it("rejects unknown columns and invalid identifiers", () => {
    expect(() => buildSelect(accounts, { where: [{ field: "nope", op: "isNull" }] })).toThrow(
      /Unknown column/,
    );
    expect(() =>
      buildSelect(accounts, { orderBy: [{ field: 'name"; DROP TABLE x;--' }] }),
    ).toThrow();
    expect(() => quoteIdent("a b")).toThrow();
  });

  it("encodes booleans and JSON on insert and fills defaults", () => {
    const tx = tableDef("transactions");
    const { sql, params } = buildInsert(tx, {
      id: "1",
      created_at: "t",
      updated_at: "t",
      account_id: "a",
      type: "expense",
      amount_cents: 100,
      date: "2026-11-08",
      tags: ["x"],
    });
    expect(sql.startsWith('INSERT INTO "transactions"')).toBe(true);
    expect(params).toContain('["x"]');
    expect(params.filter((p) => p === null).length).toBeGreaterThan(0);
  });

  it("throws on missing required columns", () => {
    expect(() => buildInsert(accounts, { id: "1" })).toThrow(/Missing required column/);
  });

  it("builds updates and counts", () => {
    expect(buildUpdate(accounts, "id-1", { archived: true, name: "X" })).toEqual({
      sql: 'UPDATE "accounts" SET "archived" = ?, "name" = ? WHERE "id" = ?',
      params: [1, "X", "id-1"],
    });
    expect(() => buildUpdate(accounts, "id-1", { id: "2" })).toThrow(/Primary key/);
    expect(buildCount(accounts).sql).toBe('SELECT COUNT(*) AS count FROM "accounts"');
  });

  it("generates idempotent DDL", () => {
    expect(createTableSql(accounts)).toMatch(/^CREATE TABLE IF NOT EXISTS "accounts"/);
    expect(createTableSql(accounts)).toContain(
      '"archived" INTEGER NOT NULL DEFAULT 0 CHECK ("archived" IN (0, 1))',
    );
    expect(createIndexSql("settings", { columns: ["key"], unique: true })).toBe(
      'CREATE UNIQUE INDEX IF NOT EXISTS "ux_settings_key" ON "settings" ("key")',
    );
  });
});
