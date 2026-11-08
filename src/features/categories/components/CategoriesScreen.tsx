"use client";

import {
  Archive,
  ArchiveRestore,
  ArrowDown,
  ArrowUp,
  FolderPlus,
  FolderTree,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Badge,
  Button,
  Card,
  CategoryIcon,
  ConfirmDialog,
  DropdownMenu,
  EmptyState,
  ErrorState,
  IconButton,
  type MenuEntry,
  PageHeader,
  Tabs,
} from "@/components/ui";
import { ListSkeleton } from "@/features/shared/components/ListSkeleton";
import styles from "@/features/shared/components/EntityList.module.css";
import { useErrorMessage } from "@/lib/errors/useErrorMessage";
import { cn } from "@/lib/utils/cn";
import { useDocumentTitle } from "@/lib/utils/useDocumentTitle";
import { categoryDisplayName } from "../displayName";
import { useAllCategories, useCategoryMutations, useCategoryUsageCheck } from "../hooks";
import type { Category, CategoryType } from "../schemas";
import { buildCategoryTree, siblingsOf } from "../tree";
import { CategoryFormDialog, type CategoryFormTarget } from "./CategoryFormDialog";

/** Category tree per type with create, edit, reorder, archive and delete. */
export function CategoriesScreen() {
  const { t } = useTranslation();
  const errorMessage = useErrorMessage();
  useDocumentTitle(t("categories.title"));
  const categories = useAllCategories();
  const mutations = useCategoryMutations();
  const usageOf = useCategoryUsageCheck();
  const [tab, setTab] = useState<CategoryType>("expense");
  const [formTarget, setFormTarget] = useState<CategoryFormTarget | null>(null);
  const [archiveCandidate, setArchiveCandidate] = useState<{
    category: Category;
    usage: number;
  } | null>(null);
  const all = categories.data ?? [];

  const requestDelete = async (category: Category) => {
    const usage = await usageOf(all, category.id);
    if (usage > 0) setArchiveCandidate({ category, usage });
    else mutations.remove.mutate({ id: category.id, all });
  };

  const menu = (category: Category): MenuEntry[] => {
    const siblings = siblingsOf(all, category);
    const index = siblings.findIndex((s) => s.id === category.id);
    return [
      {
        id: "edit",
        label: t("common.edit"),
        icon: <Pencil />,
        onSelect: () => setFormTarget({ category }),
      },
      ...(!category.parent_id && !category.archived
        ? [
            {
              id: "sub",
              label: t("categories.addSub"),
              icon: <FolderPlus />,
              onSelect: () =>
                setFormTarget({ category: null, type: category.type, parentId: category.id }),
            },
          ]
        : []),
      {
        id: "up",
        label: t("common.moveUp"),
        icon: <ArrowUp />,
        disabled: index <= 0,
        onSelect: () => mutations.move.mutate({ siblings, id: category.id, direction: "up" }),
      },
      {
        id: "down",
        label: t("common.moveDown"),
        icon: <ArrowDown />,
        disabled: index === siblings.length - 1,
        onSelect: () => mutations.move.mutate({ siblings, id: category.id, direction: "down" }),
      },
      { type: "separator", id: "sep" },
      category.archived
        ? {
            id: "unarchive",
            label: t("common.unarchive"),
            icon: <ArchiveRestore />,
            onSelect: () => mutations.setArchived.mutate({ id: category.id, archived: false, all }),
          }
        : {
            id: "archive",
            label: t("common.archive"),
            icon: <Archive />,
            onSelect: () => mutations.setArchived.mutate({ id: category.id, archived: true, all }),
          },
      {
        id: "delete",
        label: t("common.delete"),
        icon: <Trash2 />,
        tone: "danger",
        onSelect: () => void requestDelete(category),
      },
    ];
  };

  const row = (category: Category, indented: boolean, meta?: string) => {
    const name = categoryDisplayName(t, category);
    return (
      <li key={category.id} className={cn(styles.row, indented && styles.indented)}>
        <CategoryIcon icon={category.icon} color={category.color} size={indented ? "sm" : "md"} />
        <div className={styles.main}>
          <span className={styles.title}>
            {name}
            {category.is_system && !category.name && <Badge>{t("common.systemBadge")}</Badge>}
          </span>
          {meta && <span className={styles.meta}>{meta}</span>}
        </div>
        <div className={styles.end}>
          <DropdownMenu
            trigger={
              <IconButton label={t("common.actionsFor", { name })} icon={<MoreHorizontal />} />
            }
            items={menu(category)}
          />
        </div>
      </li>
    );
  };

  const treeFor = (type: CategoryType) => {
    const tree = buildCategoryTree(
      all.filter((c) => !c.archived),
      type,
    );
    if (tree.length === 0) {
      return (
        <EmptyState
          headingLevel={3}
          icon={<FolderTree />}
          title={t("categories.empty.title")}
          description={t("categories.empty.text")}
          action={
            <Button
              variant="primary"
              iconStart={<Plus />}
              onClick={() => setFormTarget({ category: null, type })}
            >
              {t("categories.add")}
            </Button>
          }
        />
      );
    }
    return (
      <Card padding="none">
        <ul role="list" className={styles.list}>
          {tree.flatMap(({ category, children }) => [
            row(
              category,
              false,
              children.length
                ? t("categories.subcategoryCount", { count: children.length })
                : undefined,
            ),
            ...children.map((child) => row(child, true)),
          ])}
        </ul>
      </Card>
    );
  };

  const archived = all.filter((c) => c.archived);

  return (
    <>
      <PageHeader
        title={t("categories.title")}
        description={t("categories.description")}
        actions={
          <Button
            variant="primary"
            iconStart={<Plus />}
            onClick={() => setFormTarget({ category: null, type: tab })}
          >
            {t("categories.add")}
          </Button>
        }
      />
      {categories.isError ? (
        <ErrorState
          description={errorMessage(categories.error)}
          onRetry={() => void categories.refetch()}
        />
      ) : !categories.data ? (
        <Card padding="none">
          <ListSkeleton rows={6} />
        </Card>
      ) : (
        <>
          <Tabs
            label={t("categories.title")}
            value={tab}
            onValueChange={setTab}
            items={[
              { value: "expense", label: t("categoryTypes.expense"), content: treeFor("expense") },
              { value: "income", label: t("categoryTypes.income"), content: treeFor("income") },
            ]}
          />
          {archived.length > 0 && (
            <>
              <h2 className={styles.sectionTitle}>{t("categories.archivedSection")}</h2>
              <Card padding="none">
                <ul role="list" className={styles.list}>
                  {archived.map((c) => row(c, false, t(`categoryTypes.${c.type}`)))}
                </ul>
              </Card>
            </>
          )}
        </>
      )}

      <CategoryFormDialog target={formTarget} onClose={() => setFormTarget(null)} all={all} />
      <ConfirmDialog
        open={archiveCandidate !== null}
        onOpenChange={(open) => !open && setArchiveCandidate(null)}
        tone="primary"
        title={t("categories.archiveInstead.title")}
        description={t("categories.archiveInstead.text", {
          name: archiveCandidate ? categoryDisplayName(t, archiveCandidate.category) : "",
          count: archiveCandidate?.usage ?? 0,
        })}
        confirmLabel={t("categories.archiveInstead.confirm")}
        onConfirm={async () => {
          if (archiveCandidate) {
            await mutations.setArchived.mutateAsync({
              id: archiveCandidate.category.id,
              archived: true,
              all,
            });
          }
        }}
      />
    </>
  );
}
