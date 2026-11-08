import { addDaysIso, daysBetween } from "@/lib/utils/dateMath";
import type { Meter, MeterReading } from "./schemas";

type ReadingLike = Pick<MeterReading, "id" | "date" | "value">;

/** Default unit per meter type (editable by the user). */
export const DEFAULT_UNITS: Record<Meter["type"], string> = {
  electricity: "kWh",
  gas: "m³",
  water: "m³",
  heating: "kWh",
};

/** Cost in cents for an amount of units at a price in 1/1000 cent per unit. */
export function costCents(amount: number, priceMillicents: number): number {
  return Math.round((amount * priceMillicents) / 1000);
}

/** Readings in chronological order (stable for equal dates). */
export function sortReadings<T extends ReadingLike>(readings: readonly T[]): T[] {
  return [...readings].sort((a, b) => a.date.localeCompare(b.date) || a.value - b.value);
}

export interface ConsumptionPeriod {
  from: string;
  to: string;
  days: number;
  amount: number;
  perDay: number;
  costCents: number;
}

/** Consumption between consecutive readings. */
export function consumptionPeriods(
  readings: readonly ReadingLike[],
  priceMillicents: number,
): ConsumptionPeriod[] {
  const sorted = sortReadings(readings);
  return sorted.slice(1).map((current, i) => {
    const previous = sorted[i] as ReadingLike;
    const days = Math.max(1, daysBetween(previous.date, current.date));
    const amount = current.value - previous.value;
    return {
      from: previous.date,
      to: current.date,
      days,
      amount,
      perDay: amount / days,
      costCents: costCents(amount, priceMillicents),
    };
  });
}

export interface MeterStats {
  latest: ReadingLike | null;
  /** Average per day over (up to) the last 365 days of readings; null with < 2 readings. */
  perDay: number | null;
  yearly: number | null;
  yearlyCostCents: number | null;
}

/**
 * Key figures of a meter. The average uses the reading closest to one year
 * before the latest one (or the first reading if the history is shorter).
 */
export function meterStats(readings: readonly ReadingLike[], priceMillicents: number): MeterStats {
  const sorted = sortReadings(readings);
  const latest = sorted.at(-1) ?? null;
  if (!latest || sorted.length < 2)
    return { latest, perDay: null, yearly: null, yearlyCostCents: null };
  const yearAgo = addDaysIso(latest.date, -365);
  const base = [...sorted].reverse().find((r) => r.date <= yearAgo) ?? (sorted[0] as ReadingLike);
  const days = daysBetween(base.date, latest.date);
  if (days <= 0) return { latest, perDay: null, yearly: null, yearlyCostCents: null };
  const perDay = (latest.value - base.value) / days;
  const yearly = perDay * 365;
  return { latest, perDay, yearly, yearlyCostCents: costCents(yearly, priceMillicents) };
}

/**
 * Readings directly before and after a date (for validation: a meter only
 * counts up). `excludeId` skips the reading being edited.
 */
export function neighbours(
  readings: readonly ReadingLike[],
  date: string,
  excludeId?: string,
): { previous: ReadingLike | null; next: ReadingLike | null } {
  const others = sortReadings(readings.filter((r) => r.id !== excludeId));
  return {
    previous: [...others].reverse().find((r) => r.date <= date) ?? null,
    next: others.find((r) => r.date > date) ?? null,
  };
}

/** Price input in cent (e.g. 32,15 ct) ↔ stored millicents (32150). */
export const centsToMillicents = (cents: number) => Math.round(cents * 1000);
export const millicentsToCents = (millicents: number) => millicents / 1000;
