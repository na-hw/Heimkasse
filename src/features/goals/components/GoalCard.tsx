"use client";

import {
  Archive,
  ArchiveRestore,
  ChevronDown,
  CircleCheck,
  Minus,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Amount,
  Badge,
  Button,
  Card,
  CategoryIcon,
  DropdownMenu,
  IconButton,
  ProgressBar,
} from "@/components/ui";
import list from "@/features/shared/components/EntityList.module.css";
import { useFormat } from "@/lib/i18n/useFormat";
import { cn } from "@/lib/utils/cn";
import { type GoalView, useGoalMutations } from "../hooks";
import type { SavingsGoal } from "../schemas";
import styles from "./GoalsScreen.module.css";

interface Props {
  view: GoalView;
  onEdit: (goal: SavingsGoal) => void;
  onContribute: (goal: SavingsGoal, kind: "deposit" | "withdrawal") => void;
}

/** One savings goal: progress, projection, deposit/withdraw and history. */
export function GoalCard({ view, onEdit, onContribute }: Props) {
  const { t } = useTranslation();
  const format = useFormat();
  const { setArchived, remove, removeContribution } = useGoalMutations();
  const [historyOpen, setHistoryOpen] = useState(false);
  const { goal, progress, contributions } = view;
  const historyId = `goal-history-${goal.id}`;

  const projection = progress.reached
    ? null
    : progress.overdue && goal.target_date
      ? t("goals.projection.overdue", { date: format.date(goal.target_date, "medium") })
      : progress.projectedDate
        ? t("goals.projection.on", { date: format.date(progress.projectedDate, "monthYear") })
        : t("goals.projection.none");

  return (
    <Card as="article" className={styles.card}>
      <div className={styles.cardHeader}>
        <CategoryIcon icon={goal.icon} color={goal.color} />
        <div className={list.main}>
          <h3 className={styles.name}>{goal.name}</h3>
          {goal.target_date && (
            <span className={list.meta}>{format.date(goal.target_date, "medium")}</span>
          )}
        </div>
        <DropdownMenu
          trigger={
            <IconButton
              label={t("common.actionsFor", { name: goal.name })}
              icon={<MoreHorizontal />}
            />
          }
          items={[
            { id: "edit", label: t("common.edit"), icon: <Pencil />, onSelect: () => onEdit(goal) },
            goal.archived
              ? {
                  id: "unarchive",
                  label: t("common.unarchive"),
                  icon: <ArchiveRestore />,
                  onSelect: () => setArchived.mutate({ id: goal.id, archived: false }),
                }
              : {
                  id: "archive",
                  label: t("common.archive"),
                  icon: <Archive />,
                  onSelect: () => setArchived.mutate({ id: goal.id, archived: true }),
                },
            { type: "separator", id: "sep" },
            {
              id: "delete",
              label: t("common.delete"),
              icon: <Trash2 />,
              tone: "danger",
              onSelect: () => remove.mutate(goal.id),
            },
          ]}
        />
      </div>

      <ProgressBar
        value={progress.saved}
        max={goal.target_cents}
        tone={progress.reached ? "success" : "primary"}
        label={
          progress.reached ? (
            <Badge tone="success" icon={<CircleCheck />}>
              {t("goals.reached")}
            </Badge>
          ) : (
            t("goals.remaining", { amount: format.money(progress.remaining) })
          )
        }
        valueText={t("goals.saved", {
          saved: format.money(progress.saved),
          target: format.money(goal.target_cents),
        })}
      />

      <div className={styles.projection}>
        {projection && <p>{projection}</p>}
        {progress.requiredMonthly !== null && goal.target_date && (
          <p>
            {t("goals.projection.needed", {
              date: format.date(goal.target_date, "medium"),
              amount: format.money(progress.requiredMonthly),
            })}
          </p>
        )}
        {progress.averageMonthly > 0 && (
          <p className={list.meta}>
            {t("goals.projection.average", { amount: format.money(progress.averageMonthly) })}
          </p>
        )}
      </div>

      {!goal.archived && (
        <div className={styles.actions}>
          <Button
            variant="primary"
            iconStart={<Plus />}
            onClick={() => onContribute(goal, "deposit")}
          >
            {t("goals.contribution.add")}
          </Button>
          <Button
            iconStart={<Minus />}
            onClick={() => onContribute(goal, "withdrawal")}
            disabled={progress.saved <= 0}
          >
            {t("goals.contribution.withdraw")}
          </Button>
        </div>
      )}

      <button
        type="button"
        className={styles.historyToggle}
        aria-expanded={historyOpen}
        aria-controls={historyId}
        onClick={() => setHistoryOpen((o) => !o)}
      >
        <ChevronDown
          size={18}
          aria-hidden="true"
          className={cn(styles.chevron, historyOpen && styles.open)}
        />
        {t("goals.contribution.history")} ({format.number(contributions.length)})
      </button>
      {historyOpen && (
        <div id={historyId}>
          {contributions.length === 0 ? (
            <p className={list.meta}>{t("goals.contribution.empty")}</p>
          ) : (
            <ul role="list" className={styles.history}>
              {contributions.map((c) => {
                const label = format.date(c.date, "medium");
                return (
                  <li key={c.id} className={styles.historyRow}>
                    <span className={list.main}>
                      <span>
                        {c.amount_cents > 0
                          ? t("goals.contribution.deposit")
                          : t("goals.contribution.withdrawal")}
                      </span>
                      <span className={list.meta}>
                        {[label, c.note].filter(Boolean).join(" · ")}
                      </span>
                    </span>
                    <Amount cents={c.amount_cents} />
                    <IconButton
                      label={`${t("common.delete")}: ${label}`}
                      icon={<Trash2 />}
                      size="sm"
                      onClick={() => removeContribution.mutate(c.id)}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </Card>
  );
}
