import { z } from "zod";
import { ICON_KEYS } from "@/lib/appearance/icons";
import { COLOR_KEYS } from "@/lib/appearance/palette";
import { isIsoDate } from "@/lib/utils/dates";
import { validationMessage } from "./messages";
import "./zodConfig";

export const idSchema = z.uuid();

export const isoDateSchema = z
  .string()
  .refine(isIsoDate, { message: validationMessage("validation.invalidDate") });

export const isoTimestampSchema = z.iso.datetime();

/** Integer cents (money is never stored as float). */
export const centsSchema = z
  .number()
  .int()
  .refine(Number.isSafeInteger, { message: validationMessage("validation.invalidAmount") });

export const positiveCentsSchema = centsSchema.refine((v) => v > 0, {
  message: validationMessage("validation.positive"),
});

/** Required, trimmed text. */
export const requiredText = (max: number) => z.string().trim().min(1).max(max);

/** Optional text; empty strings become null. */
export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .transform((v) => (v === "" ? null : v));

export const colorKeySchema = z.enum(COLOR_KEYS);
export const iconKeySchema = z.enum(ICON_KEYS);

/** Fields every entity has. */
export const baseEntitySchema = z.object({
  id: idSchema,
  created_at: isoTimestampSchema,
  updated_at: isoTimestampSchema,
  deleted_at: isoTimestampSchema.nullable(),
});

export type BaseEntity = z.infer<typeof baseEntitySchema>;
