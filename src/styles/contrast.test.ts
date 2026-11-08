import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(join(__dirname, "themes.css"), "utf8");

function block(selector: string): Record<string, string> {
  const start = css.indexOf(`${selector} {`);
  const body = css.slice(start, css.indexOf("\n}", start));
  return Object.fromEntries(
    [...body.matchAll(/(--[\w-]+):\s*(#[0-9a-f]{6})\s*;/gi)].map((m) => [m[1], m[2]]),
  );
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(a: string, b: string): number {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (l1 + 0.05) / (l2 + 0.05);
}

const THEMES = { light: block(":root"), dark: block(':root[data-theme="dark"]') };

/** [foreground, background] pairs used for text – must reach WCAG AA 4.5:1. */
const TEXT_PAIRS: Array<[string, string]> = [
  ["--color-text", "--color-bg"],
  ["--color-text", "--color-surface"],
  ["--color-text-muted", "--color-surface"],
  ["--color-text-muted", "--color-bg"],
  ["--color-text-muted", "--color-surface-sunken"],
  ["--color-text-subtle", "--color-surface"],
  ["--color-on-primary", "--color-primary"],
  ["--color-on-danger", "--color-danger"],
  ["--color-primary", "--color-surface"],
  ["--color-primary-soft-text", "--color-primary-soft"],
  ["--color-success", "--color-surface"],
  ["--color-success", "--color-success-soft"],
  ["--color-danger", "--color-surface"],
  ["--color-danger", "--color-danger-soft"],
  ["--color-warning", "--color-surface"],
  ["--color-warning", "--color-warning-soft"],
  ["--color-info", "--color-surface"],
  ["--color-info", "--color-info-soft"],
  ["--color-text-inverse", "--color-text"],
];

const SWATCHES = [
  "teal",
  "green",
  "olive",
  "amber",
  "orange",
  "red",
  "pink",
  "purple",
  "indigo",
  "blue",
  "cyan",
  "gray",
];

describe.each(Object.entries(THEMES))("%s theme contrast", (_name, tokens) => {
  it.each(TEXT_PAIRS)("%s on %s ≥ 4.5:1", (fg, bg) => {
    expect(tokens[fg], fg).toBeDefined();
    expect(tokens[bg], bg).toBeDefined();
    expect(ratio(tokens[fg] as string, tokens[bg] as string)).toBeGreaterThanOrEqual(4.5);
  });

  it.each(SWATCHES)("swatch %s on surface ≥ 4.5:1", (key) => {
    expect(
      ratio(tokens[`--swatch-${key}`] as string, tokens["--color-surface"] as string),
    ).toBeGreaterThanOrEqual(4.5);
  });

  it("border-strong is visible against surface (≥ 1.8:1 for control outlines)", () => {
    expect(
      ratio(tokens["--color-border-strong"] as string, tokens["--color-surface"] as string),
    ).toBeGreaterThanOrEqual(1.8);
  });
});
