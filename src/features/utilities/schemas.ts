import { z } from "zod";
import { baseEntitySchema, centsSchema, optionalText } from "@/lib/validation/common";

const fields = {
  year: z.number().int().min(2000).max(2100),
  monthly_prepayment_cents: centsSchema.refine((v) => v >= 0),
  actual_cost_cents: centsSchema.refine((v) => v >= 0),
  /** Positive = refund (Guthaben), negative = back-payment (Nachzahlung). */
  result_cents: centsSchema,
  notes: optionalText(1000),
};

export const utilitySettlementSchema = baseEntitySchema.extend(fields);
export const utilitySettlementCreateSchema = z.object({ ...fields, notes: fields.notes.default(null) });
export const utilitySettlementUpdateSchema = z.object(fields).partial();

export type UtilitySettlement = z.infer<typeof utilitySettlementSchema>;
export type UtilitySettlementCreate = z.input<typeof utilitySettlementCreateSchema>;
export type UtilitySettlementUpdate = z.input<typeof utilitySettlementUpdateSchema>;
