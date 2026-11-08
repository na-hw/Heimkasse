"use client";

import { Plus } from "lucide-react";
import dynamic from "next/dynamic";
import { useTranslation } from "react-i18next";
import { Fab } from "@/components/ui";
import { useModHotkey } from "@/lib/utils/useHotkey";
import { useTransactionEditor } from "../editorStore";

/** The form (date picker, form + validation code) is loaded on first use, not with every page. */
const TransactionFormDialog = dynamic(
  () => import("./TransactionFormDialog").then((m) => m.TransactionFormDialog),
  { ssr: false },
);

/** Global quick add: ⌘N / Ctrl+N anywhere, floating "+" on phones. */
export function QuickAddHost() {
  const { t } = useTranslation();
  const openCreate = useTransactionEditor((s) => s.openCreate);
  const used = useTransactionEditor((s) => s.open || s.used);
  useModHotkey("n", () => openCreate());
  return (
    <>
      <Fab label={t("nav.quickAdd")} icon={<Plus />} onClick={() => openCreate()} />
      {used && <TransactionFormDialog />}
    </>
  );
}
