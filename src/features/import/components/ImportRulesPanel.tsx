"use client";

import { ArrowDown, ArrowUp, MoreHorizontal, Pencil, Plus, Trash2, Wand2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Card, DropdownMenu, EmptyState, ErrorState, IconButton } from "@/components/ui";
import { categoryDisplayName } from "@/features/categories/displayName";
import { useAllCategories } from "@/features/categories/hooks";
import { ListSkeleton } from "@/features/shared/components/ListSkeleton";
import list from "@/features/shared/components/EntityList.module.css";
import { useErrorMessage } from "@/lib/errors/useErrorMessage";
import { useImportRuleMutations, useImportRules } from "../hooks";
import type { ImportRule } from "../schemas";
import { ImportRuleFormDialog } from "./ImportRuleFormDialog";

/** Import rules: ordered list, first match wins. */
export function ImportRulesPanel() {
  const { t } = useTranslation();
  const errorMessage = useErrorMessage();
  const rules = useImportRules();
  const categories = useAllCategories();
  const mutations = useImportRuleMutations();
  const [target, setTarget] = useState<{ rule: ImportRule | null; nextOrder: number } | null>(null);
  const data = rules.data ?? [];
  const nextOrder = data.reduce((max, r) => Math.max(max, r.sort_order + 1), 0);
  const categoryName = (id: string | null) => {
    const c = id ? categories.data?.find((x) => x.id === id) : undefined;
    return c ? categoryDisplayName(t, c) : null;
  };

  const addButton = (
    <Button iconStart={<Plus />} onClick={() => setTarget({ rule: null, nextOrder })}>
      {t("import.rules.add")}
    </Button>
  );

  return (
    <>
      <Card
        title={t("import.rules.title")}
        description={t("import.rules.description")}
        actions={data.length > 0 ? addButton : undefined}
        padding="none"
      >
        {rules.isError ? (
          <ErrorState
            description={errorMessage(rules.error)}
            onRetry={() => void rules.refetch()}
          />
        ) : !rules.data ? (
          <ListSkeleton rows={2} />
        ) : data.length === 0 ? (
          <EmptyState
            headingLevel={3}
            icon={<Wand2 />}
            title={t("import.rules.empty.title")}
            description={t("import.rules.empty.text")}
            action={addButton}
          />
        ) : (
          <ul className={list.list} aria-label={t("import.rules.title")}>
            {data.map((rule, index) => {
              const category = categoryName(rule.category_id);
              const effects = [
                category && t("import.rules.setsCategory", { category }),
                rule.payee_rename && t("import.rules.renames", { payee: rule.payee_rename }),
              ].filter(Boolean);
              const title = t("import.rules.summary", {
                field: t(`import.rules.matchFields.${rule.match_field}`),
                text: rule.match_text,
              });
              return (
                <li key={rule.id} className={list.row}>
                  <div className={list.main}>
                    <span className={list.title}>{title}</span>
                    <span className={list.meta}>
                      {effects.length > 0 ? effects.join(" · ") : t("import.rules.noEffect")}
                    </span>
                  </div>
                  <div className={list.end}>
                    <DropdownMenu
                      trigger={
                        <IconButton
                          label={t("common.actionsFor", { name: rule.match_text })}
                          icon={<MoreHorizontal />}
                          showTooltip={false}
                        />
                      }
                      items={[
                        {
                          id: "edit",
                          label: t("common.edit"),
                          icon: <Pencil />,
                          onSelect: () => setTarget({ rule, nextOrder }),
                        },
                        {
                          id: "up",
                          label: t("common.moveUp"),
                          icon: <ArrowUp />,
                          disabled: index === 0,
                          onSelect: () =>
                            mutations.move.mutate({ rules: data, id: rule.id, direction: "up" }),
                        },
                        {
                          id: "down",
                          label: t("common.moveDown"),
                          icon: <ArrowDown />,
                          disabled: index === data.length - 1,
                          onSelect: () =>
                            mutations.move.mutate({ rules: data, id: rule.id, direction: "down" }),
                        },
                        { type: "separator", id: "sep" },
                        {
                          id: "del",
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
        )}
      </Card>
      <ImportRuleFormDialog target={target} onClose={() => setTarget(null)} />
    </>
  );
}
