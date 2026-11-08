import { z } from "zod";
import { PAYMENT_METHODS, TAX_CATEGORIES, TRANSACTION_TYPES, tagsSchema } from "@/features/transactions/schemas";
import {
  baseEntitySchema,
  idSchema,
  isoDateSchema,
  optionalText,
  positiveCentsSchema,
} from "@/lib/validation/common";

export const FREQUENCIES = ["weekly", "monthly", "quarterly", "yearly"] as const;
export type Frequency = (typeof FREQUENCIES)[number];

const fields = {
  account_id: idSchema,
  category_id: idSchema.nullable(),
  type: z.enum(TRANSACTION_TYPES),
  amount_cents: positiveCentsSchema,
  payee: optionalText(120),
  note: optionalText(500),
  payment_method: z.enum(PAYMENT_METHODS).nullable(),
  tags: tagsSchema,
  tax_category: z.enum(TAX_CATEGORIES).nullable(),
  transfer_account_id: idSchema.nullable(),
  frequency: z.enum(FREQUENCIES),
  interval: z.number().int().min(1).max(36),
  start_date: isoDateSchema,
  end_date: isoDateSchema.nullable(),
  next_run_date: isoDateSchema,
  auto_create: z.boolean(),
  paused: z.boolean(),
};

export const recurringRuleSchema = baseEntitySchema.extend(fields);
export const recurringRuleCreateSchema = z.object({
  ...fields,
  category_id: fields.category_id.default(null),
  payee: fields.payee.default(null),
  note: fields.note.default(null),
  payment_method: fields.payment_method.default(null),
  tags: fields.tags.default([]),
  tax_category: fields.tax_category.default(null),
  transfer_account_id: fields.transfer_account_id.default(null),
  interval: fields.interval.default(1),
  end_date: fields.end_date.default(null),
  auto_create: fields.auto_create.default(true),
  paused: fields.paused.default(false),
});
export const recurringRuleUpdateSchema = z.object(fields).partial();

export type RecurringRule = z.infer<typeof recurringRuleSchema>;
export type RecurringRuleCreate = z.input<typeof recurringRuleCreateSchema>;
export type RecurringRuleUpdate = z.input<typeof recurringRuleUpdateSchema>;
