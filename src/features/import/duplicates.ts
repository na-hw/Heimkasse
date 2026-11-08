/** Deterministic 64-bit string hash (cyrb53-style, two 32-bit lanes) as hex. */
function hash53(input: string, seed = 0): string {
  let h1 = 0xdeadbeef ^ seed;
  let h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < input.length; i += 1) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h2 >>> 0).toString(16).padStart(8, "0") + (h1 >>> 0).toString(16).padStart(8, "0");
}

const normalize = (value: string | null) =>
  (value ?? "").toLocaleLowerCase("de").replace(/\s+/g, " ").trim();

export interface HashInput {
  accountId: string;
  date: string;
  amountCents: number;
  payee: string | null;
  note: string | null;
}

/** Identity of a bank row (before rules rename anything). */
export function rowFingerprint(row: HashInput): string {
  return [row.accountId, row.date, row.amountCents, normalize(row.payee), normalize(row.note)].join(
    "|",
  );
}

/**
 * `import_hash` per row. Identical rows inside one file (e.g. two coffees
 * on the same day) get their occurrence number, so both are imported once
 * and both are recognised when the same file is imported again.
 */
export function importHashes(rows: readonly HashInput[]): string[] {
  const seen = new Map<string, number>();
  return rows.map((row) => {
    const fingerprint = rowFingerprint(row);
    const occurrence = (seen.get(fingerprint) ?? 0) + 1;
    seen.set(fingerprint, occurrence);
    return `v1:${hash53(`${fingerprint}#${occurrence}`)}${hash53(fingerprint, occurrence)}`;
  });
}

/** Key for "possible duplicate" checks against manually entered transactions. */
export const manualMatchKey = (date: string, signedCents: number) => `${date}|${signedCents}`;
