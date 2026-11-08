import { addDaysIso, addMonthsIso, daysBetween } from "@/lib/utils/dateMath";
import type { Frequency, RecurringRule } from "./schemas";

export interface Schedule {
  frequency: Frequency;
  interval: number;
  start_date: string;
  end_date: string | null;
}

const MONTHS_PER_STEP: Record<Exclude<Frequency, "weekly">, number> = {
  monthly: 1,
  quarterly: 3,
  yearly: 12,
};

/**
 * The n-th occurrence (0 = start). Months are always counted from the start
 * date, so a rule starting on the 31st stays on month ends (31.01. → 28.02. → 31.03.).
 */
export function occurrenceAt(s: Schedule, n: number): string {
  if (s.frequency === "weekly") return addDaysIso(s.start_date, 7 * s.interval * n);
  return addMonthsIso(s.start_date, MONTHS_PER_STEP[s.frequency] * s.interval * n);
}

function approxStepDays(s: Schedule): number {
  return s.frequency === "weekly"
    ? 7 * s.interval
    : 30.44 * MONTHS_PER_STEP[s.frequency] * s.interval;
}

/** Index of the first occurrence on or after `date` (ignores the end date). */
function firstIndexOnOrAfter(s: Schedule, date: string): number {
  if (date <= s.start_date) return 0;
  let n = Math.max(0, Math.floor(daysBetween(s.start_date, date) / approxStepDays(s)) - 1);
  while (occurrenceAt(s, n) < date) n += 1;
  return n;
}

/** First occurrence on or after `date`, or null if the schedule has ended by then. */
export function firstOnOrAfter(s: Schedule, date: string): string | null {
  const occ = occurrenceAt(s, firstIndexOnOrAfter(s, date));
  return s.end_date && occ > s.end_date ? null : occ;
}

/** The occurrence strictly after `date`, ignoring the end date (used to advance next_run_date). */
export function occurrenceAfter(s: Schedule, date: string): string {
  return occurrenceAt(s, firstIndexOnOrAfter(s, addDaysIso(date, 1)));
}

/** All occurrences from `from` through `to` (inclusive), respecting the end date. */
export function occurrencesBetween(s: Schedule, from: string, to: string, limit = 400): string[] {
  const result: string[] = [];
  let n = firstIndexOnOrAfter(s, from);
  for (
    let occ = occurrenceAt(s, n);
    occ <= to && result.length < limit;
    occ = occurrenceAt(s, ++n)
  ) {
    if (s.end_date && occ > s.end_date) break;
    result.push(occ);
  }
  return result;
}

export type RuleStatus = "active" | "paused" | "ended";

export function ruleStatus(
  rule: Pick<RecurringRule, "paused" | "end_date" | "next_run_date">,
): RuleStatus {
  if (rule.end_date && rule.next_run_date > rule.end_date) return "ended";
  return rule.paused ? "paused" : "active";
}

/** Dates that are due (next_run_date … today), capped to protect against huge backfills. */
export function dueDates(rule: RecurringRule, today: string, limit = 400): string[] {
  if (ruleStatus(rule) !== "active" || rule.next_run_date > today) return [];
  return occurrencesBetween(rule, rule.next_run_date, today, limit);
}
