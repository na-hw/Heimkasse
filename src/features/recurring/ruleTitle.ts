import type { TFunction } from "i18next";
import { categoryDisplayName } from "@/features/categories/displayName";
import type { Category } from "@/features/categories/schemas";
import type { RecurringRule } from "./schemas";

/** Human title of a rule: payee, else category, else transaction type. */
export function ruleTitle(
  t: TFunction,
  rule: RecurringRule,
  category: Category | undefined,
): string {
  return (
    rule.payee ||
    (category ? categoryDisplayName(t, category) : t(`transactions.types.${rule.type}`))
  );
}

/** "Monatlich", "Alle 2 Monate", … */
export function frequencyLabel(
  t: TFunction,
  rule: Pick<RecurringRule, "frequency" | "interval">,
): string {
  return t(`recurring.every.${rule.frequency}`, { count: rule.interval });
}
