import { BUILTIN_CATEGORIES, builtinCategoryOps } from "../seeds/categories";
import type { Migration } from "./types";

const KEYS = new Set([
  "sport",
  "sport_parents",
  "sport_children",
  "subscriptions_streaming",
  "childcare",
]);

/** Adds the built-in Sport (parents/children), Streaming and Kita categories to existing databases. */
export const migration003: Migration = {
  version: 3,
  name: "sport_streaming_childcare_categories",
  seed: (now) =>
    builtinCategoryOps(
      BUILTIN_CATEGORIES.filter((c) => KEYS.has(c.key)),
      now,
    ),
};
