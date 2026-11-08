import { addDaysIso, addMonthsIso } from "./dateMath";

/** Inclusive date range of ISO calendar dates. */
export interface DateRange {
  start: string;
  end: string;
}

/** True if the ISO date lies within the range (inclusive). */
export function inRange(date: string, range: DateRange): boolean {
  return date >= range.start && date <= range.end;
}

/**
 * The budget month containing `date`. A budget month starts on `startDay`
 * (1–28) and ends the day before `startDay` of the following month,
 * e.g. start day 25: 25.10.–24.11.
 */
export function budgetPeriod(date: string, startDay: number): DateRange {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  const day = String(startDay).padStart(2, "0");
  const thisMonthStart = `${y}-${String(m).padStart(2, "0")}-${day}`;
  const start = d >= startDay ? thisMonthStart : addMonthsIso(thisMonthStart, -1);
  return { start, end: addDaysIso(addMonthsIso(start, 1), -1) };
}

/** The budget month `offset` periods before (negative) or after (positive) the given one. */
export function shiftBudgetPeriod(period: DateRange, offset: number, startDay: number): DateRange {
  return budgetPeriod(addMonthsIso(period.start, offset), startDay);
}

/** Month key `YYYY-MM` of an ISO date. */
export function monthKey(date: string): string {
  return date.slice(0, 7);
}

/** Calendar month range for a `YYYY-MM` key. */
export function monthRange(key: string): DateRange {
  const start = `${key}-01`;
  return { start, end: addDaysIso(addMonthsIso(start, 1), -1) };
}

/** Calendar year range. */
export function yearRange(year: number): DateRange {
  return { start: `${year}-01-01`, end: `${year}-12-31` };
}

/** Consecutive month keys from the month of `start` through the month of `end`. */
export function monthKeysBetween(start: string, end: string): string[] {
  const keys: string[] = [];
  const last = monthKey(end);
  for (let cur = `${monthKey(start)}-01`; monthKey(cur) <= last; cur = addMonthsIso(cur, 1))
    keys.push(monthKey(cur));
  return keys;
}

/** The `count` month keys ending with the month of `date` (oldest first). */
export function lastMonthKeys(date: string, count: number): string[] {
  return monthKeysBetween(addMonthsIso(`${monthKey(date)}-01`, -(count - 1)), date);
}
