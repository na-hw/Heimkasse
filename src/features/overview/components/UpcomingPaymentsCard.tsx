"use client";

import { CalendarClock } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Amount, Badge, Button, Card, CategoryIcon } from "@/components/ui";
import { useCategoryLookup } from "@/features/categories/hooks";
import { ruleTitle } from "@/features/recurring/ruleTitle";
import type { UpcomingItem } from "@/features/recurring/service";
import list from "@/features/shared/components/EntityList.module.css";
import { useFormat } from "@/lib/i18n/useFormat";
import styles from "./OverviewScreen.module.css";

const signed = ({ rule }: UpcomingItem) =>
  rule.type === "income" ? rule.amount_cents : rule.type === "expense" ? -rule.amount_cents : 0;

/** Recurring payments of the next 14 days. */
export function UpcomingPaymentsCard({ items }: { items: readonly UpcomingItem[] }) {
  const { t } = useTranslation();
  const format = useFormat();
  const categories = useCategoryLookup();
  const total = items.reduce((sum, item) => sum + signed(item), 0);

  return (
    <Card
      title={t("dashboard.upcoming.title")}
      description={t("dashboard.upcoming.description")}
      padding="none"
      actions={
        <Button asChild variant="ghost" size="sm">
          <Link href="/recurring/">{t("dashboard.upcoming.all")}</Link>
        </Button>
      }
    >
      {items.length === 0 ? (
        <p className={styles.cardBody}>{t("dashboard.upcoming.empty")}</p>
      ) : (
        <>
          <ul role="list" className={list.list}>
            {items.map((item) => {
              const { rule, date, due } = item;
              const category = categories.get(rule.category_id);
              return (
                <li key={`${rule.id}-${date}`} className={list.row}>
                  <CategoryIcon
                    icon={rule.type === "transfer" || !category ? "repeat" : category.icon}
                    color={rule.type === "transfer" || !category ? "gray" : category.color}
                  />
                  <div className={list.main}>
                    <span className={list.title}>
                      {ruleTitle(t, rule, category)}
                      {due && (
                        <Badge tone="warning" icon={<CalendarClock />}>
                          {t("recurring.upcoming.due")}
                        </Badge>
                      )}
                    </span>
                    <span className={list.meta}>{format.date(date, "full")}</span>
                  </div>
                  <div className={list.end}>
                    <Amount
                      cents={rule.type === "transfer" ? rule.amount_cents : signed(item)}
                      variant={rule.type === "transfer" ? "neutral" : "signed"}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
          <p className={styles.cardFooter}>
            {t("dashboard.upcoming.total", { amount: format.money(total) })}
          </p>
        </>
      )}
    </Card>
  );
}
