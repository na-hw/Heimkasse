/**
 * Date helpers. Calendar dates are stored as ISO `YYYY-MM-DD` strings
 * (no time zone), timestamps as full ISO strings (UTC).
 */

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Current timestamp as ISO string (UTC). */
export function nowIso(): string {
  return new Date().toISOString();
}

/** Formats a local Date as `YYYY-MM-DD`. */
export function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Today's local calendar date as `YYYY-MM-DD`. */
export function todayIso(): string {
  return toIsoDate(new Date());
}

/** True if the string is a real calendar date in `YYYY-MM-DD` format. */
export function isIsoDate(value: string): boolean {
  const match = ISO_DATE.exec(value);
  if (!match) return false;
  const [, y, m, d] = match;
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  return (
    date.getFullYear() === Number(y) &&
    date.getMonth() === Number(m) - 1 &&
    date.getDate() === Number(d)
  );
}

/** Parses `YYYY-MM-DD` into a local Date at midnight. Throws on invalid input. */
export function parseIsoDate(value: string): Date {
  if (!isIsoDate(value)) throw new RangeError(`Invalid ISO date: ${value}`);
  const [y, m, d] = value.split("-").map(Number) as [number, number, number];
  return new Date(y, m - 1, d);
}
