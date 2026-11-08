import type { Repositories } from "@/features/repositories";
import type { TransactionCreate } from "@/features/transactions/schemas";
import type { WriteOp } from "@/lib/db/types";
import { addDaysIso } from "@/lib/utils/dateMath";
import type { RecurringRule, RecurringRuleCreate, RecurringRuleUpdate } from "./schemas";
import { dueDates, firstOnOrAfter, occurrenceAfter, occurrencesBetween, ruleStatus } from "./schedule";

/** Transaction fields generated from a rule for one occurrence date. */
export function transactionFromRule(rule: RecurringRule, date: string): TransactionCreate {
  return {
    account_id: rule.account_id,
    category_id: rule.type === "transfer" ? null : rule.category_id,
    type: rule.type,
    amount_cents: rule.amount_cents,
    date,
    payee: rule.payee,
    note: rule.note,
    payment_method: rule.payment_method,
    tags: rule.tags,
    tax_category: rule.tax_category,
    recurring_rule_id: rule.id,
    transfer_account_id: rule.transfer_account_id,
  };
}

/** Creates a rule; the first due date is the start date (past dates get backfilled). */
export function createRule(repos: Repositories, input: Omit<RecurringRuleCreate, "next_run_date">) {
  return repos.recurringRules.create({ ...input, next_run_date: input.start_date });
}

const SCHEDULE_FIELDS = ["frequency", "interval", "start_date", "end_date"] as const;

/**
 * Updates a rule. Changes apply to future occurrences only; if the schedule
 * changes, the next date is recalculated from today (no retroactive bookings).
 */
export function updateRule(repos: Repositories, rule: RecurringRule, patch: RecurringRuleUpdate, today: string) {
  const merged = { ...rule, ...patch } as RecurringRule;
  const scheduleChanged = SCHEDULE_FIELDS.some((f) => patch[f] !== undefined && patch[f] !== rule[f]);
  if (!scheduleChanged) return repos.recurringRules.update(rule.id, patch);
  const from = rule.next_run_date > today ? rule.next_run_date : today;
  const next = firstOnOrAfter(merged, from < merged.start_date ? merged.start_date : from);
  return repos.recurringRules.update(rule.id, {
    ...patch,
    next_run_date: next ?? addDaysIso(merged.end_date ?? from, 1),
  });
}

/** Write operations that book the given dates and advance the rule. */
function bookOps(repos: Repositories, rule: RecurringRule, dates: readonly string[]): WriteOp[] {
  const last = dates.at(-1);
  if (!last) return [];
  return [
    ...dates.map((date) => repos.transactions.prepareCreate(transactionFromRule(rule, date)).op),
    repos.recurringRules.prepareUpdate(rule.id, { next_run_date: occurrenceAfter(rule, last) }),
  ];
}

/**
 * Books all due occurrences of automatic rules up to `today`. Each rule is
 * written atomically and advanced, so running this again never duplicates.
 */
export async function generateDueTransactions(repos: Repositories, today: string): Promise<number> {
  const rules = await repos.recurringRules.list({ where: [{ field: "auto_create", op: "eq", value: true }] });
  let created = 0;
  for (const rule of rules) {
    const dates = dueDates(rule, today);
    if (dates.length === 0) continue;
    await repos.storage.write(bookOps(repos, rule, dates));
    created += dates.length;
  }
  return created;
}

/** Books the next occurrence of a (manual) rule now. */
export async function bookNext(repos: Repositories, rule: RecurringRule) {
  await repos.storage.write(bookOps(repos, rule, [rule.next_run_date]));
}

/** Skips the next occurrence without booking it. */
export function skipNext(repos: Repositories, rule: RecurringRule) {
  return repos.recurringRules.update(rule.id, { next_run_date: occurrenceAfter(rule, rule.next_run_date) });
}

export interface UpcomingItem {
  rule: RecurringRule;
  date: string;
  /** Date is today or in the past and not yet booked (manual rules). */
  due: boolean;
}

/** Occurrences of active rules from their next date through today + `days`. */
export function upcomingOccurrences(rules: readonly RecurringRule[], today: string, days = 30): UpcomingItem[] {
  const until = addDaysIso(today, days);
  return rules
    .filter((r) => ruleStatus(r) === "active")
    .flatMap((rule) =>
      occurrencesBetween(rule, rule.next_run_date, until, 60).map((date) => ({ rule, date, due: date <= today })),
    )
    .sort((a, b) => a.date.localeCompare(b.date));
}
