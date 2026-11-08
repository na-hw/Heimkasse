import { z } from "zod";
import {
  baseEntitySchema,
  idSchema,
  isoDateSchema,
  optionalText,
  positiveCentsSchema,
} from "@/lib/validation/common";

export const TRANSACTION_TYPES = ["income", "expense", "transfer"] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const PAYMENT_METHODS = [
  "card",
  "cash",
  "bank_transfer",
  "direct_debit",
  "paypal",
  "other",
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

/** German tax-relevant categories (Steuerhelfer). */
export const TAX_CATEGORIES = [
  "work_expenses",
  "home_office",
  "craftsman_services",
  "household_services",
  "medical_costs",
  "donations",
  "insurance",
] as const;
export type TaxCategory = (typeof TAX_CATEGORIES)[number];

export const tagsSchema = z.array(z.string().trim().min(1).max(40)).max(20);

const fields = {
  account_id: idSchema,
  category_id: idSchema.nullable(),
  type: z.enum(TRANSACTION_TYPES),
  /** Always positive; the type determines the direction. */
  amount_cents: positiveCentsSchema,
  date: isoDateSchema,
  payee: optionalText(120),
  note: optionalText(500),
  payment_method: z.enum(PAYMENT_METHODS).nullable(),
  tags: tagsSchema,
  tax_category: z.enum(TAX_CATEGORIES).nullable(),
  recurring_rule_id: idSchema.nullable(),
  transfer_account_id: idSchema.nullable(),
  import_hash: z.string().max(128).nullable(),
};

export const transactionSchema = baseEntitySchema.extend(fields);

export const transactionCreateSchema = z
  .object({
    ...fields,
    category_id: fields.category_id.default(null),
    payee: fields.payee.default(null),
    note: fields.note.default(null),
    payment_method: fields.payment_method.default(null),
    tags: fields.tags.default([]),
    tax_category: fields.tax_category.default(null),
    recurring_rule_id: fields.recurring_rule_id.default(null),
    transfer_account_id: fields.transfer_account_id.default(null),
    import_hash: fields.import_hash.default(null),
  })
  .refine(
    (t) =>
      t.type !== "transfer" ||
      (t.transfer_account_id !== null && t.transfer_account_id !== t.account_id),
    {
      path: ["transfer_account_id"],
      message: "validation.required",
    },
  );

export const transactionUpdateSchema = z.object(fields).partial();

export type Transaction = z.infer<typeof transactionSchema>;
export type TransactionCreate = z.input<typeof transactionCreateSchema>;
export type TransactionUpdate = z.input<typeof transactionUpdateSchema>;
