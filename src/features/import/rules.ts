import type { ImportRule } from "./schemas";

export interface RuleResult {
  ruleId: string | null;
  categoryId: string | null;
  payee: string | null;
}

const includes = (value: string | null, text: string) =>
  value !== null && value.toLocaleLowerCase("de").includes(text.toLocaleLowerCase("de"));

/** True if the rule's text occurs (case-insensitive) in the chosen field. */
export function ruleMatches(rule: ImportRule, row: { payee: string | null; note: string | null }) {
  const text = rule.match_text.trim();
  if (text === "") return false;
  if (rule.match_field === "payee") return includes(row.payee, text);
  if (rule.match_field === "note") return includes(row.note, text);
  return includes(row.payee, text) || includes(row.note, text);
}

/** Applies the first matching rule (by sort order): category and optional payee rename. */
export function applyImportRules(
  row: { payee: string | null; note: string | null },
  rules: readonly ImportRule[],
): RuleResult {
  const ordered = [...rules].sort((a, b) => a.sort_order - b.sort_order);
  const rule = ordered.find((r) => ruleMatches(r, row));
  if (!rule) return { ruleId: null, categoryId: null, payee: row.payee };
  return { ruleId: rule.id, categoryId: rule.category_id, payee: rule.payee_rename ?? row.payee };
}
