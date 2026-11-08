import type { Repositories } from "@/features/repositories";
import { updateRule } from "@/features/recurring/service";
import type { WriteOp } from "@/lib/db/types";
import type { Contract, ContractCreate, ContractUpdate } from "./schemas";

/** Payment plan for the optional linked recurring rule. */
export interface LinkedPayment {
  account_id: string;
  first_payment_date: string;
}

/** Creates a contract and, optionally, its recurring payment in one transaction. */
export async function createContract(
  repos: Repositories,
  input: ContractCreate,
  payment: LinkedPayment | null,
): Promise<Contract> {
  const ops: WriteOp[] = [];
  let recurringRuleId: string | null = null;
  if (payment) {
    const rule = repos.recurringRules.prepareCreate({
      type: "expense",
      account_id: payment.account_id,
      category_id: input.category_id ?? null,
      amount_cents: input.amount_cents,
      payee: input.provider || input.name,
      frequency: input.billing_frequency,
      start_date: payment.first_payment_date,
      next_run_date: payment.first_payment_date,
    });
    ops.push(rule.op);
    recurringRuleId = rule.entity.id;
  }
  const contract = repos.contracts.prepareCreate({ ...input, recurring_rule_id: recurringRuleId });
  await repos.storage.write([...ops, contract.op]);
  return contract.entity;
}

/**
 * Updates a contract. Amount, billing frequency and category changes are
 * passed on to the linked recurring rule (future occurrences only).
 */
export async function updateContract(
  repos: Repositories,
  contract: Contract,
  patch: ContractUpdate,
  today: string,
): Promise<void> {
  await repos.contracts.update(contract.id, patch);
  const rule = contract.recurring_rule_id
    ? await repos.recurringRules.get(contract.recurring_rule_id)
    : null;
  if (!rule) return;
  const rulePatch = {
    ...(patch.amount_cents !== undefined && { amount_cents: patch.amount_cents }),
    ...(patch.billing_frequency !== undefined && { frequency: patch.billing_frequency }),
    ...(patch.category_id !== undefined && { category_id: patch.category_id }),
  };
  if (Object.keys(rulePatch).length > 0) await updateRule(repos, rule, rulePatch, today);
}

async function linkedRuleOps(
  repos: Repositories,
  contract: Contract,
  endDate: string | null,
): Promise<WriteOp[]> {
  const rule = contract.recurring_rule_id
    ? await repos.recurringRules.get(contract.recurring_rule_id)
    : null;
  return rule ? [repos.recurringRules.prepareUpdate(rule.id, { end_date: endDate })] : [];
}

/** Marks a contract as cancelled; the linked payment stops after `endDate`. */
export async function cancelContract(repos: Repositories, contract: Contract, endDate: string) {
  await repos.storage.write([
    repos.contracts.prepareUpdate(contract.id, { status: "cancelled", cancellation_date: endDate }),
    ...(await linkedRuleOps(repos, contract, endDate)),
  ]);
}

/** Undoes a cancellation: active again, the linked payment continues. */
export async function reactivateContract(repos: Repositories, contract: Contract) {
  await repos.storage.write([
    repos.contracts.prepareUpdate(contract.id, { status: "active", cancellation_date: null }),
    ...(await linkedRuleOps(repos, contract, null)),
  ]);
}
