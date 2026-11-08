import { z } from "zod";
import {
  baseEntitySchema,
  idSchema,
  isoDateSchema,
  optionalText,
  requiredText,
} from "@/lib/validation/common";

export const METER_TYPES = ["electricity", "gas", "water", "heating"] as const;

const meterFields = {
  name: requiredText(60),
  type: z.enum(METER_TYPES),
  unit: requiredText(12),
  meter_number: optionalText(40),
  /**
   * Price per unit in 1/1000 cent, e.g. 32,15 ct/kWh → 32150.
   * Integer like all money values; cents alone are too coarse for unit prices.
   */
  price_per_unit_millicents: z.number().int().min(0),
};

export const meterSchema = baseEntitySchema.extend(meterFields);
export const meterCreateSchema = z.object({
  ...meterFields,
  meter_number: meterFields.meter_number.default(null),
  price_per_unit_millicents: meterFields.price_per_unit_millicents.default(0),
});
export const meterUpdateSchema = z.object(meterFields).partial();

const readingFields = {
  meter_id: idSchema,
  date: isoDateSchema,
  value: z.number().finite().min(0),
  note: optionalText(300),
};

export const meterReadingSchema = baseEntitySchema.extend(readingFields);
export const meterReadingCreateSchema = z.object({
  ...readingFields,
  note: readingFields.note.default(null),
});
export const meterReadingUpdateSchema = z.object(readingFields).partial();

export type Meter = z.infer<typeof meterSchema>;
export type MeterCreate = z.input<typeof meterCreateSchema>;
export type MeterUpdate = z.input<typeof meterUpdateSchema>;
export type MeterReading = z.infer<typeof meterReadingSchema>;
export type MeterReadingCreate = z.input<typeof meterReadingCreateSchema>;
export type MeterReadingUpdate = z.input<typeof meterReadingUpdateSchema>;
