// @vitest-environment node
import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { createRepositories, type Repositories } from "@/features/repositories";
import { ADAPTER_FACTORIES } from "@/test/adapters";
import type { StorageAdapter } from "./types";

let tick = 0;
const clock = () => new Date(Date.UTC(2026, 10, 8, 10, 0, tick++)).toISOString();

describe.each(ADAPTER_FACTORIES)("repositories on $name", ({ create }) => {
  let storage: StorageAdapter;
  let repos: Repositories;

  beforeEach(async () => {
    storage = create();
    await storage.init();
    repos = createRepositories({ storage, clock });
  });

  it("creates entities with ids, timestamps and defaults", async () => {
    const account = await repos.accounts.create({ name: "  Girokonto  ", type: "bank" });
    expect(account.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(account).toMatchObject({
      name: "Girokonto",
      initial_balance_cents: 0,
      archived: false,
      deleted_at: null,
    });
    expect(await repos.accounts.get(account.id)).toEqual(account);
  });

  it("rejects invalid input before writing", async () => {
    await expect(repos.accounts.create({ name: "", type: "bank" })).rejects.toThrow();
    await expect(
      repos.accounts.create({ name: "X", type: "bank", initial_balance_cents: 1.5 }),
    ).rejects.toThrow();
    expect(await repos.accounts.count()).toBe(0);
  });

  it("updates only given fields and bumps updated_at", async () => {
    const a = await repos.accounts.create({
      name: "Bar",
      type: "cash",
      initial_balance_cents: 5000,
    });
    const updated = await repos.accounts.update(a.id, { name: "Portemonnaie" });
    expect(updated).toMatchObject({
      name: "Portemonnaie",
      initial_balance_cents: 5000,
      type: "cash",
    });
    expect(updated.updated_at > a.updated_at).toBe(true);
    expect(updated.created_at).toBe(a.created_at);
  });

  it("soft deletes, restores and purges", async () => {
    const a = await repos.accounts.create({ name: "A", type: "bank" });
    const b = await repos.accounts.create({ name: "B", type: "bank" });
    await repos.accounts.softDelete([a.id]);
    expect((await repos.accounts.list()).map((x) => x.id)).toEqual([b.id]);
    expect((await repos.accounts.list({ deleted: "only" })).map((x) => x.id)).toEqual([a.id]);
    expect(await repos.accounts.count({ deleted: "include" })).toBe(2);

    await repos.accounts.restore([a.id]);
    expect(await repos.accounts.count()).toBe(2);

    await repos.accounts.purge([a.id]);
    expect(await repos.accounts.get(a.id)).toBeNull();
  });

  it("filters, sorts and paginates consistently", async () => {
    const names = ["Delta", "alpha", "Charlie", "Bravo"];
    for (const [i, name] of names.entries()) {
      await repos.accounts.create({
        name,
        type: i % 2 ? "cash" : "bank",
        sort_order: i,
        archived: i === 3,
      });
    }
    const active = await repos.accounts.listActive();
    expect(active.map((a) => a.name)).toEqual(["Delta", "alpha", "Charlie"]);

    const page = await repos.accounts.list({
      orderBy: [{ field: "sort_order", direction: "desc" }],
      limit: 2,
      offset: 1,
    });
    expect(page.map((a) => a.name)).toEqual(["Charlie", "alpha"]);

    const contains = await repos.accounts.list({
      where: [{ field: "name", op: "contains", value: "ALP" }],
    });
    expect(contains.map((a) => a.name)).toEqual(["alpha"]);

    const byType = await repos.accounts.list({
      where: [{ field: "type", op: "in", values: ["cash"] }],
      orderBy: [{ field: "name" }],
    });
    expect(byType.map((a) => a.name)).toEqual(["Bravo", "alpha"]);

    const range = await repos.accounts.list({
      where: [{ field: "sort_order", op: "gte", value: 2 }],
      orderBy: [{ field: "sort_order" }],
    });
    expect(range.map((a) => a.name)).toEqual(["Charlie", "Bravo"]);
  });

  it("stores JSON and nullable fields round-trip", async () => {
    const [category] = await repos.categories.listActive("expense");
    const account = await repos.accounts.create({ name: "Giro", type: "bank" });
    const tx = await repos.transactions.create({
      account_id: account.id,
      category_id: category?.id ?? null,
      type: "expense",
      amount_cents: 4599,
      date: "2026-11-08",
      tags: ["urlaub", "familie"],
      note: "",
    });
    const loaded = await repos.transactions.getOrThrow(tx.id);
    expect(loaded.tags).toEqual(["urlaub", "familie"]);
    expect(loaded.note).toBeNull();
    expect(loaded.amount_cents).toBe(4599);
    expect(await repos.transactions.countUsing("account_id", account.id)).toBe(1);
  });

  it("validates transfers need a different target account", async () => {
    const a = await repos.accounts.create({ name: "A", type: "bank" });
    await expect(
      repos.transactions.create({
        account_id: a.id,
        type: "transfer",
        amount_cents: 100,
        date: "2026-11-08",
        transfer_account_id: a.id,
      }),
    ).rejects.toThrow();
  });

  it("applies batched writes atomically", async () => {
    const { entity, op } = repos.accounts.prepareCreate({ name: "Atomic", type: "bank" });
    const duplicate = repos.accounts.prepareCreate({ name: "Dup", type: "bank" });
    const conflicting = {
      ...duplicate.op,
      row: { ...duplicate.entity, id: entity.id },
    } as typeof op;
    await expect(storage.write([op, conflicting])).rejects.toMatchObject({ code: "write_failed" });
    expect(await repos.accounts.get(entity.id)).toBeNull();
  });

  it("throws not_found for missing entities", async () => {
    await expect(
      repos.accounts.getOrThrow("00000000-0000-4000-8000-000000000000"),
    ).rejects.toMatchObject({
      code: "not_found",
    });
  });

  describe("settings", () => {
    it("returns defaults when nothing is stored", async () => {
      expect(await repos.settings.getPreferences()).toEqual({
        language: "fa",
        theme: "system",
        digitStyle: "persian",
        calendar: "gregorian",
        weekStart: 1,
        currency: "EUR",
        budgetMonthStartDay: 1,
      });
    });

    it("upserts and validates preferences", async () => {
      await repos.settings.setPreference("language", "de");
      await repos.settings.setPreference("language", "fa");
      await repos.settings.setPreference("budgetMonthStartDay", 25);
      expect(await repos.settings.count()).toBe(2);
      expect(await repos.settings.getPreferences()).toMatchObject({
        language: "fa",
        budgetMonthStartDay: 25,
      });
      await expect(repos.settings.setPreference("budgetMonthStartDay", 31)).rejects.toThrow();
    });

    it("falls back per key when a stored value is invalid", async () => {
      await repos.settings.create({ key: "theme", value: "neon" });
      await repos.settings.create({ key: "weekStart", value: 6 });
      expect(await repos.settings.getPreferences()).toMatchObject({
        theme: "system",
        weekStart: 6,
      });
    });
  });
});
