import { describe, expect, it } from "vitest";
import { buildCategoryTree, siblingsOf, withDescendants } from "./tree";
import type { Category } from "./schemas";

const cat = (id: string, sort: number, parent: string | null = null, type: "income" | "expense" = "expense"): Category => ({
  id,
  created_at: "2026-11-08T10:00:00.000Z",
  updated_at: "2026-11-08T10:00:00.000Z",
  deleted_at: null,
  name: id,
  name_key: null,
  type,
  parent_id: parent,
  color: "gray",
  icon: "tag",
  is_system: false,
  archived: false,
  sort_order: sort,
});

const list = [cat("b", 2), cat("a", 1), cat("a2", 2, "a"), cat("a1", 1, "a"), cat("salary", 0, null, "income"), cat("orphan", 9, "gone")];

describe("category tree", () => {
  it("builds sorted roots with sorted children", () => {
    const tree = buildCategoryTree(list, "expense");
    expect(tree.map((n) => n.category.id)).toEqual(["a", "b", "orphan"]);
    expect(tree[0]?.children.map((c) => c.id)).toEqual(["a1", "a2"]);
  });

  it("filters by type", () => {
    expect(buildCategoryTree(list, "income").map((n) => n.category.id)).toEqual(["salary"]);
  });

  it("returns a category with its descendants", () => {
    expect(withDescendants(list, "a").sort()).toEqual(["a", "a1", "a2"]);
  });

  it("finds siblings in order", () => {
    expect(siblingsOf(list, cat("a2", 2, "a")).map((c) => c.id)).toEqual(["a1", "a2"]);
  });
});
