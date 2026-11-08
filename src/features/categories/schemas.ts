import { z } from "zod";
import {
  baseEntitySchema,
  colorKeySchema,
  iconKeySchema,
  idSchema,
  optionalText,
  requiredText,
} from "@/lib/validation/common";

export const CATEGORY_TYPES = ["income", "expense"] as const;
export type CategoryType = (typeof CATEGORY_TYPES)[number];

const fields = {
  name: requiredText(60),
  type: z.enum(CATEGORY_TYPES),
  parent_id: idSchema.nullable(),
  color: colorKeySchema,
  icon: iconKeySchema,
  archived: z.boolean(),
  sort_order: z.number().int().min(0),
};

/** Built-in categories have `name_key` (translated) and no `name`; user categories the opposite. */
export const categorySchema = baseEntitySchema.extend({
  ...fields,
  name: optionalText(60),
  name_key: z.string().nullable(),
  is_system: z.boolean(),
});

export const categoryCreateSchema = z.object({
  ...fields,
  parent_id: fields.parent_id.default(null),
  color: fields.color.default("gray"),
  icon: fields.icon.default("tag"),
  archived: fields.archived.default(false),
  sort_order: fields.sort_order.default(0),
  is_system: z.literal(false).default(false),
  name_key: z.null().default(null),
});

export const categoryUpdateSchema = z.object(fields).partial();

export type Category = z.infer<typeof categorySchema>;
export type CategoryCreate = z.input<typeof categoryCreateSchema>;
export type CategoryUpdate = z.input<typeof categoryUpdateSchema>;
