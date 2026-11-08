import { BUILTIN_CATEGORIES, builtinCategoryOps } from "../seeds/categories";
import type { Migration } from "./types";

/** Adds the built-in "Warmmiete" category (rent incl. Nebenkosten) to existing databases. */
export const migration002: Migration = {
  version: 2,
  name: "warm_rent_category",
  seed: (now) =>
    builtinCategoryOps(
      BUILTIN_CATEGORIES.filter((c) => c.key === "rent_warm"),
      now,
    ),
};
