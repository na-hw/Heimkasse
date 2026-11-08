import { describe, expect, it } from "vitest";
import { reorder } from "./reorder";

const items = [{ id: "a" }, { id: "b" }, { id: "c" }];

describe("reorder", () => {
  it("moves an item down and normalizes the order", () => {
    expect(reorder(items, "a", "down")).toEqual([
      { id: "b", sort_order: 0 },
      { id: "a", sort_order: 1 },
      { id: "c", sort_order: 2 },
    ]);
  });
  it("moves an item up", () => {
    expect(reorder(items, "c", "up").map((i) => i.id)).toEqual(["a", "c", "b"]);
  });
  it("does nothing at the edges", () => {
    expect(reorder(items, "a", "up")).toEqual([]);
    expect(reorder(items, "c", "down")).toEqual([]);
  });
});
