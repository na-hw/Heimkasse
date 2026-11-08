import { describe, expect, it } from "vitest";
import { greetingKey } from "./greeting";

describe("greetingKey", () => {
  it.each([
    [6, "home.greeting.morning"],
    [11, "home.greeting.morning"],
    [12, "home.greeting.afternoon"],
    [17, "home.greeting.afternoon"],
    [18, "home.greeting.evening"],
    [2, "home.greeting.evening"],
  ])("%i h → %s", (hour, key) => {
    expect(greetingKey(new Date(2026, 10, 8, hour))).toBe(key);
  });
});
