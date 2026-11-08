"use client";

import {
  CalendarClock,
  MoreHorizontal,
  Pause,
  Pencil,
  Play,
  Plus,
  Repeat,
  SkipForward,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Amount,
  Badge,
  Button,
  Card,
  CategoryIcon,
  DropdownMenu,
  EmptyState,
  ErrorState,
  IconButton,
  PageHeader,
} from "@/components/ui";
import { useAccounts } from "@/features/accounts/hooks";
import { useAllCategories } from "@/features/categories/hooks";
import type { Category } from "@/features/categories/schemas";
import { ListSkeleton } from "@/features/shared/components/ListSkeleton";
import styles from "@/features/shared/components/EntityList.module.css";
import { useErrorMessage } from "@/lib/errors/useErrorMessage";
import { useFormat } from "@/lib/i18n/useFormat";
import { todayIso } from "@/lib/utils/dates";
import { useDocumentTitle } from "@/lib/utils/useDocumentTitle";
import { useRecurringMutations, useRecurringRules } from "../hooks";
import { frequencyLabel, ruleTitle } from "../ruleTitle";
import { ruleStatus } from "../schedule";
import type { RecurringRule } from "../schemas";
import { upcomingOccurrences } from "../service";
import { RecurringFormDialog } from "./RecurringFormDialog";

const signedAmount = (rule: RecurringRule) =>
  rule.type === "income" ? rule.amount_cents : -rule.amount_cents;

/** Recurring rules plus the next 30 days of occurrences. */
export function RecurringScreen() {
  const { t } = useTranslation();
  const format = useFormat();
  const errorMessage = useErrorMessage();
  useDocumentTitle(t("recurring.title"));
  const rules = useRecurringRules();
  const categories = useAllCategories();
  const accounts = useAccounts();
  const mutations = useRecurringMutations();
  const [target, setTarget] = useState<{ rule: RecurringRule | null } | null>(null);
  const today = todayIso();

  const categoryById = useMemo(
    () => new Map((categories.data ?? []).map((c) => [c.id, c])),
    [categories.data],
  );
  const accountById = useMemo(
    () => new Map((accounts.data?.all ?? []).map((a) => [a.id, a])),
    [accounts.data],
  );
  const upcoming = useMemo(() => upcomingOccurrences(rules.data ?? [], today), [rules.data, today]);
  const categoryOf = (rule: RecurringRule): Category | undefined =>
    rule.category_id ? categoryById.get(rule.category_id) : undefined;

  const icon = (rule: RecurringRule) => {
    const category = categoryOf(rule);
    return rule.type === "transfer" || !category ? (
      <CategoryIcon icon="repeat" color="gray" />
    ) : (
      <CategoryIcon icon={category.icon} color={category.color} />
    );
  };

  const addButton = (
    <Button variant="primary" iconStart={<Plus />} onClick={() => setTarget({ rule: null })}>
      {t("recurring.add")}
    </Button>
  );

  if (rules.isError) {
    return (
      <>
        <PageHeader title={t("recurring.title")} description={t("recurring.description")} />
        <ErrorState description={errorMessage(rules.error)} onRetry={() => void rules.refetch()} />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={t("recurring.title")}
        description={t("recurring.description")}
        actions={addButton}
      />
      {!rules.data ? (
        <Card padding="none">
          <ListSkeleton />
        </Card>
      ) : rules.data.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Repeat />}
            title={t("recurring.empty.title")}
            description={t("recurring.empty.text")}
            action={addButton}
          />
        </Card>
      ) : (
        <>
          <Card
            title={t("recurring.upcoming.title")}
            description={t("recurring.upcoming.description")}
            padding="md"
          >
            {upcoming.length === 0 ? (
              <p className={styles.meta}>{t("recurring.upcoming.empty")}</p>
            ) : (
              <ul role="list" className={styles.list}>
                {upcoming.map(({ rule, date, due }) => (
                  <li key={`${rule.id}-${date}`} className={styles.row}>
                    {icon(rule)}
                    <div className={styles.main}>
                      <span className={styles.title}>
                        {ruleTitle(t, rule, categoryOf(rule))}
                        {due && (
                          <Badge tone="warning" icon={<CalendarClock />}>
                            {t("recurring.upcoming.due")}
                          </Badge>
                        )}
                        {!rule.auto_create && !due && (
                          <Badge>{t("recurring.upcoming.manual")}</Badge>
                        )}
                      </span>
                      <span className={styles.meta}>{format.date(date, "full")}</span>
                    </div>
                    <div className={styles.end}>
                      <Amount
                        cents={signedAmount(rule)}
                        variant={rule.type === "transfer" ? "neutral" : "signed"}
                      />
                      {due && date === rule.next_run_date && (
                        <>
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => mutations.book.mutate(rule)}
                          >
                            {t("recurring.upcoming.book")}
                          </Button>
                          <IconButton
                            size="sm"
                            label={t("recurring.skip")}
                            icon={<SkipForward />}
                            onClick={() => mutations.skip.mutate(rule)}
                          />
                        </>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <h2 className={styles.sectionTitle}>{t("recurring.listTitle")}</h2>
          <Card padding="none">
            <ul role="list" className={styles.list}>
              {rules.data.map((rule) => {
                const status = ruleStatus(rule);
                const title = ruleTitle(t, rule, categoryOf(rule));
                return (
                  <li key={rule.id} className={styles.row}>
                    {icon(rule)}
                    <div className={styles.main}>
                      <span className={styles.title}>
                        {title}
                        {status !== "active" && (
                          <Badge tone={status === "paused" ? "warning" : "neutral"}>
                            {t(`recurring.status.${status}`)}
                          </Badge>
                        )}
                      </span>
                      <span className={styles.meta}>
                        {[
                          frequencyLabel(t, rule),
                          status === "ended"
                            ? null
                            : t("recurring.nextDate", {
                                date: format.date(rule.next_run_date, "medium"),
                              }),
                          accountById.get(rule.account_id)?.name,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </div>
                    <div className={styles.end}>
                      <Amount
                        cents={signedAmount(rule)}
                        variant={rule.type === "transfer" ? "neutral" : "signed"}
                      />
                      <DropdownMenu
                        trigger={
                          <IconButton
                            label={t("common.actionsFor", { name: title })}
                            icon={<MoreHorizontal />}
                          />
                        }
                        items={[
                          {
                            id: "edit",
                            label: t("common.edit"),
                            icon: <Pencil />,
                            onSelect: () => setTarget({ rule }),
                          },
                          rule.paused
                            ? {
                                id: "resume",
                                label: t("recurring.resume"),
                                icon: <Play />,
                                onSelect: () => mutations.setPaused.mutate({ rule, paused: false }),
                              }
                            : {
                                id: "pause",
                                label: t("recurring.pause"),
                                icon: <Pause />,
                                disabled: status === "ended",
                                onSelect: () => mutations.setPaused.mutate({ rule, paused: true }),
                              },
                          {
                            id: "skip",
                            label: t("recurring.skip"),
                            icon: <SkipForward />,
                            disabled: status !== "active",
                            onSelect: () => mutations.skip.mutate(rule),
                          },
                          { type: "separator", id: "sep" },
                          {
                            id: "delete",
                            label: t("common.delete"),
                            icon: <Trash2 />,
                            tone: "danger",
                            onSelect: () => mutations.remove.mutate(rule.id),
                          },
                        ]}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>
        </>
      )}
      <RecurringFormDialog target={target} onClose={() => setTarget(null)} />
    </>
  );
}
