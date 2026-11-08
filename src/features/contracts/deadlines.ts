import { addDaysIso, addMonthsIso, daysBetween } from "@/lib/utils/dateMath";
import type { Contract } from "./schemas";

export type ContractTerms = Pick<
  Contract,
  | "start_date"
  | "minimum_term_months"
  | "notice_period_value"
  | "notice_period_unit"
  | "auto_renew_months"
>;

export type DeadlineInfo =
  | {
      /** fixed = still in the minimum term, renewing = in an automatic extension. */
      kind: "fixed" | "renewing";
      /** Last day of the current term. */
      termEnd: string;
      /** Latest date the cancellation must be received. */
      deadline: string;
      daysLeft: number;
    }
  | {
      /** No fixed term (any more): can be cancelled any time with the notice period. */
      kind: "open";
      /** Contract end if cancelled today. */
      earliestEnd: string;
    };

/** Latest receipt date for a cancellation "with notice to the end of the term". */
export function noticeDeadline(
  termEnd: string,
  value: number,
  unit: Contract["notice_period_unit"],
): string {
  if (unit === "days") return addDaysIso(termEnd, -value);
  if (unit === "weeks") return addDaysIso(termEnd, -7 * value);
  // "3 months to 31.12." → must arrive by 30.09.
  return addDaysIso(addMonthsIso(addDaysIso(termEnd, 1), -value), -1);
}

/** End date when cancelling on `date` with the notice period. */
export function endIfCancelledOn(
  date: string,
  value: number,
  unit: Contract["notice_period_unit"],
): string {
  if (unit === "days") return addDaysIso(date, value);
  if (unit === "weeks") return addDaysIso(date, 7 * value);
  return addMonthsIso(date, value);
}

/** Last day of the term that ends `months` after the start (anchored to the start date). */
const termEndAfter = (start: string, months: number) => addDaysIso(addMonthsIso(start, months), -1);

/**
 * Next cancellation deadline as of `today`. After the minimum term the
 * contract renews by `auto_renew_months`; with 0 it becomes open-ended and
 * can be cancelled any time (German law for consumer contracts since 2022).
 */
export function nextDeadline(terms: ContractTerms, today: string): DeadlineInfo {
  const { start_date, minimum_term_months, notice_period_value: value } = terms;
  const unit = terms.notice_period_unit;
  const open = (): DeadlineInfo => {
    const end = endIfCancelledOn(today, value, unit);
    const minEnd = minimum_term_months > 0 ? termEndAfter(start_date, minimum_term_months) : null;
    return { kind: "open", earliestEnd: minEnd && minEnd > end ? minEnd : end };
  };
  if (minimum_term_months <= 0) return open();

  let months = minimum_term_months;
  let kind: "fixed" | "renewing" = "fixed";
  for (let guard = 0; guard < 2000; guard += 1) {
    const termEnd = termEndAfter(start_date, months);
    const deadline = noticeDeadline(termEnd, value, unit);
    if (deadline >= today)
      return { kind, termEnd, deadline, daysLeft: daysBetween(today, deadline) };
    if (terms.auto_renew_months <= 0) return open();
    months += terms.auto_renew_months;
    kind = "renewing";
  }
  return open();
}

/** Monthly equivalent of a contract amount (rounded to cents). */
export function monthlyCents(amount: number, frequency: Contract["billing_frequency"]): number {
  const factor = { weekly: 52 / 12, monthly: 1, quarterly: 1 / 3, yearly: 1 / 12 }[frequency];
  return Math.round(amount * factor);
}

export const REMINDER_DAYS = [30, 14, 3] as const;
export type ReminderStage = (typeof REMINDER_DAYS)[number];

/** The most urgent reminder stage reached (3 < 14 < 30), or null if more than 30 days are left. */
export function reminderStage(daysLeft: number): ReminderStage | null {
  if (daysLeft < 0) return null;
  return [...REMINDER_DAYS].reverse().find((d) => daysLeft <= d) ?? null;
}

export interface DueReminder {
  contractId: string;
  deadline: string;
  daysLeft: number;
  stage: ReminderStage;
}

/**
 * Reminders that are due and not yet shown. `notified` maps
 * `contractId:deadline` to the last stage shown; stale entries are dropped.
 */
export function pendingReminders(
  contracts: readonly { id: string; info: DeadlineInfo | null }[],
  notified: Readonly<Record<string, number>>,
): { due: DueReminder[]; next: Record<string, number> } {
  const due: DueReminder[] = [];
  const next: Record<string, number> = {};
  for (const { id, info } of contracts) {
    if (!info || info.kind === "open") continue;
    const key = `${id}:${info.deadline}`;
    const stage = reminderStage(info.daysLeft);
    const previous = notified[key];
    if (previous !== undefined) next[key] = previous;
    if (stage === null) continue;
    if (previous === undefined || stage < previous) {
      due.push({ contractId: id, deadline: info.deadline, daysLeft: info.daysLeft, stage });
      next[key] = stage;
    }
  }
  return { due, next };
}
