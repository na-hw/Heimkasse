import { z } from "zod";
import {
  baseEntitySchema,
  idSchema,
  isoDateSchema,
  optionalText,
  positiveCentsSchema,
  requiredText,
} from "@/lib/validation/common";

export const BILLING_FREQUENCIES = ["weekly", "monthly", "quarterly", "yearly"] as const;
export const NOTICE_UNITS = ["days", "weeks", "months"] as const;
export const CONTRACT_STATUSES = ["active", "cancelled", "ended"] as const;

const fields = {
  name: requiredText(80),
  provider: optionalText(80),
  category_id: idSchema.nullable(),
  amount_cents: positiveCentsSchema,
  billing_frequency: z.enum(BILLING_FREQUENCIES),
  start_date: isoDateSchema,
  minimum_term_months: z.number().int().min(0).max(240),
  notice_period_value: z.number().int().min(0).max(365),
  notice_period_unit: z.enum(NOTICE_UNITS),
  auto_renew_months: z.number().int().min(0).max(120),
  cancellation_date: isoDateSchema.nullable(),
  status: z.enum(CONTRACT_STATUSES),
  notes: optionalText(1000),
  recurring_rule_id: idSchema.nullable(),
};

export const contractSchema = baseEntitySchema.extend(fields);
export const contractCreateSchema = z.object({
  ...fields,
  provider: fields.provider.default(null),
  category_id: fields.category_id.default(null),
  minimum_term_months: fields.minimum_term_months.default(0),
  notice_period_value: fields.notice_period_value.default(0),
  notice_period_unit: fields.notice_period_unit.default("months"),
  auto_renew_months: fields.auto_renew_months.default(0),
  cancellation_date: fields.cancellation_date.default(null),
  status: fields.status.default("active"),
  notes: fields.notes.default(null),
  recurring_rule_id: fields.recurring_rule_id.default(null),
});
export const contractUpdateSchema = z.object(fields).partial();

export type Contract = z.infer<typeof contractSchema>;
export type ContractCreate = z.input<typeof contractCreateSchema>;
export type ContractUpdate = z.input<typeof contractUpdateSchema>;
