import { describe, expect, it } from "vitest";
import de from "./locales/de.json";
import fa from "./locales/fa.json";

function leafKeys(obj: Record<string, unknown>, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([key, value]) =>
    value !== null && typeof value === "object"
      ? leafKeys(value as Record<string, unknown>, `${prefix}${key}.`)
      : [`${prefix}${key}`],
  );
}

function leafValues(obj: Record<string, unknown>): string[] {
  return Object.values(obj).flatMap((v) =>
    v !== null && typeof v === "object" ? leafValues(v as Record<string, unknown>) : [String(v)],
  );
}

describe("translations", () => {
  it("German and Persian have exactly the same keys", () => {
    expect(leafKeys(fa).sort()).toEqual(leafKeys(de).sort());
  });

  it("contain no empty strings", () => {
    expect(leafValues(de).filter((v) => v.trim() === "")).toEqual([]);
    expect(leafValues(fa).filter((v) => v.trim() === "")).toEqual([]);
  });

  it("use the same interpolation variables in both languages", () => {
    const vars = (s: string) => [...s.matchAll(/{{(\w+)}}/g)].map((m) => m[1]).sort();
    const deKeys = leafKeys(de);
    const get = (obj: Record<string, unknown>, path: string) =>
      path.split(".").reduce<unknown>((o, k) => (o as Record<string, unknown>)[k], obj) as string;
    for (const key of deKeys) {
      expect(vars(get(fa, key)), key).toEqual(vars(get(de, key)));
    }
  });
});
