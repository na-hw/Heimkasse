// @vitest-environment node
import { beforeEach, describe, expect, it } from "vitest";
import { accountUsage, moveAccount, purgeAccount } from "@/features/accounts/service";
import {
  categoryUsage,
  purgeCategory,
  setCategoryArchived,
  softDeleteCategory,
} from "@/features/categories/service";
import { createRepositories, type Repositories } from "@/features/repositories";
import { changeCategory } from "@/features/transactions/service";
import { ADAPTER_FACTORIES } from "@/test/adapters";

describe.each(ADAPTER_FACTORIES)("entity services on $name", ({ create }) => {
  let repos: Repositories;
  let giro: string;
  let cash: string;

  beforeEach(async () => {
    const storage = create();
    await storage.init();
    repos = createRepositories({ storage });
    giro = (await repos.accounts.create({ name: "Giro", type: "bank", sort_order: 0 })).id;
    cash = (await repos.accounts.create({ name: "Bar", type: "cash", sort_order: 1 })).id;
  });

  const expense = (
    account: string,
    category: string | null = null,
    extra: Record<string, unknown> = {},
  ) =>
    repos.transactions.create({
      account_id: account,
      category_id: category,
      type: "expense",
      amount_cents: 100,
      date: "2026-11-08",
      ...extra,
    });

  it("counts account usage incl. transfer targets and rules", async () => {
    expect(await accountUsage(repos, cash)).toBe(0);
    await repos.transactions.create({
      account_id: giro,
      transfer_account_id: cash,
      type: "transfer",
      amount_cents: 5,
      date: "2026-11-08",
    });
    await repos.recurringRules.create({
      account_id: cash,
      type: "expense",
      amount_cents: 5,
      frequency: "monthly",
      start_date: "2026-11-01",
      next_run_date: "2026-11-01",
    });
    expect(await accountUsage(repos, cash)).toBe(2);
  });

  it("refuses to purge a referenced account, even by trashed transactions", async () => {
    const tx = await expense(cash);
    await repos.transactions.softDelete([tx.id]);
    await repos.accounts.softDelete([cash]);
    await expect(purgeAccount(repos, cash)).rejects.toMatchObject({ code: "in_use" });
    await repos.transactions.purge([tx.id]);
    await purgeAccount(repos, cash);
    expect(await repos.accounts.get(cash)).toBeNull();
  });

  it("reorders accounts", async () => {
    const accounts = await repos.accounts.list({ orderBy: [{ field: "sort_order" }] });
    await moveAccount(repos, accounts, cash, "up");
    const after = await repos.accounts.list({ orderBy: [{ field: "sort_order" }] });
    expect(after.map((a) => a.name)).toEqual(["Bar", "Giro"]);
  });

  it("counts category usage including subcategories", async () => {
    const all = await repos.categories.list();
    const insurance = all.find((c) => c.name_key === "categories.builtin.insurance");
    const health = all.find((c) => c.name_key === "categories.builtin.insurance_health");
    if (!insurance || !health) throw new Error("seed missing");
    await expense(giro, health.id);
    expect(await categoryUsage(repos, all, insurance.id)).toBe(1);
  });

  it("deletes and archives categories together with subcategories", async () => {
    const all = await repos.categories.list();
    const transport = all.find((c) => c.name_key === "categories.builtin.transport");
    if (!transport) throw new Error("seed missing");
    await setCategoryArchived(repos, all, transport.id, true);
    expect(
      (await repos.categories.listActive()).some(
        (c) => c.parent_id === transport.id || c.id === transport.id,
      ),
    ).toBe(false);
    await softDeleteCategory(repos, all, transport.id);
    expect(await repos.categories.count({ deleted: "only" })).toBe(3);
  });

  it("purges a category and clears references atomically", async () => {
    const groceries = (await repos.categories.list()).find(
      (c) => c.name_key === "categories.builtin.groceries",
    );
    if (!groceries) throw new Error("seed missing");
    const tx = await expense(giro, groceries.id);
    await repos.budgets.create({ category_id: groceries.id, amount_cents: 300_00 });
    const contract = await repos.contracts.create({
      name: "Gemüsekiste",
      category_id: groceries.id,
      amount_cents: 25_00,
      billing_frequency: "weekly",
      start_date: "2026-01-01",
    });
    expect(await categoryUsage(repos, await repos.categories.list(), groceries.id)).toBe(3);
    await purgeCategory(repos, groceries.id);
    expect((await repos.contracts.getOrThrow(contract.id)).category_id).toBeNull();
    expect((await repos.transactions.getOrThrow(tx.id)).category_id).toBeNull();
    expect(await repos.budgets.count({ deleted: "include" })).toBe(0);
    expect(await repos.categories.get(groceries.id)).toBeNull();
  });

  it("changes the category of many transactions at once", async () => {
    const [a, b] = [await expense(giro), await expense(giro)];
    const salary = (await repos.categories.list()).find(
      (c) => c.name_key === "categories.builtin.salary",
    );
    await changeCategory(repos, [a.id, b.id], salary?.id ?? null);
    const updated = await repos.transactions.list();
    expect(updated.every((t) => t.category_id === salary?.id)).toBe(true);
  });
});
