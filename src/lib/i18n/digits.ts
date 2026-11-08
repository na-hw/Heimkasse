const PERSIAN_ZERO = 0x06f0;
const ARABIC_ZERO = 0x0660;

/** Converts Persian (۰-۹) and Arabic-Indic (٠-٩) digits to ASCII digits. */
export function toLatinDigits(input: string): string {
  return input.replace(/[۰-۹٠-٩]/g, (ch) => {
    const code = ch.charCodeAt(0);
    const base = code >= PERSIAN_ZERO ? PERSIAN_ZERO : ARABIC_ZERO;
    return String(code - base);
  });
}

/** Converts ASCII digits to Persian digits (used for plain strings, not Intl output). */
export function toPersianDigits(input: string): string {
  return input.replace(/[0-9]/g, (d) => String.fromCharCode(PERSIAN_ZERO + Number(d)));
}
