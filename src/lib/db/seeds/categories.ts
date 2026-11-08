import type { ColorKey } from "@/lib/appearance/palette";
import type { IconKey } from "@/lib/appearance/icons";
import type { WriteOp } from "../types";

export interface BuiltinCategory {
  /** Fixed UUID so seeding is idempotent and stable across devices/backups. */
  id: string;
  /** Translation key below `categories.builtin`. */
  key: string;
  type: "income" | "expense";
  parentKey?: string;
  color: ColorKey;
  icon: IconKey;
}

/** Built-in categories for living in Germany. Order = default sort order. */
export const BUILTIN_CATEGORIES: readonly BuiltinCategory[] = [
  {
    id: "f2853973-e479-4ec7-bdf9-2959d72cae31",
    key: "rent",
    type: "expense",
    color: "teal",
    icon: "home",
  },
  {
    id: "e871a7d4-4da4-430e-bbbf-c40aee031a8a",
    key: "utilities",
    type: "expense",
    color: "cyan",
    icon: "receipt",
  },
  {
    id: "9046d512-47f9-4cd9-bada-fed80cfdf7bd",
    key: "energy",
    type: "expense",
    color: "amber",
    icon: "zap",
  },
  {
    id: "8907c2a4-c928-43fa-89c5-3687d3082bd7",
    key: "internet_phone",
    type: "expense",
    color: "blue",
    icon: "wifi",
  },
  {
    id: "9d549ccb-63a4-4c70-a106-3efd81531338",
    key: "broadcast_fee",
    type: "expense",
    color: "gray",
    icon: "radio",
  },
  {
    id: "43ca1f78-8035-412c-82c5-9654db6891a7",
    key: "groceries",
    type: "expense",
    color: "green",
    icon: "shopping-cart",
  },
  {
    id: "5bf2b62d-1b7e-4d5d-82e4-905902d3d825",
    key: "transport",
    type: "expense",
    color: "indigo",
    icon: "bus",
  },
  {
    id: "f04bf53a-952e-4ee4-987f-64fe5683a54d",
    key: "transport_deutschlandticket",
    type: "expense",
    parentKey: "transport",
    color: "indigo",
    icon: "train",
  },
  {
    id: "5edc53dd-8b24-4d48-b6ef-cd742a752dd2",
    key: "transport_fuel",
    type: "expense",
    parentKey: "transport",
    color: "indigo",
    icon: "fuel",
  },
  {
    id: "a0515b8d-1ccf-43c3-909a-a89105b92ebd",
    key: "insurance",
    type: "expense",
    color: "purple",
    icon: "shield",
  },
  {
    id: "679cd2c5-2148-4c9d-841a-44e6e6e69116",
    key: "insurance_health",
    type: "expense",
    parentKey: "insurance",
    color: "purple",
    icon: "heart-pulse",
  },
  {
    id: "ba3d7f47-2d53-4b09-8868-f159c5b29519",
    key: "insurance_liability",
    type: "expense",
    parentKey: "insurance",
    color: "purple",
    icon: "umbrella",
  },
  {
    id: "217b2a8a-0a63-48a6-9706-88f238083451",
    key: "insurance_household",
    type: "expense",
    parentKey: "insurance",
    color: "purple",
    icon: "sofa",
  },
  {
    id: "43cd41a3-5087-4cd9-80ab-0df1846518cc",
    key: "insurance_car",
    type: "expense",
    parentKey: "insurance",
    color: "purple",
    icon: "car",
  },
  {
    id: "98d2f103-e63b-4313-a741-cd6c91e3569f",
    key: "health",
    type: "expense",
    color: "red",
    icon: "heart-pulse",
  },
  {
    id: "89b697d8-6e1c-4135-b633-54597f2382b3",
    key: "household",
    type: "expense",
    color: "olive",
    icon: "spray-can",
  },
  {
    id: "82161b89-bdc4-4d04-9b45-0cbdf74085c2",
    key: "clothing",
    type: "expense",
    color: "pink",
    icon: "shirt",
  },
  {
    id: "15c4fe62-c46e-4e9e-ae97-be353c4189b2",
    key: "leisure",
    type: "expense",
    color: "orange",
    icon: "ticket",
  },
  {
    id: "dbeae7ea-6a31-4707-b68e-e660a2b38089",
    key: "restaurants",
    type: "expense",
    color: "orange",
    icon: "utensils",
  },
  {
    id: "aad8fcb3-01d3-43f0-bfb3-e1fb34b8cadf",
    key: "education",
    type: "expense",
    color: "blue",
    icon: "graduation-cap",
  },
  {
    id: "cbdf4e9d-0ce7-4fe6-badf-c61fc9f6960c",
    key: "subscriptions",
    type: "expense",
    color: "cyan",
    icon: "repeat",
  },
  {
    id: "caff8eb5-7f86-432a-87b1-edba73c177ca",
    key: "gifts",
    type: "expense",
    color: "pink",
    icon: "gift",
  },
  {
    id: "99efb3d9-8fb5-4242-beea-ebd8a325f383",
    key: "salary",
    type: "income",
    color: "green",
    icon: "briefcase",
  },
  {
    id: "1cd2cbe8-013f-481b-8623-2cd87675c824",
    key: "other_income",
    type: "income",
    color: "teal",
    icon: "coins",
  },
];

/** Builds idempotent insert operations for the given built-in categories. */
export function builtinCategoryOps(categories: readonly BuiltinCategory[], now: string): WriteOp[] {
  const idByKey = new Map(categories.map((c) => [c.key, c.id]));
  return categories.map((c, index) => ({
    type: "insert",
    table: "categories",
    onConflict: "ignore",
    row: {
      id: c.id,
      created_at: now,
      updated_at: now,
      deleted_at: null,
      name: null,
      name_key: `categories.builtin.${c.key}`,
      type: c.type,
      parent_id: c.parentKey ? (idByKey.get(c.parentKey) ?? null) : null,
      color: c.color,
      icon: c.icon,
      is_system: true,
      archived: false,
      sort_order: index,
    },
  }));
}
