import { z } from "zod";
import {
  baseEntitySchema,
  centsSchema,
  colorKeySchema,
  iconKeySchema,
  idSchema,
  isoDateSchema,
  optionalText,
  positiveCentsSchema,
  requiredText,
} from "@/lib/validation/common";

const goalFields = {
  name: requiredText(80),
  target_cents: positiveCentsSchema,
  target_date: isoDateSchema.nullable(),
  color: colorKeySchema,
  icon: iconKeySchema,
  archived: z.boolean(),
};

export const savingsGoalSchema = baseEntitySchema.extend(goalFields);
export const savingsGoalCreateSchema = z.object({
  ...goalFields,
  target_date: goalFields.target_date.default(null),
  color: goalFields.color.default("green"),
  icon: goalFields.icon.default("piggy-bank"),
  archived: goalFields.archived.default(false),
});
export const savingsGoalUpdateSchema = z.object(goalFields).partial();

const contributionFields = {
  goal_id: idSchema,
  /** Negative values are withdrawals. */
  amount_cents: centsSchema.refine((v) => v !== 0),
  date: isoDateSchema,
  note: optionalText(300),
};

export const goalContributionSchema = baseEntitySchema.extend(contributionFields);
export const goalContributionCreateSchema = z.object({ ...contributionFields, note: contributionFields.note.default(null) });
export const goalContributionUpdateSchema = z.object(contributionFields).partial();

export type SavingsGoal = z.infer<typeof savingsGoalSchema>;
export type SavingsGoalCreate = z.input<typeof savingsGoalCreateSchema>;
export type SavingsGoalUpdate = z.input<typeof savingsGoalUpdateSchema>;
export type GoalContribution = z.infer<typeof goalContributionSchema>;
export type GoalContributionCreate = z.input<typeof goalContributionCreateSchema>;
export type GoalContributionUpdate = z.input<typeof goalContributionUpdateSchema>;
