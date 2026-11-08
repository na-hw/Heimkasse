import { describe, expect, it } from "vitest";
import { computeBalances, effectOnAccount, totalBalance } from "./balances";

const tx = (type: "income" | "expense" | "transfer", amount: number, account: string, to: string | null = null) => ({
  type,
  amount_cents: amount,
  account_id: account,
  transfer_account_id: to,
});

describe("balances", () => {
  it("applies income, expense and transfers", () => {
    const balances = computeBalances(
      [
        { id: "giro", initial_balance_cents: 100_00 },
        { id: "cash", initial_balance_cents: 0 },
      ],
      [
        tx("income", 2500_00, "giro"),
        tx("expense", 45_99, "giro"),
        tx("transfer", 200_00, "giro", "cash"),
        tx("expense", 12_50, "cash"),
      ],
    );
    expect(balances.get("giro")).toBe(100_00 + 2500_00 - 45_99 - 200_00);
    expect(balances.get("cash")).toBe(200_00 - 12_50);
    expect(totalBalance(balances, ["giro", "cash"])).toBe(100_00 + 2500_00 - 45_99 - 12_50);
  });

  it("transfers do not change the total", () => {
    const balances = computeBalances(
      [
        { id: "a", initial_balance_cents: 0 },
        { id: "b", initial_balance_cents: 0 },
      ],
      [tx("transfer", 5_00, "a", "b")],
    );
    expect(totalBalance(balances, ["a", "b"])).toBe(0);
  });

  it("ignores transactions of unknown accounts", () => {
    expect(computeBalances([{ id: "a", initial_balance_cents: 1 }], [tx("expense", 5, "x")]).get("a")).toBe(1);
  });

  it("computes the effect per account", () => {
    const t = tx("transfer", 300, "a", "b");
    expect(effectOnAccount(t, "a")).toBe(-300);
    expect(effectOnAccount(t, "b")).toBe(300);
    expect(effectOnAccount(t, "c")).toBe(0);
  });
});
