/** Creates a RFC 4122 v4 UUID (crypto-backed, works offline in all runtimes). */
export function createId(): string {
  return crypto.randomUUID();
}
