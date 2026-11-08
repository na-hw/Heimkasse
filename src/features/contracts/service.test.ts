// @vitest-environment node
import { beforeEach, describe, expect, it } from "vitest";
import { createRepositories, type Repositories } from "@/features/repositories";
import { ADAPTER_FACTORIES } from "@/test/adapters";
import { cancelContract, createContract, reactivateContract, updateContract } from "./service";

describe.each(ADAPTER_FACTORIES)("contract service on $name", ({ create }) => {
  let repos: Repositories;
  let giro: string;

  beforeEach(async () => {
    const storage = create();
    await storage.init();
    repos = createRepositories({ storage });
    giro = (await repos.accounts.create({ name: "Giro", type: "bank" })).id;
  });

  const input = {
    name: "Mobilfunk",
    provider: "Telekom",
    amount_cents: 2999,
    billing_frequency: "monthly" as const,
    start_date: "2026-01-01",
    minimum_term_months: 24,
  };

  it("creates a contract with a linked recurring payment", async () => {
    const contract = await createContract(repos, input, {
      account_id: giro,
      first_payment_date: "2026-12-01",
    });
    const rule = await repos.recurringRules.getOrThrow(contract.recurring_rule_id ?? "");
    expect(rule).toMatchObject({
      payee: "Telekom",
      amount_cents: 2999,
      frequency: "monthly",
      next_run_date: "2026-12-01",
      type: "expense",
    });
  });

  it("creates a contract without payment", async () => {
    const contract = await createContract(repos, input, null);
    expect(contract.recurring_rule_id).toBeNull();
    expect(await repos.recurringRules.count()).toBe(0);
  });

  it("passes amount changes on and ends the payment on cancellation", async () => {
    const contract = await createContract(repos, input, {
      account_id: giro,
      first_payment_date: "2026-12-01",
    });
    await updateContract(repos, contract, { amount_cents: 3499 }, "2026-11-08");
    const ruleId = contract.recurring_rule_id ?? "";
    expect((await repos.recurringRules.getOrThrow(ruleId)).amount_cents).toBe(3499);

    await cancelContract(repos, contract, "2027-12-31");
    expect(await repos.contracts.getOrThrow(contract.id)).toMatchObject({
      status: "cancelled",
      cancellation_date: "2027-12-31",
    });
    expect((await repos.recurringRules.getOrThrow(ruleId)).end_date).toBe("2027-12-31");

    await reactivateContract(repos, contract);
    expect((await repos.contracts.getOrThrow(contract.id)).status).toBe("active");
    expect((await repos.recurringRules.getOrThrow(ruleId)).end_date).toBeNull();
  });
});
