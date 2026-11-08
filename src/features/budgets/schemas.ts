import { z } from "zod";
import { baseEntitySchema, idSchema, positiveCentsSchema } from "@/lib/validation/common";

const fields = {
  category_id: idSchema,
  period: z.literal("monthly"),
  amount_cents: positiveCentsSchema,
  alert_threshold_percent: z.number().int().min(1).max(100),
};

export const budgetSchema = baseEntitySchema.extend(fields);
export const budgetCreateSchema = z.object({
  ...fields,
  period: fields.period.default("monthly"),
  alert_threshold_percent: fields.alert_threshold_percent.default(80),
});
export const budgetUpdateSchema = z.object(fields).partial();

export type Budget = z.infer<typeof budgetSchema>;
export type BudgetCreate = z.input<typeof budgetCreateSchema>;
export type BudgetUpdate = z.input<typeof budgetUpdateSchema>;
