import { describe, expect, it } from "vitest";
import { AppError, toAppError } from "./AppError";

describe("toAppError", () => {
  it("keeps AppErrors and wraps everything else", () => {
    const original = new AppError("in_use", "x");
    expect(toAppError(original)).toBe(original);
    const wrapped = toAppError(new Error("boom"));
    expect(wrapped).toMatchObject({ code: "unknown", message: "boom" });
    expect(toAppError("text")).toMatchObject({ code: "unknown", message: "text" });
  });
});
