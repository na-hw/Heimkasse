import {
  addDays as fnsAddDays,
  addMonths as fnsAddMonths,
  differenceInCalendarDays,
} from "date-fns";
import { parseIsoDate, toIsoDate } from "./dates";

/** Date arithmetic on ISO calendar dates (`YYYY-MM-DD`), timezone-safe. */
export function addDaysIso(date: string, days: number): string {
  return toIsoDate(fnsAddDays(parseIsoDate(date), days));
}

/** Adds months; clamps to the month end (31.01. + 1 month = 28./29.02.). */
export function addMonthsIso(date: string, months: number): string {
  return toIsoDate(fnsAddMonths(parseIsoDate(date), months));
}

/** Calendar days from `a` to `b` (positive if b is later). */
export function daysBetween(a: string, b: string): number {
  return differenceInCalendarDays(parseIsoDate(b), parseIsoDate(a));
}
