// @vitest-environment node
import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { ADAPTER_FACTORIES, FIXED_NOW } from "@/test/adapters";
import { createNodeSqliteExecutor } from "@/test/nodeSqliteExecutor";
import { TauriSqliteAdapter } from "./adapters/sqlite/TauriSqliteAdapter";
import { BrowserAdapter } from "./adapters/browser/BrowserAdapter";
import { LATEST_SCHEMA_VERSION, MIGRATIONS, type Migration } from "./migrations";
import { TABLE_NAMES, schemaAt } from "./schema";
import { BUILTIN_CATEGORIES } from "./seeds/categories";

describe("schema", () => {
  it("defines every table exactly as listed, each with base columns", () => {
    const tables = schemaAt(LATEST_SCHEMA_VERSION);
    expect([...tables.keys()].sort()).toEqual([...TABLE_NAMES].sort());
    for (const t of tables.values()) {
      expect(Object.keys(t.columns)).toEqual(
        expect.arrayContaining(["id", "created_at", "updated_at", "deleted_at"]),
      );
    }
  });

  it("has strictly increasing migration versions", () => {
    MIGRATIONS.forEach((m, i) => expect(m.version).toBe(i + 1));
  });
});

describe.each(ADAPTER_FACTORIES)("migrations on $name", ({ create }) => {
  it("creates all tables, seeds built-in categories and records the version", async () => {
    const adapter = create();
    await adapter.init();
    expect(await adapter.schemaVersion()).toBe(LATEST_SCHEMA_VERSION);
    expect(await adapter.count("categories")).toBe(BUILTIN_CATEGORIES.length);
    for (const table of TABLE_NAMES) {
      await expect(adapter.count(table)).resolves.toBeGreaterThanOrEqual(0);
    }
    const [rent] = await adapter.find("categories", {
      where: [{ field: "name_key", op: "eq", value: "categories.builtin.rent" }],
    });
    expect(rent).toMatchObject({
      is_system: true,
      archived: false,
      type: "expense",
      created_at: FIXED_NOW,
    });
  });

  it("is idempotent when run again", async () => {
    const adapter = create();
    await adapter.init();
    await adapter.init();
    expect(await adapter.count("categories")).toBe(BUILTIN_CATEGORIES.length);
    expect(await adapter.schemaVersion()).toBe(LATEST_SCHEMA_VERSION);
  });

  it("links subcategories to existing parents", async () => {
    const adapter = create();
    await adapter.init();
    const children = await adapter.find("categories", {
      where: [{ field: "parent_id", op: "notNull" }],
    });
    expect(children.length).toBe(BUILTIN_CATEGORIES.filter((c) => c.parentKey).length);
    for (const child of children) {
      expect(await adapter.get("categories", String(child.parent_id))).not.toBeNull();
    }
  });
});

describe("sqlite migration safety", () => {
  it("rolls back a failing migration completely and retries on next start", async () => {
    const executor = createNodeSqliteExecutor();
    const broken: Migration = {
      version: 2,
      name: "broken",
      addColumns: [{ table: "accounts", column: "iban", def: { type: "text", nullable: true } }],
      seed: () => [{ type: "insert", table: "accounts", row: { id: "x" } }],
    };
    const adapter = new TauriSqliteAdapter(executor, [...MIGRATIONS, broken], () => FIXED_NOW);
    await expect(adapter.init()).rejects.toThrow();
    expect(await adapter.schemaVersion()).toBe(1);
    const columns = await executor.select({ sql: 'PRAGMA table_info("accounts")', params: [] });
    expect(columns.map((c) => c.name)).not.toContain("iban");
  });

  it("refuses to open a database created by a newer app version", async () => {
    const executor = createNodeSqliteExecutor();
    const future: Migration = { version: 2, name: "future" };
    await new TauriSqliteAdapter(executor, [...MIGRATIONS, future]).init();
    await expect(new TauriSqliteAdapter(executor, MIGRATIONS).init()).rejects.toMatchObject({
      code: "storage_init_failed",
    });
  });

  it("applies additive migrations to existing databases", async () => {
    const executor = createNodeSqliteExecutor();
    await new TauriSqliteAdapter(executor, MIGRATIONS).init();
    const v2: Migration = {
      version: 2,
      name: "add_iban",
      addColumns: [{ table: "accounts", column: "iban", def: { type: "text", nullable: true } }],
    };
    await new TauriSqliteAdapter(executor, [...MIGRATIONS, v2]).init();
    const columns = await executor.select({ sql: 'PRAGMA table_info("accounts")', params: [] });
    expect(columns.map((c) => c.name)).toContain("iban");
  });
});

describe("indexeddb migration upgrades", () => {
  it("upgrades an existing database to a new version with seeds", async () => {
    const name = "heimkasse-upgrade-test";
    const v1 = new BrowserAdapter(name, MIGRATIONS, () => FIXED_NOW);
    await v1.init();
    await v1.close();
    const v2: Migration = {
      version: 2,
      name: "seed_more",
      seed: (now) => [
        {
          type: "insert",
          table: "import_rules",
          onConflict: "ignore",
          row: {
            id: "3f0a3f0e-8f39-4a43-9f0c-2b8f0c1d2e3f",
            created_at: now,
            updated_at: now,
            match_field: "payee",
            match_text: "REWE",
          },
        },
      ],
    };
    const upgraded = new BrowserAdapter(name, [...MIGRATIONS, v2], () => FIXED_NOW);
    await upgraded.init();
    expect(await upgraded.schemaVersion()).toBe(2);
    expect(await upgraded.count("import_rules")).toBe(1);
    expect(await upgraded.count("categories")).toBe(BUILTIN_CATEGORIES.length);
    await upgraded.destroy();
  });
});
