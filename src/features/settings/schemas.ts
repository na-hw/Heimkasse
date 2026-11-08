import { z } from "zod";
import { baseEntitySchema, requiredText } from "@/lib/validation/common";

const fields = {
  key: requiredText(64),
  value: z.json(),
};

export const settingSchema = baseEntitySchema.extend(fields);
export const settingCreateSchema = z.object(fields);
export const settingUpdateSchema = z.object({ value: fields.value });

export type Setting = z.infer<typeof settingSchema>;
export type SettingCreate = z.input<typeof settingCreateSchema>;
export type SettingUpdate = z.input<typeof settingUpdateSchema>;
