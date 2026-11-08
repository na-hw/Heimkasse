/**
 * Text decoding for bank exports. German banks deliver UTF-8 (with or
 * without BOM) or the legacy Windows-1252 / ISO-8859-1 code pages.
 * Per the WHATWG encoding standard "iso-8859-1" decodes as windows-1252,
 * which is a superset for all printable characters.
 */
export const CSV_ENCODINGS = ["utf-8", "windows-1252"] as const;
export type CsvEncoding = (typeof CSV_ENCODINGS)[number];

const UTF8_BOM = [0xef, 0xbb, 0xbf] as const;

function hasUtf8Bom(bytes: Uint8Array): boolean {
  return UTF8_BOM.every((b, i) => bytes[i] === b);
}

/** UTF-8 if the bytes have a BOM or are valid UTF-8, otherwise Windows-1252. */
export function detectEncoding(bytes: Uint8Array): CsvEncoding {
  if (hasUtf8Bom(bytes)) return "utf-8";
  try {
    new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return "utf-8";
  } catch {
    return "windows-1252";
  }
}

/** Windows-1252 code points for bytes 0x80–0x9F (everything else equals Latin-1). */
const CP1252_HIGH = [
  0x20ac, 0x81, 0x201a, 0x0192, 0x201e, 0x2026, 0x2020, 0x2021, 0x02c6, 0x2030, 0x0160, 0x2039,
  0x0152, 0x8d, 0x017d, 0x8f, 0x90, 0x2018, 0x2019, 0x201c, 0x201d, 0x2022, 0x2013, 0x2014, 0x02dc,
  0x2122, 0x0161, 0x203a, 0x0153, 0x9d, 0x017e, 0x0178,
] as const;

/** Table-based decoder: runtimes without full ICU decode windows-1252 as plain Latin-1. */
function decodeWindows1252(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; i += 4096) {
    const chunk = Array.from(bytes.subarray(i, i + 4096), (b) =>
      b >= 0x80 && b <= 0x9f ? (CP1252_HIGH[b - 0x80] ?? b) : b,
    );
    out += String.fromCharCode(...chunk);
  }
  return out;
}

const BOM = String.fromCharCode(0xfeff);

/** Decodes bytes with the given encoding; a UTF-8 BOM is stripped. */
export function decodeText(bytes: Uint8Array, encoding: CsvEncoding): string {
  const text =
    encoding === "utf-8" ? new TextDecoder("utf-8").decode(bytes) : decodeWindows1252(bytes);
  return text.startsWith(BOM) ? text.slice(1) : text;
}
