// @vitest-environment node
import { beforeEach, describe, expect, it } from "vitest";
import { createRepositories, type Repositories } from "@/features/repositories";
import { ADAPTER_FACTORIES } from "@/test/adapters";
import { ruleStatus } from "./schedule";
import {
  bookNext,
  createRule,
  generateDueTransactions,
  skipNext,
  updateRule,
  upcomingOccurrences,
} from "./service";

const sqlite = ADAPTER_FACTORIES[0];

describe("recurring service", () => {
  let repos: Repositories;
  let accountId: string;

  beforeEach(async () => {
    if (!sqlite) throw new Error("missing adapter");
    const storage = sqlite.create();
    await storage.init();
    repos = createRepositories({ storage });
    accountId = (await repos.accounts.create({ name: "Giro", type: "bank" })).id;
  });

  const rent = (over: Record<string, unknown> = {}) =>
    createRule(repos, {
      account_id: accountId,
      type: "expense",
      amount_cents: 950_00,
      payee: "Vermieter",
      frequency: "monthly",
      start_date: "2026-08-31",
      ...over,
    });

  it("backfills due occurrences once and advances the rule", async () => {
    const rule = await rent();
    expect(await generateDueTransactions(repos, "2026-11-08")).toBe(3);
    expect(await generateDueTransactions(repos, "2026-11-08")).toBe(0);
    const txs = await repos.transactions.list({ orderBy: [{ field: "date" }] });
    expect(txs.map((t) => t.date)).toEqual(["2026-08-31", "2026-09-30", "2026-10-31"]);
    expect(txs.every((t) => t.recurring_rule_id === rule.id && t.amount_cents === 950_00)).toBe(
      true,
    );
    expect((await repos.recurringRules.getOrThrow(rule.id)).next_run_date).toBe("2026-11-30");
  });

  it("does not book paused, manual or ended rules", async () => {
    await rent({ paused: true });
    await rent({ auto_create: false });
    const ending = await rent({ end_date: "2026-01-01", start_date: "2025-12-01" });
    // Only the ended rule books: 01.12.2025 and 01.01.2026 (end date inclusive).
    expect(await generateDueTransactions(repos, "2026-11-08")).toBe(2);
    const after = await repos.recurringRules.getOrThrow(ending.id);
    expect(ruleStatus(after)).toBe("ended");
    expect(await generateDueTransactions(repos, "2026-11-08")).toBe(0);
  });

  it("books and skips manual occurrences", async () => {
    const rule = await rent({ auto_create: false, start_date: "2026-11-01" });
    await bookNext(repos, rule);
    const after = await repos.recurringRules.getOrThrow(rule.id);
    expect(after.next_run_date).toBe("2026-12-01");
    const skipped = await skipNext(repos, after);
    expect(skipped.next_run_date).toBe("2027-01-01");
    expect(await repos.transactions.count()).toBe(1);
  });

  it("applies edits to future occurrences only", async () => {
    const rule = await rent({ start_date: "2026-10-15" });
    await generateDueTransactions(repos, "2026-11-08");
    const current = await repos.recurringRules.getOrThrow(rule.id);
    const updated = await updateRule(repos, current, { amount_cents: 990_00 }, "2026-11-08");
    expect(updated.next_run_date).toBe("2026-11-15");
    const moved = await updateRule(repos, updated, { start_date: "2026-10-01" }, "2026-11-08");
    expect(moved.next_run_date).toBe("2026-12-01");
    const booked = await repos.transactions.list();
    expect(booked.every((t) => t.amount_cents === 950_00)).toBe(true);
  });

  it("lists upcoming occurrences with due flags", async () => {
    await rent({ auto_create: false, start_date: "2026-11-01" });
    const rules = await repos.recurringRules.list();
    const items = upcomingOccurrences(rules, "2026-11-08", 30);
    expect(items.map((i) => [i.date, i.due])).toEqual([
      ["2026-11-01", true],
      ["2026-12-01", false],
    ]);
  });
});
