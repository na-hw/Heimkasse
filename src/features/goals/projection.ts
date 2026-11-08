import { addMonthsIso, daysBetween } from "@/lib/utils/dateMath";
import type { GoalContribution, SavingsGoal } from "./schemas";

type ContributionLike = Pick<GoalContribution, "amount_cents" | "date">;

const AVERAGE_MONTHS = 3;
const DAYS_PER_MONTH = 30.44;

export interface GoalProgress {
  saved: number;
  remaining: number;
  /** saved / target, capped at 1. */
  ratio: number;
  reached: boolean;
  /** Average net contribution per month over the last 3 months. */
  averageMonthly: number;
  /** Expected date the target is reached at the current pace; null without positive pace. */
  projectedDate: string | null;
  /** Monthly amount needed to reach the target by its date; null without target date or when reached. */
  requiredMonthly: number | null;
  /** The target date has passed without reaching the goal. */
  overdue: boolean;
}

export function goalProgress(
  goal: Pick<SavingsGoal, "target_cents" | "target_date">,
  contributions: readonly ContributionLike[],
  today: string,
): GoalProgress {
  const saved = contributions.reduce((s, c) => s + c.amount_cents, 0);
  const remaining = Math.max(0, goal.target_cents - saved);
  const reached = remaining === 0;
  const since = addMonthsIso(today, -AVERAGE_MONTHS);
  const recent = contributions
    .filter((c) => c.date > since && c.date <= today)
    .reduce((s, c) => s + c.amount_cents, 0);
  const averageMonthly = Math.round(recent / AVERAGE_MONTHS);

  const projectedDate =
    reached || averageMonthly <= 0
      ? null
      : addMonthsIso(today, Math.ceil(remaining / averageMonthly));

  const overdue = !reached && goal.target_date !== null && goal.target_date < today;
  const requiredMonthly =
    reached || goal.target_date === null || overdue
      ? null
      : Math.ceil(
          remaining / Math.max(1, Math.ceil(daysBetween(today, goal.target_date) / DAYS_PER_MONTH)),
        );

  return {
    saved,
    remaining,
    ratio: goal.target_cents > 0 ? Math.min(1, saved / goal.target_cents) : 0,
    reached,
    averageMonthly,
    projectedDate,
    requiredMonthly,
    overdue,
  };
}
