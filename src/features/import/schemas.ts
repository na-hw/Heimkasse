import { z } from "zod";
import { baseEntitySchema, idSchema, optionalText, requiredText } from "@/lib/validation/common";

export const IMPORT_MATCH_FIELDS = ["payee", "note", "any"] as const;

const fields = {
  match_field: z.enum(IMPORT_MATCH_FIELDS),
  match_text: requiredText(120),
  category_id: idSchema.nullable(),
  payee_rename: optionalText(120),
  sort_order: z.number().int().min(0),
};

export const importRuleSchema = baseEntitySchema.extend(fields);
export const importRuleCreateSchema = z.object({
  ...fields,
  category_id: fields.category_id.default(null),
  payee_rename: fields.payee_rename.default(null),
  sort_order: fields.sort_order.default(0),
});
export const importRuleUpdateSchema = z.object(fields).partial();

export type ImportRule = z.infer<typeof importRuleSchema>;
export type ImportRuleCreate = z.input<typeof importRuleCreateSchema>;
export type ImportRuleUpdate = z.input<typeof importRuleUpdateSchema>;
