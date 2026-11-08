import type { IconKey } from "@/lib/appearance/icons";
import type { AccountType } from "./schemas";

/** Default icon for each account type (used when creating). */
export const ACCOUNT_TYPE_ICON: Record<AccountType, IconKey> = {
  bank: "landmark",
  cash: "banknote",
  credit_card: "credit-card",
  paypal: "wallet",
};
