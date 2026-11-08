import { z } from "zod";
import { baseEntitySchema, centsSchema, colorKeySchema, iconKeySchema, requiredText } from "@/lib/validation/common";

export const ACCOUNT_TYPES = ["bank", "cash", "credit_card", "paypal"] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

const fields = {
  name: requiredText(80),
  type: z.enum(ACCOUNT_TYPES),
  initial_balance_cents: centsSchema,
  color: colorKeySchema,
  icon: iconKeySchema,
  archived: z.boolean(),
  sort_order: z.number().int().min(0),
};

export const accountSchema = baseEntitySchema.extend(fields);
export const accountCreateSchema = z.object({
  ...fields,
  initial_balance_cents: fields.initial_balance_cents.default(0),
  color: fields.color.default("teal"),
  icon: fields.icon.default("landmark"),
  archived: fields.archived.default(false),
  sort_order: fields.sort_order.default(0),
});
export const accountUpdateSchema = z.object(fields).partial();

export type Account = z.infer<typeof accountSchema>;
export type AccountCreate = z.input<typeof accountCreateSchema>;
export type AccountUpdate = z.input<typeof accountUpdateSchema>;
